// lib/services/cacheService.ts
import fs from 'fs';
import path from 'path';
import { ScrapedJob, ScrapingError } from './scraperService';

interface CacheData {
  jobs: ScrapedJob[];
  errors: ScrapingError[];
  timestamp: number;
  lastUpdated: string;
}

export class PersistentCacheService {
  private readonly cacheFile: string;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  constructor() {
    // Store cache in a 'cache' directory in your project root
    const cacheDir = path.join(process.cwd(), 'cache');
    this.cacheFile = path.join(cacheDir, 'jobs-cache.json');
    
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }
  
  /**
   * Get cached data if it exists and is still valid (within 24h)
   * Returns null if no cache or cache is expired
   */
  getCachedData(): CacheData | null {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        console.log('📋 No cache file found');
        return null;
      }
      
      const cacheContent = fs.readFileSync(this.cacheFile, 'utf8');
      const cacheData: CacheData = JSON.parse(cacheContent);
      
      const now = Date.now();
      const cacheAge = now - cacheData.timestamp;
      
      console.log(`📋 Cache found, age: ${Math.round(cacheAge / (60 * 60 * 1000))} hours`);
      
      // Check if cache is still valid (within 24h)
      if (cacheAge < this.CACHE_DURATION) {
        console.log('✅ Using valid cached data');
        return cacheData;
      } else {
        console.log('⏰ Cache expired, will need fresh data');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error reading cache:', error);
      return null;
    }
  }
  
  /**
   * Save fresh data to persistent cache
   */
  saveToCache(jobs: ScrapedJob[], errors: ScrapingError[]): void {
    try {
      const cacheData: CacheData = {
        jobs,
        errors,
        timestamp: Date.now(),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
      console.log(`💾 Saved ${jobs.length} jobs to persistent cache`);
      
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }
  
  /**
   * Force clear cache (used when user clicks "Actualiser")
   */
  clearCache(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
        console.log('🗑️ Cache cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
  
  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { cached: boolean; age?: number; jobCount?: number } {
    const cachedData = this.getCachedData();
    
    if (!cachedData) {
      return { cached: false };
    }
    
    const ageHours = Math.round((Date.now() - cachedData.timestamp) / (60 * 60 * 1000));
    
    return {
      cached: true,
      age: ageHours,
      jobCount: cachedData.jobs.length
    };
  }
  
  /**
   * Check if we should force refresh (no cache or expired)
   */
  shouldRefresh(): boolean {
    return this.getCachedData() === null;
  }
}