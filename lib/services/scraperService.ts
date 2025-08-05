// lib/services/scraperService.ts - Updated with duplicate prevention
import { JobDocument } from '../models/job';
import { EstreemScraper } from '../scrapers/estreemScraper';
import { InfomilScraper } from '../scrapers/infomilScraper';
import { BPCEScraper } from '../scrapers/bpceScraper';
import { AirFranceScraper } from '../scrapers/airfranceScraper';
import { BergerLevraultScraper } from '../scrapers/bergerLevraultScraper';
import { removeDuplicateJobs, normalizeJobData } from '../utils/jobUtils';

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

export class ScraperService {
  private estreemScraper = new EstreemScraper();
  private infomilScraper = new InfomilScraper();
  private bpceScraper = new BPCEScraper();
  private airfranceScraper = new AirFranceScraper();
  private bergerLevraultScraper = new BergerLevraultScraper();
  
  // Convert scraped jobs to database format with normalization
  convertToJobDocument(scrapedJob: ScrapedJob): JobDocument {
    const normalized = normalizeJobData(scrapedJob);
    
    return {
      id: normalized.id,
      companyName: normalized.companyName,
      jobTitle: normalized.jobTitle,
      location: normalized.location,
      publishDate: normalized.publishDate,
      url: normalized.url,
      source: normalized.source,
      scrapedAt: new Date(),
      isActive: true,
      description: normalized.description,
      contractType: normalized.contractType
    };
  }
  
  // Scrape all configured companies with duplicate prevention
  async scrapeAllJobs(): Promise<JobDocument[]> {
    console.log('🚀 Starting to scrape all jobs...');
    
    const allJobs: JobDocument[] = [];
    
    try {
      // Scrape each company
      const companies = [
        { name: 'BPCE', scraper: this.bpceScraper },
        { name: 'Estreem', scraper: this.estreemScraper },
        { name: 'Infomil', scraper: this.infomilScraper },
        { name: 'Air France', scraper: this.airfranceScraper },
        { name: 'Berger Levrault', scraper: this.bergerLevraultScraper }
      ];
      
      for (const company of companies) {
        try {
          console.log(`📍 Scraping ${company.name}...`);
          const jobs = await company.scraper.scrapeJobs();
          const normalizedJobs = jobs.map(job => this.convertToJobDocument(job));
          allJobs.push(...normalizedJobs);
          console.log(`✅ ${company.name}: ${jobs.length} jobs processed`);
        } catch (error) {
          console.error(`❌ Error scraping ${company.name}:`, error);
          // Continue with other companies even if one fails
        }
      }
      
      // Remove duplicates across all scraped jobs
      const uniqueJobs = removeDuplicateJobs(allJobs);
      
      console.log(`🎉 Scraping complete: ${allJobs.length} total scraped, ${uniqueJobs.length} unique jobs`);
      return uniqueJobs;
      
    } catch (error) {
      console.error('❌ Error in scrapeAllJobs:', error);
      return allJobs; // Return what we have so far
    }
  }
  
  // Scrape specific company with duplicate prevention
  async scrapeCompany(companyName: string): Promise<JobDocument[]> {
    console.log(`🔍 Scraping ${companyName}...`);
    
    try {
      let jobs: ScrapedJob[] = [];
      
      switch (companyName.toLowerCase()) {
        case 'bpce':
          jobs = await this.bpceScraper.scrapeJobs();
          break;
        case 'estreem':
          jobs = await this.estreemScraper.scrapeJobs();
          break;
        case 'infomil':
          jobs = await this.infomilScraper.scrapeJobs();
          break;
        case 'air france':
        case 'airfrance':
          jobs = await this.airfranceScraper.scrapeJobs();
          break;
        case 'berger levrault':
        case 'bergerlevrault':
          jobs = await this.bergerLevraultScraper.scrapeJobs();
          break;
        default:
          throw new Error(`Unknown company: ${companyName}`);
      }
      
      const normalizedJobs = jobs.map(job => this.convertToJobDocument(job));
      const uniqueJobs = removeDuplicateJobs(normalizedJobs);
      
      console.log(`✅ ${companyName}: ${jobs.length} scraped, ${uniqueJobs.length} unique`);
      return uniqueJobs;
      
    } catch (error) {
      console.error(`❌ Error scraping ${companyName}:`, error);
      return [];
    }
  }
  
  // Get scraping statistics
  async getScrapingStats(): Promise<{[key: string]: number}> {
    const stats: {[key: string]: number} = {};
    
    const companies = [
      { name: 'BPCE', scraper: this.bpceScraper },
      { name: 'Estreem', scraper: this.estreemScraper },
      { name: 'Infomil', scraper: this.infomilScraper },
      { name: 'Air France', scraper: this.airfranceScraper },
      { name: 'Berger Levrault', scraper: this.bergerLevraultScraper }
    ];
    
    for (const company of companies) {
      try {
        const jobs = await company.scraper.scrapeJobs();
        stats[company.name] = jobs.length;
      } catch (error) {
        console.error(`Error getting stats for ${company.name}:`, error);
        stats[company.name] = 0;
      }
    }
    
    return stats;
  }
}