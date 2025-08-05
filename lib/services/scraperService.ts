// lib/services/scraperService.ts
import { JobDocument } from '../models/job';
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

export class ScraperService {
  private estreemScraper = new EstreemScraper();
  private infomilScraper = new InfomilScraper();
  private bpceScraper = new BPCEScraper();
  private airfranceScraper = new AirFranceScraper();
  private bergerLevraultScraper = new BergerLevraultScraper();
  
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
      // Scrape BPCE (Priority - has Open Data API)
      console.log('📍 Scraping BPCE...');
      const bpceJobs = await this.bpceScraper.scrapeJobs();
      allJobs.push(...bpceJobs.map(job => this.convertToJobDocument(job)));
      console.log(`✅ BPCE: ${bpceJobs.length} jobs processed`);
      
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
      
      // Scrape Air France
      console.log('📍 Scraping Air France...');
      const airfranceJobs = await this.airfranceScraper.scrapeJobs();
      allJobs.push(...airfranceJobs.map(job => this.convertToJobDocument(job)));
      console.log(`✅ Air France: ${airfranceJobs.length} jobs processed`);
      
      // Scrape Berger Levrault
      console.log('📍 Scraping Berger Levrault...');
      const bergerLevraultJobs = await this.bergerLevraultScraper.scrapeJobs();
      allJobs.push(...bergerLevraultJobs.map(job => this.convertToJobDocument(job)));
      console.log(`✅ Berger Levrault: ${bergerLevraultJobs.length} jobs processed`);
      
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
          console.warn(`⚠️ Unknown company: ${companyName}`);
          return [];
      }
      
      return jobs.map(job => this.convertToJobDocument(job));
      
    } catch (error) {
      console.error(`❌ Error scraping ${companyName}:`, error);
      return [];
    }
  }
  
  // Get list of supported companies
  getSupportedCompanies(): string[] {
    return [
      'BPCE',
      'Estreem', 
      'Infomil',
      'Air France',
      'Berger Levrault'
    ];
  }
  
  // Get scraping statistics
  async getScrapingStats(): Promise<{[key: string]: number}> {
    const stats: {[key: string]: number} = {};
    
    for (const company of this.getSupportedCompanies()) {
      try {
        const jobs = await this.scrapeCompany(company);
        stats[company] = jobs.length;
      } catch (error) {
        console.error(`Error getting stats for ${company}:`, error);
        stats[company] = 0;
      }
    }
    
    return stats;
  }
}