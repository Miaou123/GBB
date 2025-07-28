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
  const [filteredJobs, setFilteredJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    companies: [],
    locations: [],
    searchTerm: ''
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.companies.length > 0) {
        params.append('companies', filters.companies.join(','));
      }
      if (filters.locations.length > 0) {
        params.append('locations', filters.locations.join(','));
      }
      if (filters.searchTerm) {
        params.append('search', filters.searchTerm);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data: ApiResponse = await response.json();
      setJobs(data.jobs);
      setFilteredJobs(data.jobs);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const debouncedSearch = useCallback(
    debounce((term: string, jobsList: JobOffer[]) => {
      const filtered = jobsList.filter(job =>
        job.companyName.toLowerCase().includes(term.toLowerCase()) ||
        job.jobTitle.toLowerCase().includes(term.toLowerCase()) ||
        job.location.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredJobs(filtered);
    }, 300),
    []
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm, jobs);
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchTerm, jobs, debouncedSearch]);

  const handleCompanyFilterChange = (selectedCompanies: string[]) => {
    setFilters(prev => ({ ...prev, companies: selectedCompanies }));
  };

  const handleLocationFilterChange = (selectedLocations: string[]) => {
    setFilters(prev => ({ ...prev, locations: selectedLocations }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const handleExportCSV = () => {
    exportToCSV(filteredJobs, `jobs-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleRefresh = () => {
    fetchJobs();
  };

  const allCompanies = getUniqueCompanies(jobs);
  const allLocations = getUniqueLocations(jobs);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Trouvez votre prochain emploi
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Découvrez les meilleures opportunités d&apos;emploi dans les entreprises technologiques françaises.
          Filtrez par entreprise, localisation ou utilisez la recherche pour trouver l&apos;offre parfaite.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-80 space-y-6">
          <div className="space-y-4">
            <div className="card p-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
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

            <ClientFilter
              title="Entreprises"
              selectedItems={filters.companies}
              allItems={allCompanies}
              onChange={handleCompanyFilterChange}
            />

            <LocationFilter
              title="Localisations"
              selectedItems={filters.locations}
              allItems={allLocations}
              onChange={handleLocationFilterChange}
            />
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <RefreshButton 
              onRefresh={handleRefresh}
              loading={loading}
              lastUpdated={lastUpdated}
            />
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportCSV}
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
                {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''} 
                {jobs.length !== filteredJobs.length && (
                  <span className="text-gray-400"> sur {jobs.length}</span>
                )}
              </div>
            </div>
          </div>

          <JobTable jobs={filteredJobs} loading={loading} />
        </div>
      </div>
    </div>
  );
}