import { SELLER_PROFILE, computeGstBreakdown, formatInrFromPaise, type PlanTier, PLAN_PRICING } from '@/lib/billing';

export interface GstInvoiceTemplateInput {
  invoiceNumber: string;
  issuedAt: string;
  razorpayPaymentId: string;
  clinicName: string;
  clinicGstin?: string;
  plan: PlanTier;
  amountPaise: number;
  isInterState?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Generate print-ready / email-ready 18% GST Tax Invoice HTML with SAC 998314. */
export function renderGstInvoiceHtml(input: GstInvoiceTemplateInput): string {
  const breakdown = computeGstBreakdown(input.amountPaise, Boolean(input.isInterState));
  const planLabel = PLAN_PRICING[input.plan]?.label || 'Clinical Web Platform Plan';
  const issueDate = new Date(input.issuedAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  const taxRows = input.isInterState
    ? `<tr>
        <td>IGST (18%)</td>
        <td style="text-align:right">${formatInrFromPaise(breakdown.igstPaise)}</td>
      </tr>`
    : `<tr>
        <td>CGST (9%)</td>
        <td style="text-align:right">${formatInrFromPaise(breakdown.cgstPaise)}</td>
      </tr>
      <tr>
        <td>SGST (9%)</td>
        <td style="text-align:right">${formatInrFromPaise(breakdown.sgstPaise)}</td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice ${escapeHtml(input.invoiceNumber)}</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 32px; background: #F8FAFC; }
    .sheet { max-width: 760px; margin: 0 auto; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 32px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0D5C46; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 0 0 4px 0; font-size: 22px; color: #0D5C46; }
    .meta { font-size: 12px; color: #475569; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; font-size: 12px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { text-align: left; background: #F1F5F9; padding: 10px; border-bottom: 1px solid #CBD5E1; color: #334155; }
    td { padding: 10px; border-bottom: 1px solid #E2E8F0; }
    .totals { width: 320px; margin-left: auto; font-size: 13px; }
    .totals td { padding: 6px 8px; }
    .grand { font-weight: 800; font-size: 15px; color: #0D5C46; border-top: 2px solid #0D5C46; }
    .footer { margin-top: 28px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 14px; }
    @media print { body { background: #FFFFFF; padding: 0; } .sheet { border: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1>TAX INVOICE</h1>
        <div class="meta">${escapeHtml(SELLER_PROFILE.legalName)}</div>
        <div class="meta">GSTIN: <strong>${escapeHtml(SELLER_PROFILE.gstin)}</strong> &bull; ${escapeHtml(SELLER_PROFILE.state)}</div>
      </div>
      <div style="text-align:right" class="meta">
        <div>Invoice No: <strong>${escapeHtml(input.invoiceNumber)}</strong></div>
        <div>Date: <strong>${escapeHtml(issueDate)}</strong></div>
        <div>Payment Ref: <strong>${escapeHtml(input.razorpayPaymentId)}</strong></div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <strong>Supplier Details</strong><br />
        ${escapeHtml(SELLER_PROFILE.legalName)}<br />
        ${escapeHtml(SELLER_PROFILE.address)}<br />
        SAC Classification: <strong>${breakdown.sacCode}</strong>
      </div>
      <div class="box">
        <strong>Billed To (Clinic Recipient)</strong><br />
        ${escapeHtml(input.clinicName)}<br />
        ${input.clinicGstin ? `Clinic GSTIN: <strong>${escapeHtml(input.clinicGstin)}</strong><br />` : 'Category: Healthcare Clinic SaaS Subscription<br />'}
        Status: <strong>PAID (GST Inclusive)</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description of Service</th>
          <th>SAC Code</th>
          <th style="text-align:right">Taxable Value</th>
          <th style="text-align:right">GST (18%)</th>
          <th style="text-align:right">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(planLabel)} — Annual Clinical Website &amp; Booking Platform</td>
          <td>${breakdown.sacCode}</td>
          <td style="text-align:right">${formatInrFromPaise(breakdown.taxablePaise)}</td>
          <td style="text-align:right">${formatInrFromPaise(breakdown.gstPaise)}</td>
          <td style="text-align:right"><strong>${formatInrFromPaise(breakdown.grossPaise)}</strong></td>
        </tr>
      </tbody>
    </table>

    <table class="totals">
      <tr>
        <td>Taxable Amount</td>
        <td style="text-align:right">${formatInrFromPaise(breakdown.taxablePaise)}</td>
      </tr>
      ${taxRows}
      <tr class="grand">
        <td>Grand Total Paid</td>
        <td style="text-align:right">${formatInrFromPaise(breakdown.grossPaise)}</td>
      </tr>
    </table>

    <div class="footer">
      Computer-generated GST Tax Invoice under Section 31 of the CGST Act, 2017. SAC ${breakdown.sacCode}: Information Technology Software &amp; Hosting Services.
    </div>
  </div>
</body>
</html>`;
}
