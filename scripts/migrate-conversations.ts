import dbConnect from '@/lib/mongodb';
import { PrivateUser } from '@/lib/models';

async function migrateUserConversations() {
  try {
    await dbConnect();

    // Find all users who don't have conversations field or have empty conversations
    const users = await PrivateUser.find({
      $or: [
        { conversations: { $exists: false } },
        { conversations: { $size: 0 } }
      ]
    });

    console.log(`Found ${users.length} users to migrate`);

    // For now, we'll just initialize empty conversations arrays
    // In a real migration, you might need to reconstruct conversations from existing data
    for (const user of users) {
      if (!user.conversations) {
        user.conversations = [];
        await user.save();
        console.log(`Initialized conversations for user: ${user.email}`);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserConversations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateUserConversations };
