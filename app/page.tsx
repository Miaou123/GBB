'use client';

import { useState, useEffect, useCallback } from 'react';
import { JobOffer, FilterState, ApiResponse } from '@/lib/types';
import { getUniqueCompanies, getUniqueLocations, debounce, exportToCSV } from '@/lib/utils';
import JobTable from './components/JobTable';
import ClientFilter from './components/ClientFilter';
import LocationFilter from './components/LocationFilter';
import RefreshButton from './components/RefreshButton';

export default function HomePage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [allJobs, setAllJobs] = useState<JobOffer[]>([]); // Keep track of all jobs for filter options
  const [filteredJobs, setFilteredJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    companies: [],
    locations: [],
    searchTerm: ''
  });

  // Helper function to fetch jobs without current filters
  const fetchJobsWithoutFilters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data: ApiResponse = await response.json();
      setJobs(data.jobs);
      setFilteredJobs(data.jobs);
      setAllJobs(data.jobs);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger scraping
  const triggerScraping = useCallback(async () => {
    setScrapingLoading(true);
    try {
      console.log('🚀 Triggering scraping process...');
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Scraping request failed');
      }

      const result = await response.json();
      console.log('✅ Scraping result:', result);
      
      // After scraping, fetch the updated jobs and refresh all jobs list
      await fetchJobsWithoutFilters();
      
      // Also fetch all jobs without filters to update filter options
      const allJobsResponse = await fetch('/api/jobs');
      if (allJobsResponse.ok) {
        const allJobsData: ApiResponse = await allJobsResponse.json();
        setAllJobs(allJobsData.jobs);
      }
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
    } finally {
      setScrapingLoading(false);
    }
  }, [fetchJobsWithoutFilters]); // Added fetchJobsWithoutFilters dependency

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Only add filters if they have actual values
      if (filters.companies.length > 0) {
        params.append('companies', filters.companies.join(','));
      }
      if (filters.locations.length > 0) {
        params.append('locations', filters.locations.join(','));
      }
      if (filters.searchTerm && filters.searchTerm.trim()) {
        params.append('search', filters.searchTerm.trim());
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data: ApiResponse = await response.json();
      setJobs(data.jobs);
      setFilteredJobs(data.jobs);
      setLastUpdated(data.lastUpdated);
      
      // If no filters are applied, this is our complete dataset for filter options
      if (filters.companies.length === 0 && filters.locations.length === 0 && !filters.searchTerm.trim()) {
        setAllJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const debouncedSearch = useCallback(
    (term: string, jobsList: JobOffer[]) => {
      const filtered = jobsList.filter(job =>
        job.companyName.toLowerCase().includes(term.toLowerCase()) ||
        job.jobTitle.toLowerCase().includes(term.toLowerCase()) ||
        job.location.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredJobs(filtered);
    },
    []
  );

  // Initial load: trigger scraping then fetch jobs
  useEffect(() => {
    const initializeData = async () => {
      console.log('🌐 Website loaded, starting automatic scraping...');
      await triggerScraping();
    };
    
    initializeData();
  }, [triggerScraping]); // Added triggerScraping to dependencies

  // Handle filter changes
  useEffect(() => {
    fetchJobs();
  }, [filters, fetchJobs]);

  // Handle search term changes
  useEffect(() => {
    const debouncedSearchHandler = debounce((term: string, jobsList: JobOffer[]) => {
      if (term) {
        const filtered = jobsList.filter(job =>
          job.companyName.toLowerCase().includes(term.toLowerCase()) ||
          job.jobTitle.toLowerCase().includes(term.toLowerCase()) ||
          job.location.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredJobs(filtered);
      } else {
        setFilteredJobs(jobsList);
      }
    }, 300);

    debouncedSearchHandler(searchTerm, jobs);
    
    // Cleanup function to cancel pending debounced calls
    return () => {
      // The debounce function should handle cleanup internally
    };
  }, [searchTerm, jobs]);

  const handleCompanyFilterChange = useCallback((values: string[]) => {
    setFilters(prev => ({ ...prev, companies: values }));
  }, []);

  const handleLocationFilterChange = useCallback((values: string[]) => {
    setFilters(prev => ({ ...prev, locations: values }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  const handleExport = useCallback(() => {
    exportToCSV(filteredJobs, 'offres-emploi.csv');
  }, [filteredJobs]);

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered...');
    await triggerScraping();
  }, [triggerScraping]);

  const uniqueCompanies = getUniqueCompanies(allJobs.length > 0 ? allJobs : jobs);
  const uniqueLocations = getUniqueLocations(allJobs.length > 0 ? allJobs : jobs);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Go Get Business</h1>
              <p className="mt-1 text-gray-600">Plateforme d&apos;agrégation d&apos;offres d&apos;emploi</p>
            </div>
            <RefreshButton 
              onRefresh={handleRefresh} 
              loading={scrapingLoading || loading} 
              lastUpdated={lastUpdated}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with filters */}
          <aside className="lg:w-80 space-y-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="card p-4">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Recherche
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Rechercher par entreprise, poste ou ville..."
                    className="input-field pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Company Filter */}
              <ClientFilter
                title="Entreprises"
                selectedItems={filters.companies}
                allItems={uniqueCompanies}
                onChange={handleCompanyFilterChange}
              />

              {/* Location Filter */}
              <LocationFilter
                title="Localisations"
                selectedItems={filters.locations}
                allItems={uniqueLocations}
                onChange={handleLocationFilterChange}
              />
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex-1 space-y-6">
            {/* Header with refresh and export buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <RefreshButton 
                onRefresh={handleRefresh}
                loading={scrapingLoading || loading}
                lastUpdated={lastUpdated}
              />
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExport}
                  disabled={filteredJobs.length === 0}
                  className={`btn-outline inline-flex items-center ${
                    filteredJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exporter CSV
                </button>
                
                <div className="text-sm text-gray-600">
                  {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''} sur {allJobs.length > 0 ? allJobs.length : jobs.length}
                </div>
              </div>
            </div>

            {/* Jobs table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {scrapingLoading && (
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                  <p className="text-sm text-blue-600 flex items-center">
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    🔄 Actualisation des données en cours...
                  </p>
                </div>
              )}
              
              <div className="p-6">
                <JobTable 
                  jobs={filteredJobs} 
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}