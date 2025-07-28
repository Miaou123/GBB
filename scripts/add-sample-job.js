// scripts/add-sample-job.js
require('dotenv').config({ path: '.env.local' }); // Load environment variables
const { MongoClient } = require('mongodb');

async function addSampleJob() {
  console.log('🔍 Adding sample job to database...');
  
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
    const collection = db.collection('jobs'); // Note: using 'jobs' to match your Atlas collection
    
    const sampleJob = {
      id: 'sample-1',
      companyName: 'Database Test Company',
      jobTitle: 'Database Test Job',
      location: 'Paris',
      publishDate: '2024-01-28',
      url: 'https://example.com/test-job',
      source: 'manual',
      scrapedAt: new Date(),
      isActive: true
    };
    
    const result = await collection.insertOne(sampleJob);
    console.log('✅ Sample job added with ID:', result.insertedId);
    
    // Check total count
    const count = await collection.countDocuments();
    console.log('📊 Total jobs in collection:', count);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

addSampleJob();