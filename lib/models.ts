import mongoose, { Document, Schema, Types } from 'mongoose';

// Conditional model definitions based on environment
let PrivateUser: any;
let Contact: any;
let WiFiNetwork: any;
let SecureNote: any;
let Password: any;
let ChatMessage: any;
let Conversation: any;
let Message: any;
let ChatRequest: any;
let UserSettings: any;

// Prevent mongoose operations on client side
if (typeof window !== 'undefined') {
  // Client-side: Export dummy objects to prevent errors
  const dummyModel = null as any;
  PrivateUser = dummyModel;
  Contact = dummyModel;
  WiFiNetwork = dummyModel;
  SecureNote = dummyModel;
  Password = dummyModel;
  ChatMessage = dummyModel;
  Conversation = dummyModel;
  Message = dummyModel;
  ChatRequest = dummyModel;
  UserSettings = dummyModel;
} else {
  // Server-side: Full mongoose implementation
  // User schema with chat-related fields
  const privateUserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    contacts: [{
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
    }],
    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
    }],
    online: {
      type: Boolean,
      default: false,
    },
    // Add conversations field to track user's conversations
    conversations: [{
      participant: {
        type: Schema.Types.ObjectId,
        ref: 'PrivateUser',
        required: true
      },
      conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
      },
      lastMessageAt: {
        type: Date,
        default: Date.now,
      },
      unreadCount: {
        type: Number,
        default: 0,
      },
    }],
    chatRequests: [{
      type: Schema.Types.ObjectId,
      ref: 'ChatRequest',
    }],
  }, {
    timestamps: true,
  });

  PrivateUser = (mongoose.models.PrivateUser as mongoose.Model<any>) || mongoose.model('PrivateUser', privateUserSchema);

  // Contact Schema
  const contactSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    notes: {
      type: String,
    },
  }, {
    timestamps: true,
  });

  Contact = (mongoose.models.Contact as mongoose.Model<any>) || mongoose.model('Contact', contactSchema);

  // WiFi Network Schema
  const wifiNetworkSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    ssid: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    securityType: {
      type: String,
      enum: ['WPA', 'WPA2', 'WEP', 'OPEN'],
      default: 'WPA2',
    },
    notes: {
      type: String,
    },
  }, {
    timestamps: true,
  });

  WiFiNetwork = (mongoose.models.WiFiNetwork as mongoose.Model<any>) || mongoose.model('WiFiNetwork', wifiNetworkSchema);

  // Secure Note Schema
  const secureNoteSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    pin: {
      type: String,
      required: function () {
        //@ts-ignore
        return this.isEncrypted;
      },
    },
    pinAttempts: {
      type: Number,
      default: 0,
    },
    maxPinAttempts: {
      type: Number,
      default: 3,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  }, {
    timestamps: true,
  });

  SecureNote = (mongoose.models.SecureNote as mongoose.Model<any>) || mongoose.model('SecureNote', secureNoteSchema);

  // Password Schema
  const passwordSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    notes: {
      type: String,
    },
    category: {
      type: String,
    },
  }, {
    timestamps: true,
  });

  Password = (mongoose.models.Password as mongoose.Model<any>) || mongoose.model('Password', passwordSchema);

  // Chat Message Schema (legacy)
  const chatMessageSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isFromUser: {
      type: Boolean,
      default: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  }, {
    timestamps: true,
  });

  ChatMessage = (mongoose.models.ChatMessage as mongoose.Model<any>) || mongoose.model('ChatMessage', chatMessageSchema);

  // Conversation model for managing chat conversations
  const conversationSchema = new mongoose.Schema({
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
    }],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
    },
  }, {
    timestamps: true,
  });

  Conversation = (mongoose.models.Conversation as mongoose.Model<any>) || mongoose.model('Conversation', conversationSchema);

  // Chat Request Schema
  const chatRequestSchema = new mongoose.Schema({
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    message: {
      type: String,
      default: 'I would like to chat with you.'
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 7*24*60*60*1000), // 7 days
      index: { expires: '7d' }
    }
  }, {
    timestamps: true,
  });

  // Create a compound index to prevent duplicate requests
  chatRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

  // Message schema
  const messageSchema = new mongoose.Schema({
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read', 'error'],
      default: 'sending',
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'system'],
      default: 'text',
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRequest',
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'PrivateUser',
    }],
    metadata: {
      type: Schema.Types.Mixed,
    },
    // IMPORTANT: Add systemData field for Q&A notifications with link button
    // This stores data like { type: 'qa_started', publicId: 'xxx', question: 'xxx' }
    systemData: {
      type: Schema.Types.Mixed,
    },
  }, {
    timestamps: true,
  });

  Message = (mongoose.models.Message as mongoose.Model<any>) || mongoose.model('Message', messageSchema);

  ChatRequest = (mongoose.models.ChatRequest as mongoose.Model<any>) ||
    mongoose.model('ChatRequest', chatRequestSchema);

  // User settings with chat preferences
  const userSettingsSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrivateUser',
      required: true,
      unique: true,
    },
    autoSave: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    lastSync: {
      type: Date,
    },
  }, {
    timestamps: true,
  });

  UserSettings = (mongoose.models.UserSettings as mongoose.Model<any>) || mongoose.model('UserSettings', userSettingsSchema);

  // Add methods to PrivateUser schema
  privateUserSchema.methods = {
    async sendChatRequest(recipientId: mongoose.Types.ObjectId, message?: string) {
      const request = new ChatRequest({
        sender: this._id,
        recipient: recipientId,
        message
      });

      await request.save();
      return request;
    },

    async getChatRequests(status?: 'pending' | 'accepted' | 'rejected') {
      const query: any = {
        $or: [
          { sender: this._id },
          { recipient: this._id }
        ]
      };

      if (status) {
        query.status = status;
      }

      return ChatRequest.find(query)
        .populate('sender', 'name email image')
        .populate('recipient', 'name email image')
        .sort({ createdAt: -1 });
    },

    async respondToRequest(requestId: mongoose.Types.ObjectId, accept: boolean) {
      const request = await ChatRequest.findOne({
        _id: requestId,
        recipient: this._id,
        status: 'pending'
      });

      if (!request) {
        throw new Error('Request not found or already processed');
      }

      request.status = accept ? 'accepted' : 'rejected';
      await request.save();

      if (accept) {
        // Add each other to contacts
        await Promise.all([
          PrivateUser.findByIdAndUpdate(this._id, {
            $addToSet: { contacts: request.sender }
          }),
          PrivateUser.findByIdAndUpdate(request.sender, {
            $addToSet: { contacts: this._id }
          })
        ]);

        // Create a conversation
        const conversation = new Conversation({
          participants: [this._id, request.sender],
          status: 'active'
        });

        await conversation.save();

        // Create a system message
        const message = new Message({
          conversation: conversation._id,
          sender: this._id,
          content: 'Chat request accepted',
          type: 'system',
          requestId: request._id
        });

        await message.save();

        // Update conversation with last message
        conversation.lastMessage = message._id;
        await conversation.save();

        return { request, conversation };
      }

      return { request };
    }
  };
}

// Export the models (now properly defined at module level)
export {
  PrivateUser,
  Contact,
  WiFiNetwork,
  SecureNote,
  Password,
  ChatMessage,
  Conversation,
  Message,
  ChatRequest,
  UserSettings
};
