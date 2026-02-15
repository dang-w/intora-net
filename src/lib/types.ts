export interface PieceMeta {
  id: string;
  designation: string;
  subtitle: string;
  status: 'live' | 'wip' | 'planned';
  date?: string;
  description?: string;
  hasAnalysis?: boolean;
  hasAudio?: boolean;
  version?: string;
  lastModified?: string;
  changelog?: string[];
}
