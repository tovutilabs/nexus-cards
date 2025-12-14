import React from 'react';
import { CardComponent, CardComponentRendererProps } from './types';
import { ProfileComponent } from './ProfileComponent';
import { AboutComponent } from './AboutComponent';
import { ContactComponent } from './ContactComponent';
import { SocialLinksComponent } from './SocialLinksComponent';
import { GalleryComponent } from './GalleryComponent';
import { CustomLinksComponent } from './CustomLinksComponent';
import { VideoComponent } from './VideoComponent';
import { CalendarComponent } from './CalendarComponent';
import { FormComponent } from './FormComponent';
import { TestimonialsComponent } from './TestimonialsComponent';
import { ServicesComponent } from './ServicesComponent';

/**
 * CardComponentRenderer
 * 
 * Main renderer that switches between different component types.
 * Acts as the central hub for rendering all card components.
 */
export function CardComponentRenderer({
  component,
  cardData,
  isEditing = false,
  onEdit,
  onDelete,
  onToggle,
  templateTheme,
}: CardComponentRendererProps) {
  // Apply component background styles (moved before early return)
  const backgroundStyle = React.useMemo(() => {
    const style: React.CSSProperties = {};

    if (component.backgroundType === 'solid' && component.backgroundColor) {
      style.backgroundColor = component.backgroundColor;
    } else if (component.backgroundType === 'gradient') {
      const start = component.backgroundGradientStart || '#ffffff';
      const end = component.backgroundGradientEnd || '#f0f0f0';
      style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    } else if (component.backgroundType === 'image' && component.backgroundImageUrl) {
      style.backgroundImage = `url(${component.backgroundImageUrl})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    }

    return style;
  }, [component]);

  // Don't render disabled components in preview mode
  if (!component.enabled && !isEditing) {
    return null;
  }

  // Render the appropriate component based on type
  const renderComponent = () => {
    const baseProps = {
      component,
      cardData,
      isEditing,
      onEdit,
      onDelete,
      onToggle,
      templateTheme,
    };

    switch (component.type) {
      case 'PROFILE':
        return <ProfileComponent {...baseProps} />;
      
      case 'ABOUT':
        return <AboutComponent {...baseProps} />;
      
      case 'CONTACT':
        return <ContactComponent {...baseProps} />;
      
      case 'SOCIAL_LINKS':
        return <SocialLinksComponent {...baseProps} />;
      
      case 'GALLERY':
        return <GalleryComponent {...baseProps} />;
      
      case 'CUSTOM_LINKS':
        return <CustomLinksComponent {...baseProps} />;
      
      case 'VIDEO':
        return <VideoComponent {...baseProps} />;
      
      case 'CALENDAR':
        return <CalendarComponent {...baseProps} />;
      
      case 'FORM':
        return <FormComponent {...baseProps} />;
      
      case 'TESTIMONIALS':
        return <TestimonialsComponent {...baseProps} />;
      
      case 'SERVICES':
        return <ServicesComponent {...baseProps} />;
      
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            Unknown component type: {component.type}
          </div>
        );
    }
  };

  return (
    <div
      className="card-component-wrapper"
      style={backgroundStyle}
      data-component-id={component.id}
      data-component-type={component.type}
      data-component-order={component.order}
    >
      {renderComponent()}
    </div>
  );
}
