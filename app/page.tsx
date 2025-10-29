// app/page.tsx - Left sidebar layout
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import JobTable from './components/JobTable';
import ClientFilter from './components/ClientFilter';
import LocationFilter from './components/LocationFilter';
import JobTitleFilter from './components/JobTitleFilter';
import RefreshButton from './components/RefreshButton';
import ScraperStatusDashboard from './components/ScraperStatusDashboard';
import ScraperStatusSummary from './components/ScraperStatusSummary';
import { JobOffer, ApiResponse } from '@/lib/types';

export default function Home() {
  const [allJobs, setAllJobs] = useState<JobOffer[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [showStatusDashboard, setShowStatusDashboard] = useState(false);
  
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filter section collapsed states
  const [companyFilterOpen, setCompanyFilterOpen] = useState(true);
  const [locationFilterOpen, setLocationFilterOpen] = useState(true);
  const [jobTitleFilterOpen, setJobTitleFilterOpen] = useState(true);

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
      setAllJobs(data.jobs);
      setLastUpdated(data.lastUpdated);
      setApiResponse(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanies, selectedLocations, searchTerm]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleRefresh = async () => {
    await fetchJobs(true);
  };

  // Extract unique companies, locations, and job titles
  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(allJobs.map(job => job.companyName))).sort();
  }, [allJobs]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(allJobs.map(job => job.location))).sort();
  }, [allJobs]);

  // Helper function to normalize text for matching (handles plurals, accents, etc.)
  const normalizeForMatching = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/s\b/g, '') // Remove trailing 's' (plurals)
      .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  // Map of French titles to their English equivalents for matching
  const titleTranslations: Record<string, string[]> = {
    'Administrateur systèmes': ['System Administrator', 'Administrateur systèmes'],
    'Ingénieur systèmes': ['System Engineer', 'Ingénieur systèmes'],
    'Architecte systèmes': ['System Architect', 'Architecte systèmes'],
    'Expert systèmes': ['System Expert', 'Expert systèmes'],
    'Administrateur réseaux': ['Network Administrator', 'Administrateur réseaux'],
    'Ingénieur réseaux': ['Network Engineer', 'Ingénieur réseaux'],
    'Architecte réseaux': ['Network Architect', 'Architecte réseaux'],
    'Expert réseaux': ['Network Expert', 'Expert réseaux'],
    'Administrateur base de données': ['Database Administrator', 'DBA', 'Administrateur base de données'],
    'Ingénieur base de données': ['Database Engineer', 'Ingénieur base de données'],
    'Architecte base de données': ['Database Architect', 'Architecte base de données'],
    'Ingénieur cloud': ['Cloud Engineer', 'Ingénieur cloud'],
    'Architecte cloud': ['Cloud Architect', 'Architecte cloud'],
    'Ingénieur DevOps': ['DevOps Engineer', 'Ingénieur DevOps'],
    'Ingénieur fiabilité': ['Site Reliability Engineer', 'SRE', 'Ingénieur fiabilité'],
    'Ingénieur sécurité': ['Security Engineer', 'Ingénieur sécurité'],
  };

  // Filter jobs based on selections
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const matchesCompany = selectedCompanies.length === 0 || selectedCompanies.includes(job.companyName);
      const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(job.location);
      
      // Job title matching: check if the job title CONTAINS any of the selected titles (French or English)
      const matchesJobTitle = selectedJobTitles.length === 0 || selectedJobTitles.some(selectedTitle => {
        const normalizedJobTitle = normalizeForMatching(job.jobTitle);
        const normalizedSelectedTitle = normalizeForMatching(selectedTitle);
        
        // Check if normalized job title contains the normalized selected title
        if (normalizedJobTitle.includes(normalizedSelectedTitle)) {
          return true;
        }
        
        // Also check English equivalents if available
        const englishEquivalents = titleTranslations[selectedTitle] || [];
        return englishEquivalents.some(englishTitle => {
          const normalizedEnglishTitle = normalizeForMatching(englishTitle);
          return normalizedJobTitle.includes(normalizedEnglishTitle);
        });
      });
      
      const matchesSearch = !searchTerm || 
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCompany && matchesLocation && matchesJobTitle && matchesSearch;
    });
  }, [allJobs, selectedCompanies, selectedLocations, selectedJobTitles, searchTerm]);

  const cacheStatus = apiResponse?.cacheStatus;

  const resetFilters = () => {
    setSelectedCompanies([]);
    setSelectedLocations([]);
    setSelectedJobTitles([]);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Dashboard Modal */}
      {showStatusDashboard && apiResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">État des scrapers</h2>
              <button
                onClick={() => setShowStatusDashboard(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ScraperStatusDashboard
                scrapingErrors={apiResponse.scrapingErrors || []}
                totalJobs={allJobs.length}
                lastUpdated={lastUpdated}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Left Sidebar - Filters */}
        <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
              <button
                onClick={resetFilters}
                disabled={selectedCompanies.length === 0 && selectedLocations.length === 0 && selectedJobTitles.length === 0 && !searchTerm}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selectedCompanies.length === 0 && selectedLocations.length === 0 && selectedJobTitles.length === 0 && !searchTerm
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                ✖ Réinitialiser
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔎 Rechercher..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Scrollable Filters */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

                        {/* Job Title Filter - Collapsible */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setJobTitleFilterOpen(!jobTitleFilterOpen)}
                className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-800">
                  Type de poste
                </span>
                <div className="flex items-center gap-2">
                  {selectedJobTitles.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {selectedJobTitles.length}
                    </span>
                  )}
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${jobTitleFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {jobTitleFilterOpen && (
                <div className="p-3">
                  <JobTitleFilter
                    selectedTitles={selectedJobTitles}
                    allJobs={allJobs}
                    onChange={setSelectedJobTitles}
                  />
                </div>
              )}
            </div>
            {/* Company Filter - Collapsible */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setCompanyFilterOpen(!companyFilterOpen)}
                className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-800">
                  Entreprise
                </span>
                <div className="flex items-center gap-2">
                  {selectedCompanies.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {selectedCompanies.length}
                    </span>
                  )}
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${companyFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {companyFilterOpen && (
                <div className="p-3">
                  <ClientFilter
                    selectedItems={selectedCompanies}
                    allItems={uniqueCompanies}
                    onChange={setSelectedCompanies}
                    title=""
                  />
                </div>
              )}
            </div>

            {/* Location Filter - Collapsible */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setLocationFilterOpen(!locationFilterOpen)}
                className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-800">
                  Localisation
                </span>
                <div className="flex items-center gap-2">
                  {selectedLocations.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {selectedLocations.length}
                    </span>
                  )}
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${locationFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {locationFilterOpen && (
                <div className="p-3">
                  <LocationFilter
                    selectedItems={selectedLocations}
                    allItems={uniqueLocations}
                    onChange={setSelectedLocations}
                    title=""
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer - Status Info */}
          {cacheStatus && apiResponse && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-2">
                <ScraperStatusSummary
                  scrapingErrors={apiResponse.scrapingErrors || []}
                  isLoading={loading}
                  onClick={() => setShowStatusDashboard(true)}
                />
                <div className="text-xs text-gray-600">
                  {cacheStatus.cached ? (
                    <span>📋 Cache: {cacheStatus.jobCount} jobs ({Math.round((cacheStatus.age || 0) / 60)}min)</span>
                  ) : (
                    <span>🔄 Données fraîches</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-r-lg p-2 hover:bg-gray-50 transition-all shadow-md"
          style={{ left: sidebarCollapsed ? '0' : '320px' }}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  <span className="text-blue-600">{filteredJobs.length}</span> offres d&apos;emploi Tech en France
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-sm text-gray-500">
                    Mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
                <RefreshButton onRefresh={handleRefresh} loading={loading} />
                {apiResponse && (
                  <button
                    onClick={() => setShowStatusDashboard(true)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
                  >
                    🔍 Détails
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Table - Scrollable */}
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <JobTable jobs={filteredJobs} loading={loading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}