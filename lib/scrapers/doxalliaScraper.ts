// lib/scrapers/doxalliaScraper.ts - Puppeteer version for AJAX pagination
import puppeteer from 'puppeteer';
import { ScrapedJob } from '../services/scraperService';

export class DoxalliaScraper {
  private readonly baseUrl = 'https://www.doxallia.com';
  private readonly jobsPath = '/nous-rejoindre/';
  
  async scrapeJobs(): Promise<ScrapedJob[]> {
    console.log('🔍 Scraping Doxallia jobs with Puppeteer (AJAX pagination)...');
    
    let browser;
    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const url = `${this.baseUrl}${this.jobsPath}`;
      console.log(`📄 Loading Doxallia page: ${url}`);
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const allJobs: ScrapedJob[] = [];
      let currentPage = 1;
      
      while (true) {
        console.log(`📄 Scraping Doxallia page ${currentPage}...`);
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract jobs from current page
        const pageJobs = await this.extractJobsFromPage(page, currentPage);
        
        if (pageJobs.length === 0) {
          console.log(`📄 No jobs found on page ${currentPage}, stopping`);
          break;
        }
        
        // Check for duplicates
        const newJobs = this.getUniqueJobs(pageJobs, allJobs);
        
        if (newJobs.length === 0) {
          console.log(`📄 No new jobs found on page ${currentPage}, stopping pagination`);
          break;
        }
        
        allJobs.push(...newJobs);
        console.log(`📄 Page ${currentPage}: Found ${newJobs.length} new jobs (total: ${allJobs.length})`);
        
        // Try to find and click next page button
        const hasNextPage = await this.clickNextPage(page);
        
        if (!hasNextPage) {
          console.log(`📄 No next page button found, stopping pagination`);
          break;
        }
        
        currentPage++;
        
        // Safety limit
        if (currentPage > 5) {
          console.log('📄 Reached safety limit of 5 pages');
          break;
        }
      }
      
      console.log(`✅ Doxallia: Successfully extracted ${allJobs.length} jobs using Puppeteer`);
      return this.removeDuplicates(allJobs);
      
    } catch (error) {
      console.error('❌ Error scraping Doxallia with Puppeteer:', error);
      throw new Error(`Failed to scrape Doxallia: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  private async extractJobsFromPage(page: any, pageNum: number): Promise<ScrapedJob[]> {
    try {
      // Extract job data from the current page
      const jobs = await page.evaluate((pageNumber: number) => {
        const jobElements: any[] = [];
        
        // Try different selectors to find job links
        const selectors = [
          'a[href*="/nous-rejoindre/"]:not([href$="/nous-rejoindre/"]):not([href*="page"])',
          '.job-listing a',
          '.offre a',
          'ul li a[href*="/nous-rejoindre/"]',
          'div[class*="job"] a',
          'a[href$=".aspx"]'
        ];
        
        let foundJobs: any[] = [];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            
            elements.forEach((element: any, index: number) => {
              const href = element.getAttribute('href');
              if (!href) return;
              
              // Make absolute URL
              const url = href.startsWith('/') ? `https://www.doxallia.com${href}` : href;
              
              // Skip if not a proper job page
              if (url === 'https://www.doxallia.com/nous-rejoindre/' ||
                  url.includes('/page/') ||
                  url.includes('?page=')) {
                return;
              }
              
              // Extract job title
              const title = element.textContent?.trim() || 
                           element.getAttribute('title') || 
                           element.getAttribute('aria-label') || '';
              
              if (title.length < 3) return;
              
              foundJobs.push({
                title: title,
                url: url,
                selector: selector,
                index: index
              });
            });
          }
        }
        
        return foundJobs;
      }, pageNum);
      
      // Convert to ScrapedJob format
      const scrapedJobs: ScrapedJob[] = jobs.map((job: any, index: number) => {
        const jobId = this.generateJobId(job.url, job.title, index);
        const location = this.extractLocationFromText(job.title + ' ' + job.url);
        
        return {
          id: jobId,
          companyName: 'Doxallia',
          jobTitle: this.cleanJobTitle(job.title),
          location: location,
          url: job.url,
          source: 'doxallia'
        };
      });
      
      console.log(`📋 Extracted ${scrapedJobs.length} jobs from page ${pageNum}`);
      return scrapedJobs;
      
    } catch (error) {
      console.error(`❌ Error extracting jobs from page ${pageNum}:`, error);
      return [];
    }
  }
  
  private async clickNextPage(page: any): Promise<boolean> {
    try {
      // Try different selectors for next page button/link
      const nextPageSelectors = [
        'a.next',
        'a[aria-label*="Next"]',
        'a[aria-label*="Suivant"]',
        'a[title*="Next"]',
        'a[title*="Suivant"]',
        '.pagination a.next',
        '.pagination .next',
        'a:contains("Next")',
        'a:contains("Suivant")',
        'a:contains(">")',
        '.page-numbers.next',
        'button[aria-label*="Next"]',
        'button[aria-label*="Suivant"]'
      ];
      
      for (const selector of nextPageSelectors) {
        try {
          // Check if element exists and is visible
          const element = await page.$(selector);
          if (element) {
            const isVisible = await page.evaluate((el: any) => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && 
                     window.getComputedStyle(el).visibility !== 'hidden' &&
                     !el.disabled;
            }, element);
            
            if (isVisible) {
              console.log(`🔗 Clicking next page with selector: ${selector}`);
              
              // Click and wait for navigation/content change
              await Promise.all([
                new Promise(resolve => setTimeout(resolve, 1000)), // Wait a bit for any animations
                element.click()
              ]);
              
              // Wait for new content to load
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              return true;
            }
          }
        } catch (error) {
          // Continue trying other selectors
          continue;
        }
      }
      
      // If no button found, try looking for page number links (2, 3, etc.)
      const pageNumberLinks = await page.$$('a.page-numbers');
      
      for (const link of pageNumberLinks) {
        const text = await page.evaluate((el: any) => el.textContent?.trim(), link);
        const pageNumber = parseInt(text || '');
        
        if (!isNaN(pageNumber) && pageNumber > 1) {
          console.log(`🔗 Clicking page number: ${pageNumber}`);
          
          await Promise.all([
            new Promise(resolve => setTimeout(resolve, 1000)),
            link.click()
          ]);
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error clicking next page:', error);
      return false;
    }
  }
  
  private generateJobId(url: string, title: string, index: number): string {
    // Extract from URL first
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1].replace(/\.aspx$/, '') || urlParts[urlParts.length - 2];
    
    if (lastPart && lastPart !== 'nous-rejoindre' && lastPart.length > 2) {
      return `doxallia-${lastPart.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`;
    }
    
    // Generate from title
    const titleSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return `doxallia-${titleSlug}-${index}`;
  }
  
  private cleanJobTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/\([^)]*\)$/, '') // Remove trailing parentheses
      .replace(/CDI|CDD|STAGE|ALTERNANCE/gi, '') // Remove contract types
      .replace(/F\/H|H\/F/gi, '') // Remove gender indicators
      .replace(/\d+\s*poste[s]?/gi, '') // Remove "1 poste" etc.
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private extractLocationFromText(text: string): string {
    const cities = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Lille', 'Bordeaux', 
      'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Rodez', 'Rennes',
      'Grenoble', 'Nancy', 'Metz', 'Clermont-Ferrand'
    ];
    
    for (const city of cities) {
      if (text.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    
    return 'France';
  }
  
  private getUniqueJobs(newJobs: ScrapedJob[], existingJobs: ScrapedJob[]): ScrapedJob[] {
    const existingUrls = new Set(existingJobs.map(job => job.url));
    const existingTitles = new Set(existingJobs.map(job => job.jobTitle.toLowerCase()));
    
    return newJobs.filter(job => {
      return !existingUrls.has(job.url) && !existingTitles.has(job.jobTitle.toLowerCase());
    });
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
}