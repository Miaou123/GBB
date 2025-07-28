'use client';

import { useState } from 'react';
import { FilterProps } from '@/lib/types';

export default function LocationFilter({ 
  selectedItems, 
  allItems, 
  onChange, 
  title 
}: FilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSelectAll = () => {
    onChange(allItems);
  };

  const handleSelectNone = () => {
    onChange([]);
  };

  const handleItemToggle = (item: string) => {
    if (selectedItems.includes(item)) {
      onChange(selectedItems.filter(i => i !== item));
    } else {
      onChange([...selectedItems, item]);
    }
  };

  const allSelected = selectedItems.length === allItems.length;
  const noneSelected = selectedItems.length === 0;

  return (
    <div className="card">
      <div 
        className="px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              ({selectedItems.length}/{allItems.length})
            </span>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handleSelectAll}
              disabled={allSelected}
              className={`text-sm px-3 py-1 rounded-md transition-colors duration-200 ${
                allSelected
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              Tout sélectionner
            </button>
            <button
              onClick={handleSelectNone}
              disabled={noneSelected}
              className={`text-sm px-3 py-1 rounded-md transition-colors duration-200 ${
                noneSelected
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tout désélectionner
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allItems.sort().map((item) => (
              <label 
                key={item} 
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item)}
                  onChange={() => handleItemToggle(item)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
                />
                <span className="text-sm text-gray-700 flex-1">{item}</span>
                <span className="text-xs text-gray-400">
                  {/* You could add job count here if needed */}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}