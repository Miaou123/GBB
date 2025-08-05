// lib/services/jobService.ts - Fixed version with correct logging interface
import { getDatabase } from '../mongodb';
import { JobDocument, CompanyDocument, ScrapingLogDocument } from '../models/job';
import { generateJobId, normalizeJobData } from '../utils/jobUtils';

export class JobService {
  private async getJobsCollection() {
    const db = await getDatabase();
    return db.collection<JobDocument>('jobs');
  }

  private async getCompaniesCollection() {
    const db = await getDatabase();
    return db.collection<CompanyDocument>('companies');
  }

  private async getLogsCollection() {
    const db = await getDatabase();
    return db.collection<ScrapingLogDocument>('scraping_logs');
  }

  // Get all active jobs with filters
  async getJobs(filters: {
    companies?: string[];
    locations?: string[];
    search?: string;
  } = {}) {
    const collection = await this.getJobsCollection();
    
    console.log('🔍 JobService: Getting jobs with filters:', filters);
    
    const query: any = { isActive: true };
    
    if (filters.companies?.length) {
      query.companyName = { $in: filters.companies };
    }
    
    if (filters.locations?.length) {
      query.location = { $in: filters.locations };
    }
    
    if (filters.search) {
      query.$or = [
        { companyName: { $regex: filters.search, $options: 'i' } },
        { jobTitle: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    console.log('🔍 JobService: Query:', JSON.stringify(query, null, 2));
    
    const results = await collection
      .find(query)
      .sort({ companyName: 1, publishDate: -1 })
      .toArray();
    
    console.log(`✅ JobService: Found ${results.length} jobs`);
    
    return results;
  }

  // Improved upsert with better duplicate detection
  async upsertJobs(jobs: JobDocument[]) {
    const collection = await this.getJobsCollection();
    
    // Normalize and deduplicate incoming jobs
    const normalizedJobs = jobs.map(job => normalizeJobData(job));
    const uniqueJobs = this.removeDuplicatesFromArray(normalizedJobs);
    
    console.log(`🔄 Processing ${jobs.length} jobs, ${uniqueJobs.length} unique after deduplication`);
    
    const operations = uniqueJobs.map(job => ({
      updateOne: {
        filter: { 
          $or: [
            { id: job.id },
            // Also check for functional duplicates
            {
              companyName: job.companyName,
              jobTitle: job.jobTitle,
              location: job.location
            }
          ]
        },
        update: {
          $set: {
            ...job,
            scrapedAt: new Date(),
            isActive: true,
            lastUpdated: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await collection.bulkWrite(operations);
    
    console.log(`✅ Upsert complete: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
    
    return result;
  }

  // Clean up old/inactive jobs
  async cleanupOldJobs(companyName?: string, keepActiveIds?: string[]) {
    const collection = await this.getJobsCollection();
    
    const filter: any = {};
    
    if (companyName) {
      filter.companyName = companyName;
    }
    
    if (keepActiveIds?.length) {
      filter.id = { $nin: keepActiveIds };
    }
    
    // Mark as inactive instead of deleting
    const result = await collection.updateMany(filter, {
      $set: { 
        isActive: false,
        deactivatedAt: new Date()
      }
    });
    
    console.log(`🧹 Cleanup: ${result.modifiedCount} jobs marked inactive`);
    
    return result;
  }

  // Remove duplicates from array
  private removeDuplicatesFromArray(jobs: JobDocument[]): JobDocument[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      if (seen.has(job.id)) {
        return false;
      }
      seen.add(job.id);
      return true;
    });
  }

  // Get unique companies and locations for filters
  async getUniqueValues() {
    const collection = await this.getJobsCollection();
    
    const [companies, locations] = await Promise.all([
      collection.distinct('companyName', { isActive: true }),
      collection.distinct('location', { isActive: true })
    ]);

    return { companies, locations };
  }

  // Log scraping activities - Fixed interface
  async logScraping(log: {
    companyName: string;
    status: 'success' | 'failed' | 'partial';
    jobsFound: number;
    errorMessage?: string;
    duration: number;
  }) {
    const collection = await this.getLogsCollection();
    return await collection.insertOne({
      ...log,
      scrapedAt: new Date() // Add scrapedAt automatically
    });
  }

  // Get database statistics
  async getStats() {
    const collection = await this.getJobsCollection();
    
    const [totalJobs, activeJobs, companiesCount] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ isActive: true }),
      collection.distinct('companyName', { isActive: true }).then(arr => arr.length)
    ]);
    
    return {
      totalJobs,
      activeJobs,
      inactiveJobs: totalJobs - activeJobs,
      companiesCount
    };
  }
}