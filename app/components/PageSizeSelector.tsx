// app/components/PageSizeSelector.tsx
'use client';

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
}

export default function PageSizeSelector({ pageSize, onPageSizeChange, totalItems }: PageSizeSelectorProps) {
  const options = [25, 50, 100, 200];

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="pageSize" className="text-sm text-gray-700">
        Afficher :
      </label>
      <select
        id="pageSize"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={totalItems}>Tout ({totalItems})</option>
      </select>
      <span className="text-sm text-gray-700">par page</span>
    </div>
  );
}