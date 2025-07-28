import { NextResponse } from 'next/server';
import { mockJobs } from '@/lib/mockData';
import { ApiResponse } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';

    let filteredJobs = [...mockJobs];

    if (companies.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        companies.includes(job.companyName)
      );
    }

    if (locations.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        locations.includes(job.location)
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.companyName.toLowerCase().includes(searchLower) ||
        job.jobTitle.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    }

    filteredJobs.sort((a, b) => a.companyName.localeCompare(b.companyName));

    const response: ApiResponse = {
      jobs: filteredJobs,
      lastUpdated: new Date().toISOString(),
      totalCount: filteredJobs.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}