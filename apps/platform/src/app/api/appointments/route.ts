import { NextResponse } from 'next/server';
import { getAppointments, addAppointment } from '@/lib/contentStore';

export async function GET() {
  return NextResponse.json(getAppointments());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.patientName || !body.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 422 });
    }
    const newApt = addAppointment({
      patientName: body.patientName,
      phone: body.phone,
      service: body.service || 'General Consultation',
      preferredDate: body.preferredDate || new Date().toISOString().split('T')[0],
      shift: body.shift || 'Morning',
      notes: body.notes || 'Submitted via patient website form',
    });
    return NextResponse.json({ success: true, appointment: newApt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create appointment' }, { status: 500 });
  }
}
