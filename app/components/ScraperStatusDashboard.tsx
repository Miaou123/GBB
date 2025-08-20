// components/ScraperStatusDashboard.tsx
import React from 'react';
import { ScrapingError } from '@/lib/types';

interface ScraperStatusProps {
  scrapingErrors: ScrapingError[];
  totalJobs: number;
  lastUpdated: string;
  isLoading: boolean;
  onRetry?: () => void;
}

interface ScraperStatus {
  company: string;
  website: string;
  status: 'success' | 'error' | 'loading';
  jobCount?: number;
  error?: string;
}

const ScraperStatusDashboard: React.FC<ScraperStatusProps> = ({
  scrapingErrors,
  totalJobs,
  lastUpdated,
  isLoading,
  onRetry
}) => {
  // Define all scrapers that should be monitored
  const allScrapers = [
    { company: 'BPCE', website: 'bpce.opendatasoft.com' },
    { company: 'Air France', website: 'airfrance.jobs' },
    { company: 'Estreem', website: 'partecis.teamtailor.com' },
    { company: 'Infomil', website: 'infomil.gestmax.fr' },
    { company: 'Berger Levrault', website: 'recrute.berger-levrault.com' },
    { company: 'Doxallia', website: 'doxallia.com' },
    { company: 'Lyra Network', website: 'lyra.com' }
  ];

  // Build status for each scraper
  const scraperStatuses: ScraperStatus[] = allScrapers.map(scraper => {
    const error = scrapingErrors.find(err => err.company === scraper.company);
    
    if (isLoading) {
      return {
        ...scraper,
        status: 'loading' as const
      };
    }
    
    if (error) {
      return {
        ...scraper,
        status: 'error' as const,
        error: error.error
      };
    }
    
    return {
      ...scraper,
      status: 'success' as const
    };
  });

  const successCount = scraperStatuses.filter(s => s.status === 'success').length;
  const errorCount = scraperStatuses.filter(s => s.status === 'error').length;
  const overallStatus = errorCount === 0 ? 'success' : errorCount === allScrapers.length ? 'error' : 'partial';

  const getStatusIcon = (status: 'success' | 'error' | 'loading') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'loading':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'loading') => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'loading':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'partial':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusText = () => {
    if (isLoading) return 'Scraping en cours...';
    
    switch (overallStatus) {
      case 'success':
        return `Tous les scrapers fonctionnent (${successCount}/${allScrapers.length})`;
      case 'error':
        return `Aucun scraper ne fonctionne (${errorCount}/${allScrapers.length} erreurs)`;
      case 'partial':
        return `${successCount}/${allScrapers.length} scrapers fonctionnent (${errorCount} erreurs)`;
      default:
        return 'Statut inconnu';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          🔍 Statut des Scrapers
        </h2>
        
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '⏳ Test en cours...' : '🔄 Retester'}
          </button>
        )}
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg border p-4 mb-6 ${getOverallStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {isLoading ? '⏳' : overallStatus === 'success' ? '✅' : overallStatus === 'error' ? '❌' : '⚠️'}
            </span>
            <div>
              <h3 className="font-medium">{getOverallStatusText()}</h3>
              {!isLoading && (
                <p className="text-sm opacity-80">
                  {totalJobs} offres d&apos;emploi collectées • 
                  Dernière vérification: {new Date(lastUpdated).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          </div>
          
          {!isLoading && (
            <div className="text-right">
              <div className="text-2xl font-bold">{totalJobs}</div>
              <div className="text-sm opacity-80">offres</div>
            </div>
          )}
        </div>
      </div>

      {/* Individual Scraper Status */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-700 mb-3">Détail par source:</h3>
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scraperStatuses.map((scraper, index) => (
            <div
              key={scraper.company}
              className={`rounded-lg border p-4 transition-all ${getStatusColor(scraper.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(scraper.status)}</span>
                  <h4 className="font-medium">{scraper.company}</h4>
                </div>
                
                {scraper.status === 'loading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                )}
              </div>
              
              <div className="text-sm opacity-80 mb-2">
                🌐 {scraper.website}
              </div>
              
              {scraper.status === 'success' && (
                <div className="text-sm font-medium">
                  ✓ Fonctionnel
                </div>
              )}
              
              {scraper.status === 'loading' && (
                <div className="text-sm">
                  Scraping en cours...
                </div>
              )}
              
              {scraper.status === 'error' && scraper.error && (
                <div className="text-sm">
                  <div className="font-medium mb-1">❌ Erreur:</div>
                  <div className="text-xs bg-white bg-opacity-50 rounded p-2 break-words">
                    {scraper.error}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Summary */}
      {errorCount > 0 && !isLoading && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">
            ⚠️ Problèmes détectés ({errorCount} erreur{errorCount > 1 ? 's' : ''})
          </h4>
          <div className="text-sm text-red-700 space-y-1">
            {scrapingErrors.map((error, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="font-medium">{error.company}:</span>
                <span>{error.error}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-sm text-red-600">
            💡 Ces erreurs peuvent être temporaires. Essayez de rafraîchir les données ou contactez l&apos;administrateur si le problème persiste.
          </div>
        </div>
      )}

      {/* Success Message */}
      {overallStatus === 'success' && !isLoading && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <span className="text-lg">🎉</span>
            <span className="font-medium">
              Parfait! Tous les scrapers fonctionnent correctement.
            </span>
          </div>
          <div className="text-sm text-green-700 mt-1">
            {totalJobs} offres d&apos;emploi ont été collectées avec succès depuis {allScrapers.length} sources.
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperStatusDashboard;