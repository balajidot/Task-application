// Razorpay — Create Subscription Order
// File: api/subscribe.js
// ✅ Creates a Razorpay order for ₹99/month subscription

import { enforceRateLimit, getClientKey } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = enforceRateLimit(getClientKey(req));
  if (!rateLimit.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay keys not configured.' });
  }

  const { userName = 'User', planType = 'monthly' } = req.body || {};

  // Amount in paise (₹99 = 9900 paise)
  const PLANS = {
    monthly:  { amount: 9900,  currency: 'INR', description: 'Task Planner Premium — Monthly' },
    yearly:   { amount: 99900, currency: 'INR', description: 'Task Planner Premium — Yearly (Save 15%)' },
  };

  const plan = PLANS[planType] || PLANS.monthly;

  try {
    // Create Razorpay order
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt: `order_${Date.now()}`,
        notes: {
          userName,
          planType,
          description: plan.description,
        },
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: order.error?.description || 'Order creation failed' });
    }

    return res.status(200).json({
      orderId:     order.id,
      amount:      order.amount,
      currency:    order.currency,
      keyId,       // Send key to frontend (public key is safe)
      description: plan.description,
    });

  } catch (err) {
    return res.status(500).json({ error: 'Payment service error. Please try again.' });
  }
}
