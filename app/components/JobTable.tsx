'use client';

import { useState } from 'react';
import { JobOffer, SortField, SortDirection } from '@/lib/types';

interface JobTableProps {
  jobs: JobOffer[];
  loading: boolean;
}

export default function JobTable({ jobs, loading }: JobTableProps) {
  const [sortField, setSortField] = useState<SortField>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6-2v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center">
          <div className="loading-spinner w-8 h-8"></div>
          <span className="ml-3 text-gray-600">Chargement des offres...</span>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gray-500 text-lg">Aucune offre d&apos;emploi trouvée</div>
        <div className="text-gray-400 text-sm mt-2">
          Essayez de modifier vos filtres ou votre recherche
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
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
            {sortedJobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="table-cell font-medium text-gray-900">
                  {job.companyName}
                </td>
                <td className="table-cell">
                  {job.jobTitle}
                </td>
                <td className="table-cell text-gray-600">
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
                    className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center transition-colors duration-200"
                  >
                    Voir l&apos;offre
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {jobs.length} offre{jobs.length > 1 ? 's' : ''} trouvée{jobs.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}