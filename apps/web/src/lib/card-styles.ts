// Card template styling utilities

export interface TemplateConfig {
  colorScheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  typography?: {
    fontFamily?: string;
    headingWeight?: string;
    bodyWeight?: string;
  };
  layout?: string;
  spacing?: string;
  borderRadius?: string;
  shadow?: string;
}

export interface CardStyle {
  fontFamily?: string;
  fontSize?: string;
  layout?: string;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  borderRadius?: string;
  shadowPreset?: string;
  customCss?: string;
  theme?: any;
}

export const fontFamilyMap: Record<string, string> = {
  inter: 'font-sans',
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
  display: 'font-display',
};

export const fontSizeMap: Record<string, { base: string; heading: string }> = {
  sm: { base: 'text-sm', heading: 'text-xl' },
  base: { base: 'text-base', heading: 'text-2xl' },
  lg: { base: 'text-lg', heading: 'text-3xl' },
};

export const borderRadiusMap: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export const shadowMap: Record<string, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

export function getCardClasses(style: CardStyle): string {
  const classes: string[] = [];

  // Font family
  if (style.fontFamily) {
    classes.push(fontFamilyMap[style.fontFamily] || 'font-sans');
  }

  // Border radius
  if (style.borderRadius) {
    classes.push(borderRadiusMap[style.borderRadius] || 'rounded-lg');
  }

  // Shadow
  if (style.shadowPreset) {
    classes.push(shadowMap[style.shadowPreset] || 'shadow-md');
  }

  return classes.join(' ');
}

export function getCardStyles(style: CardStyle): React.CSSProperties {
  const styles: React.CSSProperties = {};

  // Background
  if (style.backgroundType === 'solid' && style.backgroundColor) {
    styles.backgroundColor = style.backgroundColor;
  } else if (style.backgroundType === 'image' && style.backgroundImage) {
    styles.backgroundImage = `url(${style.backgroundImage})`;
    styles.backgroundSize = 'cover';
    styles.backgroundPosition = 'center';
  }

  // Theme colors (CSS custom properties)
  if (style.theme?.primary) {
    (styles as Record<string, string>)['--primary'] = style.theme.primary;
  }
  if (style.theme?.secondary) {
    (styles as Record<string, string>)['--secondary'] = style.theme.secondary;
  }
  if (style.theme?.accent) {
    (styles as Record<string, string>)['--accent'] = style.theme.accent;
  }

  return styles;
}

export function getLayoutContainerClass(layout?: string): string {
  switch (layout) {
    case 'horizontal':
      return 'flex flex-col md:flex-row gap-8 items-start';
    case 'center':
      return 'flex flex-col items-center text-center max-w-md mx-auto';
    case 'image-first':
      return 'flex flex-col gap-4';
    case 'compact':
      return 'flex flex-col gap-2';
    case 'vertical':
    default:
      return 'flex flex-col gap-6';
  }
}

export function getTextSizeClass(style: CardStyle, type: 'base' | 'heading'): string {
  const sizeMap = fontSizeMap[style.fontSize || 'base'];
  return sizeMap ? sizeMap[type] : type === 'heading' ? 'text-2xl' : 'text-base';
}
