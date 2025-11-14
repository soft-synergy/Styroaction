import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import AdminModel from '../src/models/Admin';

// Load environment variables from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styrtoaction';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const args = process.argv.slice(2);
    const username = args[0] || 'admin';
    const email = args[1] || 'admin@styrtoaction.pl';
    const password = args[2] || 'admin123';

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ 
      $or: [{ username }, { email }] 
    });
    if (existingAdmin) {
      console.log('❌ Admin with this username or email already exists');
      console.log(`Existing admin: ${existingAdmin.username} (${existingAdmin.email})`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const admin = new AdminModel({
      username,
      email,
      password,
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Check your MongoDB connection string and network access');
      console.error('💡 Make sure your IP is whitelisted in MongoDB Atlas');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createAdmin();

