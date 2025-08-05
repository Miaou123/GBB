// scripts/cleanup-duplicates.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function cleanupDuplicates() {
  console.log('🧹 Starting duplicate cleanup...');
  
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
    
    // Get initial count
    const initialCount = await collection.countDocuments();
    console.log(`📊 Initial count: ${initialCount} jobs`);
    
    // Find duplicates based on company, title, and location
    const pipeline = [
      {
        $group: {
          _id: {
            companyName: "$companyName",
            jobTitle: "$jobTitle",
            location: "$location"
          },
          docs: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ];
    
    const duplicates = await collection.aggregate(pipeline).toArray();
    console.log(`🔍 Found ${duplicates.length} sets of duplicates`);
    
    let deletedCount = 0;
    
    for (const duplicate of duplicates) {
      // Keep the first document, delete the rest
      const docsToDelete = duplicate.docs.slice(1);
      
      if (docsToDelete.length > 0) {
        const result = await collection.deleteMany({
          _id: { $in: docsToDelete }
        });
        deletedCount += result.deletedCount;
        
        console.log(`🗑️  Deleted ${result.deletedCount} duplicates for: ${duplicate._id.companyName} - ${duplicate._id.jobTitle}`);
      }
    }
    
    console.log(`✅ Cleanup complete: ${deletedCount} duplicate jobs removed`);
    
    // Get final count
    const finalCount = await collection.countDocuments();
    console.log(`📊 Total jobs remaining: ${finalCount}`);
    console.log(`📈 Reduction: ${initialCount - finalCount} jobs removed (${((initialCount - finalCount) / initialCount * 100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

cleanupDuplicates();