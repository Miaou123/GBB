// scripts/test-infomil-scraper.ts
import { InfomilScraper } from '../lib/scrapers/infomilScraper';
import { ScraperService } from '../lib/services/scraperService';

async function testInfomilScraper() {
  console.log('🧪 Testing Infomil Scraper...');
  
  try {
    // Test direct scraper
    console.log('\n1. Testing InfomilScraper directly:');
    const infomilScraper = new InfomilScraper();
    const directJobs = await infomilScraper.scrapeJobs();
    
    console.log(`✅ Direct scraper found ${directJobs.length} jobs`);
    if (directJobs.length > 0) {
      console.log('Sample job:', {
        title: directJobs[0].jobTitle,
        location: directJobs[0].location,
        url: directJobs[0].url,
        publishDate: directJobs[0].publishDate
      });
    }
    
    // Test with ScraperService
    console.log('\n2. Testing ScraperService with Infomil:');
    const scraperService = new ScraperService();
    const serviceJobs = await scraperService.scrapeCompany('Infomil');
    
    console.log(`✅ ScraperService found ${serviceJobs.length} jobs`);
    if (serviceJobs.length > 0) {
      console.log('Sample job:', {
        title: serviceJobs[0].jobTitle,
        location: serviceJobs[0].location,
        url: serviceJobs[0].url,
        publishDate: serviceJobs[0].publishDate,
        isActive: serviceJobs[0].isActive
      });
    }
    
    // Test URL extraction
    console.log('\n3. Checking URL patterns:');
    const jobsWithRealUrls = directJobs.filter(job => 
      job.url.includes('/search') === false && job.url.includes('gestmax.fr')
    );
    console.log(`Jobs with real detail URLs: ${jobsWithRealUrls.length}/${directJobs.length}`);
    
    if (jobsWithRealUrls.length > 0) {
      console.log('Real URL examples:');
      jobsWithRealUrls.slice(0, 3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.jobTitle} -> ${job.url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testInfomilScraper();
}

export { testInfomilScraper };