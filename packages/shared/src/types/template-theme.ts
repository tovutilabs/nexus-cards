/**
 * Template Theme System
 * 
 * Defines the interface for template themes that allow components
 * to adapt their styling to match the active template's design language.
 */

export interface TemplateTheme {
  /** Unique identifier for the theme */
  id: string;
  
  /** Display name of the template */
  name: string;
  
  /** Layout type that influences component positioning */
  layout: 'horizontal' | 'vertical' | 'split' | 'centered' | 'image-first';
  
  /** Color palette */
  colors: {
    /** Main background color */
    primary: string;
    
    /** Alternate/secondary background color */
    secondary: string;
    
    /** Primary text color */
    text: string;
    
    /** Accent/highlight color */
    accent: string;
    
    /** Border color (optional) */
    border?: string;
  };
  
  /** Typography settings */
  typography: {
    /** Font family stack */
    fontFamily: string;
    
    /** Heading font size */
    headingSize: string;
    
    /** Body text font size */
    bodySize: string;
    
    /** Heading font weight */
    headingWeight: number;
    
    /** Body text font weight */
    bodyWeight: number;
  };
  
  /** Spacing scale */
  spacing: {
    /** Space between major sections */
    section: string;
    
    /** Space between components */
    component: string;
    
    /** Space between items within a component */
    item: string;
  };
  
  /** Overall style preference */
  style: 'minimal' | 'decorative' | 'bold' | 'classic' | 'modern';
  
  /** Default preferences for component styling */
  componentDefaults: {
    /** Whether components should show borders */
    showBorders: boolean;
    
    /** Whether components should have shadows */
    showShadows: boolean;
    
    /** Whether corners should be rounded */
    roundedCorners: boolean;
    
    /** Icon style preference */
    iconStyle: 'solid' | 'outline' | 'minimal';
  };
  
  /** Default variant names for each component type (optional) */
  defaultVariants?: Record<string, string>;
  
  /** List of component types that this template explicitly supports (optional) */
  supportedComponents?: string[];
}
