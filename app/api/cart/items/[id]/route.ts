import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Cart from '@/models/Cart';
import CartItem from '@/models/CartItem';
import Product from '@/models/Product';

// Ensure models are loaded
import '@/models/User';

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await connectToDB();
    
    const { quantity } = await request.json();
    const { id: itemId } = await context.params;
    
    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }
    
    // Find and update the cart item
    const updatedItem = await CartItem.findByIdAndUpdate(
      itemId,
      { $set: { quantity } },
      { new: true, runValidators: true }
    ).populate({
      path: 'product',
      model: 'Product'
    });
    
    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Update the cart's total
    const cart = await Cart.findById(updatedItem.cart).populate({
      path: 'items',
      populate: { 
        path: 'product',
        model: 'Product'
      }
    });
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }
    
    // Calculate new total and item count
    cart.total = cart.items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.price),
      0
    );
    
    cart.itemCount = cart.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    
    await cart.save();
    
    return NextResponse.json({
      success: true,
      item: updatedItem,
      cart: {
        total: cart.total,
        itemCount: cart.itemCount
      }
    });
    
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}
