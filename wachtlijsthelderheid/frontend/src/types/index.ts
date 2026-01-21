// Day types
export type Day = 'MA' | 'DI' | 'WO' | 'DO' | 'VR';

// Confirmation status (Feature 9)
export type ConfirmationStatus = 'active' | 'pending_confirmation' | 'expired' | 'archived';

// Organization type
export interface Organization {
  id: number;
  name: string;
  type?: 'KDV' | 'BSO';
  email: string;
  created_at?: string;
}

// Priority factors
export interface PriorityFactors {
  has_sibling?: boolean;
  single_parent?: boolean;
  custom?: string;
}

// Waitlist entry
export interface WaitlistEntry {
  id: number;
  org_id: number;
  parent_name: string;
  parent_email?: string;
  parent_phone?: string;
  child_name: string;
  child_birthdate?: string;
  preferred_days: Day[];
  desired_start_date: string;
  notes?: string;
  status: 'waiting' | 'matched' | 'accepted' | 'removed' | 'pending_confirmation' | 'expired' | 'archived';
  access_code: string;
  priority_factors: PriorityFactors;
  // Feature 9: Interest confirmation
  last_confirmed_at?: string;
  confirmation_status?: ConfirmationStatus;
  other_registrations?: string[];
  archived_at?: string;
  // Metadata
  created_at: string;
  updated_at: string;
}

// Priority rule
export interface PriorityRule {
  id?: number;
  org_id?: number;
  rule_name: string;
  rule_type: 'registration_date' | 'sibling' | 'single_parent' | 'custom';
  weight_percentage: number;
  description?: string;
  is_active?: boolean;
}

// Available spot
export interface AvailableSpot {
  id: number;
  org_id: number;
  days: Day[];
  start_date: string;
  num_spots: number;
  status: 'open' | 'filled';
  created_at: string;
}

// Score breakdown
export interface ScoreBreakdown {
  days: {
    score: number;
    maxScore: number;
    overlappingDays: Day[];
    overlapCount: number;
    requestedCount: number;
    explanation: string;
  };
  priority: {
    score: number;
    maxScore: number;
    breakdown: Array<{
      ruleName: string;
      ruleType: string;
      weight: number;
      score: number;
      maxScore: number;
      explanation: string;
    }>;
    explanation: string;
  };
  startDate: {
    score: number;
    maxScore: number;
    diffDays: number;
    spotStartDate: string;
    desiredStartDate: string;
    explanation: string;
  };
}

// Match candidate
export interface MatchCandidate {
  entry: WaitlistEntry;
  score: number;
  percentage: number;
  breakdown: ScoreBreakdown;
  summary: string;
}

// Match
export interface Match {
  id: number;
  spot_id: number;
  entry_id: number;
  match_score: number;
  score_breakdown: ScoreBreakdown;
  status: 'proposed' | 'accepted' | 'rejected' | 'expired';
  proposed_at: string;
  response_date?: string;
  rejection_reason?: string;
  parent_name?: string;
  child_name?: string;
  entry_days?: Day[];
  spot_days?: Day[];
  start_date?: string;
}

// Decision log entry (Feature 5: Enhanced)
export interface DecisionLogEntry {
  id: number;
  org_id: number;
  action_type: string;
  category?: 'inschrijving' | 'matching' | 'regelwijziging' | 'archivering' | 'import_export' | 'system' | 'general';
  description: string;
  related_entry_id?: number;
  related_spot_id?: number;
  related_match_id?: number;
  employee_name?: string;
  reason?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Analytics data
export interface Analytics {
  totalWaiting: number;
  totalEntries: number;
  acceptedCount: number;
  avgWaitTimeDays: number;
  dayDemand: Record<Day, number>;
  recentActivity: number;
  // Feature 9: Confirmation stats
  confirmationStats?: {
    active: number;
    pending: number;
    expired: number;
    archived: number;
  };
}

// Position range (Feature 1)
export interface PositionRange {
  best: number;
  worst: number;
  explanation: string;
}

// Ahead by rule breakdown (Feature 2)
export interface AheadByRule {
  [ruleType: string]: {
    ruleName: string;
    count: number;
    description: string;
  };
}

// Enhanced ahead info
export interface AheadInfo {
  total: number;
  withSibling: number;
  withSingleParent?: number;
  withOverlappingDays?: number;
}

// Waitlist position (Features 1 & 2)
export interface WaitlistPosition {
  position: number;
  total: number;
  percentile: number;
  matchChance: 'high' | 'medium' | 'low';
  priorityScore: {
    score: number;
    maxScore: number;
    breakdown: Array<{
      ruleName: string;
      ruleType: string;
      weight: number;
      score: number;
      maxScore: number;
      explanation: string;
    }>;
    explanation: string;
  };
  aheadInfo: AheadInfo;
  // Feature 1: Position range
  positionRange?: PositionRange;
  // Feature 2: Ahead by rule breakdown
  aheadByRule?: AheadByRule;
}

// Simulation result (Feature 4)
export interface SimulationResult {
  currentPosition: number;
  simulatedPosition: number;
  positionChange: number;
  currentDays: Day[];
  simulatedDays: Day[];
  impact: {
    direction: 'better' | 'worse' | 'same';
    explanation: string;
    competitionChange: string;
  };
}

// Fairness check result (Feature 8)
export interface FairnessCheck {
  isBalanced: boolean;
  warnings: Array<{
    ruleType: string;
    ruleName: string;
    weight: number;
    message: string;
    severity: 'warning' | 'critical';
  }>;
  suggestions: string[];
  affectedAnalysis: {
    totalEntries: number;
    byRuleType: Record<string, { count: number; percentage: number }>;
  };
  simulationResults?: {
    withCurrentRules: { position: number; entryId: number }[];
    withBalancedRules: { position: number; entryId: number }[];
  };
}

// Import result (Feature 7)
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: Array<{ row: number; existingId: number; reason: string }>;
}

// Portal data (parent view)
export interface PortalData {
  entry: WaitlistEntry;
  organization: string;
  position: WaitlistPosition;
  pendingMatches: Array<Match & { days: Day[] }>;
  timeline: DecisionLogEntry[];
  // Feature 9: Confirmation info
  confirmationNeeded?: boolean;
  daysUntilExpiry?: number;
}

// Auth context
export interface AuthState {
  token: string | null;
  organization: Organization | null;
  isAuthenticated: boolean;
}
