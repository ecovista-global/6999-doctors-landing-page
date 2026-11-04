import { NextResponse } from 'next/server';
import { updateAppointmentStatus } from '@/lib/contentStore';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = updateAppointmentStatus(id, body.status, body.notes, {
      opdStage: body.opdStage,
      tokenNumber: body.tokenNumber,
      whatsappConfirmationSent: body.whatsappConfirmationSent,
      googleReviewSent: body.googleReviewSent,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update appointment' }, { status: 500 });
  }
}
