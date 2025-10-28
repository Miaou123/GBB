// lib/types.ts - UPDATED VERSION with job title filter support

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
  jobTitles: string[];  // NEW: Added job title filter
  searchTerm: string;
}

export interface FilterProps {
  selectedItems: string[];
  allItems: string[];
  onChange: (items: string[]) => void;
  title: string;
}

// NEW: Interface for job title filter
export interface JobTitleFilterProps {
  selectedTitles: string[];
  allJobs: JobOffer[];
  onChange: (titles: string[]) => void;
}

// NEW: Interface for job categories
export interface JobCategory {
  name: string;
  titles: string[];
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
  remainingTime?: number;
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

// NEW: Job matching types
export type MatchingOptions = {
  minKeywords?: number;      // Minimum matching keywords required (default: 2)
  caseSensitive?: boolean;   // Case sensitive matching (default: false)
  exactMatch?: boolean;      // Require exact match instead of keyword-based (default: false)
};