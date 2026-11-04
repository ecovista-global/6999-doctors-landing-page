import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeName = `${Date.now()}_${cleanBase}${ext}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const base64Data = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      const sizeKb = `${Math.max(1, Math.round(buffer.length / 1024))} KB`;

      return NextResponse.json({
        success: true,
        asset: {
          id: `med-${Date.now()}`,
          title: cleanBase,
          fileName: safeName,
          fileType: file.type || 'image/jpeg',
          fileSize: sizeKb,
          url: base64Data, // Data URI ensures instant render without disk delay
          diskUrl: `/uploads/${safeName}`,
          assignedTo: 'unassigned' as const,
          uploadedAt: 'Just now',
        },
      });
    }

    // JSON payload fallback
    const body = await req.json();
    if (body.dataUrl) {
      const ext = body.fileType?.includes('png') ? '.png' : body.fileType?.includes('webp') ? '.webp' : '.jpg';
      const cleanBase = (body.fileName || 'upload').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeName = `${Date.now()}_${cleanBase}${ext}`;

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      try {
        const matches = body.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
        }
      } catch (e) {
        console.warn('Failed to save to disk, using data URI', e);
      }

      return NextResponse.json({
        success: true,
        asset: {
          id: `med-${Date.now()}`,
          title: cleanBase,
          fileName: safeName,
          fileType: body.fileType || 'image/jpeg',
          fileSize: body.fileSize || '38 KB',
          url: body.dataUrl,
          diskUrl: `/uploads/${safeName}`,
          assignedTo: 'unassigned' as const,
          uploadedAt: 'Just now',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}

