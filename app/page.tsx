// app/page.tsx - Updated with Status Dashboard (Clean Version)
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import JobTable from './components/JobTable';
import ClientFilter from './components/ClientFilter';
import LocationFilter from './components/LocationFilter';
import RefreshButton from './components/RefreshButton';
import ScraperStatusDashboard from './components/ScraperStatusDashboard';
import ScraperStatusSummary from './components/ScraperStatusSummary';
import { JobOffer, ApiResponse } from '@/lib/types';

export default function Home() {
  const [allJobs, setAllJobs] = useState<JobOffer[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [showStatusDashboard, setShowStatusDashboard] = useState(false);

  const fetchJobs = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedCompanies.length > 0) {
        params.append('companies', selectedCompanies.join(','));
      }
      if (selectedLocations.length > 0) {
        params.append('locations', selectedLocations.join(','));
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (forceRefresh) {
        params.append('refresh', 'true');
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setApiResponse(data);
      setAllJobs(data.jobs || []);
      setLastUpdated(data.lastUpdated);
      
      console.log('✅ Jobs loaded:', data.jobs?.length || 0, 'jobs');
      
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanies, selectedLocations, searchTerm]);

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await fetchJobs(true);
  }, [fetchJobs]);

  // Handle status dashboard retry (test scrapers)
  const handleStatusRetry = useCallback(async () => {
    await fetchJobs(true);
  }, [fetchJobs]);

  // Memoized filter options
  const { companies, locations } = useMemo(() => {
    const companies = Array.from(new Set(allJobs.map(job => job.companyName))).sort();
    const locations = Array.from(new Set(allJobs.map(job => job.location))).sort();
    return { companies, locations };
  }, [allJobs]);

  // Memoized filtered jobs
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const matchesCompany = selectedCompanies.length === 0 || selectedCompanies.includes(job.companyName);
      const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(job.location);
      const matchesSearch = !searchTerm || 
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCompany && matchesLocation && matchesSearch;
    });
  }, [allJobs, selectedCompanies, selectedLocations, searchTerm]);

  const cacheStatus = apiResponse?.cacheStatus;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🚀 Go Get Business
              </h1>
              <p className="text-gray-600 mt-1">
                Offres d'emploi Tech en France
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <ScraperStatusSummary
                scrapingErrors={apiResponse?.scrapingErrors || []}
                isLoading={loading}
                onClick={() => setShowStatusDashboard(!showStatusDashboard)}
              />
              
              <button
                onClick={() => setShowStatusDashboard(!showStatusDashboard)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showStatusDashboard 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showStatusDashboard ? '📊 Masquer les détails' : '🔍 Voir les détails'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Dashboard */}
      {showStatusDashboard && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="mx-auto px-6 py-6">
            <ScraperStatusDashboard
              scrapingErrors={apiResponse?.scrapingErrors || []}
              totalJobs={allJobs.length}
              lastUpdated={lastUpdated || new Date().toISOString()}
              isLoading={loading}
              onRetry={handleStatusRetry}
            />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar Filters */}
        <div className="w-80 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              🔍 Filtres
            </h2>

            {/* Search Bar */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un poste, entreprise..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <ClientFilter
              selectedItems={selectedCompanies}
              allItems={companies}
              onChange={setSelectedCompanies}
              title="Entreprises"
            />

            <LocationFilter
              selectedItems={selectedLocations}
              allItems={locations}
              onChange={setSelectedLocations}
              title="Lieux"
            />

            {/* Cache Status Info */}
            {cacheStatus && (
              <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600">
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