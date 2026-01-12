// Day types
export type Day = 'MA' | 'DI' | 'WO' | 'DO' | 'VR';

// Organization type
export interface Organization {
  id: number;
  name: string;
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
  child_name: string;
  child_birthdate?: string;
  preferred_days: Day[];
  desired_start_date: string;
  notes?: string;
  status: 'waiting' | 'matched' | 'accepted' | 'removed';
  access_code: string;
  priority_factors: PriorityFactors;
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

// Decision log entry
export interface DecisionLogEntry {
  id: number;
  org_id: number;
  action_type: string;
  description: string;
  related_entry_id?: number;
  related_spot_id?: number;
  related_match_id?: number;
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
}

// Waitlist position
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
  aheadInfo: {
    total: number;
    withSibling: number;
  };
}

// Portal data (parent view)
export interface PortalData {
  entry: WaitlistEntry;
  organization: string;
  position: WaitlistPosition;
  pendingMatches: Array<Match & { days: Day[] }>;
  timeline: DecisionLogEntry[];
}

// Auth context
export interface AuthState {
  token: string | null;
  organization: Organization | null;
  isAuthenticated: boolean;
}
