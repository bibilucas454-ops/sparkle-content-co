export interface Trend {
  id: string;
  topic: string;
  platform: string;
  trending_score: number;
  description: string;
  category: string;
}

export interface ContentItem {
  id: string;
  type: string;
  topic: string;
  viral_score: number;
  created_at: string;
}
