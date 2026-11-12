import { NextResponse } from 'next/server';
import { getAppointments, addAppointment, getContent } from '@/lib/contentStore';
import { syncAppointmentToPostgres } from '@/lib/appointmentSync';
import { sendEmail } from '@/lib/resend';

export async function GET() {
  return NextResponse.json(getAppointments());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.patientName || !body.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 422 });
    }
    const preferredDate = body.preferredDate || new Date().toISOString().split('T')[0];
    const requestedDoctor = body.doctor || body.doctorName || undefined;
    const requestedSlot = body.preferredTimeSlot || body.timeSlot || '';

    // Basic slot conflict check when an explicit time slot is requested
    if (requestedSlot) {
      const existing = getAppointments().find(
        (a) =>
          a.status !== 'cancelled' &&
          a.preferredDate === preferredDate &&
          (!requestedDoctor || !a.doctor || a.doctor === requestedDoctor) &&
          ((a.preferredTimeSlot && a.preferredTimeSlot === requestedSlot) ||
            (a.notes && a.notes.includes(`Selected Slot: ${requestedSlot}`)))
      );
      if (existing) {
        return NextResponse.json(
          {
            error: `Selected slot ${requestedSlot} on ${preferredDate}${requestedDoctor ? ` for ${requestedDoctor}` : ''} is already booked. Please choose another time.`,
            code: 'E-1608',
          },
          { status: 409 }
        );
      }
    }

    const newApt = addAppointment({
      patientName: body.patientName,
      phone: body.phone,
      doctor: requestedDoctor,
      service: body.service || 'General Consultation',
      preferredDate,
      preferredTimeSlot: requestedSlot || undefined,
      shift: body.shift || 'Morning',
      notes: body.notes || 'Submitted via patient website form',
      tokenNumber: body.tokenNumber,
      opdStage: body.opdStage || 'waiting',
      status: body.status || 'new',
    });

    // Sync public booking into PostgreSQL so /cms/submissions displays it immediately
    await syncAppointmentToPostgres(newApt);

    // Notify clinic inbox asynchronously on new appointment activity
    const clinicEmail = getContent().doctor?.email;
    if (clinicEmail) {
      await sendEmail({
        to: clinicEmail,
        subject: `[HealthConsult] New Appointment Request #${newApt.tokenNumber}${requestedDoctor ? ` — ${requestedDoctor}` : ''}`,
        html: `<p>New appointment request recorded for <strong>${body.patientName}</strong> (${body.phone}) on <strong>${preferredDate}</strong>${requestedSlot ? ` (${requestedSlot})` : ''}${requestedDoctor ? ` with <strong>${requestedDoctor}</strong>` : ''}.</p>`,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, appointment: newApt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create appointment' }, { status: 500 });
  }
}
