import jwt from 'jsonwebtoken';
import { PrivateUser } from './models';
import dbConnect from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    return null;
  }

  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log('Token verified successfully:', { userId: decoded.userId, email: decoded.email });
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
//@ts-ignore

export async function getUserFromToken(token: string): Promise<PrivateUser | null> {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) return null;

    await dbConnect();
    const user = await PrivateUser.findById(decoded.userId);
    return user;
  } catch (error) {
    return null;
  }
}
//@ts-ignore
export function generateToken(user: PrivateUser): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
