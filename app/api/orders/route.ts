import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import User from '@/models/User';
import { CartStatus } from '@/models/Cart';

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    
    const { userInfo, shippingInfo, paymentMethod } = await req.json();

    // Validate required fields
    if (!userInfo?.email || !shippingInfo) {
      return NextResponse.json(
        { error: 'User information and shipping details are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: userInfo.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find user's active cart with populated items and their products
    const cart = await Cart.findOne({
      user: user._id,
      status: CartStatus.ACTIVE
    })
    .populate({
      path: 'items',
      model: 'CartItem',
      populate: {
        path: 'product',
        model: 'Product',
        select: '_id title price images specifications',
        match: { _id: { $exists: true } }
      }
    });

    // Filter out any items where product population failed
    if (cart) {
      cart.items = cart.items.filter((item: any) => item?.product?._id);
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'No active cart found or cart is empty' },
        { status: 404 }
      );
    }

    // Verify all cart items have valid products
    if (!cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Your cart is empty. Please add items to your cart before checking out.' },
        { status: 400 }
      );
    }

    const invalidItems = cart.items.filter((item: any) => !item?.product?._id);
    if (invalidItems.length > 0) {
      console.error('Invalid cart items found:', invalidItems);
      return NextResponse.json(
        { 
          error: 'Some items in your cart are no longer available.',
          details: 'Please update your cart and try again.',
          invalidItems: invalidItems.map((item: any) => ({
            itemId: item._id,
            productId: item.product?._id || 'unknown',
            reason: item.product ? 'Product not found' : 'Invalid product reference'
          }))
        },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const itemCount = cart.items.reduce((sum: number, item: any) => {
      return sum + item.quantity;
    }, 0);

    // Log cart items for debugging
    console.log('Cart items before processing:', JSON.stringify(cart.items, null, 2));

    // Prepare order items
    const orderItems = cart.items.map((item: any) => {
      console.log('Processing cart item:', JSON.stringify(item, null, 2));
      
      const product = item.product;
      if (!product?._id) {
        console.error('Invalid product in cart item:', item);
        throw new Error('Invalid product in cart');
      }
      
      return {
        product: product._id,
        name: product.title || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        image: (product.images && product.images[0]) || null,
        specifications: item.specifications || {}
      };
    });

    // Create order
    const order = new Order({
      user: cart.user,
      items: orderItems,
      subtotal,
      total: subtotal, // Add shipping costs if any
      itemCount,
      status: 'pending',
      shippingInfo,
      paymentInfo: {
        method: paymentMethod || 'on_delivery',
        status: paymentMethod === 'on_delivery' ? 'pending' : 'completed',
        amountPaid: subtotal,
        paidAt: paymentMethod !== 'on_delivery' ? new Date() : undefined
      }
    });

    try {
      await order.save();
      
      // Update cart status to COMPLETED and clear items
      cart.status = CartStatus.COMPLETED;
      cart.items = [];
      cart.itemCount = 0;
      cart.total = 0;
      await cart.save();

      return NextResponse.json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    } catch (error: any) {
      console.error('Error saving order or updating cart:', error);
      // If we fail to save the order, we should delete it to avoid orphaned orders
      if (order._id) {
        await Order.findByIdAndDelete(order._id).catch(console.error);
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    // Find the user by email and phone
    const user = await User.findOne({ email, phone });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find orders by user ID and populate necessary fields
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.product',
        select: 'title price images',
      });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}
