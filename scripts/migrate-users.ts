import mongoose from 'mongoose';
import dbConnect from '../lib/mongodb';
import { PrivateUser } from '../lib/models';

interface LegacyUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

async function migrateUsers() {
  try {
    await dbConnect();

    console.log('Starting user migration...');

    // Connect to the legacy user collection
    const legacyUserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
    }, {
      timestamps: true,
      collection: 'user' // Explicitly use the 'user' collection
    });

    const LegacyUser = mongoose.models.LegacyUser || mongoose.model('LegacyUser', legacyUserSchema);

    // Find all users in the legacy collection
    const legacyUsers = await LegacyUser.find({});

    console.log(`Found ${legacyUsers.length} users to migrate`);

    for (const legacyUser of legacyUsers) {
      // Check if user already exists in PrivateUser collection
      const existingUser = await PrivateUser.findOne({ email: legacyUser.email });

      if (!existingUser) {
        // Create new PrivateUser
        const newUser = new PrivateUser({
          name: legacyUser.name,
          email: legacyUser.email,
          password: legacyUser.password,
          createdAt: legacyUser.createdAt,
          updatedAt: legacyUser.updatedAt,
        });

        await newUser.save();
        console.log(`Migrated user: ${legacyUser.email}`);
      } else {
        console.log(`User already exists: ${legacyUser.email}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUsers();
}

export default migrateUsers;
