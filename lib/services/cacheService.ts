// lib/services/cacheService.ts - Enhanced with debug logging
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
    
    console.log('🔧 Cache initialized with path:', this.cacheFile);
    
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      console.log('📁 Creating cache directory:', cacheDir);
      fs.mkdirSync(cacheDir, { recursive: true });
    } else {
      console.log('📁 Cache directory exists:', cacheDir);
    }
  }
  
  /**
   * Get cached data if it exists and is still valid (within 24h)
   * Returns null if no cache or cache is expired
   */
  getCachedData(): CacheData | null {
    try {
      console.log('🔍 Checking for cache file:', this.cacheFile);
      
      if (!fs.existsSync(this.cacheFile)) {
        console.log('❌ No cache file found at:', this.cacheFile);
        return null;
      }
      
      console.log('✅ Cache file exists, reading content...');
      const cacheContent = fs.readFileSync(this.cacheFile, 'utf8');
      console.log('📄 Cache file size:', cacheContent.length, 'characters');
      
      const cacheData: CacheData = JSON.parse(cacheContent);
      console.log('✅ Cache parsed successfully, jobs count:', cacheData.jobs?.length || 0);
      
      const now = Date.now();
      const cacheAge = now - cacheData.timestamp;
      const cacheAgeHours = Math.round(cacheAge / (60 * 60 * 1000));
      const cacheAgeMinutes = Math.round(cacheAge / (60 * 1000));
      
      console.log(`⏰ Cache age: ${cacheAgeHours} hours (${cacheAgeMinutes} minutes)`);
      console.log(`⏰ Cache duration limit: ${this.CACHE_DURATION / (60 * 60 * 1000)} hours`);
      
      // Check if cache is still valid (within 24h)
      if (cacheAge < this.CACHE_DURATION) {
        console.log('✅ Cache is valid, using cached data');
        return cacheData;
      } else {
        console.log('⏰ Cache expired, will need fresh data');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error reading cache:', error);
      if (error instanceof SyntaxError) {
        console.log('🔧 Cache file appears corrupted, will delete and recreate');
        this.clearCache();
      }
      return null;
    }
  }
  
  /**
   * Save fresh data to persistent cache
   */
  saveToCache(jobs: ScrapedJob[], errors: ScrapingError[]): void {
    try {
      console.log(`💾 Attempting to save ${jobs.length} jobs to cache...`);
      
      const cacheData: CacheData = {
        jobs,
        errors,
        timestamp: Date.now(),
        lastUpdated: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(cacheData, null, 2);
      console.log('📄 Cache data serialized, size:', jsonString.length, 'characters');
      
      fs.writeFileSync(this.cacheFile, jsonString, 'utf8');
      console.log(`✅ Successfully saved ${jobs.length} jobs to cache file:`, this.cacheFile);
      
      // Verify the save worked
      if (fs.existsSync(this.cacheFile)) {
        const stats = fs.statSync(this.cacheFile);
        console.log('✅ Cache file verified, size:', stats.size, 'bytes');
      } else {
        console.error('❌ Cache file was not created!');
      }
      
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
      console.error('🔧 Cache file path:', this.cacheFile);
      console.error('🔧 Process working directory:', process.cwd());
    }
  }
  
  /**
   * Force clear cache (used when user clicks "Actualiser")
   */
  clearCache(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
        console.log('🗑️ Cache file deleted:', this.cacheFile);
      } else {
        console.log('🗑️ No cache file to delete');
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
  
  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { cached: boolean; age?: number; jobCount?: number; remainingTime?: number } {
    const cachedData = this.getCachedData();
    
    if (!cachedData) {
      return { cached: false };
    }
    
    const now = Date.now();
    const cacheAge = now - cachedData.timestamp;
    const ageSeconds = Math.round(cacheAge / 1000);
    const remainingTime = Math.max(0, Math.round((this.CACHE_DURATION - cacheAge) / 1000));
    
    return {
      cached: true,
      age: ageSeconds,
      jobCount: cachedData.jobs.length,
      remainingTime: remainingTime
    };
  }
  
  /**
   * Check if we should force refresh (no cache or expired)
   */
  shouldRefresh(): boolean {
    const result = this.getCachedData() === null;
    console.log('🤔 Should refresh?', result);
    return result;
  }
}