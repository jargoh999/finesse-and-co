#!/usr/bin/env node

const mongoose = require('mongoose');

// Simple test script to verify the chat system is working
async function testChatSystem() {
  console.log('🧪 Testing Personal Chat System...\n');

  try {
    // Check environment
    console.log('1. Checking environment...');
    const mongoUri = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      console.log('   Please set it in your .env.local file');
      return;
    }

    if (!jwtSecret) {
      console.error('❌ JWT_SECRET environment variable is not set');
      console.log('   Please set it in your .env.local file');
      return;
    }

    console.log('✅ Environment variables are set');

    // Test database connection
    console.log('\n2. Testing database connection...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('\n3. Checking collections...');
    console.log('Found collections:', collectionNames.join(', '));

    if (!collectionNames.includes('privateusers')) {
      console.log('⚠️  PrivateUser collection not found');
      console.log('   You may need to register users first');
    } else {
      const userCount = await mongoose.connection.db.collection('privateusers').countDocuments();
      console.log(`✅ Found ${userCount} users in database`);

      if (userCount < 2) {
        console.log('⚠️  Need at least 2 users for chat to work');
        console.log('   Please register another user via /register');
      }
    }

    if (!collectionNames.includes('conversations')) {
      console.log('⚠️  Conversations collection not found');
    } else {
      const convCount = await mongoose.connection.db.collection('conversations').countDocuments();
      console.log(`✅ Found ${convCount} conversations`);
    }

    if (!collectionNames.includes('messages')) {
      console.log('⚠️  Messages collection not found');
    } else {
      const msgCount = await mongoose.connection.db.collection('messages').countDocuments();
      console.log(`✅ Found ${msgCount} messages`);
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Register at least 2 users via /register');
    console.log('3. Open browser console to see detailed logs');
    console.log('4. Try sending a message and check console for errors');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if MongoDB is running');
    console.log('2. Verify MONGODB_URI in .env.local');
    console.log('3. Check JWT_SECRET in .env.local');
    console.log('4. Try restarting the development server');
  } finally {
    await mongoose.disconnect();
  }
}

testChatSystem();
