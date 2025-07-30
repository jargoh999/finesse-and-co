import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzq1y0vqp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export async function POST(request: Request) {
  try {
    console.log('Upload request received');
    
    // Get the form data
    const formData = await request.formData();
    console.log('Form data keys:', [...formData.keys()]);
    
    // Get the files
    const files = formData.getAll('file');
    console.log('Files found:', files.length);
    
    if (!files || files.length === 0) {
      console.error('No files found in the request');
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    
    for (const file of files) {
      if (file instanceof File) {
        console.log('Processing file:', file.name, file.type, file.size);
        
        try {
          // Check file size (max 5MB)
          const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.name} is too large. Max size is 5MB.`);
          }

          // Check file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image`);
          }

          // Convert file to buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const dataUri = `data:${file.type};base64,${base64Data}`;
          
          console.log('Uploading to Cloudinary...');
          
          // Define Cloudinary upload result type
          interface CloudinaryUploadResult {
            secure_url: string;
            public_id: string;
            // Add other Cloudinary response fields as needed
          }
          
          // Upload to Cloudinary
          const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            cloudinary.uploader.upload(
              dataUri, 
              { 
                upload_preset: UPLOAD_PRESET,

              },
              (error: any, result: any) => {
                if (error) {
                  console.error('Cloudinary upload error:', error);
                  reject(error);
                } else if (!result) {
                  reject(new Error('No result from Cloudinary'));
                } else {
                  resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id
                    // Map other necessary fields
                  });
                }
              }
            );
          });
          
          console.log('Upload result:', uploadResult);
          
          if (uploadResult.secure_url && uploadResult.public_id) {
            uploadedFiles.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id
            });
          } else {
            throw new Error('Invalid response from Cloudinary');
          }
          
          console.log('File uploaded successfully:', file.name);
          
        } catch (error: any) {
          console.error(`Error processing file ${file.name}:`, error);
          // Continue with other files if one fails
          continue;
        }
      }
    }

    if (uploadedFiles.length === 0) {
      console.error('No files were successfully uploaded');
      return NextResponse.json(
        { success: false, message: 'No files were successfully uploaded' },
        { status: 400 }
      );
    }

    console.log('Upload completed successfully');
    
    return NextResponse.json({
      success: true,
      data: uploadedFiles,
      message: uploadedFiles.length === 1 
        ? '1 file uploaded successfully' 
        : `${uploadedFiles.length} files uploaded successfully`
    });
    
  } catch (error: any) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Error processing file upload',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
