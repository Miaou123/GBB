// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { ScraperService, ScrapedJob } from '@/lib/services/scraperService';
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

    // Get all jobs from scrapers (use cache unless force refresh)
    const scrapedJobs: ScrapedJob[] = await scraperService.getAllJobs(!forceRefresh);

    // Convert scraped jobs to JobOffer format
    let jobOffers: JobOffer[] = scrapedJobs.map(job => ({
      id: job.id,
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      location: job.location,
      publishDate: job.publishDate,
      url: job.url
    }));

    // Apply filters
    if (companies.length > 0) {
      jobOffers = jobOffers.filter(job => companies.includes(job.companyName));
    }

    if (locations.length > 0) {
      jobOffers = jobOffers.filter(job => locations.includes(job.location));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      jobOffers = jobOffers.filter(job =>
        job.companyName.toLowerCase().includes(searchLower) ||
        job.jobTitle.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    }

    // Get cache status for debugging
    const cacheStatus = scraperService.getCacheStatus();
    
    const response: ApiResponse = {
      jobs: jobOffers,
      lastUpdated: new Date().toISOString(),
      totalCount: jobOffers.length,
      source: 'scraping',
      cacheStatus
    };

    console.log(`✅ API: Returning ${jobOffers.length} jobs (cache: ${cacheStatus.cached})`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Fallback to mock data if everything fails
    const { mockJobs } = await import('@/lib/mockData');
    
    let filteredJobs = [...mockJobs];
    const { searchParams } = new URL(request.url);
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';

    // Apply same filters to mock data
    if (companies.length > 0) {
      filteredJobs = filteredJobs.filter(job => companies.includes(job.companyName));
    }

    if (locations.length > 0) {
      filteredJobs = filteredJobs.filter(job => locations.includes(job.location));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.companyName.toLowerCase().includes(searchLower) ||
        job.jobTitle.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    }

    const response: ApiResponse = {
      jobs: filteredJobs,
      lastUpdated: new Date().toISOString(),
      totalCount: filteredJobs.length,
      source: 'mock-fallback'
    };

    return NextResponse.json(response);
  }
}
