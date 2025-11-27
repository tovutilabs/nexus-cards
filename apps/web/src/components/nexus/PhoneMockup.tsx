'use client';

import { ReactNode } from 'react';

interface PhoneMockupProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
  deviceColor?: 'black' | 'white' | 'midnight' | 'purple' | 'silver';
  variant?: 'iphone' | 'android' | 'ipad';
}

export function PhoneMockup({ children, theme = 'light', deviceColor = 'midnight', variant = 'iphone' }: PhoneMockupProps) {
  const deviceColors = {
    black: 'bg-gray-900',
    white: 'bg-gray-100',
    silver: 'bg-gradient-to-br from-gray-300 to-gray-400',
    midnight: 'bg-gradient-to-br from-blue-900 to-purple-900',
    purple: 'bg-gradient-to-br from-purple-600 to-pink-600',
  };

  const dimensions = {
    iphone: { width: '320px', height: '650px', rounded: '3rem', padding: '2.5' },
    android: { width: '340px', height: '680px', rounded: '2.5rem', padding: '2' },
    ipad: { width: '500px', height: '700px', rounded: '2rem', padding: '3' },
  };

  const { width, height, rounded, padding } = dimensions[variant];

  // Android uses punch-hole camera, iPhone uses dynamic island, iPad has thicker bezels
  const renderNotch = () => {
    if (variant === 'android') {
      return (
        <div className="absolute top-4 right-8 w-3 h-3 bg-black rounded-full z-20 border-2 border-gray-800" />
      );
    }
    if (variant === 'iphone') {
      return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-20">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-800 rounded-full" />
        </div>
      );
    }
    return null; // iPad has no notch
  };

  const buttonPositions = {
    iphone: { power: 'right-0 top-32 h-16', volumeUp: 'left-0 top-28 h-12', volumeDown: 'left-0 top-44 h-12' },
    android: { power: 'right-0 top-28 h-14', volumeUp: 'left-0 top-24 h-10', volumeDown: 'left-0 top-40 h-10' },
    ipad: { power: 'top-20 right-0 h-12', volumeUp: 'top-40 right-0 h-10', volumeDown: 'top-56 right-0 h-10' },
  };

  const buttons = buttonPositions[variant];
  const screenRadius = variant === 'ipad' ? '1.5rem' : '2.5rem';

  return (
    <div className="relative mx-auto" style={{ width, height }}>
      {/* Phone Frame */}
      <div 
        className={`absolute inset-0 ${deviceColors[deviceColor]} shadow-2xl`}
        style={{ 
          borderRadius: rounded,
          padding: variant === 'iphone' ? '10px' : variant === 'android' ? '8px' : '12px'
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
            {variant !== 'ipad' && (
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
    avatarUrl?: string;
  };
}

export function CardPreview({
  fontFamily = 'inter',
  fontSize = 'base',
  layout = 'vertical',
  backgroundColor = '#ffffff',
  borderRadius = 'md',
  shadowPreset = 'sm',
  cardData = {},
}: CardPreviewProps) {
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
    avatarUrl,
  } = cardData;

  const containerClasses = `
    ${fontFamilyMap[fontFamily]}
    ${fontSizeMap[fontSize]}
    ${borderRadiusMap[borderRadius]}
    ${shadowMap[shadowPreset]}
    p-6 mt-4
  `.trim();

  if (layout === 'horizontal') {
    return (
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
    );
  }

  if (layout === 'center') {
    return (
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
    );
  }

  // Default: vertical layout
  return (
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
  );
}
