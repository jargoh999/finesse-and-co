'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface UserInfo {
  email: string;
  phone: string;
}

interface UserInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (info: UserInfo) => void;
  productName: string;
}

export default function UserInfoPopup({ isOpen, onClose, onContinue, productName }: UserInfoPopupProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !phone) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    onContinue({ email, phone });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Information</DialogTitle>
          <DialogDescription>
            To add {productName} to your cart, please provide your contact information.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (123) 456-7890"
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full">
              Continue to Cart
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            We'll use this information to send you order updates and receipts.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
