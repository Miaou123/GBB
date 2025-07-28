import { JobOffer } from './types';

export function getUniqueCompanies(jobs: JobOffer[]): string[] {
  const companies = jobs.map(job => job.companyName);
  return [...new Set(companies)].sort();
}

export function getUniqueLocations(jobs: JobOffer[]): string[] {
  const locations = jobs.map(job => job.location);
  return [...new Set(locations)].sort();
}

export function filterJobs(
  jobs: JobOffer[],
  selectedCompanies: string[],
  selectedLocations: string[],
  searchTerm: string
): JobOffer[] {
  return jobs.filter(job => {
    const companyMatch = selectedCompanies.length === 0 || selectedCompanies.includes(job.companyName);
    const locationMatch = selectedLocations.length === 0 || selectedLocations.includes(job.location);
    const searchMatch = !searchTerm || 
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return companyMatch && locationMatch && searchMatch;
  });
}

export function exportToCSV(jobs: JobOffer[], filename: string = 'jobs.csv'): void {
  const headers = ['Entreprise', 'Poste', 'Localisation', 'Date de publication', 'URL'];
  const csvContent = [
    headers.join(','),
    ...jobs.map(job => [
      `"${job.companyName}"`,
      `"${job.jobTitle}"`,
      `"${job.location}"`,
      `"${job.publishDate || 'N/A'}"`,
      `"${job.url}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}