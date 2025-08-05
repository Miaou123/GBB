// lib/services/scraperService.ts
import { JobDocument } from '../models/job';
import { JobService } from './jobService';
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
  private jobService = new JobService();
  
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
  
  // Scrape all configured companies with proper cleanup
  async scrapeAllJobs(): Promise<{ newJobs: number; updatedJobs: number; deactivatedJobs: number }> {
    console.log('🚀 Starting job scraping process...');
    console.log('🚀 Starting to scrape all jobs...');
    
    const results = {
      newJobs: 0,
      updatedJobs: 0,
      deactivatedJobs: 0
    };
    
    try {
      // Scrape BPCE (Priority - has Open Data API)
      await this.scrapeAndUpdateCompany('BPCE', this.bpceScraper, results);
      
      // Scrape Estreem
      await this.scrapeAndUpdateCompany('Estreem', this.estreemScraper, results);
      
      // Scrape Infomil
      await this.scrapeAndUpdateCompany('Infomil', this.infomilScraper, results);
      
      // Scrape Air France
      await this.scrapeAndUpdateCompany('Air France', this.airfranceScraper, results);
      
      // Scrape Berger Levrault
      await this.scrapeAndUpdateCompany('Berger Levrault', this.bergerLevraultScraper, results);
      
      console.log(`✅ Scraping completed: ${results.newJobs} new jobs, ${results.updatedJobs} updated jobs, ${results.deactivatedJobs} deactivated jobs`);
      return results;
      
    } catch (error) {
      console.error('❌ Error in scrapeAllJobs:', error);
      return results;
    }
  }
  
  // Scrape a specific company and update database with cleanup
  private async scrapeAndUpdateCompany(
    companyName: string, 
    scraper: EstreemScraper | InfomilScraper | BPCEScraper | AirFranceScraper | BergerLevraultScraper, 
    results: { newJobs: number; updatedJobs: number; deactivatedJobs: number }
  ): Promise<void> {
    try {
      console.log(`📍 Scraping ${companyName}...`);
      
      // Scrape current jobs
      const scrapedJobs: ScrapedJob[] = await scraper.scrapeJobs();
      const jobDocuments: JobDocument[] = scrapedJobs.map((job: ScrapedJob) => this.convertToJobDocument(job));
      
      if (jobDocuments.length > 0) {
        // Step 1: Upsert all scraped jobs
        console.log(`💾 Saving ${jobDocuments.length} jobs to database...`);
        const upsertResult = await this.jobService.upsertJobs(jobDocuments);
        
        // Step 2: Mark old jobs as inactive (cleanup)
        const activeJobIds = jobDocuments.map(job => job.id);
        const deactivateResult = await this.jobService.markJobsInactive(companyName, activeJobIds);
        
        // Update counters
        results.newJobs += upsertResult.upsertedCount || 0;
        results.updatedJobs += upsertResult.modifiedCount || 0;
        results.deactivatedJobs += deactivateResult.modifiedCount || 0;
        
        console.log(`✅ ${companyName}: ${jobDocuments.length} jobs processed`);
        console.log(`🔄 Processing ${jobDocuments.length} jobs, ${jobDocuments.length} unique after deduplication`);
        console.log(`✅ Upsert complete: ${upsertResult.upsertedCount || 0} new, ${upsertResult.modifiedCount || 0} updated`);
      } else {
        console.log(`⚠️ ${companyName}: No jobs found`);
      }
      
    } catch (error) {
      console.error(`❌ Error scraping ${companyName}:`, error);
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
          console.log(`⚠️ Unknown company: ${companyName}`);
          return [];
      }
      
      const jobDocuments: JobDocument[] = jobs.map((job: ScrapedJob) => this.convertToJobDocument(job));
      
      if (jobDocuments.length > 0) {
        // Update database with cleanup
        await this.jobService.upsertJobs(jobDocuments);
        const activeJobIds = jobDocuments.map(job => job.id);
        await this.jobService.markJobsInactive(companyName, activeJobIds);
      }
      
      console.log(`✅ ${companyName}: ${jobDocuments.length} jobs processed`);
      return jobDocuments;
      
    } catch (error) {
      console.error(`❌ Error scraping ${companyName}:`, error);
      return [];
    }
  }
  
  // Get scraping statistics
  async getScrapingStats(): Promise<{
    totalActiveJobs: number;
    jobsByCompany: { [company: string]: number };
    lastScrapedAt: Date | null;
  }> {
    try {
      const allJobs = await this.jobService.getJobs();
      const jobsByCompany = await this.jobService.getJobsCountByCompany();
      
      let lastScrapedAt: Date | null = null;
      allJobs.forEach((job: JobDocument) => {
        if (job.scrapedAt && (!lastScrapedAt || job.scrapedAt > lastScrapedAt)) {
          lastScrapedAt = job.scrapedAt;
        }
      });
      
      return {
        totalActiveJobs: allJobs.length,
        jobsByCompany,
        lastScrapedAt
      };
      
    } catch (error) {
      console.error('❌ Error getting scraping stats:', error);
      return {
        totalActiveJobs: 0,
        jobsByCompany: {},
        lastScrapedAt: null
      };
    }
  }
}