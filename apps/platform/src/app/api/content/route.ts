import { NextResponse } from 'next/server';
import { getContent, updateContent } from '@/lib/contentStore';

export async function GET() {
  return NextResponse.json(getContent());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = updateContent(body);
    return NextResponse.json({ success: true, content: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update content' }, { status: 400 });
  }
}
