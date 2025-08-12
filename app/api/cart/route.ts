import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/lib/mongoose';
import { Cart }  from '@/models/Cart';
import User from '@/models/User';
import { CartStatus } from '@/models/Cart';

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const { action, productId, quantity = 1, userInfo } = await req.json();

    if (!userInfo?.email || !userInfo?.phone) {
      return NextResponse.json(
        { error: 'User information is required' },
        { status: 400 }
      );
    }

    // Find or create user
    const user  = await User.findOrCreate({
      email: userInfo.email,
      phone: userInfo.phone,
      name: userInfo.name
    });

    // Get or create active cart for user
    const cart = await Cart.getOrCreateActiveCart(user._id);

    switch (action) {
      case 'add':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required' },
            { status: 400 }
          );
        }

        // In a real app, you'd fetch the product price from the database
        // For now, we'll use a placeholder price
        const price = 0; // You'd fetch this from your product database

        await cart.addItem(productId, quantity, price);
        break;

      case 'remove':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required' },
            { status: 400 }
          );
        }

        // Find the cart item to remove
        const { CartItem } = await import('@/models/CartItem');
        const item = await CartItem.findOne({
          cart: cart._id,
          product: productId
        });

        if (item) {
          await cart.removeItem(item._id);
        }
        break;

      case 'update':
        if (!productId || !quantity) {
          return NextResponse.json(
            { error: 'Product ID and quantity are required' },
            { status: 400 }
          );
        }

        // Find the cart item to update
        const { CartItem: CartItemForUpdate } = await import('@/models/CartItem');
        const itemToUpdate = await CartItemForUpdate.findOne({
          cart: cart._id,
          product: productId
        });

        if (itemToUpdate) {
          await cart.updateItemQuantity(itemToUpdate._id, quantity);
        }
        break;

      case 'clear':
        // Clear all items from cart
        cart.items = [];
        await cart.save();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          model: 'Product'
        }
      })
      .populate('user');

    return NextResponse.json({
      success: true,
      cart: updatedCart
    });

  } catch (error) {
    console.error('Cart API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Find user by contact info
    const user = await User.findOne({
      email: email.toLowerCase(),
      phone
    });

    if (!user) {
      return NextResponse.json({
        hasPreviousCarts: false,
        cart: null
      });
    }

    // Get active cart or most recent cart
    let cart = await Cart.findOne({
      user: user._id,
      status: CartStatus.ACTIVE
    })
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          model: 'Product'
        }
      });

    // If no active cart, get the most recent cart
    if (!cart) {
      cart = await Cart.findOne({ user: user._id })
        .sort({ updatedAt: -1 })
        .populate({
          path: 'items',
          populate: {
            path: 'product',
            model: 'Product'
          }
        });
    }

    // Check if user has previous carts
    const hasPreviousCarts = await Cart.exists({
      user: user._id,
      _id: { $ne: cart?._id }
    });

    return NextResponse.json({
      hasPreviousCarts,
      cart,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Get Cart Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
