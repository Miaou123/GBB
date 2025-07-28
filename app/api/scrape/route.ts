// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { ScraperService } from '@/lib/services/scraperService';
import { JobService } from '@/lib/services/jobService';

const scraperService = new ScraperService();
const jobService = new JobService();

export async function POST(request: Request) {
  try {
    console.log('🚀 Starting job scraping process...');
    
    const startTime = Date.now();
    
    // Scrape all jobs
    const scrapedJobs = await scraperService.scrapeAllJobs();
    
    if (scrapedJobs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No jobs were scraped',
        jobsAdded: 0,
        duration: Date.now() - startTime
      });
    }
    
    // Save jobs to database
    console.log(`💾 Saving ${scrapedJobs.length} jobs to database...`);
    const result = await jobService.upsertJobs(scrapedJobs);
    
    // Log the scraping activity
    await jobService.logScraping({
      companyName: 'All Companies',
      status: 'success',
      jobsFound: scrapedJobs.length,
      duration: Date.now() - startTime
    });
    
    console.log(`✅ Scraping completed: ${result.upsertedCount} new jobs, ${result.modifiedCount} updated jobs`);
    
    return NextResponse.json({
      success: true,
      message: 'Jobs scraped successfully',
      jobsAdded: result.upsertedCount,
      jobsUpdated: result.modifiedCount,
      totalJobs: scrapedJobs.length,
      duration: Date.now() - startTime,
      companies: [...new Set(scrapedJobs.map(job => job.companyName))]
    });
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    
    // Log the failed scraping attempt
    await jobService.logScraping({
      companyName: 'All Companies',
      status: 'failed',
      jobsFound: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - Date.now()
    });
    
    return NextResponse.json({
      success: false,
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}