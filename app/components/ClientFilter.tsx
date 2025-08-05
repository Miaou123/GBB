// app/components/ClientFilter.tsx
'use client';

import { FilterProps } from '@/lib/types';

export default function ClientFilter({ selectedItems, allItems, onChange, title }: FilterProps) {
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
    onChange([...allItems]);
  };

  const handleSelectNone = () => {
    onChange([]);
  };

  const allSelected = selectedItems.length === allItems.length;
  const noneSelected = selectedItems.length === 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">
          ({selectedItems.length}/{allItems.length})
        </span>
      </div>

      {/* Select All/None buttons */}
      <div className="flex mb-3 space-x-2">
        <button
          onClick={handleSelectAll}
          disabled={allSelected}
          className={`text-xs px-3 py-1 rounded-md transition-colors duration-200 ${
            allSelected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Tout sélectionner
        </button>
        <button
          onClick={handleSelectNone}
          disabled={noneSelected}
          className={`text-xs px-3 py-1 rounded-md transition-colors duration-200 ${
            noneSelected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tout désélectionner
        </button>
      </div>
      
      {/* Options List */}
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
            />
            <span className="text-sm text-gray-700 flex-1">{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}