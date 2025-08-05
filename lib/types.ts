// lib/types.ts
export interface JobOffer {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  publishDate?: string;
  url: string;
}

export interface FilterState {
  companies: string[];
  locations: string[];
  searchTerm: string;
}

export interface ApiResponse {
  jobs: JobOffer[];
  lastUpdated: string;
  totalCount: number;
  source: 'scraping' | 'mock-fallback';
  cacheStatus?: {
    cached: boolean;
    age?: number;
    jobCount?: number;
    remainingTime?: number;
  };
}

export interface FilterProps {
  selectedItems: string[];
  allItems: string[];
  onChange: (items: string[]) => void;
  title: string;
}

export type SortDirection = 'asc' | 'desc';
export type SortField = 'companyName' | 'jobTitle' | 'location' | 'publishDate';