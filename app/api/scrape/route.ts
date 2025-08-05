// app/api/scraper/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ScraperService } from '@/lib/services/scraperService';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting scraper API endpoint...');
    
    const scraperService = new ScraperService();
    
    // Check if it's a specific company scrape or all companies
    const body = await request.json().catch(() => ({}));
    const { company } = body;
    
    if (company) {
      console.log(`🔍 Scraping specific company: ${company}`);
      
      // For specific company, use individual scraper
      let jobs;
      switch (company.toLowerCase()) {
        case 'infomil':
          jobs = await scraperService.scrapeCompany('Infomil');
          break;
        case 'estreem':
          jobs = await scraperService.scrapeCompany('Estreem');
          break;
        case 'bpce':
          jobs = await scraperService.scrapeCompany('BPCE');
          break;
        case 'air france':
        case 'airfrance':
          jobs = await scraperService.scrapeCompany('Air France');
          break;
        case 'berger levrault':
        case 'bergerlevrault':
          jobs = await scraperService.scrapeCompany('Berger Levrault');
          break;
        default:
          return NextResponse.json({
            success: false,
            error: `Unknown company: ${company}`,
            message: 'Supported companies: Infomil, Estreem, BPCE, Air France, Berger Levrault'
          }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully scraped ${company}`,
        jobsCount: jobs.length,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('🔍 Scraping all companies...');
      const results = await scraperService.scrapeAllJobs();
      
      // Get updated stats
      const stats = await scraperService.getScrapingStats();
      
      return NextResponse.json({
        success: true,
        message: 'Successfully scraped all companies',
        results: {
          newJobs: results.newJobs,
          updatedJobs: results.updatedJobs,
          deactivatedJobs: results.deactivatedJobs,
          totalActiveJobs: stats.totalActiveJobs
        },
        stats: stats.jobsByCompany,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Error in scraper API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scrape jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const scraperService = new ScraperService();
    const stats = await scraperService.getScrapingStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalActiveJobs: stats.totalActiveJobs,
        jobsByCompany: stats.jobsByCompany,
        lastScrapedAt: stats.lastScrapedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting scraper stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scraper stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}