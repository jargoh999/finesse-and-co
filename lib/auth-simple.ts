import { compare, hash } from 'bcryptjs';
import dbConnect from './mongodb';
import { PrivateUser } from './models';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function createUser(name: string, email: string, password: string) {
  await dbConnect();

  const existingUser = await PrivateUser.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hash(password, 12);

  const user = new PrivateUser({
    name,
    email,
    password: hashedPassword,
  });

  await user.save();
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export async function authenticateUser(email: string, password: string) {
  await dbConnect();

  const user = await PrivateUser.findOne({ email });
  if (!user) {
    return null;
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return { id: user._id.toString(), name: user.name, email: user.email };
}

export function generateToken(user: any) {
  // Simple base64 encoding for Edge Runtime compatibility
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(payload));
  const signature = btoa('simple-signature'); // In production, use proper HMAC

  return `${header}.${payloadStr}.${signature}`;
}

export function verifyToken(token: string) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
