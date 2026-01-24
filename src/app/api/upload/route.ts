import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as 'logo' | 'attachment' | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const isLogoUpload = type === 'logo';
    const allowedTypes = isLogoUpload ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    const maxSize = isLogoUpload ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: `Invalid file type. Allowed: ${isLogoUpload ? 'images only' : 'images and PDFs'}`,
          allowedTypes 
        },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
          maxSize 
        },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const userId = session.user.id;
    const ext = file.name.split('.').pop() || 'bin';
    const folder = isLogoUpload ? 'logos' : 'attachments';
    const filename = `${folder}/${userId}/${timestamp}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
