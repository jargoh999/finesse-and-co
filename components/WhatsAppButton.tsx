'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

interface WhatsAppButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'middle-right' | 'bottom-right' | 'bottom-left' | 'middle-left';
}

export default function WhatsAppButton({ 
  className = '',
  size = 'md',
  position = 'middle-right'
}: WhatsAppButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const phoneNumber = '2348124139608';
  const message = 'Hello! I would like to get in touch.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  // Prevent touchmove on the button to stop any unwanted scrolling
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const preventDefault = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    const options = { passive: false, capture: true };
    
    // Add multiple event listeners to ensure we catch all touch events
    button.addEventListener('touchstart', preventDefault, options);
    button.addEventListener('touchmove', preventDefault, options);
    button.addEventListener('touchend', preventDefault, options);
    
    return () => {
      button.removeEventListener('touchstart', preventDefault, options);
      button.removeEventListener('touchmove', preventDefault, options);
      button.removeEventListener('touchend', preventDefault, options);
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  // Position classes
  const positionClasses = {
    'middle-right': 'right-4 top-1/2 -translate-y-1/2 transform-gpu',
    'bottom-right': 'right-4 bottom-4',
    'bottom-left': 'left-4 bottom-4',
    'middle-left': 'left-4 top-1/2 -translate-y-1/2 transform-gpu'
  };

  return (
    <div 
      className={`fixed z-[9999] ${positionClasses[position]} ${className}`}
      style={{
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        position: 'fixed',
        pointerEvents: 'auto',
      }}
    >
      <a
        ref={buttonRef}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={`whatsapp-link ${sizeClasses[size]} flex items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2`}
        style={{
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <Image
          src="/whatsapp.png"
          alt="WhatsApp"
          width={28}
          height={28}
          className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-7 w-7' : 'h-10 w-10'}`}
          style={{
            filter: 'brightness(0) invert(1)',
          }}
          priority
        />
      </a>
    </div>
  );
}