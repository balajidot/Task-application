// Razorpay — Verify Payment Signature
// File: api/verify.js
// ✅ Verifies payment is genuine using HMAC SHA256

import crypto from 'crypto';
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

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(500).json({ error: 'Razorpay secret not configured.' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userName, planType } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification data.' });
  }

  try {
    // HMAC verification — standard Razorpay approach
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isValid   = expected === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Payment verification failed. Contact support.' });
    }

    // Calculate expiry date
    const now       = new Date();
    const expiresAt = new Date(now);
    if (planType === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    return res.status(200).json({
      success:    true,
      paymentId:  razorpay_payment_id,
      orderId:    razorpay_order_id,
      expiresAt:  expiresAt.toISOString(),
      planType,
      message:    'Payment verified! Welcome to Premium 🎉',
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Verification error. Contact support.' });
  }
}
