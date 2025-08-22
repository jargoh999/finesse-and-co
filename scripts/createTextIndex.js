const mongoose = require('mongoose');
const dbConnect = require('../lib/dbConnect');
const Product = require('../models/Product');

async function createTextIndex() {
  try {
    await dbConnect();
    
    // Drop existing text index if it exists
    try {
      await Product.collection.dropIndex('title_text_description_text');
      console.log('Dropped existing text index');
    } catch (error) {
      console.log('No existing text index to drop');
    }
    
    // Create new text index
    await Product.collection.createIndex(
      { title: 'text', description: 'text' },
      { name: 'title_text_description_text', weights: { title: 2, description: 1 } }
    );
    
    console.log('Created text index on title and description fields');
    
    // Verify the index was created
    const indexes = await Product.collection.indexes();
    const textIndexes = indexes.filter(index => index.textIndexVersion);
    console.log('Current text indexes:', textIndexes);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating text index:', error);
    process.exit(1);
  }
}

createTextIndex();
