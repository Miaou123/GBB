// components/ScraperStatusSummary.tsx
import React from 'react';
import { ScrapingError } from '@/lib/types';

interface ScraperStatusSummaryProps {
  scrapingErrors: ScrapingError[];
  isLoading: boolean;
  onClick?: () => void; // Pour ouvrir le dashboard détaillé
}

const ScraperStatusSummary: React.FC<ScraperStatusSummaryProps> = ({
  scrapingErrors,
  isLoading,
  onClick
}) => {
  // Liste de tous les scrapers attendus
  const totalScrapers = 7; // BPCE, Air France, Estreem, Infomil, Berger Levrault, Doxallia, Lyra Network
  const errorCount = scrapingErrors.length;
  const successCount = totalScrapers - errorCount;

  // Déterminer le statut global
  const getOverallStatus = () => {
    if (isLoading) return 'loading';
    if (errorCount === 0) return 'success';
    if (errorCount === totalScrapers) return 'error';
    return 'partial';
  };

  const overallStatus = getOverallStatus();

  // Styles selon le statut
  const getStatusStyles = () => {
    switch (overallStatus) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Icône selon le statut
  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'partial':
        return '⚠️';
      case 'loading':
        return '⏳';
      default:
        return '❓';
    }
  };

  // Texte du statut
  const getStatusText = () => {
    if (isLoading) {
      return 'Vérification des scrapers...';
    }
    
    if (overallStatus === 'success') {
      return `${successCount}/${totalScrapers} scrapers opérationnels`;
    }
    
    return `${successCount}/${totalScrapers} scrapers opérationnels`;
  };

  // Détails des erreurs pour le tooltip
  const getErrorTooltip = () => {
    if (errorCount === 0) return '';
    
    const errorCompanies = scrapingErrors.map(err => err.company).join(', ');
    return `Erreurs sur: ${errorCompanies}`;
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
        transition-all duration-200 cursor-pointer hover:shadow-sm
        ${getStatusStyles()}
      `}
      onClick={onClick}
      title={`Cliquez pour plus de détails. ${getErrorTooltip()}`}
    >
      {/* Icône de statut */}
      <span className="text-base">
        {getStatusIcon()}
      </span>
      
      {/* Animation de chargement */}
      {isLoading && (
        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
      )}
      
      {/* Texte du statut */}
      <span>{getStatusText()}</span>
      
      {/* Indicateur d'erreurs */}
      {errorCount > 0 && !isLoading && (
        <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-70 rounded text-xs font-bold">
          {errorCount} erreur{errorCount > 1 ? 's' : ''}
        </span>
      )}
      
      {/* Indicateur cliquable */}
      <span className="text-xs opacity-60">
        📊
      </span>
    </div>
  );
};

export default ScraperStatusSummary;