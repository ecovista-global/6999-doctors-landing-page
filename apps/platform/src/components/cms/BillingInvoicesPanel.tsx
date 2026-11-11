'use client';

import React, { useEffect, useState } from 'react';
import {
  BanknoteIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from '@/components/Icons';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

interface SubscriptionSummary {
  id: string;
  plan: string;
  planLabel: string;
  status: string;
  currentPeriodEnd: string;
  renewalPricePaise: number;
  renewalPriceFormatted: string;
}

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  razorpayPaymentId: string;
  planLabel: string;
  amountPaise: number;
  taxablePaise: number;
  gstPaise: number;
  sacCode: string;
  status: string;
  issuedAt: string;
  amountFormatted: string;
}

interface OrderPreview {
  orderId: string;
  amountFormatted: string;
  planLabel: string;
  billingCycle: string;
  gstBreakdown: {
    taxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    gstPaise: number;
    sacCode: string;
  };
}

function fmtInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BillingInvoicesPanel() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [clinicGstin, setClinicGstin] = useState('');
  const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolved =
      typeof window !== 'undefined'
        ? localStorage.getItem('tenantId') || DEFAULT_TENANT_ID
        : DEFAULT_TENANT_ID;
    setTenantId(resolved);

    fetch(`/api/v1/payments/order?tenantId=${resolved}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.title || 'Failed to load billing summary');
        setSubscription(data.subscription || null);
        setInvoices(data.invoices || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load billing'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateOrder = async (billingCycle: 'initial' | 'renewal') => {
    setCreatingOrder(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/payments/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          tenantId,
          plan: 'professional',
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || 'Unable to generate payment order');
      setOrderPreview(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order creation failed');
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '860px',
        margin: '28px auto 0 auto',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: '14px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BanknoteIcon size={18} color="#0D5C46" />
            <span>Subscription Billing &amp; 18% GST Tax Invoices</span>
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
            Razorpay INR billing (Professional Clinic ₹18,999 initial / ₹9,999 annual renewal, GST inclusive under SAC 998314).
          </p>
        </div>

        {subscription && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              background: '#D1FAE5',
              color: '#065F46',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <ShieldCheckIcon size={14} />
            <span>{subscription.planLabel} &bull; {subscription.status.toUpperCase()}</span>
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: '13px', color: '#64748B' }}>Loading billing &amp; GST records...</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 16px', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
              <div>
                <strong>Annual Renewal Rate:</strong> {subscription?.renewalPriceFormatted || '₹9,999.00'} (incl. 18% GST)
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Valid Through: <strong>{subscription?.currentPeriodEnd || 'Pending activation'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={creatingOrder}
                onClick={() => handleCreateOrder('initial')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: creatingOrder ? 'not-allowed' : 'pointer',
                }}
              >
                New Plan Checkout (₹18,999)
              </button>
              <button
                type="button"
                disabled={creatingOrder}
                onClick={() => handleCreateOrder('renewal')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0D5C46',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: creatingOrder ? 'not-allowed' : 'pointer',
                }}
              >
                {creatingOrder ? 'Generating...' : 'Generate Renewal Order (₹9,999)'}
              </button>
            </div>
          </div>

          {orderPreview && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px', fontSize: '12px', color: '#14532D' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                Razorpay Order Created: {orderPreview.orderId} ({orderPreview.amountFormatted} — {orderPreview.billingCycle})
              </div>
              <div>
                SAC {orderPreview.gstBreakdown.sacCode} &bull; Taxable Base: {fmtInr(orderPreview.gstBreakdown.taxablePaise)} &bull; CGST (9%): {fmtInr(orderPreview.gstBreakdown.cgstPaise)} &bull; SGST (9%): {fmtInr(orderPreview.gstBreakdown.sgstPaise)}
              </div>
            </div>
          )}

          {/* Optional Clinic GSTIN for Tax Invoice Preview */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <strong style={{ fontSize: '13px', color: '#0F172A' }}>Paid GST Tax Invoices</strong>
            <input
              type="text"
              placeholder="Optional Clinic GSTIN on invoice..."
              value={clinicGstin}
              onChange={(e) => setClinicGstin(e.target.value.toUpperCase())}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                width: '240px',
              }}
            />
          </div>

          {invoices.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>No GST invoices recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {invoices.map((inv) => {
                const invoiceHref = `/api/v1/payments/order?tenantId=${encodeURIComponent(tenantId)}&invoiceId=${encodeURIComponent(inv.id)}${clinicGstin ? `&gstin=${encodeURIComponent(clinicGstin)}` : ''}`;
                return (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileTextIcon size={14} color="#0D5C46" />
                        <span>{inv.invoiceNumber}</span>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>&bull; {inv.planLabel}</span>
                      </div>
                      <div style={{ color: '#64748B', marginTop: '2px' }}>
                        Paid {inv.amountFormatted} (Taxable {fmtInr(inv.taxablePaise)} + 18% GST {fmtInr(inv.gstPaise)}) &bull; SAC {inv.sacCode}
                      </div>
                    </div>

                    <a
                      href={invoiceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        color: '#0D5C46',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <span>View GST Invoice</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
