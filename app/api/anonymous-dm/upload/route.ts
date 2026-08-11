import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine resource_type based on file mime type
    const mimeType = file.type || '';
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    let mediaType: 'image' | 'video' | 'audio' | 'file' = 'file';

    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
      mediaType = 'image';
    } else if (mimeType.startsWith('video/')) {
      resourceType = 'video';
      mediaType = 'video';
    } else if (mimeType.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary processes audio under video resource_type
      mediaType = 'audio';
    } else {
      resourceType = 'raw';
      mediaType = 'file';
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'anonymous_dm_media',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const uploadResult = result as any;

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      mediaType,
      publicId: uploadResult.public_id,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Error uploading anonymous DM media:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media file' },
      { status: 500 }
    );
  }
}
