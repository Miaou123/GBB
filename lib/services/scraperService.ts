// lib/services/scraperService.ts
import { EstreemScraper } from '../scrapers/estreemScraper';
import { InfomilScraper } from '../scrapers/infomilScraper';
import { BPCEScraper } from '../scrapers/bpceScraper';
import { AirFranceScraper } from '../scrapers/airfranceScraper';
import { BergerLevraultScraper } from '../scrapers/bergerLevraultScraper';

export interface ScrapedJob {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  publishDate?: string;
  url: string;
  source: string;
  description?: string;
  contractType?: string;
}

// Simple in-memory cache (optional - 30 minutes)
interface CacheEntry {
  data: ScrapedJob[];
  timestamp: number;
}

export class ScraperService {
  private estreemScraper = new EstreemScraper();
  private infomilScraper = new InfomilScraper();
  private bpceScraper = new BPCEScraper();
  private airfranceScraper = new AirFranceScraper();
  private bergerLevraultScraper = new BergerLevraultScraper();
  
  // Simple in-memory cache
  private cache: CacheEntry | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  // Get all jobs from all companies (with optional caching)
  async getAllJobs(useCache: boolean = true): Promise<ScrapedJob[]> {
    // Check cache first
    if (useCache && this.cache && this.isCacheValid()) {
      console.log('📋 Returning cached jobs');
      return this.cache.data;
    }
    
    console.log('🚀 Starting fresh scraping process...');
    
    const allJobs: ScrapedJob[] = [];
    const scrapePromises: Promise<ScrapedJob[]>[] = [];
    
    // Scrape all companies in parallel for speed
    try {
      scrapePromises.push(this.scrapeCompany('BPCE', this.bpceScraper));
      scrapePromises.push(this.scrapeCompany('Air France', this.airfranceScraper));
      scrapePromises.push(this.scrapeCompany('Estreem', this.estreemScraper));
      scrapePromises.push(this.scrapeCompany('Infomil', this.infomilScraper));
      scrapePromises.push(this.scrapeCompany('Berger Levrault', this.bergerLevraultScraper));
      
      // Wait for all scrapers to complete
      const results = await Promise.allSettled(scrapePromises);
      
      // Collect successful results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value);
        } else {
          console.error(`❌ Scraper ${index} failed:`, result.reason);
        }
      });
      
      // Remove duplicates based on id
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      // Update cache
      if (useCache) {
        this.cache = {
          data: uniqueJobs,
          timestamp: Date.now()
        };
      }
      
      console.log(`✅ Scraping completed: ${uniqueJobs.length} unique jobs found`);
      return uniqueJobs;
      
    } catch (error) {
      console.error('❌ Error in getAllJobs:', error);
      
      // Return cached data if available, otherwise empty array
      if (this.cache && this.cache.data.length > 0) {
        console.log('📋 Returning stale cached data due to error');
        return this.cache.data;
      }
      
      return [];
    }
  }
  
  // Scrape a specific company
  private async scrapeCompany(
    companyName: string, 
    scraper: EstreemScraper | InfomilScraper | BPCEScraper | AirFranceScraper | BergerLevraultScraper
  ): Promise<ScrapedJob[]> {
    try {
      console.log(`📍 Scraping ${companyName}...`);
      
      const jobs: ScrapedJob[] = await scraper.scrapeJobs();
      
      console.log(`✅ ${companyName}: ${jobs.length} jobs found`);
      return jobs;
      
    } catch (error) {
      console.error(`❌ Error scraping ${companyName}:`, error);
      return [];
    }
  }
  
  // Remove duplicate jobs based on ID
  private removeDuplicates(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      if (seen.has(job.id)) {
        return false;
      }
      seen.add(job.id);
      return true;
    });
  }
  
  // Check if cache is still valid
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return (Date.now() - this.cache.timestamp) < this.CACHE_DURATION;
  }
  
  // Clear cache manually (useful for testing)
  clearCache(): void {
    this.cache = null;
    console.log('🗑️ Cache cleared');
  }
  
  // Get cache status
  getCacheStatus(): { 
    cached: boolean; 
    age?: number; 
    jobCount?: number; 
    remainingTime?: number 
  } {
    if (!this.cache) {
      return { cached: false };
    }
    
    const age = Date.now() - this.cache.timestamp;
    const remainingTime = this.CACHE_DURATION - age;
    
    return {
      cached: true,
      age: Math.floor(age / 1000), // seconds
      jobCount: this.cache.data.length,
      remainingTime: Math.max(0, Math.floor(remainingTime / 1000)) // seconds
    };
  }
}