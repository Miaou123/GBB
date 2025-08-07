// lib/scrapers/bergerLevraultScraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedJob } from '../services/scraperService';

export class BergerLevraultScraper {
  private readonly baseUrl = 'https://recrute.berger-levrault.com';
  private readonly jobListUrl = 'https://recrute.berger-levrault.com/job/list-of-all-jobs.aspx';
  
  async scrapeJobs(): Promise<ScrapedJob[]> {
    try {
      console.log('🔍 Scraping Berger Levrault jobs...');
      
      const allJobs: ScrapedJob[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`📄 Scraping Berger Levrault page ${page}...`);
        
        const response = await axios.get(this.jobListUrl, {
          params: {
            all: 1,
            mode: 'list',
            page: page,
            LCID: 2057 // English version
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
          },
          timeout: 15000
        });
        
        console.log(`📄 Berger Levrault page ${page} response received, parsing HTML...`);
        
        const $ = cheerio.load(response.data);
        const jobs = this.extractJobsFromPage($);
        
        if (jobs.length === 0) {
          console.log(`🔚 No more jobs found on page ${page}, stopping pagination`);
          hasMore = false;
        } else {
          allJobs.push(...jobs);
          console.log(`✅ Extracted ${jobs.length} jobs from Berger Levrault page ${page}`);
          
          // Check if there's a next page button or pagination
          const nextPageExists = $('.pagination a[rel="next"]').length > 0 || 
                                 $('.pagination').find(`a:contains("${page + 1}")`).length > 0;
          
          if (!nextPageExists) {
            hasMore = false;
          } else {
            page++;
            // Rate limiting - be respectful
            await this.delay(1500);
          }
        }
        
        // Safety check to prevent infinite loops
        if (page > 20) {
          console.log('⚠️ Berger Levrault: Reached safety limit of 20 pages, stopping');
          break;
        }
      }
      
      // Remove duplicates
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      if (uniqueJobs.length === 0) {
        throw new Error('No jobs found on Berger Levrault website');
      }
      
      console.log(`✅ Berger Levrault: Successfully scraped ${uniqueJobs.length} jobs`);
      return uniqueJobs;
      
    } catch (error) {
      console.error('❌ Error scraping Berger Levrault:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          console.error('Rate limit exceeded for Berger Levrault');
        } else if (error.response && error.response.status >= 400) {
          console.error(`Berger Levrault error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.code === 'ECONNABORTED') {
          console.error('Berger Levrault request timeout');
        } else if (!error.response) {
          console.error('Network error - no response received from Berger Levrault');
        }
      }
      
      throw new Error(`Berger Levrault scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private extractJobsFromPage($: cheerio.CheerioAPI): ScrapedJob[] {
    const jobs: ScrapedJob[] = [];
    
    // Use the actual selectors from the HTML structure
    const jobElements = $('li.ts-offer-list-item.offerlist-item');
    
    console.log(`🎯 Found ${jobElements.length} job elements with actual selector`);
    
    if (jobElements.length === 0) {
      console.log('⚠️ No job elements found with correct selector');
      return jobs;
    }
    
    // Extract job data from each element
    jobElements.each((_, element) => {
      try {
        const job = this.extractJobData($, $(element));
        if (job && this.isValidJob(job)) {
          jobs.push(job);
        }
      } catch (error) {
        console.error('Error extracting job data:', error);
      }
    });
    
    return jobs;
  }
  
  private extractJobData($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): ScrapedJob | null {
    try {
      // Extract job title from the link text
      const titleLink = element.find('a[title]');
      const jobTitle = titleLink.attr('title') || titleLink.text().trim() || '';
      
      if (!jobTitle) {
        console.log('⚠️ No job title found in element');
        return null;
      }
      
      // Extract job URL from the href attribute
      const href = titleLink.attr('href');
      let jobUrl = 'https://recrute.berger-levrault.com/';
      if (href) {
        jobUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
      }
      
      // Extract location from onclick attribute
      // Example: "location.href='/offre-de-emploi/emploi-technicien-formateur-logiciel-de-proximite-f-h_5742.aspx';"
      let location = 'France'; // Default location
      const onclickAttr = titleLink.attr('onclick');
      if (onclickAttr) {
        // Try to extract more specific location info from the URL or job title
        // For now, we'll keep the default
        location = 'France';
      }
      
      // Extract reference/ID from the URL
      let reference = null;
      if (href) {
        const referenceMatch = href.match(/_(\d+)\.aspx/);
        if (referenceMatch) {
          reference = referenceMatch[1];
        }
      }
      
      // Generate unique ID
      const jobId = reference ? 
        `berger-levrault-${reference}` : 
        `berger-levrault-${this.generateHashId(jobTitle, location)}`;
      
      // No publish date available in the HTML, so set to undefined
      const publishDate = undefined;
      
      console.log(`📋 Extracted job: ${jobTitle} (ID: ${jobId})`);
      
      return {
        id: jobId,
        companyName: 'Berger Levrault',
        jobTitle: this.cleanText(jobTitle),
        location: location,
        publishDate: publishDate,
        url: jobUrl,
        source: 'berger-levrault',
        contractType: 'CDI', // Default since not specified in this HTML
        description: undefined // Could be extracted from individual job pages if needed
      };
      
    } catch (error) {
      console.error('Error extracting job data from element:', error);
      return null;
    }
  }
  
  private extractDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string | undefined {
    const descriptionSelectors = ['.job-description', '.description', '.content', '.resume'];
    
    for (const selector of descriptionSelectors) {
      const descEl = element.find(selector).first();
      if (descEl.length && descEl.text().trim()) {
        return this.cleanText(descEl.text()).substring(0, 200);
      }
    }
    
    return undefined;
  }
  
  private formatDate(dateString: string): string {
    try {
      // Try to parse various French date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }
  
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }
  
  private generateHashId(title: string, location: string): string {
    const baseString = `${title}-${location}`.toLowerCase();
    let hash = 0;
    
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString();
  }
  
  private isValidJob(job: ScrapedJob): boolean {
    return !!(
      job.jobTitle && 
      job.jobTitle.length > 3 && 
      job.location &&
      job.companyName
    );
  }
  
  private removeDuplicates(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.jobTitle.toLowerCase()}-${job.location.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}