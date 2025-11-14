require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styrtoaction';

// Admin Schema
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const AdminModel = mongoose.model('Admin', AdminSchema);

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const args = process.argv.slice(2);
    const username = args[0] || 'admin';
    const email = args[1] || 'admin@styrtoaction.pl';
    const password = args[2] || 'admin123';

    console.log(`\n📝 Creating admin with:`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${'*'.repeat(password.length)}\n`);

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ 
      $or: [{ username }, { email }] 
    });
    if (existingAdmin) {
      console.log('❌ Admin with this username or email already exists');
      console.log(`   Existing admin: ${existingAdmin.username} (${existingAdmin.email})`);
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
    console.log(`\n📋 Admin details:`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${admin._id}\n`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check your MongoDB connection string in .env file');
      console.error('   2. Make sure your IP is whitelisted in MongoDB Atlas');
      console.error('   3. Check network connectivity');
      console.error('   4. Verify username and password are correct');
    }
    if (error.code === 11000) {
      console.error('\n💡 Admin with this username or email already exists');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createAdmin();

