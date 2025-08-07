// lib/scrapers/lyraScraper.ts
import axios from 'axios';
import { ScrapedJob } from '../services/scraperService';

interface LyraJob {
  id: number;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  lyra_departments: Array<{
    slug: string;
    name: string;
  }>;
}

export class LyraScraper {
  private readonly baseUrl = 'https://www.lyra.com/fr/wp-json/wp/v2/offer_type';
  private readonly perPage = 12; // They use 12 jobs per page
  
  async scrapeJobs(): Promise<ScrapedJob[]> {
    console.log('🔍 Scraping Lyra Network jobs from REST API...');
    
    try {
      const allJobs: ScrapedJob[] = [];
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        console.log(`📄 Fetching Lyra jobs page ${page}...`);
        
        const pageJobs = await this.fetchJobsPage(page);
        console.log(`📊 Raw jobs from page ${page}: ${pageJobs.length}`);
        
        if (pageJobs.length === 0) {
          console.log(`📄 No jobs found on page ${page}, stopping pagination`);
          hasMorePages = false;
        } else {
          allJobs.push(...pageJobs);
          console.log(`📄 Page ${page}: Found ${pageJobs.length} jobs, total so far: ${allJobs.length}`);
          
          // Debug: Show all jobs added from this page
          pageJobs.forEach(job => {
            console.log(`📝 Page ${page} job: "${job.jobTitle}" (${job.id}) - Company: "${job.companyName}"`);
          });
          
          page++;
          
          // If we got fewer jobs than the per_page limit, we've reached the end
          if (pageJobs.length < this.perPage) {
            console.log(`📄 Received ${pageJobs.length} jobs (less than ${this.perPage}), reached end of pagination`);
            hasMorePages = false;
          }
          
          // Safety limit
          if (page > 20) {
            console.log('📄 Reached safety limit of 20 pages');
            hasMorePages = false;
          }
        }
        
        // Be respectful with requests
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const uniqueJobs = this.removeDuplicates(allJobs);
      console.log(`✅ Lyra Network: Successfully extracted ${uniqueJobs.length} unique jobs`);
      return uniqueJobs;
      
    } catch (error) {
      console.error('❌ Error scraping Lyra Network:', error);
      throw new Error(`Failed to scrape Lyra Network: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async fetchJobsPage(page: number): Promise<ScrapedJob[]> {
    try {
      const url = this.buildApiUrl(page);
      console.log(`🔗 Fetching: ${url}`);
      
      const response = await axios.get<LyraJob[]>(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        timeout: 15000
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!Array.isArray(response.data)) {
        console.error('❌ Unexpected response format:', response.data);
        return [];
      }
      
      console.log(`📄 Lyra API response: ${response.data.length} jobs on page ${page}`);
      
      // Convert API response to ScrapedJob format
      const jobs = response.data.map((job, index) => this.convertToScrapedJob(job, index));
      
      return jobs.filter(job => job !== null) as ScrapedJob[];
      
    } catch (error) {
      console.error(`❌ Error fetching Lyra jobs page ${page}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log(`📄 Page ${page} returned 404, no more pages`);
          return [];
        }
        console.error(`HTTP ${error.response?.status}: ${error.response?.statusText}`);
      }
      
      return [];
    }
  }
  
  private buildApiUrl(page: number): string {
    const params = new URLSearchParams({
      'filters': '{}', // Empty filters object
      'page': page.toString(),
      'per_page': this.perPage.toString(),
      'search': '', // Empty search
      '_fields': 'id,title,excerpt,link,formatted_date_gmt,media,type,lyra_departments'
    });
    
    return `${this.baseUrl}?${params.toString()}`;
  }
  
  private convertToScrapedJob(job: LyraJob, index: number): ScrapedJob | null {
    try {
      // Validate required fields
      if (!job.id || !job.title?.rendered || !job.link) {
        console.log(`⚠️ Skipping job with missing required fields: ID=${job.id}`);
        return null;
      }
      
      // Clean job title
      const jobTitle = this.cleanJobTitle(job.title.rendered);
      
      if (!jobTitle || jobTitle.length < 3) {
        console.log(`⚠️ Skipping job with invalid title: "${job.title.rendered}"`);
        return null;
      }
      
      // Extract location from departments or job title
      const location = this.extractLocation(job, jobTitle);
      
      // Generate unique ID
      const jobId = `lyra-${job.id}`;
      
      const scrapedJob: ScrapedJob = {
        id: jobId,
        companyName: 'Lyra Network',
        jobTitle: jobTitle,
        location: location,
        url: job.link,
        source: 'lyra',
        description: job.excerpt?.rendered ? this.cleanDescription(job.excerpt.rendered) : undefined
      };
      
      console.log(`📋 Converted job: ${jobTitle} (ID: ${jobId})`);
      return scrapedJob;
      
    } catch (error) {
      console.error(`❌ Error converting job ${job.id}:`, error);
      return null;
    }
  }
  
  private cleanJobTitle(title: string): string {
    // Remove HTML entities and clean up
    return title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&hellip;/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private cleanDescription(description: string): string {
    // Remove HTML tags and entities, limit length
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&hellip;/g, '...')
      .replace(/\s+/g, ' ')
      .substring(0, 200) // Limit to 200 characters
      .trim();
  }
  
  private extractLocation(job: LyraJob, jobTitle: string): string {
    // First, check if there are department locations
    if (job.lyra_departments && job.lyra_departments.length > 0) {
      const departmentNames = job.lyra_departments.map(dept => dept.name).join(', ');
      
      // Check if department names contain location indicators
      const locationKeywords = ['Lyon', 'Paris', 'Toulouse', 'Grenoble', 'France'];
      for (const keyword of locationKeywords) {
        if (departmentNames.toLowerCase().includes(keyword.toLowerCase())) {
          return keyword;
        }
      }
    }
    
    // Extract from job title
    const locationFromTitle = this.extractLocationFromText(jobTitle);
    if (locationFromTitle !== 'France') {
      return locationFromTitle;
    }
    
    // Check job URL for location hints
    const locationFromUrl = this.extractLocationFromText(job.link);
    if (locationFromUrl !== 'France') {
      return locationFromUrl;
    }
    
    // Default to Lyra's headquarters location
    return 'Toulouse'; // Lyra Network is based in Toulouse
  }
  
  private extractLocationFromText(text: string): string {
    const cities = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Lille', 'Bordeaux', 
      'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Grenoble', 
      'Rennes', 'Nancy', 'Metz', 'Clermont-Ferrand'
    ];
    
    const lowerText = text.toLowerCase();
    
    for (const city of cities) {
      if (lowerText.includes(city.toLowerCase())) {
        return city;
      }
    }
    
    return 'France';
  }
  
  private removeDuplicates(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    
    const uniqueJobs = jobs.filter(job => {
      // Use both ID and title for deduplication
      const key = `${job.id}-${job.jobTitle.toLowerCase()}`;
      if (seen.has(key)) {
        duplicates.push(`${job.jobTitle} (${job.id})`);
        return false;
      }
      seen.add(key);
      return true;
    });
    
    if (duplicates.length > 0) {
      console.log(`🔄 Removed ${duplicates.length} duplicates: ${duplicates.join(', ')}`);
    }
    
    console.log(`📊 Final job count: ${uniqueJobs.length} unique jobs`);
    uniqueJobs.forEach(job => {
      console.log(`📝 Final job: "${job.jobTitle}" (${job.id}) - Company: "${job.companyName}"`);
    });
    
    return uniqueJobs;
  }
}