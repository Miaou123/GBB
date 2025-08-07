// app/api/jobs/route.ts - Updated version
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
    const forceRefresh = searchParams.get('refresh') === 'true'; // Only true when user clicks "Actualiser"

    console.log('🔍 API: Fetching jobs with filters:', { companies, locations, search, forceRefresh });
    console.log('🔍 DEBUG: refresh param value:', searchParams.get('refresh'));
    console.log('🔍 DEBUG: forceRefresh boolean:', forceRefresh);

    // Get all jobs from scrapers
    // IMPORTANT: Only use forceRefresh when explicitly requested
    const scrapingResult = await scraperService.getAllJobs(forceRefresh);
    
    // Debug: Check what we got
    console.log('🔍 Scraping result type:', typeof scrapingResult);
    console.log('🔍 Scraping result keys:', Object.keys(scrapingResult));
    
    const scrapedJobs = scrapingResult.jobs;
    const scrapingErrors = scrapingResult.errors;
    
    // Debug: Check if scrapedJobs is an array
    console.log('🔍 scrapedJobs type:', typeof scrapedJobs, 'isArray:', Array.isArray(scrapedJobs));
    
    if (!Array.isArray(scrapedJobs)) {
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

    console.log(`✅ API: Returning ${jobOffers.length} jobs (cached: ${cacheStatus.cached}, age: ${cacheStatus.age}h)`);
    
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
      source: 'mock-fallback',
      scrapingErrors: [{
        company: 'System',
        error: 'All scrapers failed, using mock data',
        website: 'system'
      }]
    };

    return NextResponse.json(response);
  }
}