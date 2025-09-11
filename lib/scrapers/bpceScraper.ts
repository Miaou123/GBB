// lib/scrapers/bpceScraper.ts
import axios from 'axios';
import { ScrapedJob } from '../services/scraperService';

interface BPCEApiResponse {
  total_count: number;
  results: BPCEJobRecord[];
}

interface BPCEJobRecord {
  title: string;
  lastmodifieddate: string;
  referencenumber: string;
  apply_url: string;
  url: string;
  company: string;
  city: string;
  state: string;
  country: string;
  description: string;
  category: string;
  jobcode: string;
  jobtype: string;
  jobindustry: string;
  organization: string;
  step_up_academy: string;
  manager_bpce: string;
  nom_recruteur_principal: string;
  email_recruteur_principal: string;
  geo_point_2d: {
    lon: number;
    lat: number;
  };
}

export class BPCEScraper {
  private readonly baseUrl = 'https://bpce.opendatasoft.com/api/explore/v2.1';
  private readonly dataset = 'groupe-bpce-offres-emploi';
  
  async scrapeJobs(): Promise<ScrapedJob[]> {
    try {
      console.log('🔍 Scraping BPCE jobs from Open Data API v2.1...');
      
      const allJobs: ScrapedJob[] = [];
      let offset = 0;
      const limit = 100; // Fetch 100 jobs per request
      let hasMore = true;
      
      while (hasMore) {
        const url = `${this.baseUrl}/catalog/datasets/${this.dataset}/records`;
        
        const params = {
          limit: limit,
          offset: offset,
          timezone: 'UTC'
        };
        
        console.log(`📥 Fetching BPCE jobs: offset ${offset}, limit ${limit}`);
        
        const response = await axios.get<BPCEApiResponse>(url, {
          params,
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (!response.data || !response.data.results) {
          throw new Error('Invalid response structure from BPCE API');
        }
        
        const records = response.data.results;
        const totalCount = response.data.total_count;
        
        console.log(`📄 BPCE API response: ${records.length} records (${offset + 1}-${offset + records.length} of ${totalCount})`);
        
        if (records.length === 0) {
          hasMore = false;
          break;
        }
        
        // Process each job record
        for (const record of records) {
          const job = this.extractJobData(record);
          
          if (job && this.isValidJob(job)) {
            allJobs.push(job);
          }
        }
        
        // Check if we should continue fetching
        offset += limit;
        hasMore = records.length === limit && offset < totalCount;
        
        // Safety check to prevent infinite loops
        if (offset > 10000) {
          console.log('⚠️ BPCE: Reached safety limit of 10,000 records, stopping pagination');
          break;
        }
        
        // Rate limiting: small delay between requests
        if (hasMore) {
          await this.delay(300); // 300ms delay
        }
      }
      
      // Remove duplicates
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      if (uniqueJobs.length === 0) {
        throw new Error('No valid jobs found in BPCE API response');
      }
      
      console.log(`✅ BPCE: Successfully scraped ${uniqueJobs.length} unique jobs`);
      return uniqueJobs;
      
    } catch (error) {
      console.error('❌ Error scraping BPCE:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          console.error('Rate limit exceeded for BPCE API');
        } else if (error.response && error.response.status >= 400) {
          console.error(`BPCE API error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.code === 'ECONNABORTED') {
          console.error('BPCE API request timeout');
        } else if (!error.response) {
          console.error('Network error - no response received from BPCE API');
        }
      }
      
      // Re-throw the error instead of returning fallback data
      throw new Error(`BPCE scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private extractJobData(record: BPCEJobRecord): ScrapedJob {
    // Generate unique ID from reference number or create one
    const jobId = record.referencenumber ? 
      `bpce-${record.referencenumber}` : 
      `bpce-${this.generateHashId(record.title, record.city, record.lastmodifieddate)}`;
    
    // Format location from city and state
    const location = this.formatLocation(record.city, record.state);
    
    // Parse the date
    const publishDate = this.formatDate(record.lastmodifieddate);
    
    // Clean and truncate description
    const description = this.cleanDescription(record.description);
    
    // For BPCE jobs, include the actual hiring company in the job title
    const actualCompany = record.organization || record.company;
    const enhancedJobTitle = actualCompany && actualCompany !== 'Groupe BPCE' 
      ? `${this.cleanText(record.title)} - ${actualCompany}`
      : this.cleanText(record.title);

    // ✅ TESTER D'ABORD LE CHAMP URL DE L'API
    const bpceUrl = this.getBPCEUrl(record);
    
    return {
      id: jobId,
      companyName: 'BPCE', // Always use BPCE as the source
      jobTitle: enhancedJobTitle, // Include actual company in job title
      location: location,
      publishDate: publishDate,
      url: bpceUrl, // ✅ Utilise maintenant l'URL BPCE au lieu de l'URL externe
      source: 'bpce-opendata',
      description: description,
      contractType: record.jobtype || 'CDI'
    };
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Essaie d'utiliser l'URL de l'API ou construit une URL BPCE
   */
  private getBPCEUrl(record: BPCEJobRecord): string {
    // Option 1: Vérifier si le champ 'url' pointe vers recrutement.bpce.fr
    if (record.url && record.url.includes('recrutement.bpce.fr')) {
      console.log(`✅ URL BPCE directe trouvée: ${record.url}`);
      return record.url;
    }
    
    // Option 2: Vérifier le champ apply_url (au cas où)
    if (record.apply_url && record.apply_url.includes('recrutement.bpce.fr')) {
      console.log(`✅ Apply URL BPCE trouvée: ${record.apply_url}`);
      return record.apply_url;
    }
    
    // Option 3: Construire l'URL nous-mêmes (fallback)
    console.log(`⚠️ Aucune URL BPCE directe, construction pour: ${record.title}`);
    return this.buildBPCEUrl(record);
  }

  /**
   * ✅ Construit l'URL vers la page BPCE officielle (fallback)
   * Format simple observé : https://recrutement.bpce.fr/job/[slug-du-titre]
   * Exemple : https://recrutement.bpce.fr/job/application-production-support-equities
   */
  private buildBPCEUrl(record: BPCEJobRecord): string {
    const baseUrl = 'https://recrutement.bpce.fr/job';
    
    // Créer un slug simple à partir du titre uniquement
    const titleSlug = this.createSlug(record.title);
    
    return `${baseUrl}/${titleSlug}`;
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Crée un slug URL-friendly à partir d'un texte
   */
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[àáâäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôöø]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^\w\s-]/g, '') // Supprime les caractères spéciaux
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Supprime les tirets multiples
      .replace(/^-|-$/g, ''); // Supprime les tirets en début/fin
  }
  
  private formatLocation(city: string, state: string): string {
    if (city && state) {
      return `${city} (${state})`;
    } else if (city) {
      return city;
    } else if (state) {
      return state;
    } else {
      return 'France';
    }
  }
  
  private formatDate(dateString: string): string {
    if (!dateString) {
      return new Date().toISOString().split('T')[0];
    }
    
    try {
      // Handle the format "07/08/2025 6:10:05 AM"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }
  
  private cleanDescription(description: string): string | undefined {
    if (!description) return undefined;
    
    return this.cleanText(description).substring(0, 200);
  }
  
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^[-•·\s]+/, '') // Remove leading bullets and spaces
      .trim();
  }
  
  private generateHashId(title: string, city: string, date: string): string {
    const baseString = `${title}-${city}-${date}`.toLowerCase();
    
    // Simple hash function for consistent IDs
    let hash = 0;
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString();
  }
  
  private isValidJob(job: ScrapedJob): boolean {
    // Validate essential job information
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
      // Create a unique key based on title, company, and location
      const key = `${job.jobTitle.toLowerCase()}-${job.companyName.toLowerCase()}-${job.location.toLowerCase()}`;
      
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