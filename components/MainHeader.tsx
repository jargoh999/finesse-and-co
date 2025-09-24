'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import AnimatedProductSearch from './AnimatedProductSearch';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/categories' },
    { name: 'Collection', href: '/collection' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
];

export default function MainHeader() {
    const { cart, userInfo } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hasOrders, setHasOrders] = useState(false);
    const pathname = usePathname();
    const itemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

    useEffect(() => {
        // Check if user has any orders
        const checkOrders = async () => {
            if (userInfo?.email && userInfo?.phone) {
                try {
                    const params = new URLSearchParams({
                        email: userInfo.email,
                        phone: userInfo.phone,
                    });
                    const response = await fetch(`/api/orders?${params}`);
                    if (response.ok) {
                        const data = await response.json();
                        setHasOrders(data.orders?.length > 0);
                    }
                } catch (error) {
                    console.error('Error checking orders:', error);
                }
            }
        };

        checkOrders();
    }, [userInfo?.email, userInfo?.phone]);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
                <div className="flex w-full items-center justify-between border-b border-gray-200 py-4 lg:border-none">
                    <div className="flex items-center
          ">
                        <Link href="/" className="text-2xl font-bold text-pink-600">
                            Finesse & Co.
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-8">
                        <div className="hidden ml-10 space-x-8 lg:flex items-center">
                            {navigation.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`text-sm font-medium ${pathname === link.href ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {userInfo?.email && hasOrders && (
                                <Link
                                    href="/orders"
                                    className={`text-sm font-medium flex items-center ${pathname === '/orders' ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'}`}
                                >
                                    <Package className="h-4 w-4 mr-1.5" />
                                    My Orders
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block">
                            <AnimatedProductSearch />
                        </div>

                        <Link href="/cart" className="relative p-2 text-gray-700 hover:text-pink-600">
                            <ShoppingCart className="h-6 w-6" aria-hidden="true" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="md:hidden p-2 -m-2.5 inline-flex items-center justify-center rounded-md text-gray-700"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Mobile menu, show/hide based on menu state */}
                <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === item.href ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50 hover:text-pink-600'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="px-3 py-2">
                            <AnimatedProductSearch />
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
