'use client';

import React, { useState } from 'react';
import { ComponentType } from './types';
import {
  User,
  FileText,
  Phone,
  Image as ImageIcon,
  Share2,
  Link as LinkIcon,
  Video,
  Calendar,
  MessageSquare,
  Star,
  Briefcase,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Component metadata including icons, descriptions, and tier requirements
 */
const COMPONENT_TYPES = [
  {
    type: 'PROFILE' as ComponentType,
    name: 'Profile',
    icon: User,
    description: 'Display your photo, name, title, and basic info',
    tier: 'FREE',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    type: 'ABOUT' as ComponentType,
    name: 'About',
    icon: FileText,
    description: 'Share your bio and background story',
    tier: 'FREE',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  {
    type: 'CONTACT' as ComponentType,
    name: 'Contact',
    icon: Phone,
    description: 'Add email, phone, and messaging buttons',
    tier: 'FREE',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    type: 'GALLERY' as ComponentType,
    name: 'Gallery',
    icon: ImageIcon,
    description: 'Showcase images in a beautiful grid or carousel',
    tier: 'PRO',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  },
  {
    type: 'SOCIAL_LINKS' as ComponentType,
    name: 'Social Links',
    icon: Share2,
    description: 'Link to your social media profiles',
    tier: 'PRO',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  },
  {
    type: 'CUSTOM_LINKS' as ComponentType,
    name: 'Custom Links',
    icon: LinkIcon,
    description: 'Add custom buttons linking anywhere',
    tier: 'PRO',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
  {
    type: 'VIDEO' as ComponentType,
    name: 'Video',
    icon: Video,
    description: 'Embed YouTube or Vimeo videos',
    tier: 'PRO',
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  {
    type: 'CALENDAR' as ComponentType,
    name: 'Calendar',
    icon: Calendar,
    description: 'Schedule meetings with Calendly or Google Calendar',
    tier: 'PREMIUM',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  {
    type: 'FORM' as ComponentType,
    name: 'Contact Form',
    icon: MessageSquare,
    description: 'Capture leads with custom form fields',
    tier: 'PREMIUM',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  },
  {
    type: 'TESTIMONIALS' as ComponentType,
    name: 'Testimonials',
    icon: Star,
    description: 'Display customer reviews and ratings',
    tier: 'PREMIUM',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  {
    type: 'SERVICES' as ComponentType,
    name: 'Services',
    icon: Briefcase,
    description: 'List your services or products',
    tier: 'PREMIUM',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
];

interface ComponentPaletteProps {
  userTier: 'FREE' | 'PRO' | 'PREMIUM';
  onAddComponent: (type: ComponentType) => void;
  disabledTypes?: ComponentType[];
  open?: boolean;
  onClose?: () => void;
}

/**
 * ComponentPalette
 * 
 * UI for selecting and adding new components to a card.
 * Shows available components filtered by user's subscription tier.
 */
export function ComponentPalette({
  userTier,
  onAddComponent,
  disabledTypes = [],
  open: externalOpen,
  onClose: externalOnClose,
}: ComponentPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnClose ? externalOnClose : (value: boolean) => setInternalOpen(value);

  // Tier hierarchy for filtering
  const tierLevel = { FREE: 1, PRO: 2, PREMIUM: 3 };

  // Filter components based on user tier
  const availableComponents = COMPONENT_TYPES.filter((component) => {
    return tierLevel[component.tier as keyof typeof tierLevel] <= tierLevel[userTier];
  });

  const unavailableComponents = COMPONENT_TYPES.filter((component) => {
    return tierLevel[component.tier as keyof typeof tierLevel] > tierLevel[userTier];
  });

  const handleAddComponent = (type: ComponentType) => {
    onAddComponent(type);
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <>
      {/* Component Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (externalOnClose && !open) {
          externalOnClose();
        } else {
          setInternalOpen(open);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Component</DialogTitle>
            <DialogDescription>
              Choose a component to add to your card. Components help you showcase different aspects of your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Available Components */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Available Components
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableComponents.map((component) => {
                  const Icon = component.icon;
                  const isDisabled = disabledTypes.includes(component.type);

                  return (
                    <button
                      key={component.type}
                      onClick={() => !isDisabled && handleAddComponent(component.type)}
                      disabled={isDisabled}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all',
                        isDisabled
                          ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md cursor-pointer'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', component.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {component.name}
                          </h4>
                          {isDisabled && (
                            <Badge variant="secondary" className="text-xs">
                              Added
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {component.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unavailable Components (locked for upgrade) */}
            {unavailableComponents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Upgrade to Unlock
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unavailableComponents.map((component) => {
                    const Icon = component.icon;

                    return (
                      <div
                        key={component.type}
                        className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 opacity-60 relative overflow-hidden"
                      >
                        <div className={cn('p-2 rounded-lg', component.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {component.name}
                            </h4>
                            <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                              {component.tier}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {component.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {userTier !== 'PREMIUM' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Upgrade to {userTier === 'FREE' ? 'PRO' : 'PREMIUM'}</strong> to unlock these components and more features!
                    </p>
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      View Plans
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
