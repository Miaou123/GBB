// lib/models/Job.ts
export interface JobDocument {
    _id?: string;
    id: string;
    companyName: string;
    jobTitle: string;
    location: string;
    publishDate?: string;
    url: string;
    source: string; // 'estreem', 'infomil', etc.
    scrapedAt: Date;
    isActive: boolean;
    description?: string;
    contractType?: string;
    salary?: string;
  }
  
  export interface CompanyDocument {
    _id?: string;
    name: string;
    website: string;
    scrapingUrl: string;
    isActive: boolean;
    lastScrapedAt?: Date;
    totalJobs: number;
  }
  
  export interface ScrapingLogDocument {
    _id?: string;
    companyName: string;
    scrapedAt: Date;
    status: 'success' | 'failed' | 'partial';
    jobsFound: number;
    errorMessage?: string;
    duration: number; // in milliseconds
  }