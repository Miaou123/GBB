// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { JobService } from '@/lib/services/jobService';
import { ApiResponse } from '@/lib/types';

const jobService = new JobService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';

    // Get jobs from database
    const jobs = await jobService.getJobs({
      companies: companies.length > 0 ? companies : undefined,
      locations: locations.length > 0 ? locations : undefined,
      search: search || undefined
    });

    // Convert MongoDB documents to JobOffer format
    const jobOffers = jobs.map(job => ({
      id: job.id,
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      location: job.location,
      publishDate: job.publishDate,
      url: job.url
    }));

    const response: ApiResponse = {
      jobs: jobOffers,
      lastUpdated: new Date().toISOString(),
      totalCount: jobOffers.length,
      source: 'database'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching jobs from database:', error);
    
    // Fallback to mock data if database fails
    const { mockJobs } = await import('@/lib/mockData');
    
    let filteredJobs = [...mockJobs];
    const { searchParams } = new URL(request.url);
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';

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
      source: 'mock'
    };

    return NextResponse.json(response);
  }
}

// New endpoint for scraping data
export async function POST(request: Request) {
  try {
    const { company } = await request.json();
    
    // This will be implemented when we add scrapers
    return NextResponse.json({ 
      message: `Scraping initiated for ${company}`,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error initiating scraping:', error);
    return NextResponse.json(
      { error: 'Failed to initiate scraping' },
      { status: 500 }
    );
  }
}