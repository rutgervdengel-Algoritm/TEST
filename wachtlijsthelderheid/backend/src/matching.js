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

  // Filter active rules only
  const activeRules = rules.filter(r => r.is_active !== 0);

  // Get total weight to normalize
  const totalWeight = activeRules.reduce((sum, r) => sum + r.weight_percentage, 0);
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

  for (const rule of activeRules) {
    const normalizedWeight = (rule.weight_percentage / totalWeight) * 40;
    let ruleScore = 0;
    let ruleExplanation = '';

    switch (rule.rule_type) {
      case 'registration_date': {
        // Oldest registration gets full points, newest gets 0
        // Linear interpolation based on position
        const sortedByDate = [...allEntries]
          .filter(e => e.status === 'waiting' || e.confirmation_status === 'active')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const position = sortedByDate.findIndex(e => e.id === entry.id);
        const total = sortedByDate.length;

        if (total > 1 && position >= 0) {
          // Position 0 (oldest) = full score, last position = 0
          ruleScore = ((total - 1 - position) / (total - 1)) * normalizedWeight;
        } else if (position >= 0) {
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
      explanation: ruleExplanation,
      applies: ruleScore > 0
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
    WHERE org_id = ? AND status = 'waiting' AND (confirmation_status = 'active' OR confirmation_status IS NULL)
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
 * Calculate position of an entry on the waitlist with extended info
 * Feature 1: Includes position range/uncertainty
 * Feature 2: Includes detailed breakdown per rule
 * @param {number} entryId - ID of the entry
 * @returns {object} Extended position info
 */
function calculateWaitlistPosition(entryId) {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }

  const allEntries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ? AND (status = 'waiting' OR status = 'matched')
    AND (confirmation_status = 'active' OR confirmation_status = 'pending_confirmation' OR confirmation_status IS NULL)
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

  // Feature 1: Calculate position range based on day preferences overlap
  const entryDays = typeof entry.preferred_days === 'string'
    ? JSON.parse(entry.preferred_days)
    : entry.preferred_days;

  // Count people ahead with overlapping days (best case) vs total ahead (worst case)
  const aheadEntries = scored.slice(0, position - 1);
  const aheadWithSameDay = aheadEntries.filter(s => {
    const days = typeof s.entry.preferred_days === 'string'
      ? JSON.parse(s.entry.preferred_days)
      : s.entry.preferred_days;
    return days.some(d => entryDays.includes(d));
  }).length;

  // Best case: only people with overlapping days are real competition
  const bestCasePosition = aheadWithSameDay + 1;
  // Worst case: everyone ahead is competition (current position)
  const worstCasePosition = position;

  // Feature 2: Count people ahead per rule
  const aheadByRule = {};
  for (const rule of rules) {
    const ruleType = rule.rule_type;
    const ruleName = rule.rule_name;

    const countAheadByThisRule = aheadEntries.filter(s => {
      const breakdown = s.priorityScore.breakdown.find(b => b.ruleType === ruleType);
      const myBreakdown = scored.find(sc => sc.entry.id === entryId)?.priorityScore.breakdown.find(b => b.ruleType === ruleType);
      return breakdown && myBreakdown && breakdown.score > myBreakdown.score;
    }).length;

    aheadByRule[ruleType] = {
      ruleName,
      count: countAheadByThisRule,
      description: getAheadByRuleDescription(ruleType, ruleName, countAheadByThisRule)
    };
  }

  // Count how many people are ahead with higher priority
  const aheadWithSibling = aheadEntries.filter(s => {
    const factors = s.entry.priority_factors
      ? (typeof s.entry.priority_factors === 'string'
          ? JSON.parse(s.entry.priority_factors)
          : s.entry.priority_factors)
      : {};
    return factors.has_sibling === true;
  }).length;

  const aheadWithSingleParent = aheadEntries.filter(s => {
    const factors = s.entry.priority_factors
      ? (typeof s.entry.priority_factors === 'string'
          ? JSON.parse(s.entry.priority_factors)
          : s.entry.priority_factors)
      : {};
    return factors.single_parent === true;
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

  const myScore = scored.find(s => s.entry.id === entryId)?.priorityScore;

  return {
    position,
    total,
    percentile: Math.round(percentile * 100),
    matchChance,
    // Feature 1: Position range
    positionRange: {
      best: bestCasePosition,
      worst: worstCasePosition,
      explanation: bestCasePosition === worstCasePosition
        ? `Uw positie is ${position}`
        : `Uw positie is ${bestCasePosition}-${worstCasePosition}, afhankelijk van beschikbare dagen`
    },
    // Feature 2: Ahead by rule breakdown
    aheadByRule,
    priorityScore: myScore,
    aheadInfo: {
      total: position - 1,
      withSibling: aheadWithSibling,
      withSingleParent: aheadWithSingleParent,
      withOverlappingDays: aheadWithSameDay
    }
  };
}

/**
 * Helper function to generate description for ahead by rule
 */
function getAheadByRuleDescription(ruleType, ruleName, count) {
  if (count === 0) {
    return `Niemand voor u door ${ruleName.toLowerCase()}`;
  } else if (count === 1) {
    return `1 persoon voor u door ${ruleName.toLowerCase()}`;
  } else {
    return `${count} mensen voor u door ${ruleName.toLowerCase()}`;
  }
}

/**
 * Feature 4: Simulate impact of changing preferences
 * @param {number} entryId - ID of the entry
 * @param {object} newPreferences - New preferences to simulate
 * @returns {object} Impact analysis
 */
function simulatePreferenceChange(entryId, newPreferences) {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }

  // Get current position
  const currentPosition = calculateWaitlistPosition(entryId);

  // Create simulated entry with new preferences
  const simulatedEntry = { ...entry };
  if (newPreferences.preferred_days) {
    simulatedEntry.preferred_days = JSON.stringify(newPreferences.preferred_days);
  }
  if (newPreferences.desired_start_date) {
    simulatedEntry.desired_start_date = newPreferences.desired_start_date;
  }
  if (newPreferences.priority_factors) {
    simulatedEntry.priority_factors = JSON.stringify(newPreferences.priority_factors);
  }

  // Get all entries and simulate
  const allEntries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ? AND (status = 'waiting' OR status = 'matched')
    AND (confirmation_status = 'active' OR confirmation_status = 'pending_confirmation' OR confirmation_status IS NULL)
    ORDER BY created_at ASC
  `).all(entry.org_id);

  const rules = db.prepare(`
    SELECT * FROM priority_rules
    WHERE org_id = ?
    ORDER BY weight_percentage DESC
  `).all(entry.org_id);

  // Replace the entry with simulated version for calculation
  const simulatedEntries = allEntries.map(e => e.id === entryId ? simulatedEntry : e);

  // Calculate simulated scores
  const scored = simulatedEntries.map(e => ({
    entry: e,
    priorityScore: calculatePriorityScore(e, rules, simulatedEntries)
  }));

  scored.sort((a, b) => b.priorityScore.score - a.priorityScore.score);

  const simulatedPosition = scored.findIndex(s => s.entry.id === entryId) + 1;

  // Calculate position range for simulation
  const simEntryDays = newPreferences.preferred_days || JSON.parse(entry.preferred_days);
  const aheadEntries = scored.slice(0, simulatedPosition - 1);
  const aheadWithSameDay = aheadEntries.filter(s => {
    const days = typeof s.entry.preferred_days === 'string'
      ? JSON.parse(s.entry.preferred_days)
      : s.entry.preferred_days;
    return days.some(d => simEntryDays.includes(d));
  }).length;

  const simBestCase = aheadWithSameDay + 1;
  const simWorstCase = simulatedPosition;

  // Determine new match chance
  const percentile = simulatedPosition / scored.length;
  let simMatchChance;
  if (percentile <= 0.2) {
    simMatchChance = 'high';
  } else if (percentile <= 0.5) {
    simMatchChance = 'medium';
  } else {
    simMatchChance = 'low';
  }

  return {
    current: {
      position: currentPosition.position,
      positionRange: currentPosition.positionRange,
      matchChance: currentPosition.matchChance
    },
    simulated: {
      position: simulatedPosition,
      positionRange: {
        best: simBestCase,
        worst: simWorstCase,
        explanation: simBestCase === simWorstCase
          ? `Positie wordt ${simulatedPosition}`
          : `Positie wordt ${simBestCase}-${simWorstCase}`
      },
      matchChance: simMatchChance
    },
    impact: {
      positionChange: currentPosition.position - simulatedPosition,
      matchChanceChange: simMatchChance !== currentPosition.matchChance,
      summary: getImpactSummary(currentPosition.position, simulatedPosition, currentPosition.matchChance, simMatchChance)
    }
  };
}

/**
 * Helper to generate impact summary text
 */
function getImpactSummary(oldPos, newPos, oldChance, newChance) {
  let text = '';
  const posDiff = oldPos - newPos;

  if (posDiff > 0) {
    text = `Positie verbetert met ${posDiff} plek${posDiff > 1 ? 'ken' : ''}`;
  } else if (posDiff < 0) {
    text = `Positie verslechtert met ${Math.abs(posDiff)} plek${Math.abs(posDiff) > 1 ? 'ken' : ''}`;
  } else {
    text = 'Positie blijft gelijk';
  }

  if (newChance !== oldChance) {
    const chanceLabels = { high: 'hoog', medium: 'gemiddeld', low: 'laag' };
    text += `. Match-kans wordt ${chanceLabels[newChance]}`;
  }

  return text;
}

/**
 * Feature 8: Check fairness of priority rules
 * @param {number} orgId - Organization ID
 * @returns {object} Fairness analysis
 */
function checkRulesFairness(orgId) {
  const rules = db.prepare(`
    SELECT * FROM priority_rules
    WHERE org_id = ?
    ORDER BY weight_percentage DESC
  `).all(orgId);

  const warnings = [];
  const suggestions = [];

  // Check total weight
  const totalWeight = rules.reduce((sum, r) => sum + r.weight_percentage, 0);

  // Check for extreme weights
  for (const rule of rules) {
    const percentage = totalWeight > 0 ? (rule.weight_percentage / totalWeight) * 100 : 0;
    if (percentage > 80) {
      warnings.push({
        severity: 'high',
        rule: rule.rule_name,
        message: `${rule.rule_name} heeft ${Math.round(percentage)}% van het totale gewicht. Dit betekent dat andere regels nauwelijks meetellen.`
      });
      suggestions.push(`Overweeg het gewicht van "${rule.rule_name}" te verlagen naar maximaal 60% voor een meer gebalanceerde verdeling.`);
    } else if (percentage > 60) {
      warnings.push({
        severity: 'medium',
        rule: rule.rule_name,
        message: `${rule.rule_name} heeft een hoog gewicht (${Math.round(percentage)}%).`
      });
    }
  }

  // Check if registration_date rule is too low (unfair to early registrants)
  const regDateRule = rules.find(r => r.rule_type === 'registration_date');
  if (regDateRule) {
    const regDatePercentage = totalWeight > 0 ? (regDateRule.weight_percentage / totalWeight) * 100 : 0;
    if (regDatePercentage < 20) {
      warnings.push({
        severity: 'medium',
        rule: regDateRule.rule_name,
        message: `Inschrijfdatum telt maar voor ${Math.round(regDatePercentage)}% mee. Vroege inschrijvers kunnen hierdoor lang wachten.`
      });
    }
  }

  // Calculate how many people would be affected by rule changes
  const entries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ? AND status = 'waiting'
  `).all(orgId);

  const affectedAnalysis = {
    totalWaiting: entries.length,
    withSibling: entries.filter(e => {
      const factors = e.priority_factors ? JSON.parse(e.priority_factors) : {};
      return factors.has_sibling === true;
    }).length,
    withSingleParent: entries.filter(e => {
      const factors = e.priority_factors ? JSON.parse(e.priority_factors) : {};
      return factors.single_parent === true;
    }).length
  };

  // Simulate distribution with 100 random entries
  const simulationResult = simulateDistribution(rules);

  return {
    rules: rules.map(r => ({
      ...r,
      effectivePercentage: totalWeight > 0 ? Math.round((r.weight_percentage / totalWeight) * 100) : 0
    })),
    warnings,
    suggestions,
    affectedAnalysis,
    simulationResult,
    overallFairness: warnings.filter(w => w.severity === 'high').length === 0 ? 'good' : 'needs_attention'
  };
}

/**
 * Simulate distribution of 100 random entries
 */
function simulateDistribution(rules) {
  // Create 100 simulated entries
  const simEntries = [];
  for (let i = 0; i < 100; i++) {
    simEntries.push({
      id: i,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'waiting',
      priority_factors: JSON.stringify({
        has_sibling: Math.random() < 0.15, // 15% has sibling
        single_parent: Math.random() < 0.10, // 10% single parent
        custom: Math.random() < 0.05 ? 'Special case' : '' // 5% custom
      })
    });
  }

  // Calculate scores
  const scored = simEntries.map(e => ({
    entry: e,
    score: calculatePriorityScore(e, rules, simEntries).score
  }));

  scored.sort((a, b) => b.score - a.score);

  // Analyze top 10
  const top10 = scored.slice(0, 10);
  const top10Analysis = {
    withSibling: top10.filter(s => {
      const factors = JSON.parse(s.entry.priority_factors);
      return factors.has_sibling;
    }).length,
    withSingleParent: top10.filter(s => {
      const factors = JSON.parse(s.entry.priority_factors);
      return factors.single_parent;
    }).length
  };

  return {
    description: 'Simulatie met 100 fictieve inschrijvingen',
    top10Analysis,
    insight: top10Analysis.withSibling > 5
      ? 'Broertje/zusje regel domineert de top 10'
      : top10Analysis.withSingleParent > 5
        ? 'Alleenstaand ouder regel domineert de top 10'
        : 'Redelijk gebalanceerde verdeling in top 10'
  };
}

module.exports = {
  calculateMatchScore,
  findTopCandidates,
  calculateWaitlistPosition,
  calculateDaysScore,
  calculatePriorityScore,
  calculateStartDateScore,
  simulatePreferenceChange,
  checkRulesFairness
};
