// WhatsApp Reminder via wa.me deep link
// ✅ Phase 3: No Twilio needed — uses free WhatsApp deep link
// For production upgrade: use WATI or Twilio WhatsApp API

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

  const { phone, message, userName = 'User', type = 'reminder' } = req.body || {};

  try {
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  // Clean phone number — remove spaces, dashes, +
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  // Add India country code if not present
  const fullPhone  = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const MESSAGES = {
    morning:  `Good morning ${userName}! 🌅 Your AI coach is ready. Open Task Planner to check in and get your personalized schedule for today. Stay focused! 💪`,
    evening:  `Good evening ${userName}! 🌙 How was your day? Open Task Planner to log your progress and reflect. Tomorrow will be even better! 📊`,
    reminder: message || `Hey ${userName}! ⏰ Your Task Planner reminder is here. Time to get back on track! 🎯`,
    streak:   `🔥 ${userName}, your streak is alive! Don't break it — open Task Planner and complete today's tasks. You're on a roll!`,
  };

  const finalMessage = MESSAGES[type] || MESSAGES.reminder;

  // Generate WhatsApp deep link
  const waLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent(finalMessage)}`;

  return res.status(200).json({
    success: true,
    waLink,
    // For server-side sending (future upgrade with WATI API):
    // Use: https://app.wati.io/api/v1/sendTemplateMessage
    message: `WhatsApp link generated for +${fullPhone}`,
    note: 'Currently using wa.me deep link. For automated sending, integrate WATI API.',
  });
}

} catch(err) { return res.status(500).json({ error: 'Error' }); }
