import React from 'react';
import { CardComponentRendererProps, ContactConfig } from './types';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
}: CardComponentRendererProps) {
  const config = component.config as ContactConfig;

  // Default values
  const showEmail = config.showEmail !== false;
  const showPhone = config.showPhone !== false;
  const showSMS = config.showSMS !== false;
  const showWhatsApp = config.showWhatsApp !== false;
  const customButtons = config.customButtons || [];
  const layout = config.layout || 'grid';

  // Extract contact data
  const email = cardData?.email || null;
  const phone = cardData?.phone || null;

  // Format phone for links (remove spaces, dashes, etc.)
  const formatPhoneForLink = (phoneNumber: string) => {
    return phoneNumber.replace(/[^\d+]/g, '');
  };

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

  return (
    <div
      className={cn(
        'contact-component p-6',
        isEditing && !component.enabled && 'opacity-50'
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
