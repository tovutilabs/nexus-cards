import React from 'react';
import { CardComponentRendererProps, ContactConfig } from './types';
import { Mail, Phone, MessageSquare, Send, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { applyTemplateStyles } from '@/lib/template-themes';

/**
 * ContactComponent
 * 
 * Renders contact action buttons (email, phone, SMS, WhatsApp, custom).
 * Users can click these buttons to initiate contact actions.
 */
export function ContactComponent({
  component,
  cardData,
  isEditing = false,
  templateTheme,
}: CardComponentRendererProps) {
  const config = component.config as ContactConfig;

  // Default values
  const showEmail = config.showEmail !== false;
  const showPhone = config.showPhone !== false;
  const showSMS = config.showSMS !== false;
  const showWhatsApp = config.showWhatsApp !== false;
  const showWebsite = config.showWebsite !== false;
  const showAddress = config.showAddress !== false;
  const customButtons = config.customButtons || [];
  const layout = config.layout || 'grid';
  const variant = config.variant || 'default';

  // Apply template theme styling
  const containerStyles = applyTemplateStyles({
    padding: templateTheme?.spacing.component || '1.5rem',
    marginBottom: '1rem',
  }, templateTheme);

  // Extract contact data
  const email = cardData?.email || null;
  const phone = cardData?.phone || null;
  const website = cardData?.website || null;
  const address = cardData?.address || null;

  // Format phone for links (remove spaces, dashes, etc.)
  const formatPhoneForLink = (phoneNumber: string) => {
    return phoneNumber.replace(/[^\d+]/g, '');
  };

  // Basic Business variant - matches CardRenderView lines 185-233
  if (variant === 'basic-business' && layout === 'tiles') {
    const contactItems = [];

    if (showPhone && phone) {
      contactItems.push({
        id: 'phone',
        label: 'Phone',
        value: phone,
        icon: Phone,
        href: `tel:${formatPhoneForLink(phone)}`,
        className: 'card-basic-contact-item-phone',
      });
    }

    if (showEmail && email) {
      contactItems.push({
        id: 'email',
        label: 'Email',
        value: email,
        icon: Mail,
        href: `mailto:${email}`,
        className: 'card-basic-contact-item-email',
      });
    }

    if (showWebsite && website) {
      contactItems.push({
        id: 'website',
        label: 'Website',
        value: website,
        icon: Globe,
        href: website,
        className: 'card-basic-contact-item-website',
      });
    }

    if (showAddress && address) {
      contactItems.push({
        id: 'location',
        label: 'Location',
        value: address,
        icon: MapPin,
        href: `https://maps.google.com/?q=${encodeURIComponent(address)}`,
        className: 'card-basic-contact-item-location',
      });
    }

    if (contactItems.length === 0 && !isEditing) {
      return null;
    }

    return (
      <div className={cn('card-basic-contact', isEditing && !component.enabled && 'opacity-50')}>
        {contactItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.href}
              className={cn('card-basic-contact-item', item.className)}
              target={item.id === 'website' || item.id === 'location' ? '_blank' : undefined}
              rel={item.id === 'website' || item.id === 'location' ? 'noopener noreferrer' : undefined}
            >
              <div className="card-basic-contact-icon">
                <Icon />
              </div>
              <div className="card-basic-contact-content">
                <span className="card-basic-contact-label">{item.label}</span>
                <span className="card-basic-contact-value">{item.value}</span>
              </div>
            </a>
          );
        })}
        {isEditing && (
          <div className="mt-2 text-xs text-gray-500 italic">
            Contact Component (Basic Business)
          </div>
        )}
      </div>
    );
  }

  // Default variant
  const contactActions = [];

  // Email button
  if (showEmail && email) {
    contactActions.push({
      id: 'email',
      label: 'Email',
      icon: Mail,
      href: `mailto:${email}`,
      color: 'bg-blue-500 hover:bg-blue-600',
    });
  }

  // Phone button
  if (showPhone && phone) {
    contactActions.push({
      id: 'phone',
      label: 'Call',
      icon: Phone,
      href: `tel:${formatPhoneForLink(phone)}`,
      color: 'bg-green-500 hover:bg-green-600',
    });
  }

  // SMS button
  if (showSMS && phone) {
    contactActions.push({
      id: 'sms',
      label: 'SMS',
      icon: MessageSquare,
      href: `sms:${formatPhoneForLink(phone)}`,
      color: 'bg-purple-500 hover:bg-purple-600',
    });
  }

  // WhatsApp button
  if (showWhatsApp && phone) {
    contactActions.push({
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: Send,
      href: `https://wa.me/${formatPhoneForLink(phone)}`,
      color: 'bg-emerald-500 hover:bg-emerald-600',
    });
  }

  // Custom buttons
  customButtons.forEach((button, index) => {
    contactActions.push({
      id: `custom-${index}`,
      label: button.label,
      icon: Send, // Default icon for custom buttons
      href: button.url,
      color: 'bg-gray-500 hover:bg-gray-600',
    });
  });

  if (contactActions.length === 0 && !isEditing) {
    return null;
  }

  const layoutClasses = {
    grid: 'grid grid-cols-2 gap-3 sm:grid-cols-3',
    list: 'flex flex-col gap-2',
  };

  const headingColor = templateTheme?.colors.text || undefined;

  return (
    <div
      style={containerStyles}
      className={cn(
        'contact-component',
        isEditing && !component.enabled && 'opacity-50'
      )}
    >
      <h3 
        style={{ color: headingColor, fontSize: templateTheme?.typography.headingSize }}
        className="text-lg font-semibold mb-4"
      >
        Get in Touch
      </h3>

      {contactActions.length > 0 ? (
        <div className={cn(layoutClasses[layout])}>
          {contactActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                asChild
                className={cn(
                  'text-white font-medium shadow-md transition-all',
                  action.color,
                  layout === 'list' && 'w-full'
                )}
              >
                <a href={action.href} target="_blank" rel="noopener noreferrer">
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </a>
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-400 italic text-center py-4">
          No contact information available. Add email or phone in card settings.
        </div>
      )}

      {/* Editing indicator */}
      {isEditing && (
        <div className="mt-4 text-xs text-gray-500 italic">
          Contact Component
        </div>
      )}
    </div>
  );
}
