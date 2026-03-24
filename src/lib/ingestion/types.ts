export interface RawItem {
  title: string;
  url: string;
  content?: string;
  publishedAt?: string;
  imageUrl?: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

export interface SourceAdapter {
  id: string;
  name: string;
  type: string;
  fetch(): Promise<RawItem[]>;
}

export interface PipelineResult {
  source: string;
  fetched: number;
  new: number;
  updated: number;
  errors: string[];
}
