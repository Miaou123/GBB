// app/page.tsx
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
  const [allJobs, setAllJobs] = useState<JobOffer[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    companies: [],
    locations: [],
    searchTerm: ''
  });

  // Fetch jobs with current filters
  const fetchJobs = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.companies.length > 0) {
        params.append('companies', filters.companies.join(','));
      }
      if (filters.locations.length > 0) {
        params.append('locations', filters.locations.join(','));
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (forceRefresh) {
        params.append('refresh', 'true');
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data: ApiResponse = await response.json();
      setJobs(data.jobs);
      setFilteredJobs(data.jobs);
      setLastUpdated(data.lastUpdated);
      setCacheStatus(data.cacheStatus);
      
      // Update allJobs for filter options if no filters applied
      if (filters.companies.length === 0 && filters.locations.length === 0 && !searchTerm) {
        setAllJobs(data.jobs);
      }
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  // Fetch jobs without filters to get all companies/locations for filter options
  const fetchAllJobsForFilters = useCallback(async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data: ApiResponse = await response.json();
        setAllJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching all jobs for filters:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchJobs();
    fetchAllJobsForFilters();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      fetchJobs();
    }, 500),
    [fetchJobs]
  );

  useEffect(() => {
    if (searchTerm !== filters.searchTerm) {
      setFilters(prev => ({ ...prev, searchTerm }));
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch, filters.searchTerm]);

  // Force refresh (clear cache and re-scrape)
  const handleRefresh = useCallback(async () => {
    await fetchJobs(true);
    await fetchAllJobsForFilters();
  }, [fetchJobs, fetchAllJobsForFilters]);

  // Filter handlers
  const handleCompanyFilter = useCallback((companies: string[]) => {
    setFilters(prev => ({ ...prev, companies }));
  }, []);

  const handleLocationFilter = useCallback((locations: string[]) => {
    setFilters(prev => ({ ...prev, locations }));
  }, []);

  const handleExport = useCallback(() => {
    exportToCSV(filteredJobs, `jobs-${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredJobs]);

  // Get unique values for filters
  const uniqueCompanies = getUniqueCompanies(allJobs);
  const uniqueLocations = getUniqueLocations(allJobs);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Layout - Sidebar + Content */}
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
          <div className="p-6 h-full overflow-y-auto">
            {/* Search Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recherche</h2>
              <input
                type="text"
                placeholder="Rechercher par entreprise, poste ou lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full"
              />
            </div>

            {/* Company Filter */}
            <div className="mb-6">
              <ClientFilter
                selectedItems={filters.companies}
                allItems={uniqueCompanies}
                onChange={handleCompanyFilter}
                title="Entreprises"
              />
            </div>

            {/* Location Filter */}
            <div className="mb-6">
              <LocationFilter
                selectedItems={filters.locations}
                allItems={uniqueLocations}
                onChange={handleLocationFilter}
                title="Localisations"
              />
            </div>

            {/* Cache Status */}
            {cacheStatus && (
              <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
                {cacheStatus.cached ? (
                  <span>
                    📋 Données en cache ({cacheStatus.jobCount} jobs, 
                    mise à jour il y a {cacheStatus.age}s, 
                    expire dans {cacheStatus.remainingTime}s)
                  </span>
                ) : (
                  <span>🔄 Données fraîches depuis le scraping</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Actions Bar */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <RefreshButton onRefresh={handleRefresh} loading={loading} />
                {lastUpdated && (
                  <span className="text-sm text-gray-500">
                    Dernière mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {loading ? 'Chargement...' : `${filteredJobs.length} offres sur ${allJobs.length}`}
                </span>
                <button
                  onClick={handleExport}
                  disabled={filteredJobs.length === 0}
                  className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Exporter CSV
                </button>
              </div>
            </div>
          </div>

          {/* Job Table Content */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <JobTable jobs={filteredJobs} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}