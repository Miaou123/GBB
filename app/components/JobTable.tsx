// app/components/JobTable.tsx
'use client';

import { useState } from 'react';
import { JobOffer, SortField, SortDirection } from '@/lib/types';
import { usePagination } from '@/lib/hooks/usePagination';
import Pagination from './Pagination';
import PageSizeSelector from './PageSizeSelector';

interface JobTableProps {
  jobs: JobOffer[];
  loading: boolean;
}

export default function JobTable({ jobs, loading }: JobTableProps) {
  const [sortField, setSortField] = useState<SortField>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort jobs first, then paginate
  const sortedJobs = [...jobs].sort((a, b) => {
    let aValue = '';
    let bValue = '';

    switch (sortField) {
      case 'companyName':
        aValue = a.companyName;
        bValue = b.companyName;
        break;
      case 'jobTitle':
        aValue = a.jobTitle;
        bValue = b.jobTitle;
        break;
      case 'location':
        aValue = a.location;
        bValue = b.location;
        break;
      case 'publishDate':
        aValue = a.publishDate || '';
        bValue = b.publishDate || '';
        break;
    }

    const result = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? result : -result;
  });

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

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 2v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
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
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('companyName')}
              >
                <div className="flex items-center">
                  Entreprise
                  <SortIcon field="companyName" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('jobTitle')}
              >
                <div className="flex items-center">
                  Poste
                  <SortIcon field="jobTitle" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('publishDate')}
              >
                <div className="flex items-center">
                  Date de publication
                  <SortIcon field="publishDate" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors duration-200"
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
              <tr key={job.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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