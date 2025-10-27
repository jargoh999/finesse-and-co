import mongoose, { Document, Schema } from 'mongoose';

export interface IChatRequest extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ChatRequestSchema = new Schema<IChatRequest>(
  {
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
    }
  },
  { timestamps: true }
);

// Prevent duplicate requests
ChatRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

// Add text index for searching
ChatRequestSchema.index({ status: 'text' });

export const ChatRequest = mongoose.models.ChatRequest || 
  mongoose.model<IChatRequest>('ChatRequest', ChatRequestSchema);
