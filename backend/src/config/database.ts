import dns from 'dns';
import mongoose from 'mongoose';

// Ensure SRV records resolve cleanly on Windows / corporate DNS configurations
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in environments where custom DNS servers cannot be set
}

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Configure backend/.env first.');
  }

  await mongoose.connect(uri, {
    dbName: 'flexora',
  });
  console.log('✅ Connected to MongoDB Atlas');
}
