// SubscriptionView.jsx — Premium Paywall Screen
// ✅ Full Razorpay integration with monthly + yearly plans

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';

const FEATURES_FREE = [
  { icon: '✅', text: 'Task management & tracking'      },
  { icon: '✅', text: 'Habit tracker (7-day grid)'       },
  { icon: '✅', text: 'Basic AI schedule (5/day limit)'  },
  { icon: '✅', text: 'Pomodoro timer'                   },
  { icon: '❌', text: 'AI Personal Coach (daily)'        },
  { icon: '❌', text: 'Unlimited AI schedules'           },
  { icon: '❌', text: 'Weekly progress report'           },
  { icon: '❌', text: 'Advanced analytics'               },
  { icon: '❌', text: 'Priority support'                 },
];

const FEATURES_PREMIUM = [
  { icon: '🤖', text: 'Daily AI Personal Coach message'  },
  { icon: '♾️', text: 'Unlimited AI schedule generation' },
  { icon: '📊', text: 'Weekly AI progress report'        },
  { icon: '🔥', text: 'XP + Level gamification'          },
  { icon: '🎯', text: 'Goal tracking & milestones'       },
  { icon: '📈', text: 'Advanced productivity analytics'  },
  { icon: '💬', text: 'Priority support'                 },
  { icon: '🔔', text: 'Smart daily notifications'        },
];

export default function SubscriptionView({ userName = 'User', appLanguage = 'en', onSubscribed }) {
  const [plan, setPlan]           = useState('monthly');
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState(null); // 'success' | 'error' | null
  const [statusMsg, setStatusMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    // Check if already premium
    const premiumData = localStorage.getItem('taskPlanner_premium');
    if (premiumData) {
      const { expiresAt } = JSON.parse(premiumData);
      if (new Date(expiresAt) > new Date()) {
        setIsPremium(true);
        setExpiresAt(expiresAt);
      } else {
        // Expired — remove
        localStorage.removeItem('taskPlanner_premium');
      }
    }
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setStatus(null);

    try {
      // Step 1: Create order
      const orderRes  = await fetch(getApiUrl('/api/subscribe'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userName, planType: plan }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Could not create order');
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        'Task Planner',
        description: orderData.description,
        order_id:    orderData.orderId,
        prefill:     { name: userName },
        theme:       { color: '#6366f1' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatus('error');
            setStatusMsg('Payment cancelled.');
          }
        },
        handler: async (response) => {
          // Step 3: Verify payment
          try {
            const verifyRes  = await fetch(getApiUrl('/api/verify'), {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                userName,
                planType: plan,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // Save premium status locally
              localStorage.setItem('taskPlanner_premium', JSON.stringify({
                paymentId: verifyData.paymentId,
                expiresAt: verifyData.expiresAt,
                planType:  plan,
              }));
              // Reset trial (premium users don't see trial banner)
              localStorage.removeItem('taskPlanner_trialStart');

              setIsPremium(true);
              setExpiresAt(verifyData.expiresAt);
              setStatus('success');
              setStatusMsg('Welcome to Premium! 🎉');
              if (onSubscribed) onSubscribed();
            } else {
              throw new Error(verifyData.error || 'Verification failed');
            }
          } catch (err) {
            setStatus('error');
            setStatusMsg(`Verification failed: ${err.message}. Contact support.`);
          } finally {
            setLoading(false);
          }
        },
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script    = document.createElement('script');
          script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload   = resolve;
          script.onerror  = () => reject(new Error('Failed to load payment gateway'));
          document.head.appendChild(script);
        });
      }

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setLoading(false);
      setStatus('error');
      setStatusMsg(err.message || 'Payment failed. Please try again.');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ─── Already Premium Screen ───
  if (isPremium) {
    return (
      <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 24, marginBottom: 20 }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>👑</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            {appLanguage === 'ta' ? 'நீங்கள் Premium!' : "You're Premium!"}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
            {appLanguage === 'ta' ? `${formatDate(expiresAt)} வரை valid` : `Active until ${formatDate(expiresAt)}`}
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
            ✨ {appLanguage === 'ta' ? 'உங்கள் Premium அம்சங்கள்' : 'Your Premium Features'}
          </div>
          {FEATURES_PREMIUM.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < FEATURES_PREMIUM.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Paywall Screen ───
  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>🚀</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 8 }}>
          {appLanguage === 'ta' ? 'Premium-க்கு Upgrade செய்' : 'Upgrade to Premium'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.5 }}>
          {appLanguage === 'ta'
            ? 'AI personal coach உங்களை motivated-ஆகவும் productive-ஆகவும் வைக்கும்.'
            : 'Get your AI personal coach — stay motivated, disciplined, and productive every day.'}
        </div>
      </div>

      {/* Plan selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { id: 'monthly', price: '₹99',  period: '/month', tag: null,        sub: 'Billed monthly'   },
          { id: 'yearly',  price: '₹999', period: '/year',  tag: '🔥 Save 15%', sub: '₹83/month'      },
        ].map(p => (
          <button key={p.id} onClick={() => setPlan(p.id)}
            style={{ padding: '16px 12px', borderRadius: 18, border: `2px solid ${plan === p.id ? 'var(--accent)' : 'var(--card-border)'}`,
              background: plan === p.id ? 'var(--accent-soft)' : 'var(--card)',
              cursor: 'pointer', textAlign: 'center', position: 'relative', transition: 'all .2s' }}>
            {p.tag && (
              <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,var(--accent),var(--purple))', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                {p.tag}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: plan === p.id ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{p.price}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>{p.period}</div>
            <div style={{ fontSize: 11, color: plan === p.id ? 'var(--accent)' : 'var(--muted)', fontWeight: 700, marginTop: 4 }}>{p.sub}</div>
          </button>
        ))}
      </div>

      {/* Features */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
          {appLanguage === 'ta' ? 'Premium-ல் கிடைக்கும்' : "What you'll get"}
        </div>
        {FEATURES_PREMIUM.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < FEATURES_PREMIUM.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{f.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Status message */}
      {status && (
        <div style={{ padding: '12px 16px', borderRadius: 14, marginBottom: 16, textAlign: 'center', fontWeight: 700, fontSize: 13,
          background: status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: status === 'success' ? '#22c55e' : '#ef4444',
          border: `1px solid ${status === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {statusMsg}
        </div>
      )}

      {/* Pay button */}
      <button onClick={handlePayment} disabled={loading}
        style={{ width: '100%', padding: '18px', borderRadius: 18, border: 'none',
          background: loading ? 'var(--chip)' : 'linear-gradient(135deg,var(--accent),var(--purple))',
          color: loading ? 'var(--muted)' : '#fff',
          fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 8px 24px var(--accent-glow)',
          transition: 'all .2s', marginBottom: 12 }}>
        {loading
          ? '⏳ Processing...'
          : plan === 'monthly'
            ? (appLanguage === 'ta' ? '₹99/மாதம் — இப்போதே தொடங்கு 🚀' : '₹99/month — Start Now 🚀')
            : (appLanguage === 'ta' ? '₹999/ஆண்டு — 15% சேமி 🔥' : '₹999/year — Save 15% 🔥')}
      </button>

      {/* Trust signals */}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.6 }}>
        🔒 {appLanguage === 'ta' ? 'Razorpay மூலம் பாதுகாப்பான பணம் செலுத்துதல்' : 'Secure payment via Razorpay'}<br />
        📱 {appLanguage === 'ta' ? 'UPI, Card, NetBanking ஆகியவை ஏற்கப்படும்' : 'UPI, Cards, NetBanking accepted'}<br />
        🔄 {appLanguage === 'ta' ? 'எப்போது வேண்டுமானாலும் cancel செய்யலாம்' : 'Cancel anytime — no questions asked'}
      </div>
    </div>
  );
}
