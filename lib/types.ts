// lib/types.ts - Updated version with remainingTime and sorting types
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

export interface FilterProps {
  selectedItems: string[];
  allItems: string[];
  onChange: (items: string[]) => void;
  title: string;
}

export interface ScrapingError {
  company: string;
  error: string;
  website: string;
}

export interface CacheStatus {
  cached: boolean;
  age?: number;
  jobCount?: number;
  remainingTime?: number; // Added this property
}

export interface ApiResponse {
  jobs: JobOffer[];
  lastUpdated: string;
  totalCount: number;
  source: 'mock-fallback' | 'scraping' | 'persistent-cache' | 'fresh-scraping';
  cacheStatus?: CacheStatus;
  scrapingErrors?: ScrapingError[];
}

// Sorting types for JobTable
export type SortField = 'companyName' | 'jobTitle' | 'location' | 'publishDate';
export type SortDirection = 'asc' | 'desc';