// Database models and types
export interface PrivateUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WiFiNetwork {
  id: string;
  userId: string;
  name: string;
  ssid: string;
  password: string;
  securityType: 'WPA' | 'WPA2' | 'WEP' | 'OPEN';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecureNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  pin?: string;
  pinAttempts: number;
  maxPinAttempts: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Password {
  id: string;
  userId: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  updatedAt: Date;
}

export interface ChatMessage {
  _id: string;
  id?: string;
  userId: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date | string;
  read: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  conversationId?: string;
  recipientId?: string;
  readAt?: Date | string;
  // Additional properties for chat functionality
  senderId?: string;
  senderName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isTyping?: boolean;
  // Add index signature to allow dynamic properties
  [key: string]: any;
}

export interface UserSettings {
  userId: string;
  autoSave: boolean;
  notifications: boolean;
  lastSync?: Date;
}
