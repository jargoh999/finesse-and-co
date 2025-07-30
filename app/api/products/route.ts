import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { Types } from 'mongoose';

type ProductData = {
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  rating?: number;
  numReviews?: number;
  isFeatured?: boolean;
  details?: Record<string, any>;
};

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '12');
    const page = parseInt(searchParams.get('page') || '1');
    
    const query: any = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Parse JSON data
    const productData = await request.json();
    console.log('Received product data:', productData);
    
    // Validate required fields
    if (!productData.title || !productData.description || productData.price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate images
    if (!Array.isArray(productData.images) || productData.images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one image is required' },
        { status: 400 }
      );
    }
    
    console.log('Creating product with data:', productData);
    
    const product = new Product({
      title: productData.title,
      description: productData.description,
      price: parseFloat(productData.price) || 0,
      category: productData.category || 'clothing',
      stock: parseInt(productData.stock) || 0,
      images: productData.images
    });
    
    await product.save();
    
    console.log('Product created successfully:', product);
    
    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating product' },
      { status: 500 }
    );
  }
}
