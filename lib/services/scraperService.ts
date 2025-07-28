// lib/services/scraperService.ts
import { JobDocument } from '../models/job';
import { EstreemScraper } from '../scrapers/estreemScraper';
import { InfomilScraper } from '../scrapers/infomilScraper';

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
  
  // Convert scraped jobs to database format
  convertToJobDocument(scrapedJob: ScrapedJob): JobDocument {
    return {
      id: scrapedJob.id,
      companyName: scrapedJob.companyName,
      jobTitle: scrapedJob.jobTitle,
      location: scrapedJob.location,
      publishDate: scrapedJob.publishDate,
      url: scrapedJob.url,
      source: scrapedJob.source,
      scrapedAt: new Date(),
      isActive: true,
      description: scrapedJob.description,
      contractType: scrapedJob.contractType
    };
  }
  
  // Scrape all configured companies
  async scrapeAllJobs(): Promise<JobDocument[]> {
    console.log('🚀 Starting to scrape all jobs...');
    
    const allJobs: JobDocument[] = [];
    
    try {
      // Scrape Estreem
      console.log('📍 Scraping Estreem...');
      const estreemJobs = await this.estreemScraper.scrapeJobs();
      allJobs.push(...estreemJobs.map(job => this.convertToJobDocument(job)));
      console.log(`✅ Estreem: ${estreemJobs.length} jobs processed`);
      
      // Scrape Infomil
      console.log('📍 Scraping Infomil...');
      const infomilJobs = await this.infomilScraper.scrapeJobs();
      allJobs.push(...infomilJobs.map(job => this.convertToJobDocument(job)));
      console.log(`✅ Infomil: ${infomilJobs.length} jobs processed`);
      
      console.log(`🎉 Total jobs scraped: ${allJobs.length}`);
      return allJobs;
      
    } catch (error) {
      console.error('❌ Error in scrapeAllJobs:', error);
      return allJobs;
    }
  }
  
  // Scrape specific company
  async scrapeCompany(companyName: string): Promise<JobDocument[]> {
    console.log(`🔍 Scraping ${companyName}...`);
    
    try {
      let jobs: ScrapedJob[] = [];
      
      switch (companyName.toLowerCase()) {
        case 'estreem':
          jobs = await this.estreemScraper.scrapeJobs();
          break;
        case 'infomil':
          jobs = await this.infomilScraper.scrapeJobs();
          break;
        default:
          console.warn(`⚠️ Unknown company: ${companyName}`);
          return [];
      }
      
      return jobs.map(job => this.convertToJobDocument(job));
      
    } catch (error) {
      console.error(`❌ Error scraping ${companyName}:`, error);
      return [];
    }
  }
}