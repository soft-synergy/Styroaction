import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AnalyticsEvent from '../src/models/AnalyticsEvent';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styrtoaction';

async function resetAnalytics() {
  try {
    console.log('🔄 Resetting analytics events...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    const totalBefore = await AnalyticsEvent.countDocuments();
    if (totalBefore === 0) {
      console.log('✅ No analytics events found. Nothing to delete.');
      return;
    }

    const result = await AnalyticsEvent.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} analytics events (previously ${totalBefore}).`);
  } catch (error) {
    console.error('❌ Failed to reset analytics events:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

resetAnalytics();


