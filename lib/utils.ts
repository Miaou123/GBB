import { JobOffer } from './types';

/**
 * Normalize a string for comparison (remove accents, lowercase, clean punctuation)
 */
export function normalizeString(str: string): string {
  return str.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * French stop words to ignore during matching
 */
const STOP_WORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'et', 'en', 'au', 'aux', 'd', 'l', 
  'un', 'une', 'dans', 'pour', 'par', 'sur', 'avec'
]);

/**
 * Tokenize a string, removing stop words and short tokens
 */
export function tokenize(str: string): string[] {
  const normalized = normalizeString(str);
  return normalized
    .split(' ')
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Remove plural form (simple French plural handling)
 */
export function singularize(word: string): string {
  // Remove trailing 's' for basic plural handling
  // Handle some common cases: -aux -> -al, -eaux -> -eau
  if (word.endsWith('aux')) {
    return word.slice(0, -3) + 'al';
  }
  if (word.endsWith('eaux')) {
    return word.slice(0, -1);
  }
  if (word.endsWith('s') && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Check if a job title matches a filter title based on keyword matching
 * Requires at least 2 matching keywords (or all keywords if filter has fewer than 2)
 * 
 * Examples:
 * - "Administrateur système Linux" matches "Administrateur système" ✓
 * - "Ingénieur systèmes" matches "Ingénieur système" ✓ (plural handled)
 * - "Administrateur de systèmes" matches "Administrateur système" ✓ (stop words ignored)
 * - "Développeur Python" does NOT match "Administrateur système" ✗
 */
export function matchesJobTitle(jobTitle: string, filterTitle: string): boolean {
  const jobTokens = tokenize(jobTitle);
  const filterTokens = tokenize(filterTitle);

  if (filterTokens.length === 0) return false;

  // Count matching tokens (with plural/singular handling)
  let matches = 0;
  
  for (const filterToken of filterTokens) {
    const filterBase = singularize(filterToken);
    
    for (const jobToken of jobTokens) {
      const jobBase = singularize(jobToken);
      
      // Match if either the base forms match or exact tokens match
      if (jobBase === filterBase || jobToken === filterToken) {
        matches++;
        break; // Count this filter token as matched, move to next
      }
    }
  }

  // Require at least 2 matching keywords, or all keywords if filter has fewer than 2
  const minMatches = Math.min(2, filterTokens.length);
  return matches >= minMatches;
}

/**
 * Filter jobs by selected job titles
 */
export function filterJobsByTitles(jobs: JobOffer[], selectedTitles: string[]): JobOffer[] {
  if (selectedTitles.length === 0) return jobs;

  return jobs.filter(job => 
    selectedTitles.some(title => matchesJobTitle(job.jobTitle, title))
  );
}

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
  searchTerm: string,
  selectedJobTitles: string[] = []
): JobOffer[] {
  return jobs.filter(job => {
    const companyMatch = selectedCompanies.length === 0 || selectedCompanies.includes(job.companyName);
    const locationMatch = selectedLocations.length === 0 || selectedLocations.includes(job.location);
    const titleMatch = selectedJobTitles.length === 0 || selectedJobTitles.some(title => matchesJobTitle(job.jobTitle, title));
    const searchMatch = !searchTerm || 
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return companyMatch && locationMatch && titleMatch && searchMatch;
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