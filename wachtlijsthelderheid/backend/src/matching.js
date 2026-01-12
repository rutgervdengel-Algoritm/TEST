/**
 * WachtlijstHelderheid Matching Algorithm
 *
 * Calculates match scores between available spots and waitlist entries.
 *
 * Total Score = 100 points maximum, composed of:
 * - Availability Match (40 points): How well do the days overlap?
 * - Priority Score (40 points): Based on organization's priority rules
 * - Start Date Proximity (20 points): How close is desired start to available start?
 */

const db = require('./db');

/**
 * Calculate days overlap score (max 40 points)
 * @param {string[]} spotDays - Available days for the spot
 * @param {string[]} entryDays - Desired days by parent
 * @returns {object} Score and breakdown
 */
function calculateDaysScore(spotDays, entryDays) {
  const overlappingDays = spotDays.filter(day => entryDays.includes(day));
  const overlapCount = overlappingDays.length;
  const requestedCount = entryDays.length;

  // Score = (overlapping / requested) * 40
  const score = requestedCount > 0 ? (overlapCount / requestedCount) * 40 : 0;

  return {
    score: Math.round(score * 10) / 10,
    maxScore: 40,
    overlappingDays,
    overlapCount,
    requestedCount,
    explanation: `${overlapCount}/${requestedCount} gevraagde dagen beschikbaar (${overlappingDays.join(', ') || 'geen'})`
  };
}

/**
 * Calculate priority score based on organization rules (max 40 points)
 * @param {object} entry - Waitlist entry with priority factors
 * @param {object[]} rules - Priority rules for the organization
 * @param {object[]} allEntries - All entries to calculate relative scores
 * @returns {object} Score and breakdown
 */
function calculatePriorityScore(entry, rules, allEntries) {
  const breakdown = [];
  let totalScore = 0;

  // Get total weight to normalize
  const totalWeight = rules.reduce((sum, r) => sum + r.weight_percentage, 0);
  if (totalWeight === 0) {
    return {
      score: 0,
      maxScore: 40,
      breakdown: [],
      explanation: 'Geen prioriteitsregels ingesteld'
    };
  }

  const priorityFactors = entry.priority_factors
    ? (typeof entry.priority_factors === 'string'
        ? JSON.parse(entry.priority_factors)
        : entry.priority_factors)
    : {};

  for (const rule of rules) {
    const normalizedWeight = (rule.weight_percentage / totalWeight) * 40;
    let ruleScore = 0;
    let ruleExplanation = '';

    switch (rule.rule_type) {
      case 'registration_date': {
        // Oldest registration gets full points, newest gets 0
        // Linear interpolation based on position
        const sortedByDate = [...allEntries]
          .filter(e => e.status === 'waiting')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const position = sortedByDate.findIndex(e => e.id === entry.id);
        const total = sortedByDate.length;

        if (total > 1) {
          // Position 0 (oldest) = full score, last position = 0
          ruleScore = ((total - 1 - position) / (total - 1)) * normalizedWeight;
        } else {
          ruleScore = normalizedWeight; // Only one entry gets full points
        }

        ruleExplanation = `Positie ${position + 1} van ${total} op inschrijfdatum`;
        break;
      }

      case 'sibling': {
        // Has sibling at this location
        if (priorityFactors.has_sibling === true) {
          ruleScore = normalizedWeight;
          ruleExplanation = 'Broertje/zusje op locatie: Ja';
        } else {
          ruleScore = 0;
          ruleExplanation = 'Broertje/zusje op locatie: Nee';
        }
        break;
      }

      case 'single_parent': {
        // Single parent priority
        if (priorityFactors.single_parent === true) {
          ruleScore = normalizedWeight;
          ruleExplanation = 'Alleenstaand ouder: Ja';
        } else {
          ruleScore = 0;
          ruleExplanation = 'Alleenstaand ouder: Nee';
        }
        break;
      }

      case 'custom': {
        // Custom rule - check if custom field has content
        if (priorityFactors.custom && priorityFactors.custom.trim()) {
          ruleScore = normalizedWeight;
          ruleExplanation = `${rule.rule_name}: ${priorityFactors.custom}`;
        } else {
          ruleScore = 0;
          ruleExplanation = `${rule.rule_name}: Niet van toepassing`;
        }
        break;
      }

      default:
        ruleExplanation = 'Onbekende regel';
    }

    breakdown.push({
      ruleName: rule.rule_name,
      ruleType: rule.rule_type,
      weight: rule.weight_percentage,
      score: Math.round(ruleScore * 10) / 10,
      maxScore: Math.round(normalizedWeight * 10) / 10,
      explanation: ruleExplanation
    });

    totalScore += ruleScore;
  }

  return {
    score: Math.round(totalScore * 10) / 10,
    maxScore: 40,
    breakdown,
    explanation: breakdown.map(b => b.explanation).join('; ')
  };
}

/**
 * Calculate start date proximity score (max 20 points)
 * @param {string} spotStartDate - When the spot becomes available
 * @param {string} desiredStartDate - When parent wants to start
 * @returns {object} Score and breakdown
 */
function calculateStartDateScore(spotStartDate, desiredStartDate) {
  const spotDate = new Date(spotStartDate);
  const desiredDate = new Date(desiredStartDate);

  // Calculate difference in days
  const diffTime = Math.abs(spotDate - desiredDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Score calculation:
  // - Exact match or spot earlier = 20 points
  // - Each week difference reduces score by 2 points
  // - After 10 weeks (70 days) = 0 points

  let score;
  if (spotDate <= desiredDate) {
    // Spot is available before or on desired date - perfect!
    score = 20;
  } else {
    // Spot is available after desired date
    score = Math.max(0, 20 - (diffDays / 7) * 2);
  }

  let explanation;
  if (diffDays === 0) {
    explanation = 'Startdatum komt exact overeen';
  } else if (spotDate < desiredDate) {
    explanation = `Plek ${diffDays} dagen eerder beschikbaar dan gewenst`;
  } else {
    explanation = `Plek ${diffDays} dagen later beschikbaar dan gewenst`;
  }

  return {
    score: Math.round(score * 10) / 10,
    maxScore: 20,
    diffDays,
    spotStartDate,
    desiredStartDate,
    explanation
  };
}

/**
 * Calculate full match score for an entry against a spot
 * @param {object} spot - Available spot
 * @param {object} entry - Waitlist entry
 * @param {object[]} rules - Priority rules for the organization
 * @param {object[]} allEntries - All entries for relative scoring
 * @returns {object} Complete score with breakdown
 */
function calculateMatchScore(spot, entry, rules, allEntries) {
  const spotDays = typeof spot.days === 'string' ? JSON.parse(spot.days) : spot.days;
  const entryDays = typeof entry.preferred_days === 'string'
    ? JSON.parse(entry.preferred_days)
    : entry.preferred_days;

  const daysScore = calculateDaysScore(spotDays, entryDays);
  const priorityScore = calculatePriorityScore(entry, rules, allEntries);
  const startDateScore = calculateStartDateScore(spot.start_date, entry.desired_start_date);

  const totalScore = daysScore.score + priorityScore.score + startDateScore.score;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    maxScore: 100,
    percentage: Math.round(totalScore),
    breakdown: {
      days: daysScore,
      priority: priorityScore,
      startDate: startDateScore
    },
    summary: `${Math.round(totalScore)}% match: ${daysScore.overlapCount}/${daysScore.requestedCount} dagen, ${priorityScore.breakdown.length > 0 ? priorityScore.breakdown.filter(b => b.score > 0).map(b => b.ruleName).join(', ') || 'geen prioriteiten' : 'geen regels'}`
  };
}

/**
 * Find top matching candidates for a spot
 * @param {number} spotId - ID of the available spot
 * @param {number} limit - Max number of candidates to return
 * @returns {object[]} Sorted list of candidates with scores
 */
function findTopCandidates(spotId, limit = 5) {
  const spot = db.prepare('SELECT * FROM available_spots WHERE id = ?').get(spotId);
  if (!spot) {
    throw new Error('Spot not found');
  }

  const entries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ? AND status = 'waiting'
    ORDER BY created_at ASC
  `).all(spot.org_id);

  const rules = db.prepare(`
    SELECT * FROM priority_rules
    WHERE org_id = ?
    ORDER BY weight_percentage DESC
  `).all(spot.org_id);

  // Calculate scores for all entries
  const candidates = entries.map(entry => {
    const score = calculateMatchScore(spot, entry, rules, entries);
    return {
      entry,
      ...score
    };
  });

  // Sort by total score descending
  candidates.sort((a, b) => b.totalScore - a.totalScore);

  // Return top candidates
  return candidates.slice(0, limit);
}

/**
 * Calculate position of an entry on the waitlist
 * Based on priority score (not including days/start date since those are spot-specific)
 * @param {number} entryId - ID of the entry
 * @returns {object} Position info
 */
function calculateWaitlistPosition(entryId) {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }

  const allEntries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ? AND status = 'waiting'
    ORDER BY created_at ASC
  `).all(entry.org_id);

  const rules = db.prepare(`
    SELECT * FROM priority_rules
    WHERE org_id = ?
    ORDER BY weight_percentage DESC
  `).all(entry.org_id);

  // Calculate priority scores for all entries
  const scored = allEntries.map(e => ({
    entry: e,
    priorityScore: calculatePriorityScore(e, rules, allEntries)
  }));

  // Sort by priority score descending
  scored.sort((a, b) => b.priorityScore.score - a.priorityScore.score);

  // Find position of this entry
  const position = scored.findIndex(s => s.entry.id === entryId) + 1;
  const total = scored.length;

  // Count how many people are ahead with higher priority
  const ahead = scored.slice(0, position - 1);
  const aheadWithSibling = ahead.filter(s => {
    const factors = s.entry.priority_factors
      ? (typeof s.entry.priority_factors === 'string'
          ? JSON.parse(s.entry.priority_factors)
          : s.entry.priority_factors)
      : {};
    return factors.has_sibling === true;
  }).length;

  // Determine match chance (simple heuristic)
  let matchChance;
  const percentile = position / total;
  if (percentile <= 0.2) {
    matchChance = 'high';
  } else if (percentile <= 0.5) {
    matchChance = 'medium';
  } else {
    matchChance = 'low';
  }

  return {
    position,
    total,
    percentile: Math.round(percentile * 100),
    matchChance,
    priorityScore: scored.find(s => s.entry.id === entryId)?.priorityScore,
    aheadInfo: {
      total: position - 1,
      withSibling: aheadWithSibling
    }
  };
}

module.exports = {
  calculateMatchScore,
  findTopCandidates,
  calculateWaitlistPosition,
  calculateDaysScore,
  calculatePriorityScore,
  calculateStartDateScore
};
