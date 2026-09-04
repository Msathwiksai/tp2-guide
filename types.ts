
export interface GuideStep {
  title: string;
  description: string;
  tips?: string[];
  actionLabel?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  visualCue?: string;
  imageUrl?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export enum ExploringMode {
  STANDARD = 'Standard',
  EXPERT = 'Expert'
}

export interface Tutorial {
  id: string;
  name: string;
  category: Category;
  description: string;
  icon: string;
  color: string;
  popularTopics: string[];
  advancedTopics: string[];
  versions: string[]; 
}

export type CommandOS = 'Windows' | 'macOS' | 'Linux';

/** A token's meaning is always relative to the command it appears in. */
export interface CommandPart {
  token: string;
  kind: 'command' | 'subcommand' | 'flag' | 'value' | 'path' | 'operator';
  meaning: string;
}

export interface CommandExplanation {
  normalized: string;
  os: string;
  summary: string;
  plainEnglish: string;
  risk: 'safe' | 'caution' | 'destructive';
  riskNote?: string;
  parts: CommandPart[];
  commonFlags: { flag: string; meaning: string }[];
  examples: { command: string; description: string }[];
  cautions?: string[];
}

export interface AIResponse {
  steps: GuideStep[];
  overview: string;
  commonShortcuts: { key: string; action: string }[];
  beginnerChecklist: string[];
  faqs: FAQItem[];
}

export enum Category {
  OS = 'OS',
  SECURITY = 'Security',
  OFFICE = 'Office',
  PRODUCTIVITY = 'Productivity',
  CREATIVE = 'Creative',
  DEV = 'Development',
  DEVOPS = 'DevOps',
  CLOUD = 'Cloud Infrastructure',
  ENTERPRISE = 'Enterprise Systems',
  WEB = 'Web Platforms',
  ENGINEERING = 'Engineering & CAD',
  GAMING = 'Gaming Platforms',
  FINANCE = 'Finance & ERP',
  SOCIAL_MEDIA = 'Social & Marketing',
  COMMUNICATION = 'Communication',
  STREAMING = 'Streaming & Media',
  E_COMMERCE = 'Marketplaces',
  DESIGN = 'Design Tools',
  COLLABORATION = 'Team Collaboration'
}
