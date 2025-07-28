'use client';

interface RefreshButtonProps {
  onRefresh: () => void;
  loading: boolean;
  lastUpdated?: string;
}

export default function RefreshButton({ onRefresh, loading, lastUpdated }: RefreshButtonProps) {
  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `Dernière mise à jour: ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`btn-primary inline-flex items-center justify-center min-w-[140px] ${
          loading ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <div className="loading-spinner w-4 h-4 mr-2"></div>
            Actualisation...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Actualiser
          </>
        )}
      </button>
      
      {lastUpdated && (
        <div className="text-sm text-gray-600 flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatLastUpdated(lastUpdated)}
        </div>
      )}
    </div>
  );
}