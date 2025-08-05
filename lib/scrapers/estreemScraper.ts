// lib/scrapers/estreemScraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedJob } from '../services/scraperService';

export class EstreemScraper {
  private readonly baseUrl = 'https://partecis.teamtailor.com';
  
  async scrapeJobs(): Promise<ScrapedJob[]> {
    try {
      console.log('🔍 Scraping Estreem jobs from TeamTailor...');
      
      // Use the cleaner jobs URL instead of the homepage
      const response = await axios.get(`${this.baseUrl}/jobs`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });
      
      console.log('📄 Response received, analyzing content...');
      
      const $ = cheerio.load(response.data);
      const jobs: ScrapedJob[] = [];
      
      // Look for job links in the HTML
      console.log('🔍 Looking for job links in HTML...');
      
      // Try different selectors to find job links
      const jobLinkSelectors = [
        'a[href*="/jobs/"]',          // Links containing /jobs/
        'a[href*="jobs"]',            // Any links with "jobs"
        '.job-link, .job-item a',     // Common job link classes
        '[data-job] a',               // Job data attributes
        'a'                           // All links as fallback
      ];
      
      let foundJobLinks = false;
      
      for (const selector of jobLinkSelectors) {
        const links = $(selector);
        console.log(`📋 Found ${links.length} links with selector: ${selector}`);
        
        if (links.length > 0) {
          links.each((index, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const linkText = $link.text().trim();
            
            console.log(`🔗 Link ${index + 1}: "${linkText}" -> ${href}`);
            
            // Check if this looks like a job link
            if (href && linkText && 
                (href.includes('/jobs/') || href.includes('job')) &&
                linkText.length > 10 &&
                (linkText.includes('H/F') || linkText.includes('Manager') || linkText.includes('Engineer') || linkText.includes('Director'))) {
              
              console.log(`✅ Found job link: ${linkText} -> ${href}`);
              
              // Extract job info from link text
              const jobTitle = this.cleanJobTitle(linkText);
              const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
              
              // Generate consistent ID based on job content (not timestamp)
              const jobId = this.generateConsistentId(jobTitle, 'Paris - Bercy Village');
              
              jobs.push({
                id: jobId,
                companyName: 'Estreem',
                jobTitle: jobTitle,
                location: 'Paris - Bercy Village', // Default, we'll improve this later
                url: fullUrl,
                source: 'estreem',
                contractType: 'Hybride'
              });
              
              foundJobLinks = true;
            }
          });
          
          // If we found job links with this selector, break
          if (foundJobLinks) {
            console.log(`✅ Successfully found job links with selector: ${selector}`);
            break;
          }
        }
      }
      
      // If we didn't find any job links, let's examine the page structure
      if (!foundJobLinks) {
        console.log('⚠️ No job links found, examining page structure...');
        console.log(`📄 All links found: ${$('a').length}`);
        
        // Log all links for debugging
        $('a').each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();
          if (href && text) {
            console.log(`🔗 All links [${index}]: "${text}" -> ${href}`);
          }
        });
        
        // Also check for any text that looks like job titles, maybe they're not links
        const allText = $('body').text();
        console.log(`📄 Page contains "Business Analyst": ${allText.includes('Business Analyst')}`);
        console.log(`📄 Page contains "/jobs/": ${allText.includes('/jobs/')}`);
      }
      
      // Fallback to hardcoded jobs if scraping fails
      if (jobs.length === 0) {
        console.log('⚠️ HTML link extraction failed, using fallback data...');
        jobs.push(...this.getFallbackJobs());
      }
      
      // Remove duplicates
      const uniqueJobs = this.removeDuplicates(jobs);
      
      console.log(`✅ Estreem: Found ${uniqueJobs.length} jobs`);
      return uniqueJobs;
      
    } catch (error) {
      console.error('❌ Error scraping Estreem:', error);
      console.log('🔄 Using fallback jobs for Estreem...');
      return this.getFallbackJobs();
    }
  }
  
  private cleanJobTitle(title: string): string {
    // Remove department indicators and clean up
    return title
      .replace(/\s*(Tech|Finance et Achats|Achats|Finance)\s*$/i, '') // Remove department tags at the end
      .replace(/^[-•·\s]+/, '') // Remove leading bullets/dashes
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\(H\/F\)|\(F\/H\)/gi, '(H/F)') // Normalize gender indicators
      .trim();
  }
  
  private cleanLocation(location: string): string {
    return location
      .replace(/^[-•·\s]+/, '') // Remove leading bullets/dashes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }
  
  private extractContractType(content: string, jobTitle: string): string | undefined {
    // Look for contract type indicators in the content around the job
    if (content.toLowerCase().includes('hybride') || content.toLowerCase().includes('hybrid')) {
      return 'Hybride';
    }
    if (content.toLowerCase().includes('remote') || content.toLowerCase().includes('télétravail')) {
      return 'Remote';
    }
    return undefined;
  }
  
  private extractDescription(originalTitle: string): string | undefined {
    // Extract department/category from original title
    const departmentMatch = originalTitle.match(/(Tech|Finance et Achats|Achats|Finance|Risques|Direction|Conformité|Juridique|Direction Générale)$/i);
    return departmentMatch ? departmentMatch[1] : undefined;
  }
  
  private generateJobSlug(jobTitle: string): string {
    // Generate a URL-friendly slug from job title
    // Remove (H/F), special characters, and convert to lowercase with hyphens
    return jobTitle
      .replace(/\s*\(H\/F\)\s*/gi, '') // Remove (H/F)
      .replace(/[&]/g, 'and') // Replace & with 'and'
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
  
  private generateConsistentId(jobTitle: string, location: string): string {
    // Create a consistent hash-like ID based on job title and location
    // This ensures the same job always gets the same ID
    const normalized = `${jobTitle.toLowerCase().replace(/\s+/g, '-')}-${location.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Create a simple hash from the normalized string
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to positive number and prefix with company name
    const positiveHash = Math.abs(hash);
    return `estreem-${positiveHash}`;
  }
  
  private getFallbackJobs(): ScrapedJob[] {
    // Updated with all 14 jobs from the cleaner /jobs URL with consistent IDs
    return [
      {
        id: this.generateConsistentId('Business Analyst Expert Monétique (H/F)', 'Lyon, Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Business Analyst Expert Monétique (H/F)',
        location: 'Lyon, Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/business-analyst-expert-monetique`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('Purchase Officer (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Purchase Officer (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/purchase-officer`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Finance et Achats'
      },
      {
        id: this.generateConsistentId('Directeur Processus & Industrialisation (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Directeur Processus & Industrialisation (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/directeur-processus-and-industrialisation`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('Manager CICD (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Manager CICD (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/manager-cicd`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('Intégrateur Cloud (H/F)', 'Paris - Bercy Village, Lyon'),
        companyName: 'Estreem',
        jobTitle: 'Intégrateur Cloud (H/F)',
        location: 'Paris - Bercy Village, Lyon',
        url: `${this.baseUrl}/jobs/integrateur-cloud`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('Documentation Manager (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Documentation Manager (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/documentation-manager`,
        source: 'estreem'
      },
      {
        id: this.generateConsistentId('Operational Risks & Compliance Manager (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Operational Risks & Compliance Manager (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/operational-risks-and-compliance-manager`,
        source: 'estreem',
        contractType: 'Hybride'
      },
      {
        id: this.generateConsistentId('Site Reliability Engineer (H/F)', 'Toulouse, Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Site Reliability Engineer (H/F)',
        location: 'Toulouse, Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/site-reliability-engineer`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('QA Automation Engineer (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'QA Automation Engineer (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/qa-automation-engineer`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('Software Engineer Java Full Stack (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Software Engineer Java Full Stack (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/software-engineer-java-full-stack`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('IT Security Director (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'IT Security Director (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/it-security-director`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      },
      {
        id: this.generateConsistentId('Cyber & IT Risks Director (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Cyber & IT Risks Director (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/cyber-and-it-risks-director`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Risques, Conformité et Juridique'
      },
      {
        id: this.generateConsistentId('Communication Officer (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Communication Officer (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/communication-officer`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Direction Générale'
      },
      {
        id: this.generateConsistentId('Directeur Architecture & Innovation (H/F)', 'Paris - Bercy Village'),
        companyName: 'Estreem',
        jobTitle: 'Directeur Architecture & Innovation (H/F)',
        location: 'Paris - Bercy Village',
        url: `${this.baseUrl}/jobs/directeur-architecture-and-innovation`,
        source: 'estreem',
        contractType: 'Hybride',
        description: 'Tech'
      }
    ];
  }
  
  private removeDuplicates(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set();
    return jobs.filter(job => {
      const key = `${job.jobTitle}-${job.location}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}