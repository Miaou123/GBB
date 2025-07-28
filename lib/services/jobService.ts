// lib/services/jobService.ts
import { getDatabase } from '../mongodb';
import { JobDocument, CompanyDocument, ScrapingLogDocument } from '../models/job';

export class JobService {
  private async getJobsCollection() {
    const db = await getDatabase();
    return db.collection<JobDocument>('jobs'); // Changed from 'job_offers' to 'jobs'
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

  // Upsert jobs (insert new, update existing)
  async upsertJobs(jobs: JobDocument[]) {
    const collection = await this.getJobsCollection();
    const operations = jobs.map(job => ({
      updateOne: {
        filter: { id: job.id },
        update: {
          $set: {
            ...job,
            scrapedAt: new Date(),
            isActive: true
          }
        },
        upsert: true
      }
    }));

    return await collection.bulkWrite(operations);
  }

  // Mark jobs as inactive (for cleanup)
  async markJobsInactive(companyName: string, activeJobIds: string[]) {
    const collection = await this.getJobsCollection();
    return await collection.updateMany(
      {
        companyName,
        id: { $nin: activeJobIds },
        isActive: true
      },
      {
        $set: { isActive: false }
      }
    );
  }

  // Get unique companies and locations for filters
  async getUniqueValues() {
    const collection = await this.getJobsCollection();
    
    const [companies, locations] = await Promise.all([
      collection.distinct('companyName', { isActive: true }),
      collection.distinct('location', { isActive: true })
    ]);

    return {
      companies: companies.sort(),
      locations: locations.sort()
    };
  }

  // Log scraping activity
  async logScraping(log: Omit<ScrapingLogDocument, '_id' | 'scrapedAt'>) {
    const collection = await this.getLogsCollection();
    return await collection.insertOne({
      ...log,
      scrapedAt: new Date()
    });
  }

  // Get scraping statistics
  async getScrapingStats() {
    const logsCollection = await this.getLogsCollection();
    const jobsCollection = await this.getJobsCollection();

    const [totalJobs, lastScraping, companiesStats] = await Promise.all([
      jobsCollection.countDocuments({ isActive: true }),
      logsCollection.findOne({}, { sort: { scrapedAt: -1 } }),
      jobsCollection.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$companyName', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);

    return {
      totalJobs,
      lastScraping,
      companiesStats
    };
  }
}