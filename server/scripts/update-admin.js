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

const AdminModel = mongoose.model('Admin', AdminSchema);

async function updateAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const args = process.argv.slice(2);
    const username = args[0] || 'admin';
    const email = args[1];
    const password = args[2];

    if (!email || !password) {
      console.error('❌ Usage: node update-admin.js <username> <email> <password>');
      process.exit(1);
    }

    console.log(`\n📝 Updating admin:`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${'*'.repeat(password.length)}\n`);

    // Find admin by username
    const admin = await AdminModel.findOne({ username });
    if (!admin) {
      console.error(`❌ Admin with username "${username}" not found`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update admin
    admin.email = email;
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Admin updated successfully!');
    console.log(`\n📋 Updated admin details:`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${admin._id}\n`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating admin:', error.message);
    if (error.code === 11000) {
      console.error('\n💡 Admin with this email already exists');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

updateAdmin();

