// lib/types.ts - Complete type definitions

export interface JobOffer {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  publishDate?: string;
  url: string;
  source?: string;
  contractType?: string;
  description?: string;
}

export interface FilterState {
  companies: string[];
  locations: string[];
  jobTitles: string[];
  searchTerm: string;
}

export interface FilterProps {
  selectedItems: string[];
  allItems: string[];
  onChange: (items: string[]) => void;
  title: string;
}

export interface JobTitleFilterProps {
  selectedTitles: string[];
  allJobs: JobOffer[];
  onChange: (titles: string[]) => void;
}

export interface JobCategory {
  name: string;
  titles: string[];
}

export interface ScrapingError {
  company: string;
  error: string;
  website: string;
}

export interface ScraperStatus {
  company: string;
  website: string;
  status: 'success' | 'error' | 'loading';
  jobCount?: number;
  error?: string;
}

export interface CacheInfo {
  isFromCache: boolean;
  age: number;
  jobCount: number;
  remainingTime: number;
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
  cacheInfo?: CacheInfo;
  scrapingErrors?: ScrapingError[];
  scraperStatuses?: ScraperStatus[];
}

// Sorting types for JobTable
export type SortField = 'companyName' | 'jobTitle' | 'location' | 'publishDate';
export type SortDirection = 'asc' | 'desc';

export type MatchingOptions = {
  minKeywords?: number;
  caseSensitive?: boolean;
  exactMatch?: boolean;
};

// Component prop types
export interface ClientFilterProps {
  companies: string[];
  selectedCompanies: string[];
  onCompanyChange: (companies: string[]) => void;
}

export interface LocationFilterProps {
  locations: string[];
  selectedLocations: string[];
  onLocationChange: (locations: string[]) => void;
}

export interface JobTitleFilterComponentProps {
  jobTitles: string[];
  selectedJobTitles: string[];
  onJobTitleChange: (jobTitles: string[]) => void;
}

export interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  loading: boolean;
}

export interface ScraperStatusDashboardProps {
  scraperStatuses: ScraperStatus[];
}

export interface ScraperStatusSummaryProps {
  scraperStatuses: ScraperStatus[];
}