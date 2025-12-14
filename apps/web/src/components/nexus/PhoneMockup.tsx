'use client';

import { ReactNode } from 'react';

interface PhoneMockupProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
  deviceColor?: 'black' | 'white' | 'midnight' | 'purple' | 'silver' | 'gold' | 'blue' | 'green';
  variant?: 'iphone-14' | 'iphone-14-pro' | 'iphone-15' | 'iphone-15-pro-max' | 'samsung-s23' | 'samsung-s24' | 'samsung-fold' | 'pixel-8' | 'ipad-air' | 'ipad-pro' | 'galaxy-tab';
}

export function PhoneMockup({ children, theme = 'light', deviceColor = 'midnight', variant = 'iphone-15' }: PhoneMockupProps) {
  const deviceColors = {
    black: 'bg-gray-900',
    white: 'bg-gray-100',
    silver: 'bg-gradient-to-br from-gray-300 to-gray-400',
    midnight: 'bg-gradient-to-br from-blue-900 to-purple-900',
    purple: 'bg-gradient-to-br from-purple-600 to-pink-600',
    gold: 'bg-gradient-to-br from-yellow-600 to-amber-700',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
    green: 'bg-gradient-to-br from-green-600 to-emerald-700',
  };

  const dimensions = {
    'iphone-14': { width: '320px', height: '650px', rounded: '3rem', padding: '10px', type: 'iphone' },
    'iphone-14-pro': { width: '325px', height: '670px', rounded: '3rem', padding: '10px', type: 'iphone-pro' },
    'iphone-15': { width: '320px', height: '655px', rounded: '3rem', padding: '10px', type: 'iphone' },
    'iphone-15-pro-max': { width: '340px', height: '700px', rounded: '3rem', padding: '10px', type: 'iphone-pro' },
    'samsung-s23': { width: '330px', height: '670px', rounded: '2.5rem', padding: '8px', type: 'android' },
    'samsung-s24': { width: '335px', height: '685px', rounded: '2.5rem', padding: '8px', type: 'android' },
    'samsung-fold': { width: '380px', height: '720px', rounded: '2rem', padding: '10px', type: 'android' },
    'pixel-8': { width: '325px', height: '665px', rounded: '2.5rem', padding: '8px', type: 'android' },
    'ipad-air': { width: '480px', height: '680px', rounded: '2rem', padding: '12px', type: 'tablet' },
    'ipad-pro': { width: '540px', height: '740px', rounded: '2rem', padding: '12px', type: 'tablet' },
    'galaxy-tab': { width: '500px', height: '700px', rounded: '2rem', padding: '12px', type: 'tablet' },
  };

  const { width, height, rounded, padding, type } = dimensions[variant];

  // Android uses punch-hole camera, iPhone uses dynamic island, iPhone Pro has pill-shaped, Tablet has no notch
  const renderNotch = () => {
    if (type === 'android') {
      return (
        <div className="absolute top-4 right-8 w-3 h-3 bg-black rounded-full z-20 border-2 border-gray-800" />
      );
    }
    if (type === 'iphone') {
      return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-20">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-800 rounded-full" />
        </div>
      );
    }
    if (type === 'iphone-pro') {
      return (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-purple-900 rounded-full" />
          <div className="w-1.5 h-1.5 bg-purple-900 rounded-full" />
        </div>
      );
    }
    return null; // Tablet has no notch
  };

  const buttonPositions: Record<string, { power: string; volumeUp: string; volumeDown: string }> = {
    'iphone': { power: 'right-0 top-32 h-16', volumeUp: 'left-0 top-28 h-12', volumeDown: 'left-0 top-44 h-12' },
    'iphone-pro': { power: 'right-0 top-32 h-16', volumeUp: 'left-0 top-28 h-12', volumeDown: 'left-0 top-44 h-12' },
    'android': { power: 'right-0 top-28 h-14', volumeUp: 'left-0 top-24 h-10', volumeDown: 'left-0 top-40 h-10' },
    'tablet': { power: 'top-20 right-0 h-12', volumeUp: 'top-40 right-0 h-10', volumeDown: 'top-56 right-0 h-10' },
  };

  const buttons = buttonPositions[type];
  const screenRadius = type === 'tablet' ? '1.5rem' : '2.5rem';

  return (
    <div className="relative mx-auto" style={{ width, height }}>
      {/* Phone Frame */}
      <div 
        className={`absolute inset-0 ${deviceColors[deviceColor]} shadow-2xl`}
        style={{ 
          borderRadius: rounded,
          padding: padding
        }}
      >
        {/* Screen Bezel */}
        <div 
          className="relative w-full h-full bg-black overflow-hidden"
          style={{ borderRadius: screenRadius }}
        >
          {/* Notch/Camera - variant specific */}
          {renderNotch()}

          {/* Screen Content Area */}
          <div className="absolute inset-0 bg-white overflow-auto">
            {/* Status Bar */}
            <div className="sticky top-0 left-0 right-0 h-11 bg-white flex items-center justify-between px-8 text-xs font-semibold z-10">
              <span className={theme === 'dark' ? 'text-white' : 'text-black'}>9:41</span>
              <div className="flex items-center gap-1">
                {/* Signal */}
                <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 22h3V11H2v11zm5 0h3V8H7v14zm5 0h3V2h-3v20zm5 0h3v-9h-3v9z"/>
                </svg>
                {/* WiFi */}
                <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                </svg>
                {/* Battery */}
                <svg className={`w-6 h-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 12">
                  <rect x="1" y="1" width="18" height="10" rx="2" />
                  <rect x="3" y="3" width="14" height="6" fill="currentColor" />
                  <rect x="19.5" y="4" width="2" height="4" rx="1" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-4 pb-20">
              {children}
            </div>

            {/* Home Indicator - only for iPhone/Android */}
            {type !== 'tablet' && (
              <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/30 rounded-full" />
            )}
          </div>
        </div>
      </div>

      {/* Power Button */}
      <div className={`absolute ${buttons.power} w-1 bg-gray-700 rounded-l-lg`} />
      
      {/* Volume Buttons */}
      <div className={`absolute ${buttons.volumeUp} w-1 bg-gray-700 rounded-r-lg`} />
      <div className={`absolute ${buttons.volumeDown} w-1 bg-gray-700 rounded-r-lg`} />
    </div>
  );
}

// Card Preview Component for use inside PhoneMockup
interface CardPreviewProps {
  card?: any;
  customization?: {
    fontFamily?: string;
    fontSize?: string;
    layout?: string;
    backgroundType?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    borderRadius?: string;
    shadowPreset?: string;
    customCss?: string;
  };
  fontFamily?: string;
  fontSize?: string;
  layout?: string;
  backgroundColor?: string;
  borderRadius?: string;
  shadowPreset?: string;
  cardData?: {
    name?: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    avatarUrl?: string;
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
    };
  };
}

export function CardPreview({
  card,
  customization,
  fontFamily: fontFamilyProp = 'inter',
  fontSize: fontSizeProp = 'base',
  layout: layoutProp = 'vertical',
  backgroundColor: backgroundColorProp = '#ffffff',
  borderRadius: borderRadiusProp = 'md',
  shadowPreset: shadowPresetProp = 'sm',
  cardData = {},
}: CardPreviewProps) {
  // Use customization props if provided, otherwise fall back to direct props
  const fontFamily = customization?.fontFamily || fontFamilyProp;
  const fontSize = customization?.fontSize || fontSizeProp;
  const layout = customization?.layout || layoutProp;
  const backgroundColor = customization?.backgroundColor || backgroundColorProp;
  const borderRadius = customization?.borderRadius || borderRadiusProp;
  const shadowPreset = customization?.shadowPreset || shadowPresetProp;
  const customCss = customization?.customCss || '';
  
  const fontFamilyMap: Record<string, string> = {
    inter: 'font-sans',
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    display: 'font-sans',
  };

  const fontSizeMap: Record<string, string> = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  const borderRadiusMap: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  const shadowMap: Record<string, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  const {
    name = 'John Doe',
    title = 'Senior Product Designer',
    company = 'Tech Company Inc.',
    email = 'john@example.com',
    phone = '+1 (555) 123-4567',
    website = 'https://example.com',
    address = 'San Francisco, CA',
    avatarUrl,
  } = cardData;

  const containerClasses = `
    ${fontFamilyMap[fontFamily]}
    ${fontSizeMap[fontSize]}
    ${borderRadiusMap[borderRadius]}
    ${shadowMap[shadowPreset]}
    p-6 mt-4
  `.trim();

  // Detect template types
  const isBasic = customCss.includes('card-basic-container');
  const isPhotographerSplit = customCss.includes('card-split-container');
  const isPhotographerWave = customCss.includes('card-wave-divider') && customCss.includes('card-photo-section');

  // Basic Business Card Preview
  if (isBasic) {
    return (
      <>
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <div className="card-basic-container" style={{ maxWidth: '360px', margin: '0 auto', fontSize: '0.9rem' }}>
          <div className="card-basic-header">
            <div className="card-basic-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="card-basic-avatar-img" />
              ) : (
                <div className="card-basic-avatar-fallback" />
              )}
            </div>
            <div className="card-basic-name">{name}</div>
            {title && <div className="card-basic-title">{title}</div>}
            {company && <div className="card-basic-company">{company}</div>}
          </div>

          <div className="card-basic-contact">
            {phone && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon phone">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.13 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.06 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12.81.37 1.6.72 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.18a2 2 0 0 1 2.11-.45c.74.35 1.53.6 2.34.72A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Phone</div>
                  <div className="card-basic-contact-value">{phone}</div>
                </div>
              </div>
            )}

            {email && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon email">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Email</div>
                  <div className="card-basic-contact-value">{email}</div>
                </div>
              </div>
            )}

            {cardData.website && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon website">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Website</div>
                  <div className="card-basic-contact-value">{cardData.website}</div>
                </div>
              </div>
            )}

            {cardData.address && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Location</div>
                  <div className="card-basic-contact-value">{cardData.address}</div>
                </div>
              </div>
            )}
          </div>

          {(cardData.socialLinks?.linkedin || cardData.socialLinks?.twitter || cardData.socialLinks?.github) && (
            <div className="card-basic-social">
              <div className="card-basic-social-title">Connect with me</div>
              <div className="card-basic-social-links">
                {cardData.socialLinks?.linkedin && (
                  <div className="card-basic-social-link linkedin">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                )}
                {cardData.socialLinks?.twitter && (
                  <div className="card-basic-social-link twitter">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                )}
                {cardData.socialLinks?.github && (
                  <div className="card-basic-social-link github">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card-basic-actions">
            <button className="card-basic-button">Save Contact</button>
          </div>
        </div>
      </>
    );
  }

  // Photographer Split Template Layout
  if (isPhotographerSplit) {
    return (
      <>
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <div className="card-split-container" style={{ minHeight: '600px', fontSize: '0.8rem' }}>
          {/* Left section - Text with horizontal two-line name */}
          <div className="card-split-text-section">
            <div className="card-split-name-vertical" style={{ fontSize: '1.9rem', lineHeight: 1.05 }}>
              <span className="card-split-name-line">{name?.split(' ')[0] || name}</span>
              {name?.split(' ')[1] && (
                <span className="card-split-name-line">{name?.split(' ')[1]}</span>
              )}
            </div>
            {title && (
              <div className="card-split-title-script" style={{ fontSize: '0.95rem' }}>
                {title}
              </div>
            )}
          </div>

          {/* Right section - Photo */}
          <div className="card-split-photo-section">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={name}
                className="card-split-photo"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#E8E8E8' }} />
            )}
          </div>

          {/* Contact footer */}
          <div className="card-split-contact-footer" style={{ fontSize: '0.75rem' }}>
            {phone && (
              <div className="card-split-contact-item">
                <span>{phone}</span>
                <svg className="contact-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            )}
            {email && (
              <div className="card-split-contact-item">
                <span>{email}</span>
                <svg className="contact-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {company && (
              <div className="card-split-contact-item">
                <span>{company}</span>
                <svg className="contact-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}

            {/* Decorative shapes - scaled down */}
            <div className="card-split-decorative-shapes" style={{ width: '60px', height: '60px' }}>
              <svg viewBox="0 0 120 120">
                <polygon points="60,10 110,110 10,110" fill="none" stroke="#D4AF37" strokeWidth="2" />
                <polygon points="70,25 120,115 30,115" fill="#B4E7CE" opacity="0.55" />
                <polygon points="50,35 95,115 15,115" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.65" />
              </svg>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Photographer Wave Template Layout
  if (isPhotographerWave) {
    return (
      <>
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <div className="card-container" style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Photo Section with Wave Divider */}
          <div className="card-photo-section">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Cover" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', position: 'absolute', top: 0, left: 0 }} />
            )}
            
            {/* Vertical Name Text */}
            <div className="photographer-name-vertical">
              {name}
            </div>

            {/* Wave Divider */}
            <div className="card-wave-divider">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M0,0 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z" />
              </svg>
            </div>
          </div>

          {/* Info Section */}
          <div className="card-info-section">
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#2C2C2C' }}>
              {name}
            </h1>
            {title && (
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                {title}
              </p>
            )}
            {company && (
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
                {company}
              </p>
            )}

            {/* Contact Info */}
            <div style={{ marginTop: '1rem' }}>
              {email && (
                <div className="contact-info-item">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span style={{ fontSize: '0.875rem' }}>{email}</span>
                </div>
              )}
              {phone && (
                <div className="contact-info-item">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span style={{ fontSize: '0.875rem' }}>{phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (layout === 'horizontal') {
    return (
      <>
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <div 
          className={containerClasses}
          style={{ backgroundColor }}
        >
          <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 truncate">{name}</h1>
            <p className="text-indigo-600 font-medium mb-1 truncate">{title}</p>
            <p className="text-gray-600 text-sm mb-4 truncate">{company}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (layout === 'center') {
    return (
      <>
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        <div 
          className={`${containerClasses} text-center`}
          style={{ backgroundColor }}
        >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-32 h-32 rounded-full object-cover mx-auto mb-4" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{name}</h1>
        <p className="text-indigo-600 font-medium mb-1">{title}</p>
        <p className="text-gray-600 text-sm mb-6">{company}</p>
        <div className="space-y-3 text-sm max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="truncate">{phone}</span>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Default: vertical layout
  return (
    <>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div 
        className={containerClasses}
        style={{ backgroundColor }}
      >
      <div className="flex flex-col items-center text-center mb-6">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-28 h-28 rounded-full object-cover mb-4" />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{name}</h1>
        <p className="text-indigo-600 font-medium mb-1">{title}</p>
        <p className="text-gray-600 text-sm">{company}</p>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3 text-gray-700 p-3 bg-gray-50 rounded-lg">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="break-all">{email}</span>
        </div>
        <div className="flex items-start gap-3 text-gray-700 p-3 bg-gray-50 rounded-lg">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{phone}</span>
        </div>
      </div>
    </div>
    </>
  );
}
