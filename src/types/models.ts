export type UserRole = "user" | "ambassador" | "admin";
export type HackathonMode = "online" | "offline" | "hybrid";
export type GoalType = "win" | "learn" | "balanced";
export type IntensityLevel = "casual" | "serious" | "grind";
export type AvailabilityMode = "online_only" | "offline_city" | "willing_to_travel";
export type MatchRequestStatus = "pending" | "accepted" | "declined" | "cancelled";
export type TeamMemberStatus = "invited" | "joined" | "locked" | "left";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";
export type ReliabilityEventType =
  | "team_locked"
  | "team_completed"
  | "peer_rated_positive"
  | "no_show_reported"
  | "unresponsive_reported"
  | "manual_admin_adjustment";

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  location?: { lat: number; lng: number };
  is_active: boolean;
  target_members: number;
  current_members?: number;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category:
    | "frontend"
    | "backend"
    | "ml_ai"
    | "mobile"
    | "hardware_iot"
    | "design"
    | "product"
    | "devops"
    | "data"
    | "blockchain"
    | "pitching";
  created_at?: string;
}

export interface ProfileSkill {
  id: string;
  profile_id: string;
  skill_id: string;
  skill_name?: string;
  category?: Skill["category"];
  proficiency: number; // 1 to 5
  is_primary: boolean;
}

export interface Project {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  repo_url?: string;
  demo_url?: string;
  image_url?: string;
  created_at?: string;
}

export interface PastHackathon {
  id: string;
  profile_id: string;
  event_name: string;
  year: number;
  result: "Winner" | "Runner Up" | "Finalist" | "Participant";
  team_size?: number;
  proof_url?: string;
  certificate_url?: string;
  verification_status: VerificationStatus;
  created_at?: string;
}

export interface VerificationBadge {
  id: string;
  profile_id: string;
  type: "github" | "linkedin" | "college_email" | "certificate";
  status: VerificationStatus;
  proof_data?: Record<string, unknown>;
  verified_at?: string;
  admin_notes?: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatar_url?: string;
  college?: string;
  year?: number;
  branch?: string;
  city_id?: string;
  city_name?: string;
  area?: string;
  location?: { lat: number; lng: number };
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  goals: GoalType;
  intensity: IntensityLevel;
  availability: AvailabilityMode;
  travel_cities?: string[];
  reliability_score: number; // 0 to 100
  completeness_score: number; // 0 to 100
  is_onboarded: boolean;
  is_banned: boolean;
  github_stats?: {
    public_repos?: number;
    followers?: number;
    top_languages?: string[];
    recent_commits_count?: number;
  };
  skills?: ProfileSkill[];
  projects?: Project[];
  past_hackathons?: PastHackathon[];
  verifications?: VerificationBadge[];
  created_at: string;
  updated_at: string;
}

export interface Hackathon {
  id: string;
  name: string;
  slug: string;
  organizer: string;
  mode: HackathonMode;
  city_id?: string;
  city_name?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  prize_pool?: string;
  theme?: string;
  description?: string;
  website_url: string;
  min_team_size: number;
  max_team_size: number;
  logo_url?: string;
  is_published: boolean;
  participant_count?: number;
  is_user_going?: boolean;
}

export interface TeamOpenSlot {
  id: string;
  team_id: string;
  title: string;
  category: Skill["category"];
  description?: string;
  is_filled: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  profile_id: string;
  role_name?: string;
  status: TeamMemberStatus;
  confirmed_lock: boolean;
  profile?: Partial<Profile>;
}

export interface Team {
  id: string;
  hackathon_id: string;
  hackathon_name?: string;
  lead_id: string;
  lead_profile?: Partial<Profile>;
  name: string;
  description?: string;
  github_repo_url?: string;
  idea_board?: string;
  is_locked: boolean;
  locked_at?: string;
  members: TeamMember[];
  open_slots: TeamOpenSlot[];
  created_at: string;
}

export interface MatchCandidate {
  id: string;
  user_id: string;
  candidate_id: string;
  candidate: Profile;
  hackathon_id: string;
  score: number; // 0 to 100
  breakdown: {
    skillComplementarity: number;
    goalAlignment: number;
    locationProximity: number;
    availability: number;
    trustBoost: number;
    fairnessBonus: number;
  };
  reasons: string[];
  computed_at: string;
}

export interface MatchRequest {
  id: string;
  sender_id: string;
  sender?: Profile;
  receiver_id: string;
  receiver?: Profile;
  hackathon_id: string;
  hackathon_name?: string;
  team_id?: string;
  note?: string;
  status: MatchRequestStatus;
  responded_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  hackathon_id?: string;
  hackathon_name?: string;
  participants: Profile[];
  last_message?: Message;
  unread_count?: number;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  hackathon_id: string;
  rating: number; // 1-5
  tags: string[];
  private_feedback?: string;
  created_at: string;
}

export interface ReliabilityEvent {
  id: string;
  profile_id: string;
  event_type: ReliabilityEventType;
  delta_score: number;
  reason: string;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string;
  city_id: string;
  city_name?: string;
  college?: string;
  referral_code: string;
  referred_by_code?: string;
  created_at: string;
}

export interface SpinSession {
  id: string;
  user_id: string;
  hackathon_id: string;
  selected_candidate: Profile;
  score: number;
  reasons: string[];
  status: "spun" | "accepted" | "skipped";
  created_at: string;
}
