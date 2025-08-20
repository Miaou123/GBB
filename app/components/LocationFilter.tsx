// app/components/LocationFilter.tsx
'use client';

import { useState } from 'react';
import { FilterProps } from '@/lib/types';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function LocationFilter({ selectedItems, allItems, onChange, title }: FilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items based on search term
  const filteredItems = allItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemToggle = (item: string) => {
    if (selectedItems.includes(item)) {
      // Remove item from selection
      const newSelection = selectedItems.filter(selected => selected !== item);
      onChange(newSelection);
    } else {
      // Add item to selection
      onChange([...selectedItems, item]);
    }
  };

  const handleSelectAll = () => {
    // Select all filtered items (or all items if no search)
    const itemsToSelect = searchTerm ? filteredItems : allItems;
    const newSelection = [...new Set([...selectedItems, ...itemsToSelect])];
    onChange(newSelection);
  };

  const handleSelectNone = () => {
    if (searchTerm) {
      // Remove only filtered items from selection
      const newSelection = selectedItems.filter(item => !filteredItems.includes(item));
      onChange(newSelection);
    } else {
      // Remove all items
      onChange([]);
    }
  };

  const visibleSelectedCount = filteredItems.filter(item => selectedItems.includes(item)).length;
  const allFilteredSelected = filteredItems.length > 0 && visibleSelectedCount === filteredItems.length;
  const noneFilteredSelected = visibleSelectedCount === 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">
          ({selectedItems.length}/{allItems.length})
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPinIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={`Rechercher dans ${title.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <span className="text-gray-400 hover:text-gray-600 text-lg">&times;</span>
          </button>
        )}
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-xs text-gray-500 mb-2">
          {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''} trouvé{filteredItems.length > 1 ? 's' : ''}
          {filteredItems.length !== allItems.length && ` sur ${allItems.length}`}
        </div>
      )}

      {/* Select All/None buttons */}
      <div className="flex mb-3 space-x-2">
        <button
          onClick={handleSelectAll}
          disabled={allFilteredSelected}
          className={`text-xs px-3 py-1 rounded-md transition-colors duration-200 ${
            allFilteredSelected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {searchTerm ? 'Sélectionner résultats' : 'Tout sélectionner'}
        </button>
        <button
          onClick={handleSelectNone}
          disabled={noneFilteredSelected}
          className={`text-xs px-3 py-1 rounded-md transition-colors duration-200 ${
            noneFilteredSelected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {searchTerm ? 'Désélectionner résultats' : 'Tout désélectionner'}
        </button>
      </div>
      
      {/* Options List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            Aucun résultat trouvé pour &quot;{searchTerm}&quot;
          </div>
        ) : (
          filteredItems.sort().map((item) => (
            <label 
              key={item} 
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => handleItemToggle(item)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
              />
              <span className="text-sm text-gray-700 flex-1">
                {searchTerm ? (
                  // Highlight search term with location-specific styling
                  <span dangerouslySetInnerHTML={{
                    __html: item.replace(
                      new RegExp(searchTerm, 'gi'),
                      (match) => `<mark class="bg-yellow-200 px-1 rounded">${match}</mark>`
                    )
                  }} />
                ) : (
                  item
                )}
              </span>
              {/* Show a small location icon for visual distinction */}
              <MapPinIcon className="h-3 w-3 text-gray-400" />
            </label>
          ))
        )}
      </div>

      {/* Clear search when no results */}
      {filteredItems.length === 0 && searchTerm && (
        <div className="mt-2">
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Effacer la recherche
          </button>
        </div>
      )}
    </div>
  );
}