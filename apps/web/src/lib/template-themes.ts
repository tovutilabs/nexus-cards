/**
 * Template Theme Utilities
 * 
 * Provides functions to extract and apply template themes from custom CSS.
 */

import { TemplateTheme } from '@nexus-cards/shared';

/**
 * Extracts a template theme from custom CSS by detecting template-specific class names
 * and CSS variables.
 * 
 * @param customCss - The custom CSS string from the card styling
 * @returns TemplateTheme object if a known template is detected, null otherwise
 */
export function getTemplateTheme(customCss?: string | null): TemplateTheme | null {
  if (!customCss) return null;

  // Detect Basic Business template
  if (customCss.includes('card-basic-container')) {
    return {
      id: 'basic-business',
      name: 'Basic Business',
      layout: 'vertical',
      colors: {
        primary: '#6366f1', // Indigo
        secondary: '#8b5cf6', // Purple
        text: '#111827',
        accent: '#6366f1',
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        headingSize: '1.75rem',
        bodySize: '0.95rem',
        headingWeight: 700,
        bodyWeight: 400,
      },
      spacing: {
        section: '1.5rem',
        component: '1.25rem',
        item: '0.75rem',
      },
      style: 'modern',
      componentDefaults: {
        showBorders: false,
        showShadows: true,
        roundedCorners: true,
        iconStyle: 'solid',
      },
      defaultVariants: {
        PROFILE: 'basic-business',
        CONTACT: 'basic-business',
        SOCIAL_LINKS: 'basic-business',
      },
      supportedComponents: ['PROFILE', 'CONTACT', 'SOCIAL_LINKS'],
    };
  }

  // Detect Photographer Split template
  if (customCss.includes('card-split-container')) {
    return {
      id: 'photographer-split',
      name: 'Photographer Split',
      layout: 'split',
      colors: {
        primary: extractCssVariable(customCss, '--template-primary-bg') || '#C8C8C8',
        secondary: extractCssVariable(customCss, '--template-secondary-bg') || '#E8E8E8',
        text: extractCssVariable(customCss, '--template-text-color') || '#000000',
        accent: extractCssVariable(customCss, '--template-accent-color') || '#D4AF37',
        border: extractCssVariable(customCss, '--template-border-color') || '#000000',
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        headingSize: '1.5rem',
        bodySize: '0.95rem',
        headingWeight: 700,
        bodyWeight: 400,
      },
      spacing: {
        section: extractCssVariable(customCss, '--template-section-spacing') || '2rem',
        component: extractCssVariable(customCss, '--template-component-spacing') || '1.5rem',
        item: extractCssVariable(customCss, '--template-item-spacing') || '1rem',
      },
      style: 'minimal',
      componentDefaults: {
        showBorders: false,
        showShadows: false,
        roundedCorners: false,
        iconStyle: 'outline',
      },
    };
  }

  // Detect Photographer Wave templates (Warm, Rose, Minimal)
  if (customCss.includes('card-wave-divider')) {
    // Extract the accent color from the CSS to determine which variant
    const infoSectionColor = extractBackgroundColor(customCss, '.card-info-section') || '#D4A574';
    
    let variantName = 'Wave';
    if (infoSectionColor.toLowerCase().includes('d4a574')) {
      variantName = 'Warm';
    } else if (infoSectionColor.toLowerCase().includes('d4a593')) {
      variantName = 'Rose';
    } else if (infoSectionColor.toLowerCase().includes('e8e8e8')) {
      variantName = 'Minimal';
    }

    return {
      id: 'photographer-wave',
      name: `Photographer ${variantName}`,
      layout: 'vertical',
      colors: {
        primary: infoSectionColor,
        secondary: '#FFFFFF',
        text: '#2C2C2C',
        accent: infoSectionColor,
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        headingSize: '1.5rem',
        bodySize: '1rem',
        headingWeight: 700,
        bodyWeight: 400,
      },
      spacing: {
        section: '2rem',
        component: '1.5rem',
        item: '1rem',
      },
      style: 'modern',
      componentDefaults: {
        showBorders: false,
        showShadows: true,
        roundedCorners: true,
        iconStyle: 'solid',
      },
    };
  }

  return null;
}

/**
 * Extracts a CSS variable value from a CSS string
 */
function extractCssVariable(css: string, variableName: string): string | null {
  const regex = new RegExp(`${variableName}:\\s*([^;]+);`, 'i');
  const match = css.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extracts a background color from a CSS class definition
 */
function extractBackgroundColor(css: string, className: string): string | null {
  // Match the class definition and find background color
  const classRegex = new RegExp(`${className.replace('.', '\\.')}\\s*\\{([^}]+)\\}`, 'is');
  const classMatch = css.match(classRegex);
  
  if (!classMatch) return null;
  
  const classContent = classMatch[1];
  const bgColorRegex = /background(?:-color)?:\s*([^;]+);/i;
  const bgMatch = classContent.match(bgColorRegex);
  
  return bgMatch ? bgMatch[1].trim() : null;
}

/**
 * Applies template theme styles to a component's base styles
 * 
 * @param baseStyles - The component's default styles
 * @param theme - The template theme to apply
 * @returns Merged styles object
 */
export function applyTemplateStyles(
  baseStyles: React.CSSProperties,
  theme: TemplateTheme | null | undefined
): React.CSSProperties {
  if (!theme) return baseStyles;

  return {
    ...baseStyles,
    backgroundColor: theme.colors.secondary,
    color: theme.colors.text,
    padding: theme.spacing.component,
    borderRadius: theme.componentDefaults.roundedCorners ? '8px' : '0',
    border: theme.componentDefaults.showBorders ? `1px solid ${theme.colors.border || '#e5e7eb'}` : 'none',
    boxShadow: theme.componentDefaults.showShadows ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
  };
}

/**
 * Gets spacing value from theme or falls back to default
 */
export function getThemeSpacing(
  theme: TemplateTheme | null | undefined,
  type: 'section' | 'component' | 'item',
  fallback: string
): string {
  return theme?.spacing[type] || fallback;
}

/**
 * Gets color from theme or falls back to default
 */
export function getThemeColor(
  theme: TemplateTheme | null | undefined,
  type: keyof TemplateTheme['colors'],
  fallback: string
): string {
  return theme?.colors[type] || fallback;
}
