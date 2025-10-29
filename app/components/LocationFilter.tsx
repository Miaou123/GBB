// app/components/LocationFilter.tsx - With Agence Toulouse grouping
'use client';

import { useState, useMemo } from 'react';
import { FilterProps } from '@/lib/types';
import { MapPinIcon } from '@heroicons/react/24/outline';

// Define Agence Toulouse cities
const AGENCE_TOULOUSE_CITIES = [
  'Toulouse',
  'Balma',
  'Blagnac',
  'Colomiers',
  'Labège',
  'Tournefeuille',
  'Portet',
  'L\'Union',
  'Saint-Martin-du-Touch',
  'Rodez',
  'Pau',
  'Castres',
  'Lavaur',
  'Montauban',
  'Tarbes',
  'Bordes',
  'Agen',
  'Villeneuve-sur-Lot',
  'Albi'
];

export default function LocationFilter({ selectedItems, allItems, onChange, title }: FilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Check if a location is part of Agence Toulouse
  const isAgenceToulouseCity = (location: string): boolean => {
    return AGENCE_TOULOUSE_CITIES.some(city => 
      location.toLowerCase().includes(city.toLowerCase())
    );
  };

  // Check how many Agence Toulouse cities are selected
  const agenceToulouseCount = useMemo(() => {
    return selectedItems.filter(item => isAgenceToulouseCity(item)).length;
  }, [selectedItems]);

  // Get all available Agence Toulouse cities from allItems
  const availableAgenceToulouseCities = useMemo(() => {
    return allItems.filter(item => isAgenceToulouseCity(item));
  }, [allItems]);

  // Check if all Agence Toulouse cities are selected
  const allAgenceToulouseSelected = useMemo(() => {
    return availableAgenceToulouseCities.length > 0 && 
           availableAgenceToulouseCities.every(city => selectedItems.includes(city));
  }, [availableAgenceToulouseCities, selectedItems]);

  // Filter items based on search term
  const filteredItems = allItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemToggle = (item: string) => {
    if (selectedItems.includes(item)) {
      const newSelection = selectedItems.filter(selected => selected !== item);
      onChange(newSelection);
    } else {
      onChange([...selectedItems, item]);
    }
  };

  const handleAgenceToulouseToggle = () => {
    if (allAgenceToulouseSelected) {
      // Deselect all Agence Toulouse cities
      const newSelection = selectedItems.filter(item => !isAgenceToulouseCity(item));
      onChange(newSelection);
    } else {
      // Select all Agence Toulouse cities
      const newSelection = [...new Set([...selectedItems, ...availableAgenceToulouseCities])];
      onChange(newSelection);
    }
  };

  const handleSelectAll = () => {
    const itemsToSelect = searchTerm ? filteredItems : allItems;
    const newSelection = [...new Set([...selectedItems, ...itemsToSelect])];
    onChange(newSelection);
  };

  const handleSelectNone = () => {
    if (searchTerm) {
      const newSelection = selectedItems.filter(item => !filteredItems.includes(item));
      onChange(newSelection);
    } else {
      onChange([]);
    }
  };

  const visibleSelectedCount = filteredItems.filter(item => selectedItems.includes(item)).length;
  const allFilteredSelected = filteredItems.length > 0 && visibleSelectedCount === filteredItems.length;
  const noneFilteredSelected = visibleSelectedCount === 0;

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPinIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher..."
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
          {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}
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
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {searchTerm ? 'Désélectionner résultats' : 'Tout désélectionner'}
        </button>
      </div>

      {/* Agence Toulouse Special Group - Only show when not searching */}
      {!searchTerm && availableAgenceToulouseCities.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={allAgenceToulouseSelected}
              onChange={handleAgenceToulouseToggle}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900">
                  🏢 Agence Toulouse
                </span>
                <span className="text-xs text-blue-700 font-medium">
                  {agenceToulouseCount}/{availableAgenceToulouseCities.length}
                </span>
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Scrollable Items List */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
        {filteredItems.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Aucun résultat trouvé
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item, index) => {
              const isSelected = selectedItems.includes(item);
              const isAgenceToulouse = isAgenceToulouseCity(item);
              
              return (
                <label
                  key={`${item}-${index}`}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                    isSelected ? 'bg-blue-50' : ''
                  } `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleItemToggle(item)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <span className={`ml-3 text-sm flex-1 ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                    {item}
                    {isAgenceToulouse && !searchTerm && (
                      <span className="ml-2 text-xs text-blue-600">🏢</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected items summary */}
      {selectedItems.length > 0 && !searchTerm && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">{selectedItems.length}</span> élément{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
            {agenceToulouseCount > 0 && (
              <span className="ml-2 text-blue-600">
                (dont {agenceToulouseCount} de l&apos;Agence Toulouse)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}