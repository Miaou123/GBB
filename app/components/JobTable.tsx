// app/components/JobTable.tsx - FIXED VERSION
'use client';

import { useState, useMemo, useCallback } from 'react';
import { JobOffer, SortField, SortDirection } from '@/lib/types';
import { usePagination } from '@/lib/hooks/usePagination';
import Pagination from './Pagination';
import PageSizeSelector from './PageSizeSelector';

interface JobTableProps {
  jobs: JobOffer[];
  loading: boolean;
}

export default function JobTable({ jobs, loading }: JobTableProps) {
  console.log('🚨 JOBTABLE COMPONENT LOADED - FIXED VERSION');
  
  const [sortField, setSortField] = useState<SortField>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Memoized sorted jobs to prevent unnecessary re-sorts
  const sortedJobs = useMemo(() => {
    console.log(`🔄 USEMEMO TRIGGERED: Sorting ${jobs.length} jobs by ${sortField} (${sortDirection})`);
    
    const sorted = [...jobs].sort((a, b) => {
      let result = 0;
      
      switch (sortField) {
        case 'companyName':
          result = a.companyName.localeCompare(b.companyName, 'fr', { 
            numeric: true, 
            sensitivity: 'base' 
          });
          // Secondary sort by job title if companies are the same
          if (result === 0) {
            result = a.jobTitle.localeCompare(b.jobTitle, 'fr');
          }
          break;
          
        case 'jobTitle':
          result = a.jobTitle.localeCompare(b.jobTitle, 'fr', { 
            numeric: true, 
            sensitivity: 'base' 
          });
          // Secondary sort by company if job titles are the same
          if (result === 0) {
            result = a.companyName.localeCompare(b.companyName, 'fr');
          }
          break;
          
        case 'location':
          result = a.location.localeCompare(b.location, 'fr', { 
            numeric: true, 
            sensitivity: 'base' 
          });
          // Secondary sort by company if locations are the same
          if (result === 0) {
            result = a.companyName.localeCompare(b.companyName, 'fr');
          }
          break;
          
        case 'publishDate':
          console.log(`📅 Sorting by publishDate, direction: ${sortDirection}`);
          
          const aDate = a.publishDate;
          const bDate = b.publishDate;
          
          // If both have no date, use secondary sort by company name
          if (!aDate && !bDate) {
            result = a.companyName.localeCompare(b.companyName, 'fr');
            break;
          }
          
          // Put items without dates as oldest (earliest dates in asc, last in desc)
          if (!aDate && !bDate) {
            result = a.companyName.localeCompare(b.companyName, 'fr');
            break;
          }
          if (!aDate) {
            // Treat missing dates as very old (year 1900)
            result = -1;
            break;
          }
          if (!bDate) {
            // Treat missing dates as very old (year 1900)
            result = 1;
            break;
          }
          
          // Parse dates - handle different formats
          let dateA: Date;
          let dateB: Date;
          
          try {
            // Handle DD/MM/YYYY format common in French dates
            if (aDate.includes('/')) {
              const [day, month, year] = aDate.split('/');
              dateA = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              dateA = new Date(aDate);
            }
          } catch (e) {
            console.warn(`❌ Invalid date A: "${aDate}"`);
            result = 1; // Put invalid dates at end
            break;
          }
          
          try {
            if (bDate.includes('/')) {
              const [day, month, year] = bDate.split('/');
              dateB = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              dateB = new Date(bDate);
            }
          } catch (e) {
            console.warn(`❌ Invalid date B: "${bDate}"`);
            result = -1; // Put invalid dates at end
            break;
          }
          
          // Validate parsed dates
          const isValidA = !isNaN(dateA.getTime());
          const isValidB = !isNaN(dateB.getTime());
          
          if (!isValidA && !isValidB) {
            result = a.companyName.localeCompare(b.companyName, 'fr');
            break;
          }
          if (!isValidA) {
            // Treat invalid dates as very old (year 1900)
            result = -1;
            break;
          }
          if (!isValidB) {
            // Treat invalid dates as very old (year 1900)
            result = 1;
            break;
          }
          
          // Compare valid dates
          result = dateA.getTime() - dateB.getTime();
          
          // If dates are identical, use secondary sort by job title
          if (result === 0) {
            result = a.jobTitle.localeCompare(b.jobTitle, 'fr');
          }
          break;
          
        default:
          result = 0;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? result : -result;
    });
    
    console.log(`✅ USEMEMO COMPLETE: Sorted ${sorted.length} jobs`);
    return sorted;
  }, [jobs, sortField, sortDirection]);

  // Use pagination hook
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize
  } = usePagination({
    data: sortedJobs,
    initialPageSize: 100
  });

  // DEBUG: Log pagination state when data changes
  console.log(`🔢 PAGINATION DEBUG:`, {
    sortedJobsLength: sortedJobs.length,
    currentPage,
    pageSize,
    totalPages,
    paginatedDataLength: paginatedData.length,
    startIndex: (currentPage - 1) * pageSize,
    endIndex: Math.min(currentPage * pageSize, sortedJobs.length)
  });

  const handleSort = useCallback((field: SortField) => {
    console.log(`🔘 Sort clicked: ${field} (current: ${sortField}, direction: ${sortDirection})`);
    
    if (field === sortField) {
      // Same field clicked - toggle direction
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      console.log(`↔️ Toggling sort direction: ${sortDirection} → ${newDirection}`);
      setSortDirection(newDirection);
    } else {
      // Different field clicked - set new field and reset to asc
      console.log(`🔄 Changing sort field: ${sortField} → ${field}`);
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Reset to first page when sorting changes
    console.log(`📄 Resetting to page 1`);
    setCurrentPage(1);
  }, [sortField, sortDirection, setCurrentPage]);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      // Not the current sort field - show neutral icon
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 2v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    // Current sort field - show direction
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4l6 6h8l6-6" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 20l-6-6H7l-6 6" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des offres d'emploi...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg mb-2">Aucune offre trouvée</p>
        <p className="text-gray-500 text-sm">Essayez de modifier vos filtres ou votre recherche</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700 font-medium">
            {sortedJobs.length} offres trouvées
          </span>

        </div>
        <PageSizeSelector
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={sortedJobs.length}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                onClick={() => handleSort('companyName')}
              >
                <div className="flex items-center">
                  Entreprise
                  <SortIcon field="companyName" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                onClick={() => handleSort('jobTitle')}
              >
                <div className="flex items-center">
                  Poste
                  <SortIcon field="jobTitle" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                onClick={() => handleSort('publishDate')}
              >
                <div className="flex items-center">
                  Date de publication
                  <SortIcon field="publishDate" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center">
                  Localisation
                  <SortIcon field="location" />
                </div>
              </th>
              <th className="px-6 py-3 text-left">
                Lien
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((job, index) => (
              <tr key={`${job.id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="table-cell font-medium">
                  {job.companyName}
                </td>
                <td className="table-cell">
                  {job.jobTitle}
                </td>
                <td className="table-cell">
                  {formatDate(job.publishDate)}
                </td>
                <td className="table-cell">
                  {job.location}
                </td>
                <td className="table-cell">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  >
                    Voir l'offre
                    <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={sortedJobs.length}
          itemsPerPage={pageSize}
        />
      )}
    </div>
  );
}