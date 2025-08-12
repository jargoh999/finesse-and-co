import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';

type CategoryWithImage = {
  name: string;
  image: string;
  count: number;
};

export async function GET() {
  try {
    await dbConnect();
    
    // Get all unique categories from the database with their latest product image
    const categories = await Product.aggregate([
      {
        $sort: { createdAt: -1 } // Sort by newest first
      },
      {
        $group: {
          _id: '$category',
          name: { $first: '$category' },
          image: { $first: { $arrayElemAt: ['$images', 0] } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: 1,
          image: 1,
          count: 1
        }
      },
      {
        $sort: { name: 1 } // Sort categories alphabetically
      }
    ]);
    
    return NextResponse.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching categories' },
      { status: 500 }
    );
  }
}
