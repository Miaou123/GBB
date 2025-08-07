// app/api/jobs/route.ts - CORRECTED VERSION
import { NextResponse } from 'next/server';
import { ScraperService } from '@/lib/services/scraperService';
import { JobOffer, ApiResponse } from '@/lib/types';

const scraperService = new ScraperService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log('🔍 API: Fetching jobs with filters:', { companies, locations, search, forceRefresh });
    console.log('🔍 DEBUG: refresh param value:', searchParams.get('refresh'));
    console.log('🔍 DEBUG: forceRefresh boolean:', forceRefresh);

    // Get all jobs from scrapers - CORRECT: Pass forceRefresh directly
    const scrapingResult = await scraperService.getAllJobs(forceRefresh);
    
    // Debug: Check what we got
    console.log('🔍 Scraping result type:', typeof scrapingResult);
    console.log('🔍 Scraping result keys:', scrapingResult ? Object.keys(scrapingResult) : 'null');
    
    if (!scrapingResult || !scrapingResult.jobs) {
      throw new Error('Invalid scraping result: missing jobs property');
    }
    
    const scrapedJobs = scrapingResult.jobs;
    const scrapingErrors = scrapingResult.errors || [];
    
    // Debug: Check if scrapedJobs is an array
    console.log('🔍 scrapedJobs type:', typeof scrapedJobs, 'isArray:', Array.isArray(scrapedJobs));
    console.log('🔍 scrapedJobs length:', Array.isArray(scrapedJobs) ? scrapedJobs.length : 'N/A');
    
    if (!Array.isArray(scrapedJobs)) {
      console.error('❌ scrapedJobs is not an array:', scrapedJobs);
      throw new Error(`Expected scrapedJobs to be array, got: ${typeof scrapedJobs}`);
    }

    // Convert scraped jobs to JobOffer format
    let jobOffers: JobOffer[] = scrapedJobs.map(job => ({
      id: job.id,
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      location: job.location,
      publishDate: job.publishDate,
      url: job.url
    }));

    console.log('✅ Converted to JobOffer format:', jobOffers.length, 'jobs');

    // Apply filters
    if (companies.length > 0) {
      jobOffers = jobOffers.filter(job => companies.includes(job.companyName));
      console.log('🔍 After company filter:', jobOffers.length, 'jobs');
    }

    if (locations.length > 0) {
      jobOffers = jobOffers.filter(job => locations.includes(job.location));
      console.log('🔍 After location filter:', jobOffers.length, 'jobs');
    }

    if (search) {
      const searchLower = search.toLowerCase();
      jobOffers = jobOffers.filter(job =>
        job.companyName.toLowerCase().includes(searchLower) ||
        job.jobTitle.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
      console.log('🔍 After search filter:', jobOffers.length, 'jobs');
    }

    // Get cache status for UI display
    const cacheStatus = scraperService.getCacheStatus();
    
    const response: ApiResponse = {
      jobs: jobOffers,
      lastUpdated: new Date().toISOString(),
      totalCount: jobOffers.length,
      source: cacheStatus.cached ? 'persistent-cache' : 'fresh-scraping',
      cacheStatus,
      scrapingErrors
    };

    console.log(`✅ API: Returning ${jobOffers.length} jobs (cached: ${cacheStatus.cached})`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch jobs', 
        details: error instanceof Error ? error.message : 'Unknown error',
        jobs: [],
        totalCount: 0,
        lastUpdated: new Date().toISOString(),
        source: 'mock-fallback'
      },
      { status: 500 }
    );
  }
}