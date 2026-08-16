import React from 'react';
import { CheckCircle2, Play, Camera, MessageSquare, Globe, Send, Users, MessageCircle } from 'lucide-react';

const PlatformButton = ({ platform, onClick, disabled = false }) => {
  const platformInfo = {
    instagram: {
      name: 'Instagram',
      color: '#E4405F',
      gradient: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      icon: Camera,
      sections: 'Timeline, Posts, Followers, Messages'
    },
    facebook: {
      name: 'Facebook',
      color: '#1877F2',
      gradient: '#1877F2',
      icon: Users,
      sections: 'Timeline, Friends, About, Messages'
    },
    twitter: {
      name: 'Twitter / X',
      color: '#000000',
      gradient: '#0f172a',
      icon: MessageCircle,
      sections: 'Posts, Replies, Followers, Media'
    },
    whatsapp: {
      name: 'WhatsApp Web',
      color: '#25D366',
      gradient: '#25D366',
      icon: MessageSquare,
      sections: 'Chats, Group Info, Media, Timestamps'
    },
    telegram: {
      name: 'Telegram Web',
      color: '#0088CC',
      gradient: '#0088CC',
      icon: Send,
      sections: 'Channels, Direct Chats, Shared Media'
    },
    google: {
      name: 'Google History',
      color: '#EA4335',
      gradient: '#EA4335',
      icon: Globe,
      sections: 'Activity, Search History, Account Info'
    },
  };

  const info = platformInfo[platform] || {
    name: platform,
    color: '#64748b',
    gradient: '#64748b',
    icon: Globe,
    sections: 'Standard Evidence Sweep'
  };

  const IconComponent = info.icon;

  return (
    <button
      className="platform-tile"
      onClick={onClick}
      disabled={disabled}
      style={{
        borderTop: disabled ? '3px solid #cbd5e1' : `3px solid ${info.color}`,
      }}
    >
      <div
        className="platform-tile-icon"
        style={{
          background: disabled ? '#94a3b8' : info.gradient,
          boxShadow: disabled ? 'none' : `0 4px 12px ${info.color}35`
        }}
      >
        <IconComponent size={22} color="#ffffff" />
      </div>

      <div>
        <div className="platform-tile-name">{info.name}</div>
        <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.2 }}>
          {info.sections}
        </div>
      </div>

      <div
        className="platform-tile-status"
        style={{
          color: disabled ? '#10b981' : '#2563eb',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginTop: 'auto'
        }}
      >
        {disabled ? (
          <>
            <CheckCircle2 size={13} />
            <span>Captured</span>
          </>
        ) : (
          <>
            <Play size={12} />
            <span>Start Capture</span>
          </>
        )}
      </div>
    </button>
  );
};

export default PlatformButton;