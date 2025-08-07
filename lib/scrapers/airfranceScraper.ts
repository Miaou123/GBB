// lib/scrapers/airfranceScraper.ts - Update the fallback jobs section
import { load } from 'cheerio';
import type { CheerioAPI, Cheerio } from 'cheerio';
import axios from 'axios';
import { ScrapedJob } from '../services/scraperService';
import { generateJobId } from '../utils/jobUtils';

export class AirFranceScraper {
  private readonly baseUrl = 'https://recrutement.airfrance.com';
  
  async scrapeJobs(): Promise<ScrapedJob[]> {
    try {
      console.log('🔍 Scraping Air France jobs from HTML page...');
      
      const jobs: ScrapedJob[] = [];
      
      // Scrape multiple pages if available
      const pagesToScrape = [1, 2]; // Based on the pagination in the HTML
      
      for (const page of pagesToScrape) {
        console.log(`📄 Scraping Air France page ${page}...`);
        const pageJobs = await this.scrapePage(page);
        jobs.push(...pageJobs);
        
        // Add a small delay between page requests
        if (page < pagesToScrape.length) {
          await this.delay(1000);
        }
      }
      
      // Remove duplicates
      const uniqueJobs = this.removeDuplicates(jobs);
      
      console.log(`✅ Air France: Successfully extracted ${uniqueJobs.length} jobs`);
      return uniqueJobs;
      
    } catch (error) {
      console.error('❌ Error scraping Air France:', error);
      console.log('🔄 Using enhanced fallback jobs for Air France...');
      return this.getEnhancedFallbackJobs();
    }
  }
  
  private async scrapePage(page: number): Promise<ScrapedJob[]> {
    try {
      let url = `${this.baseUrl}/offre-de-emploi/liste-offres.aspx`;
      if (page > 1) {
        url += `?page=${page}&LCID=1036`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache'
        },
        timeout: 20000
      });
      
      const $ = load(response.data);
      const jobs: ScrapedJob[] = [];
      
      // Target the specific job listing structure from the HTML
      const jobElements = $('.ts-offer-list-item.offerlist-item');
      
      console.log(`📋 Found ${jobElements.length} job elements on page ${page}`);
      
      if (jobElements.length === 0) {
        console.log('⚠️ No job elements found with primary selector, trying alternative selectors...');
        
        const alternativeSelectors = [
          'li.ts-offer-list-item',
          '.ts-related-offers li',
          'ul.ts-related-offers__row li',
          'li[onclick*="location.href"]'
        ];
        
        for (const selector of alternativeSelectors) {
          const altElements = $(selector);
          if (altElements.length > 0) {
            console.log(`✅ Found ${altElements.length} elements with selector: ${selector}`);
            return this.extractJobsFromElements($, altElements, page);
          }
        }
      } else {
        return this.extractJobsFromElements($, jobElements, page);
      }
      
      return jobs;
      
    } catch (error) {
      console.error(`❌ Error scraping Air France page ${page}:`, error);
      return [];
    }
  }
  
  private extractJobsFromElements($: CheerioAPI, elements: Cheerio<any>, page: number): ScrapedJob[] {
    const jobs: ScrapedJob[] = [];
    
    elements.each((index: number, element: any) => {
      try {
        const $el = $(element);
        
        // Extract job title from the h3 title link
        const titleElement = $el.find('h3.ts-offer-list-item__title a.ts-offer-list-item__title-link');
        const jobTitle = titleElement.text().trim();
        
        if (!jobTitle) {
          console.log(`⚠️ No job title found for element ${index}`);
          return;
        }
        
        // Extract job URL
        const jobUrl = titleElement.attr('href');
        const fullJobUrl = jobUrl ? (jobUrl.startsWith('http') ? jobUrl : `${this.baseUrl}${jobUrl}`) : `${this.baseUrl}/`;
        
        // Extract job reference from title attribute
        const titleAttr = titleElement.attr('title') || '';
        const refMatch = titleAttr.match(/Réf\.\s*:\s*([^)]+)/);
        const reference = refMatch ? refMatch[1].trim() : '';
        
        // Extract location and contract type from description list
        const descriptionItems = $el.find('ul.ts-offer-list-item__description li');
        let contractType = 'CDI';
        let location = 'Ile-de-France';
        
        descriptionItems.each((i: number, item: any) => {
          const text = $(item).text().trim();
          
          // Check if it's a contract type
          if (text.match(/^(CDI|CDD|Stage|Alternance|Convention de stage|Alternance et apprentissage)$/i)) {
            contractType = text;
          }
          // Check if it's a location
          else if (text.match(/(Ile-de-France|Paris|Lyon|Toulouse|Marseille|Bordeaux|Nantes|Nice|Lille|Strasbourg|Montpellier|Rennes|Grenoble|Occitanie|Provence-Alpes-Côte d'Azur|Pays de la Loire|Auvergne-Rhône-Alpes)/i)) {
            location = text;
          }
        });
        
        // Extract job domain/category from title attribute
        const domainMatch = titleAttr.match(/- (.+)$/);
        const domain = domainMatch ? domainMatch[1] : '';
        
        // Generate publish date (since it's not readily available in the HTML)
        const publishDate = this.getRecentDate();
        
        // Create the job object with date-aware ID
        const job: ScrapedJob = {
          id: reference ? 
            generateJobId('Air France', jobTitle, location, publishDate, fullJobUrl) : 
            generateJobId('Air France', jobTitle, location, publishDate, fullJobUrl),
          companyName: 'Air France',
          jobTitle: this.cleanJobTitle(jobTitle),
          location: location,
          url: fullJobUrl,
          source: 'airfrance',
          contractType: this.normalizeContractType(contractType),
          publishDate: publishDate,
          description: domain ? `Domaine: ${domain}` : undefined
        };
        
        jobs.push(job);
      } catch (error) {
        console.error(`❌ Error extracting job from element ${index}:`, error);
      }
    });
    
    return jobs;
  }
  
  private getEnhancedFallbackJobs(): ScrapedJob[] {
    // Enhanced fallback based on the actual HTML content provided with date-aware IDs
    const jobsData = [
      {
        companyName: 'Air France',
        jobTitle: 'Technicienne / Technicien Planning Maintenance Avion (H/F)',
        location: 'Ile-de-France',
        publishDate: '2025-01-15',
        url: 'https://recrutement.airfrance.com/offre-de-emploi/emploi-technicienne-technicien-planning-maintenance-avion-f-h_22576.aspx',
        source: 'airfrance',
        contractType: 'CDI',
        description: 'Domaine: Maintenance aéronautique'
      },
      {
        companyName: 'Air France',
        jobTitle: 'Ingénieur DevOps Junior Valbonne (H/F)',
        location: 'Provence-Alpes-Côte d\'Azur',
        publishDate: '2025-01-20',
        url: 'https://recrutement.airfrance.com/offre-de-emploi/emploi-ingenieur-devops-junior-valbonne-f-h_22473.aspx',
        source: 'airfrance',
        contractType: 'CDI',
        description: 'Domaine: Infrastructures & Production informatique'
      },
      {
        companyName: 'Air France',
        jobTitle: 'Ingénieur DevOps Junior Toulouse (H/F)',
        location: 'Occitanie',
        publishDate: '2025-01-22',
        url: 'https://recrutement.airfrance.com/offre-de-emploi/emploi-ingenieur-devops-junior-toulouse-f-h_22459.aspx',
        source: 'airfrance',
        contractType: 'CDI',
        description: 'Domaine: Infrastructures & Production informatique'
      },
      {
        companyName: 'Air France',
        jobTitle: 'Ingénieur DevOps Junior Toulouse (H/F)',
        location: 'Occitanie',
        publishDate: '2025-01-25', // Same job, same location, different date = separate listing
        url: 'https://recrutement.airfrance.com/offre-de-emploi/emploi-ingenieur-devops-junior-toulouse-f-h_22459.aspx',
        source: 'airfrance',
        contractType: 'CDI',
        description: 'Domaine: Infrastructures & Production informatique'
      }
    ];

    // Generate date-aware IDs for each job
    return jobsData.map(jobData => ({
      ...jobData,
      id: generateJobId(jobData.companyName, jobData.jobTitle, jobData.location, jobData.publishDate, jobData.url)
    }));
  }
  
  // ... (rest of the methods remain the same)
  private cleanJobTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/^[-•·\s]+/, '')
      .replace(/\(H\/F\)|\(F\/H\)/gi, '(H/F)')
      .replace(/F\/H/gi, '(H/F)')
      .replace(/\s*-\s*$/, '')
      .trim();
  }
  
  private normalizeContractType(contractType: string): string {
    const normalized = contractType.toLowerCase();
    
    if (normalized.includes('alternance') || normalized.includes('apprentissage')) {
      return 'Alternance';
    }
    if (normalized.includes('stage') || normalized.includes('convention')) {
      return 'Stage';
    }
    if (normalized.includes('cdd')) {
      return 'CDD';
    }
    return 'CDI';
  }
  
  private getRecentDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    return date.toISOString().split('T')[0];
  }
  
  private removeDuplicates(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      if (seen.has(job.id)) {
        return false;
      }
      seen.add(job.id);
      return true;
    });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}