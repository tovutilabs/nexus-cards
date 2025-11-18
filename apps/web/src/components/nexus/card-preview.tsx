import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';

export interface CardPreviewProps {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  bio?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
  };
  className?: string;
}

export function CardPreview({
  firstName,
  lastName,
  jobTitle,
  company,
  email,
  phone,
  website,
  location,
  bio,
  theme,
  className,
}: CardPreviewProps) {
  const primaryColor = theme?.primaryColor || '#2D3494';
  const backgroundColor = theme?.backgroundColor || '#FFFFFF';

  return (
    <Card
      className={cn('overflow-hidden max-w-sm mx-auto', className)}
      style={{ backgroundColor }}
    >
      <div
        className="h-24 bg-gradient-to-r from-brand-primary to-brand-secondary"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        }}
      />
      <div className="relative px-6 pb-6">
        <div className="flex flex-col items-center -mt-12">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-brand-primary">
            {firstName[0]}
            {lastName[0]}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {firstName} {lastName}
          </h2>
          {jobTitle && <p className="text-md text-gray-600 mt-1">{jobTitle}</p>}
          {company && <p className="text-sm text-gray-500">{company}</p>}
          {location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
              <MapPin className="h-3 w-3" />
              {location}
            </div>
          )}
          {bio && (
            <p className="text-center text-sm text-gray-600 mt-4 line-clamp-3">{bio}</p>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {email && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Mail className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-900 truncate">{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-gray-900">{phone}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-900 truncate">{website}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
