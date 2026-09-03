import dns from 'dns';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Ignore if custom DNS cannot be set
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

const connectDatabase = async (attempt = 1) => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MongoDB Atlas connection string not found. Please configure backend/.env.');
    process.exit(1);
  }

  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    logger.error('Local MongoDB URI detected. MSEC Parent Connect requires MongoDB Atlas. Update MONGODB_URI in backend/.env.');
    process.exit(1);
  }

  if (attempt === 1) {
    logger.info('Connecting to MongoDB Atlas...');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    const dbName = conn.connection.name;
    const host = conn.connection.host;

    logger.info('MongoDB Atlas Connected Successfully');
    logger.info(`Database Name: ${dbName}`);
    logger.info(`Host: ${host}`);

    await verifyCollections();

    return true;
  } catch (error) {
    logger.error(`MongoDB Atlas connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);

    if (error.message.includes('authentication') || error.message.includes('auth')) {
      logger.error('Atlas authentication failed. Verify username and password.');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      logger.error('Atlas rejected the connection. Verify Network Access whitelist.');
    } else if (error.message.includes('DNS') || error.message.includes('resolve')) {
      logger.error('Unable to resolve MongoDB Atlas cluster.');
    } else if (error.message.includes('timeout') || error.message.includes('SSL')) {
      logger.error('Network timeout. Check your network connection and Atlas cluster status.');
    }

    if (attempt < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDatabase(attempt + 1);
    }

    return false;
  }
};

const verifyCollections = async () => {
  const requiredCollections = [
    'students',
    'attendance',
    'messagetemplates',
    'notificationhistories',
    'settings',
    'whatsappsessions',
  ];

  const db = mongoose.connection.db;
  const existing = await db.listCollections().toArray();
  const existingNames = existing.map((c) => c.name.toLowerCase());

  for (const name of requiredCollections) {
    if (!existingNames.includes(name)) {
      await db.createCollection(name);
      logger.info(`   Created collection: ${name}`);
    }
  }

  logger.info('   Collections Ready');
};

export default connectDatabase;
