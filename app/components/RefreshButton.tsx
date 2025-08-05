// app/components/RefreshButton.tsx
'use client';

import { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  loading: boolean;
}

export default function RefreshButton({ onRefresh, loading }: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing || loading) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const isDisabled = refreshing || loading;

  return (
    <button
      onClick={handleRefresh}
      disabled={isDisabled}
      className={`
        btn-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center space-x-2
        ${refreshing ? 'animate-pulse' : ''}
      `}
      title="Actualiser les données (vide le cache et relance le scraping)"
    >
      <svg 
        className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      <span>
        {refreshing ? 'Actualisation...' : 'Actualiser'}
      </span>
    </button>
  );
}