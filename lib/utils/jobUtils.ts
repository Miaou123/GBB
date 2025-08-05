// lib/utils/jobUtils.ts
import crypto from 'crypto';

/**
 * Generate a stable, unique ID for a job based on its content INCLUDING publish date
 */
export function generateJobId(companyName: string, jobTitle: string, location: string, publishDate?: string, url?: string): string {
  // Normalize the input to handle variations
  const normalizedCompany = companyName.toLowerCase().trim();
  const normalizedTitle = jobTitle.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
  const normalizedLocation = location.toLowerCase().trim();
  
  // Normalize publish date if available
  const normalizedDate = publishDate ? normalizePublishDate(publishDate) : 'no-date';
  
  // Create a unique string from the normalized values INCLUDING date
  const uniqueString = `${normalizedCompany}-${normalizedTitle}-${normalizedLocation}-${normalizedDate}`;
  
  // Generate a hash to create a stable ID
  const hash = crypto.createHash('md5').update(uniqueString).digest('hex');
  
  // Return a readable ID format with date indicator
  const companySlug = normalizedCompany.replace(/\s+/g, '-');
  const dateSlug = normalizedDate !== 'no-date' ? `-${normalizedDate}` : '';
  
  return `${companySlug}-${hash.substring(0, 8)}${dateSlug}`;
}

/**
 * Normalize publish date to a consistent format for ID generation
 */
function normalizePublishDate(publishDate: string): string {
  try {
    // Handle various date formats
    let date: Date;
    
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(publishDate)) {
      date = new Date(publishDate);
    }
    // Handle DD/MM/YYYY format
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(publishDate)) {
      const [day, month, year] = publishDate.split('/');
      date = new Date(`${year}-${month}-${day}`);
    }
    // Handle MM/DD/YYYY format
    else if (publishDate.includes('/')) {
      date = new Date(publishDate);
    }
    // Handle other formats
    else {
      date = new Date(publishDate);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${publishDate}`);
      return 'invalid-date';
    }
    
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
    
  } catch (error) {
    console.warn(`Error parsing date ${publishDate}:`, error);
    return 'invalid-date';
  }
}

/**
 * Normalize job data to prevent duplicates from formatting differences
 */
export function normalizeJobData(job: any) {
  return {
    ...job,
    companyName: job.companyName.trim(),
    jobTitle: job.jobTitle.trim().replace(/\s+/g, ' '),
    location: job.location.trim(),
    url: job.url?.trim() || '',
    publishDate: job.publishDate?.trim() || undefined,
    // Generate a stable ID including publish date
    id: job.id && !job.id.includes(Date.now().toString()) 
      ? job.id 
      : generateJobId(job.companyName, job.jobTitle, job.location, job.publishDate, job.url)
  };
}

/**
 * Remove duplicates from an array of jobs (now considers date)
 */
export function removeDuplicateJobs(jobs: any[]): any[] {
  const seen = new Set<string>();
  const uniqueJobs: any[] = [];
  
  for (const job of jobs) {
    const normalizedJob = normalizeJobData(job);
    const key = normalizedJob.id;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueJobs.push(normalizedJob);
    } else {
      console.log(`🔄 Duplicate job filtered: ${job.companyName} - ${job.jobTitle} - ${job.location} - ${job.publishDate || 'no date'}`);
    }
  }
  
  return uniqueJobs;
}

/**
 * Check if two jobs are the same (for debugging purposes)
 */
export function areJobsIdentical(job1: any, job2: any): boolean {
  const id1 = generateJobId(job1.companyName, job1.jobTitle, job1.location, job1.publishDate, job1.url);
  const id2 = generateJobId(job2.companyName, job2.jobTitle, job2.location, job2.publishDate, job2.url);
  return id1 === id2;
}

/**
 * Get a human-readable description of what makes a job unique
 */
export function getJobUniqueSignature(job: any): string {
  return `${job.companyName} | ${job.jobTitle} | ${job.location} | ${job.publishDate || 'No date'}`;
}