import mongoose, { Document, Model } from 'mongoose';

interface IUser extends Document {
  email: string;
  phone: string;
  name?: string;
  activeCart?: mongoose.Types.ObjectId;
  previousCarts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

interface IUserModel extends Model<IUser> {
  findOrCreate(userData: { email: string; phone: string; name?: string }): Promise<IUser>;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  activeCart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    default: null
  },
  previousCarts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Update lastActive timestamp before saving
userSchema.pre('save', function (next) {
  this.lastActive = new Date();
  next();
});

// Static method to find or create user
userSchema.statics.findOrCreate = async function (userData: { email: string; phone: string; name?: string }) {
  let user = await this.findOne({ email: userData.email });

  if (!user) {
    user = new this({
      email: userData.email,
      phone: userData.phone,
      name: userData.name
    });
    await user.save();
  } else {
    // Update phone number if provided and different
    if (userData.phone && user.phone !== userData.phone) {
      user.phone = userData.phone;
      await user.save();
    }
  }

  return user;
};

const User = mongoose.models.User as IUserModel || mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
