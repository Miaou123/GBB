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
    if (filters.companies.length > 0 || filters.locations.length > 0 || searchTerm) {
      fetchJobs();
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Go Get Business - Offres d'emploi Tech
          </h1>
          <p className="text-gray-600">
            Découvrez les dernières opportunités dans les entreprises tech françaises
          </p>
          
          {/* Cache Status (for debugging) */}
          {cacheStatus && (
            <div className="mt-2 text-sm text-gray-500">
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

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par entreprise, poste ou lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div className="flex gap-2">
              <RefreshButton onRefresh={handleRefresh} loading={loading} />
              <button
                onClick={handleExport}
                disabled={filteredJobs.length === 0}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exporter CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <ClientFilter
              selectedItems={filters.companies}
              allItems={uniqueCompanies}
              onChange={handleCompanyFilter}
              title="Entreprises"
            />
            <LocationFilter
              selectedItems={filters.locations}
              allItems={uniqueLocations}
              onChange={handleLocationFilter}
              title="Localisations"
            />
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {loading ? 'Chargement...' : `${filteredJobs.length} offre${filteredJobs.length > 1 ? 's' : ''} trouvée${filteredJobs.length > 1 ? 's' : ''}`}
            </span>
            {lastUpdated && (
              <span>
                Dernière mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        {/* Job Table */}
        <div className="card">
          <JobTable jobs={filteredJobs} loading={loading} />
        </div>
      </div>
    </div>
  );
}