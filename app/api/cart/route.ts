import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDB from '@/lib/mongoose';

// Import enums
import Cart, { CartStatus } from '@/models/Cart';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    // Import models inside the function to avoid top-level await
    const Cart = mongoose.models.Cart || (await import('@/models/Cart')).default;
    const CartItem = mongoose.models.CartItem || (await import('@/models/CartItem')).default;
    const User = mongoose.models.User || (await import('@/models/User')).default;
    const Product = mongoose.models.Product || (await import('@/models/Product')).default;

    const { action, productId, quantity = 1, userInfo } = await req.json();

    if (!userInfo?.email || !userInfo?.phone) {
      return NextResponse.json(
        { error: 'User information is required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await User.findOne({
      email: userInfo.email,
      phone: userInfo.phone
    });

    if (!user) {
      user = new User({
        email: userInfo.email,
        phone: userInfo.phone,
        name: userInfo.name || 'Customer'
      });
      await user.save();
    }

    // Find or create active cart for user
    let cart = await Cart.findOne({
      user: user._id,
      status: CartStatus.ACTIVE
    });

    if (!cart) {
      cart = new Cart({
        user: user._id,
        status: CartStatus.ACTIVE,
        items: [],
        total: 0,
        itemCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
      await cart.save();
    }

    switch (action) {
      case 'add':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required' },
            { status: 400 }
          );
        }

        // Fetch the product to get its price
        const product = await Product.findById(productId);

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        // Check if item already exists in cart
        const existingItem = await CartItem.findOne({
          cart: cart._id,
          product: productId
        });

        if (existingItem) {
          // Update quantity if item exists
          existingItem.quantity += quantity;
          await existingItem.save();
        } else {
          // Create new cart item
          const newItem = new CartItem({
            cart: cart._id,
            product: productId,
            quantity,
            price: product.price
          });
          await newItem.save();

          // Add to cart's items array
          cart.items.push(newItem._id);
          await cart.save();
        }

        // Refresh the cart with populated items for the response
        const updatedCartData = await Cart.findById(cart._id)
          .populate({
            path: 'items',
            populate: { path: 'product' }
          });

        // Update the cart reference
        if (updatedCartData) {
          cart = updatedCartData;
        }
        break;

      case 'remove':
        if (!productId) {
          return NextResponse.json(
            { error: 'Cart item ID is required' },
            { status: 400 }
          );
        }

        // Find the cart item by its ID
        const item = await CartItem.findById(productId);

        if (!item) {
          return NextResponse.json(
            { error: 'Cart item not found' },
            { status: 404 }
          );
        }

        // Remove the item from the cart's items array
        cart.items = cart.items.filter((itemId: mongoose.Types.ObjectId | string) =>
          itemId.toString() !== productId
        );
        await cart.save();

        // Delete the cart item
        await CartItem.findByIdAndDelete(productId);

        // Refresh the cart with populated items for the response
        const populatedCart = await Cart.findById(cart._id).populate({
          path: 'items',
          populate: { path: 'product' }
        });

        if (!populatedCart) {
          return NextResponse.json(
            { error: 'Failed to load cart data' },
            { status: 500 }
          );
        }

        // Update cart totals
        cart.total = populatedCart.items.reduce((sum: number, item: any) => {
          return sum + (item.product?.price || 0) * item.quantity;
        }, 0);

        cart.itemCount = populatedCart.items.reduce((sum: number, item: any) => {
          return sum + item.quantity;
        }, 0);

        await cart.save();
        break;

      case 'update':
        if (!productId || !quantity) {
          return NextResponse.json(
            { error: 'Cart item ID and quantity are required' },
            { status: 400 }
          );
        }

        // Update the cart item quantity
        await cart.updateItemQuantity(productId, quantity);

        // Refresh the cart to get updated totals
        const updatedCart = await Cart.findById(cart._id).populate('items');
        if (!updatedCart) {
          return NextResponse.json(
            { error: 'Failed to update cart' },
            { status: 500 }
          );
        }

        // Update the cart total and item count
        updatedCart.total = updatedCart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        updatedCart.itemCount = updatedCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        await updatedCart.save();

        return NextResponse.json({ cart: updatedCart });
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
