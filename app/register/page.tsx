'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Montserrat, Playfair_Display } from 'next/font/google';

// Create a wrapper component to handle Suspense
function RegisterPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <RegisterPageInner />
    </Suspense>
  );
}

export default RegisterPageContent;

// Configure fonts
const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserInfo, addToCart } = useCart();
  const productId = searchParams?.get('productId') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.phone) {
      setError('Email and phone number are required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Save user info to context and local storage
      await setUserInfo({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      // If there's a product ID, add it to cart
      if (productId) {
        try {
          await addToCart(productId, 1);
          // Redirect to cart page after adding the product
          router.push('/cart');
          return;
        } catch (error) {
          console.error('Failed to add product to cart:', error);
          // Continue to redirect even if adding to cart fails
        }
      }

      // Redirect back to the original page or home
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);

    } catch (err) {
      console.error('Registration failed:', err);
      setError('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${montserrat.variable} font-sans`}>
      {/* Mobile Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleGoBack}
            className="text-pink-600 hover:text-pink-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium text-gray-900">Complete Registration</h1>
          <div className="w-6"></div> {/* Spacer for balance */}
        </div>
      </header>

      <div className="max-w-md w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h2 className={`${playfair.variable} font-serif text-2xl font-semibold text-gray-900 mb-2`}>
              Complete Your Registration
            </h2>
            <p className="text-gray-600 text-sm">
              We need a few details to process your order
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                </div>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  placeholder="your.email@example.com"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  We'll use this to track your orders and send order confirmations. Your email will not be shared with third parties.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  placeholder="+234 800 000 0000"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  We'll use this to send you order updates via WhatsApp. The seller may contact you for order confirmation.
                  <strong>Important:</strong> We will never ask you to click on any links or share sensitive information.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 text-base font-medium rounded-lg bg-pink-600 hover:bg-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Continue Shopping'
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our{' '}
                  <a href="/privacy" className="text-pink-600 hover:underline">Privacy Policy</a> and{' '}
                  <a href="/terms" className="text-pink-600 hover:underline">Terms of Service</a>.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  We value your privacy. Your information is secure and will only be used for order processing and communication.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
