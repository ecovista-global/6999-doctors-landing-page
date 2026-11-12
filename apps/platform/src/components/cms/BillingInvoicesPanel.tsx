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
  const [selectedPlan, setSelectedPlan] = useState<'professional' | 'premium'>('premium');
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
        if (data.subscription?.plan === 'professional' || data.subscription?.plan === 'premium') {
          setSelectedPlan(data.subscription.plan);
        }
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
          plan: selectedPlan,
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
          borderBottom: '1px solid var(--color-border-subtle, #DFE8EB)',
          paddingBottom: '14px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main, #121B1F)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BanknoteIcon size={18} color="var(--color-brand-primary, #183C4A)" />
            <span>Subscription Billing &amp; 18% GST Tax Invoices</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted, #5A6B72)', margin: 0 }}>
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
              borderRadius: '9999px',
              background: 'var(--color-brand-surface, #E7F2F5)',
              color: 'var(--color-brand-primary, #183C4A)',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid var(--color-border-subtle, #DFE8EB)',
            }}
          >
            <ShieldCheckIcon size={14} />
            <span>{subscription.planLabel} &bull; {subscription.status.toUpperCase()}</span>
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #5A6B72)' }}>Loading billing &amp; GST records...</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--color-bg-base, #F5F8F9)', border: '1px solid var(--color-border-subtle, #DFE8EB)', borderRadius: '14px', padding: '14px 16px', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-main, #121B1F)', lineHeight: 1.6 }}>
              <div>
                <strong>Annual Renewal Rate:</strong>{' '}
                {subscription?.renewalPriceFormatted ||
                  (selectedPlan === 'premium' ? '₹14,999.00' : '₹9,999.00')}{' '}
                (incl. 18% GST)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #5A6B72)' }}>
                Valid Through: <strong>{subscription?.currentPeriodEnd || 'Pending activation'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as 'professional' | 'premium')}
                aria-label="Billing Plan Tier"
                style={{
                  padding: '8px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-border-subtle, #DFE8EB)',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <option value="premium">Premium Clinic (₹24,999 / ₹14,999)</option>
                <option value="professional">Professional Clinic (₹18,999 / ₹9,999)</option>
              </select>
              <button
                type="button"
                disabled={creatingOrder}
                onClick={() => handleCreateOrder('initial')}
                className="ms-pill-light"
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: creatingOrder ? 'not-allowed' : 'pointer',
                }}
              >
                New Plan Checkout ({selectedPlan === 'premium' ? '₹24,999' : '₹18,999'})
              </button>
              <button
                type="button"
                disabled={creatingOrder}
                onClick={() => handleCreateOrder('renewal')}
                className="ms-pill-dark"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: creatingOrder ? 'not-allowed' : 'pointer',
                }}
              >
                {creatingOrder
                  ? 'Generating...'
                  : `Generate Renewal Order (${selectedPlan === 'premium' ? '₹14,999' : '₹9,999'})`}
              </button>
            </div>
          </div>

          {orderPreview && (
            <div style={{ background: 'var(--color-brand-surface, #E7F2F5)', border: '1px solid var(--color-border-subtle, #DFE8EB)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', fontSize: '12px', color: 'var(--color-brand-primary, #183C4A)' }}>
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
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main, #121B1F)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileTextIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                        <span>{inv.invoiceNumber}</span>
                        <span style={{ color: 'var(--color-text-muted, #5A6B72)', fontWeight: 500 }}>&bull; {inv.planLabel}</span>
                      </div>
                      <div style={{ color: 'var(--color-text-muted, #5A6B72)', marginTop: '2px' }}>
                        Paid {inv.amountFormatted} (Taxable {fmtInr(inv.taxablePaise)} + 18% GST {fmtInr(inv.gstPaise)}) &bull; SAC {inv.sacCode}
                      </div>
                    </div>

                    <a
                      href={invoiceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-pill-light"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        color: 'var(--color-brand-primary, #183C4A)',
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
