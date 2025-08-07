// lib/services/scraperService.ts - Updated version
import { EstreemScraper } from '../scrapers/estreemScraper';
import { InfomilScraper } from '../scrapers/infomilScraper';
import { BPCEScraper } from '../scrapers/bpceScraper';
import { AirFranceScraper } from '../scrapers/airfranceScraper';
import { BergerLevraultScraper } from '../scrapers/bergerLevraultScraper';
import { PersistentCacheService } from './cacheService';

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

export interface ScrapingError {
  company: string;
  error: string;
  website: string;
}

export interface ScrapingResult {
  jobs: ScrapedJob[];
  errors: ScrapingError[];
}

export class ScraperService {
  private estreemScraper = new EstreemScraper();
  private infomilScraper = new InfomilScraper();
  private bpceScraper = new BPCEScraper();
  private airfranceScraper = new AirFranceScraper();
  private bergerLevraultScraper = new BergerLevraultScraper();
  private cacheService = new PersistentCacheService();
  
  // Company websites for error messages
  private readonly companyWebsites = {
    'BPCE': 'bpce.opendatasoft.com',
    'Air France': 'airfrance.jobs', 
    'Estreem': 'partecis.teamtailor.com',
    'Infomil': 'infomil.gestmax.fr',
    'Berger Levrault': 'recrute.berger-levrault.com'
  };
  
  /**
   * Get all jobs - uses persistent cache or scrapes fresh data
   * @param forceRefresh - if true, ignores cache and scrapes fresh data
   */
  async getAllJobs(forceRefresh: boolean = false): Promise<ScrapingResult> {
    // If force refresh (user clicked "Actualiser"), clear cache first
    if (forceRefresh) {
      console.log('🔄 Force refresh requested by user, clearing cache');
      this.cacheService.clearCache();
    } else {
      // Try to get cached data first for normal requests
      const cachedData = this.cacheService.getCachedData();
      if (cachedData) {
        console.log('📋 Returning cached jobs from file system');
        return {
          jobs: cachedData.jobs,
          errors: cachedData.errors
        };
      } else {
        console.log('📋 No valid cache found, will scrape fresh data');
      }
    }
    
    // No valid cache found or force refresh - scrape fresh data
    console.log('🚀 Starting fresh scraping process...');
    
    const allJobs: ScrapedJob[] = [];
    const allErrors: ScrapingError[] = [];
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
      
      // Collect successful results and errors
      results.forEach((result, index) => {
        const companies = ['BPCE', 'Air France', 'Estreem', 'Infomil', 'Berger Levrault'];
        const company = companies[index];
        
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value);
          console.log(`✅ ${company}: ${result.value.length} jobs`);
        } else {
          const error: ScrapingError = {
            company: company,
            error: result.reason instanceof Error ? 
              result.reason.message : 
              'Unknown scraping error',
            website: this.companyWebsites[company as keyof typeof this.companyWebsites]
          };
          allErrors.push(error);
          console.log(`❌ ${company}: ${error.error}`);
        }
      });
      
      // Remove duplicates across all sources
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      console.log(`✅ Scraping completed: ${uniqueJobs.length} unique jobs found`);
      
      // Save fresh data to persistent cache
      this.cacheService.saveToCache(uniqueJobs, allErrors);
      
      return {
        jobs: uniqueJobs,
        errors: allErrors
      };
      
    } catch (error) {
      console.error('❌ Fatal scraping error:', error);
      
      // If scraping completely fails, try to return any cached data as fallback
      const cachedData = this.cacheService.getCachedData();
      if (cachedData) {
        console.log('🆘 Using expired cache as fallback');
        return {
          jobs: cachedData.jobs,
          errors: [...cachedData.errors, {
            company: 'System',
            error: 'Fresh scraping failed, using cached data',
            website: 'system'
          }]
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Get cache status for UI display
   */
  getCacheStatus(): { cached: boolean; age?: number; jobCount?: number } {
    return this.cacheService.getCacheStatus();
  }
  
  /**
   * Check if system should auto-refresh (no cache or expired)
   */
  shouldAutoRefresh(): boolean {
    return this.cacheService.shouldRefresh();
  }
  
  private async scrapeCompany(companyName: string, scraper: any): Promise<ScrapedJob[]> {
    console.log(`📍 Scraping ${companyName}...`);
    return await scraper.scrapeJobs();
  }
  
  private removeDuplicates(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.companyName}-${job.jobTitle}-${job.location}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}