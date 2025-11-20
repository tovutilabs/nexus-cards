'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Share2,
  Download,
  MessageSquare,
} from 'lucide-react';
import {
  getCardClasses,
  getCardStyles,
  getLayoutContainerClass,
  getTextSizeClass,
} from '@/lib/card-styles';

interface CardData {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  bio?: string;
  socialLinks?: Record<string, string>;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
  };
  secondaryLanguage?: string;
  firstName_es?: string;
  lastName_es?: string;
  jobTitle_es?: string;
  company_es?: string;
  bio_es?: string;
  logoUrl?: string;
  fontFamily?: string;
  fontSize?: string;
  layout?: string;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  borderRadius?: string;
  shadowPreset?: string;
  customCss?: string;
}

export default function PublicCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const nfcUid = searchParams.get('uid');

  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [language, setLanguage] = useState<'primary' | 'secondary'>('primary');

  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  useEffect(() => {
    loadCard();
  }, [slug, nfcUid]);

  const loadCard = async () => {
    try {
      const apiClient = createApiClient();
      const url = nfcUid
        ? `/public/cards/${slug}?uid=${nfcUid}`
        : `/public/cards/${slug}`;
      const data = await apiClient.get<CardData>(url);
      setCard(data);
    } catch (error) {
      console.error('Failed to load card:', error);
      setCard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const apiClient = createApiClient();
      const url = nfcUid
        ? `/public/cards/${slug}/contacts?uid=${nfcUid}`
        : `/public/cards/${slug}/contacts`;

      await apiClient.post(url, contactForm);
      setSubmitted(true);
      setContactForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Failed to submit contact:', error);
      alert(error.message || 'Failed to submit contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card?.firstName} ${card?.lastName}`,
          text:
            card?.bio || `Connect with ${card?.firstName} ${card?.lastName}`,
          url,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const downloadVCard = () => {
    if (!card) return;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${card.firstName} ${card.lastName}
N:${card.lastName};${card.firstName};;;
${card.jobTitle ? `TITLE:${card.jobTitle}\n` : ''}${card.company ? `ORG:${card.company}\n` : ''}${card.email ? `EMAIL:${card.email}\n` : ''}${card.phone ? `TEL:${card.phone}\n` : ''}${card.website ? `URL:${card.website}\n` : ''}${card.bio ? `NOTE:${card.bio}\n` : ''}END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.firstName}-${card.lastName}.vcf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading card...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-12 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Card Not Found
          </h1>
          <p className="text-gray-600">
            The card you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </Card>
      </div>
    );
  }

  const cardUrl =
    typeof window !== 'undefined' ? window.location.origin + `/p/${slug}` : '';
  const primaryColor = card.theme?.primaryColor || '#4F46E5';

  const hasSecondaryLanguage =
    card.secondaryLanguage &&
    (card.firstName_es ||
      card.lastName_es ||
      card.jobTitle_es ||
      card.company_es ||
      card.bio_es);

  const displayName =
    language === 'secondary' && card.firstName_es && card.lastName_es
      ? `${card.firstName_es} ${card.lastName_es}`
      : `${card.firstName} ${card.lastName}`;

  const displayJobTitle =
    language === 'secondary' && card.jobTitle_es
      ? card.jobTitle_es
      : card.jobTitle;

  const displayCompany =
    language === 'secondary' && card.company_es
      ? card.company_es
      : card.company;

  const displayBio =
    language === 'secondary' && card.bio_es ? card.bio_es : card.bio;

  const cardClasses = getCardClasses({
    borderRadius: card.borderRadius || 'md',
    shadowPreset: card.shadowPreset || 'md',
  });

  const cardStyles = getCardStyles({
    backgroundType: card.backgroundType || 'solid',
    backgroundColor: card.backgroundColor || primaryColor,
    backgroundImage: card.backgroundImage,
  });

  const layoutClass = getLayoutContainerClass(card.layout || 'vertical');
  const textSizeClass = getTextSizeClass(card.fontSize || 'base');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {card.customCss && (
        <style dangerouslySetInnerHTML={{ __html: card.customCss }} />
      )}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Main Card */}
        <Card className={`overflow-hidden ${cardClasses}`} style={cardStyles}>
          {/* Header with gradient and language switcher */}
          <div
            className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            {hasSecondaryLanguage && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() =>
                    setLanguage(
                      language === 'primary' ? 'secondary' : 'primary'
                    )
                  }
                  className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-white/30 transition-colors flex items-center gap-2"
                  aria-label="Switch language"
                >
                  <Globe className="h-4 w-4" />
                  {language === 'primary' ? 'ES' : 'EN'}
                </button>
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className={`relative px-6 pb-6 ${layoutClass} ${textSizeClass}`}>
            <div className="flex flex-col items-center -mt-16">
              {/* Avatar or Logo */}
              {card.logoUrl ? (
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden">
                  <img
                    src={card.logoUrl}
                    alt={`${displayName} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-indigo-600">
                  {card.firstName[0]}
                  {card.lastName[0]}
                </div>
              )}

              <h1 className="mt-4 text-3xl font-bold text-gray-900">
                {displayName}
              </h1>

              {displayJobTitle && (
                <p className="text-lg text-gray-600 mt-1">{displayJobTitle}</p>
              )}

              {displayCompany && (
                <p className="text-md text-gray-500 mt-1">{displayCompany}</p>
              )}

              {card.location && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <MapPin className="h-4 w-4" />
                  {card.location}
                </div>
              )}

              {displayBio && (
                <p className="text-center text-gray-600 mt-4 max-w-lg">
                  {displayBio}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              {card.email && (
                <a
                  href={`mailto:${card.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-gray-900">{card.email}</span>
                </a>
              )}

              {card.phone && (
                <a
                  href={`tel:${card.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-900">{card.phone}</span>
                </a>
              )}

              {card.website && (
                <a
                  href={card.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-900">{card.website}</span>
                </a>
              )}
            </div>

            {/* Social Links */}
            {card.socialLinks && Object.keys(card.socialLinks).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Connect
                </p>
                <div className="flex gap-3">
                  {card.socialLinks.linkedin && (
                    <a
                      href={card.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <Linkedin className="h-5 w-5 text-white" />
                    </a>
                  )}
                  {card.socialLinks.twitter && (
                    <a
                      href={card.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-600 transition-colors"
                    >
                      <Twitter className="h-5 w-5 text-white" />
                    </a>
                  )}
                  {card.socialLinks.github && (
                    <a
                      href={card.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-900 transition-colors"
                    >
                      <Github className="h-5 w-5 text-white" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowContactForm(!showContactForm)}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Exchange</span>
              </Button>
              <Button
                variant="outline"
                onClick={downloadVCard}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Download className="h-5 w-5" />
                <span className="text-xs">Save</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Contact Exchange Form */}
        {showContactForm && (
          <Card className="mt-6 p-6 shadow-xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Contact Exchanged!
                </h3>
                <p className="text-gray-600">
                  Thank you for connecting. {card.firstName} will be in touch
                  soon.
                </p>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setShowContactForm(false);
                  }}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Exchange Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={contactForm.firstName}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          firstName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={contactForm.lastName}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          lastName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        company: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Message (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={contactForm.notes}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* QR Code */}
        {!showContactForm && (
          <Card className="mt-6 p-6 text-center shadow-xl">
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            {showQR && cardUrl && (
              <div className="mt-4 inline-block p-4 bg-white rounded-lg">
                <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                  QR Code
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Scan to save contact
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by <span className="font-semibold">Nexus Cards</span>
          </p>
          <p className="mt-1">
            <a href="https://nexus.cards" className="hover:text-indigo-600">
              Create your digital business card
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
