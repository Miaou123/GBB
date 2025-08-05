// scripts/clean-database.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'GBB';
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('jobs');
    
    // Show current state
    console.log('\n📊 Current database state:');
    const totalJobs = await collection.countDocuments();
    const activeJobs = await collection.countDocuments({ isActive: true });
    const inactiveJobs = await collection.countDocuments({ isActive: false });
    
    console.log(`   - Total jobs: ${totalJobs}`);
    console.log(`   - Active jobs: ${activeJobs}`);
    console.log(`   - Inactive jobs: ${inactiveJobs}`);
    
    // Show jobs by company
    const jobsByCompany = await collection.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$companyName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📋 Active jobs by company:');
    jobsByCompany.forEach(company => {
      console.log(`   - ${company._id}: ${company.count} jobs`);
    });
    
    // Options for what to clean
    console.log('\n🔧 Cleanup options:');
    console.log('1. Remove ALL Estreem jobs (recommended for fixing ID issue)');
    console.log('2. Remove only INACTIVE jobs (all companies)');
    console.log('3. Remove duplicate jobs (same title + location + company)');
    console.log('4. Show Estreem job IDs (diagnostic)');
    console.log('5. Exit without changes');
    
    // For now, let's implement option 1 (most needed)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nChoose an option (1-5): ', async (answer) => {
      try {
        switch (answer) {
          case '1':
            await cleanEstreemJobs(collection);
            break;
          case '2':
            await cleanInactiveJobs(collection);
            break;
          case '3':
            await cleanDuplicateJobs(collection);
            break;
          case '4':
            await showEstreemJobs(collection);
            break;
          case '5':
            console.log('👋 Exiting without changes');
            break;
          default:
            console.log('❌ Invalid option');
        }
      } catch (error) {
        console.error('❌ Error during cleanup:', error);
      } finally {
        rl.close();
        await client.close();
        console.log('🔌 Database connection closed');
      }
    });
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    await client.close();
  }
}

async function cleanEstreemJobs(collection) {
  console.log('\n🧹 Removing ALL Estreem jobs...');
  
  const estreemJobs = await collection.countDocuments({ companyName: 'Estreem' });
  console.log(`   Found ${estreemJobs} Estreem jobs to remove`);
  
  if (estreemJobs > 0) {
    const result = await collection.deleteMany({ companyName: 'Estreem' });
    console.log(`✅ Deleted ${result.deletedCount} Estreem jobs`);
    console.log('💡 Next scrape will use consistent IDs and avoid duplicates');
  } else {
    console.log('ℹ️ No Estreem jobs found to remove');
  }
}

async function cleanInactiveJobs(collection) {
  console.log('\n🧹 Removing inactive jobs from all companies...');
  
  const inactiveJobs = await collection.countDocuments({ isActive: false });
  console.log(`   Found ${inactiveJobs} inactive jobs to remove`);
  
  if (inactiveJobs > 0) {
    const result = await collection.deleteMany({ isActive: false });
    console.log(`✅ Deleted ${result.deletedCount} inactive jobs`);
  } else {
    console.log('ℹ️ No inactive jobs found to remove');
  }
}

async function cleanDuplicateJobs(collection) {
  console.log('\n🧹 Finding and removing duplicate jobs...');
  
  // Find duplicates based on company + title + location
  const duplicates = await collection.aggregate([
    {
      $group: {
        _id: {
          companyName: '$companyName',
          jobTitle: '$jobTitle',
          location: '$location'
        },
        ids: { $push: '$_id' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  console.log(`   Found ${duplicates.length} sets of duplicate jobs`);
  
  let totalDeleted = 0;
  for (const duplicate of duplicates) {
    // Keep the first job, remove the rest
    const idsToDelete = duplicate.ids.slice(1);
    const result = await collection.deleteMany({
      _id: { $in: idsToDelete }
    });
    totalDeleted += result.deletedCount;
    
    console.log(`   - Removed ${result.deletedCount} duplicates of "${duplicate._id.jobTitle}"`);
  }
  
  console.log(`✅ Total duplicates removed: ${totalDeleted}`);
}

async function showEstreemJobs(collection) {
  console.log('\n🔍 Estreem jobs in database:');
  
  const estreemJobs = await collection.find({ companyName: 'Estreem' })
    .sort({ isActive: -1, scrapedAt: -1 })
    .toArray();
  
  if (estreemJobs.length === 0) {
    console.log('   No Estreem jobs found');
    return;
  }
  
  console.log(`   Found ${estreemJobs.length} Estreem jobs:`);
  estreemJobs.forEach((job, index) => {
    const status = job.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE';
    const date = job.scrapedAt ? job.scrapedAt.toISOString().split('T')[0] : 'N/A';
    console.log(`   ${index + 1}. ${status} ${job.jobTitle}`);
    console.log(`      ID: ${job.id}`);
    console.log(`      Scraped: ${date}`);
    console.log('');
  });
}

// Run the cleanup
cleanDatabase();