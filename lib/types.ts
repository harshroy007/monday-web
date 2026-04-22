export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DashboardData {
  guard: {
    level: 'ADVISORY' | 'CAUTION' | 'WARNING' | 'CRITICAL';
    threats: string[];
  };
  sparkline: number[];
  stats: {
    total_entries: number;
    avg_energy: number;
    energy_delta: number;
    commitment_rate: number;
  };
  signals: Array<{
    signal_type: string;
    intensity: number;
  }>;
  narrative: {
    how_youve_been: string;
    observations: Array<{
      icon: string;
      color: string;
      text: string;
    }>;
  };
  latest_entry: {
    summary: string;
    key_insight: string;
    confidence: number;
    energy_level: number;
  };
}

export interface ProfileData {
  user_wiki: string;
  beliefs: Array<{
    summary: string;
    confidence: number;
  }>;
  patterns: Array<{
    name: string;
    trigger: string;
    consequence: string;
  }>;
  gaps: Array<{
    title: string;
    severity: number;
  }>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FeedEntry {
  id: string;
  confidence: number;
  energy_level: number;
  mood: string;
  summary: string;
  source: string;
  created_at: string;
}

export interface VoiceQueryResponse {
  reply: string;
  transcript: string;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

export interface WikiData {
  user_wiki: string;
  beliefs: string;
  relationships: Record<string, string>;
  decisions: Record<string, string>;
  patterns: Record<string, string>;
}
