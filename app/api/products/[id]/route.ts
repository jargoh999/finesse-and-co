import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { Types } from 'mongoose';
import { uploadImage } from '@/lib/cloudinary';

type Params = {
  params: {
    id: string;
  };
};

export async function PUT(
  request: Request,
  { params }: Params
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    let productData;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const existingProduct = await Product.findById(id);
      
      if (!existingProduct) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Get existing images from the form data
      const existingImages = JSON.parse(formData.get('existingImages') as string || '[]') as string[];
      const imageFiles = formData.getAll('images') as File[];
      const uploadedImages = [...existingImages];
      
      // Upload new images to Cloudinary
      for (const file of imageFiles) {
        if (file instanceof File) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            const dataUri = `data:${file.type};base64,${base64Data}`;
            
            const uploadResult = await uploadImage(dataUri);
            uploadedImages.push(uploadResult.url);
          } catch (error) {
            console.error('Error uploading image:', error);
            // Continue with other images even if one fails
          }
        }
      }
      
      // Get other form data
      productData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string) || 0,
        category: formData.get('category') as string || 'clothing',
        stock: parseInt(formData.get('stock') as string) || 0,
        images: uploadedImages,
        rating: parseFloat(formData.get('rating') as string) || 0,
        numReviews: parseInt(formData.get('numReviews') as string) || 0,
        isFeatured: formData.get('isFeatured') === 'true',
        details: formData.get('details') ? JSON.parse(formData.get('details') as string) : {}
      };
    } else {
      // Handle JSON data
      const jsonData = await request.json();
      productData = {
        ...jsonData,
        price: parseFloat(jsonData.price) || 0,
        stock: parseInt(jsonData.stock) || 0,
        rating: parseFloat(jsonData.rating) || 0,
        numReviews: parseInt(jsonData.numReviews) || 0,
        isFeatured: Boolean(jsonData.isFeatured),
        details: jsonData.details || {}
      };
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: productData },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedProduct
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating product' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Convert _id to string and ensure proper typing
    const productObj = product as any;
    const result = {
      ...productObj,
      _id: productObj._id.toString(),
      id: productObj._id.toString(),
    };
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Delete images from Cloudinary
    // Note: If you store public_ids in your database, you can delete them here
    // For now, we'll just delete the product
    
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting product' },
      { status: 500 }
    );
  }
}
