import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';
import { useApp } from '../context/AppContext';

export default function ReferralView() {
  const { userName = 'User', appLanguage = 'en' } = useApp();
  const [referralCode, setReferralCode]   = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [freeMonths, setFreeMonths]       = useState(0);
  const [copied, setCopied]               = useState(false);
  const [inputCode, setInputCode]         = useState('');
  const [redeemStatus, setRedeemStatus]   = useState(null);
  const [redeemMsg, setRedeemMsg]         = useState('');

  useEffect(() => {
    // Generate stable referral code from userName
    const saved = localStorage.getItem('taskPlanner_referralCode');
    if (saved) {
      setReferralCode(saved);
    } else {
      const code = `TP${userName.toUpperCase().replace(/\s/g, '').slice(0, 4)}${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('taskPlanner_referralCode', code);
      setReferralCode(code);
    }
    const count  = parseInt(localStorage.getItem('taskPlanner_referralCount') || '0');
    const months = parseInt(localStorage.getItem('taskPlanner_freeMonths')    || '0');
    setReferralCount(count);
    setFreeMonths(months);
  }, []);

  const referralLink = `https://task-application-sigma.vercel.app?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const msg = appLanguage === 'ta'
      ? `நான் Task Planner AI Coach use பண்றேன் — daily productivity மிகவும் improve ஆச்சு! இலவசமாக try பண்ணு: ${referralLink}`
      : `I've been using Task Planner AI Coach and my productivity has improved a lot! Try it free: ${referralLink}`;

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(msg)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
    };

    window.open(urls[platform], '_blank');
  };

  const handleRedeem = () => {
    if (!inputCode.trim()) return;
    const myCode = localStorage.getItem('taskPlanner_referralCode');
    if (inputCode.toUpperCase() === myCode) {
      setRedeemStatus('error');
      setRedeemMsg(appLanguage === 'ta' ? 'உங்கள் சொந்த code பயன்படுத்த முடியாது!' : "You can't use your own code!");
      return;
    }
    const alreadyRedeemed = localStorage.getItem('taskPlanner_redeemedCode');
    if (alreadyRedeemed) {
      setRedeemStatus('error');
      setRedeemMsg(appLanguage === 'ta' ? 'நீங்கள் ஏற்கனவே ஒரு code பயன்படுத்தினீர்கள்.' : 'You have already redeemed a referral code.');
      return;
    }
    // Grant 30-day extension
    const existing  = localStorage.getItem('taskPlanner_premium');
    const baseDate  = existing ? new Date(JSON.parse(existing).expiresAt) : new Date();
    if (baseDate < new Date()) baseDate.setTime(Date.now());
    baseDate.setMonth(baseDate.getMonth() + 1);
    localStorage.setItem('taskPlanner_premium', JSON.stringify({
      paymentId:  'referral_' + inputCode,
      expiresAt:  baseDate.toISOString(),
      planType:   'referral',
    }));
    localStorage.setItem('taskPlanner_redeemedCode', inputCode.toUpperCase());
    localStorage.removeItem('taskPlanner_trialStart'); // Remove trial counter
    setRedeemStatus('success');
    setRedeemMsg(appLanguage === 'ta' ? '🎉 1 மாதம் இலவசமாக பெற்றீர்கள்!' : '🎉 You got 1 month free!');
  };

  const STEPS = [
    { icon: '🔗', text: appLanguage === 'ta' ? 'உங்கள் link share பண்ணுங்கள்'     : 'Share your unique link'            },
    { icon: '👥', text: appLanguage === 'ta' ? 'நண்பர் sign up பண்ணுகிறார்'         : 'Friend signs up using your link'   },
    { icon: '🎁', text: appLanguage === 'ta' ? 'நீங்கள் 1 மாதம் இலவசமாக பெறுவீர்கள்' : 'You both get 1 month free!'        },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎁</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 8 }}>
          {appLanguage === 'ta' ? 'நண்பரை அழைக்கவும்' : 'Refer a Friend'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          {appLanguage === 'ta'
            ? 'ஒவ்வொரு நண்பரையும் அழைக்கும்போது நீங்களும் அவரும் 1 மாதம் இலவசமாக பெறுவீர்கள்!'
            : 'For every friend you invite, you both get 1 month of Premium FREE!'}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>
          {appLanguage === 'ta' ? 'எப்படி?' : 'How it works'}
        </div>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < STEPS.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.text}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '14px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>{referralCount}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>
            {appLanguage === 'ta' ? 'அழைத்தவர்கள்' : 'Friends Referred'}
          </div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '14px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>{freeMonths}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>
            {appLanguage === 'ta' ? 'இலவச மாதங்கள்' : 'Free Months Earned'}
          </div>
        </div>
      </div>

      {/* Your referral code */}
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '18px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>
          {appLanguage === 'ta' ? 'உங்கள் referral code' : 'Your Referral Code'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1px solid var(--card-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '2px', flex: 1 }}>{referralCode}</div>
          <button onClick={handleCopy}
            style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: copied ? 'rgba(34,197,94,0.15)' : 'var(--accent-soft)', color: copied ? '#22c55e' : 'var(--accent)', fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { id: 'whatsapp', icon: '💬', label: 'WhatsApp', color: '#22c55e' },
            { id: 'telegram', icon: '✈️', label: 'Telegram', color: '#3b82f6' },
            { id: 'twitter',  icon: '𝕏',  label: 'Twitter',  color: '#1d9bf0' },
          ].map(p => (
            <button key={p.id} onClick={() => handleShare(p.id)}
              style={{ padding: '12px 8px', borderRadius: 14, border: `1.5px solid ${p.color}22`, background: `${p.color}11`, cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{p.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Redeem a code */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '18px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          {appLanguage === 'ta' ? '🎁 Friend code redeem பண்ணுங்கள்' : '🎁 Redeem a Friend\'s Code'}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: redeemStatus ? 10 : 0 }}>
          <input value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())}
            placeholder={appLanguage === 'ta' ? 'Code உள்ளிடவும்...' : 'Enter code...'}
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--card-border)', background: 'var(--chip)', color: 'var(--text)', fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'inherit', letterSpacing: '1px' }} />
          <button onClick={handleRedeem} disabled={!inputCode.trim()}
            style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: inputCode.trim() ? 'linear-gradient(135deg,var(--accent),var(--purple))' : 'var(--chip)', color: inputCode.trim() ? '#fff' : 'var(--muted)', fontWeight: 800, cursor: inputCode.trim() ? 'pointer' : 'not-allowed', fontSize: 13, flexShrink: 0 }}>
            {appLanguage === 'ta' ? 'Redeem' : 'Redeem'}
          </button>
        </div>
        {redeemStatus && (
          <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: redeemStatus === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color:      redeemStatus === 'success' ? '#22c55e' : '#ef4444',
            border:    `1px solid ${redeemStatus === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {redeemMsg}
          </div>
        )}
      </div>
    </div>
  );
}
