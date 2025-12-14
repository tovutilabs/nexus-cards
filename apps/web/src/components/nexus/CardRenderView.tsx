'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Share2,
  Download,
  MessageSquare,
  MapPin,
  Building2,
  Briefcase,
} from 'lucide-react';
import { createApiClient } from '@/lib/api-client';
import { CardComponentRenderer } from '@/components/card-components/CardComponentRenderer';
import { getTemplateTheme } from '@/lib/template-themes';

interface CardRenderViewProps {
  card: any;
  nfcUid?: string;
}

export function CardRenderView({ card, nfcUid }: CardRenderViewProps) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  const { identityHeader, styling, components } = card;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const apiClient = createApiClient();
      const url = nfcUid
        ? `/public/cards/${card.slug}/contacts?uid=${nfcUid}`
        : `/public/cards/${card.slug}/contacts`;

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
      setTimeout(() => setShowContactForm(false), 2000);
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
          title: `${identityHeader.firstName} ${identityHeader.lastName}`,
          text: identityHeader.bio || `Connect with ${identityHeader.firstName} ${identityHeader.lastName}`,
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
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${identityHeader.firstName} ${identityHeader.lastName}
N:${identityHeader.lastName};${identityHeader.firstName};;;
${identityHeader.jobTitle ? `TITLE:${identityHeader.jobTitle}\n` : ''}${identityHeader.company ? `ORG:${identityHeader.company}\n` : ''}${identityHeader.email ? `EMAIL:${identityHeader.email}\n` : ''}${identityHeader.phone ? `TEL:${identityHeader.phone}\n` : ''}${identityHeader.website ? `URL:${identityHeader.website}\n` : ''}${identityHeader.bio ? `NOTE:${identityHeader.bio}\n` : ''}END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${identityHeader.firstName}-${identityHeader.lastName}.vcf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const containerClasses = `min-h-screen ${styling.backgroundType === 'solid' && styling.backgroundColor ? '' : 'bg-gray-50'}`;
  const containerStyle: React.CSSProperties = {};

  if (styling.backgroundType === 'solid' && styling.backgroundColor) {
    containerStyle.backgroundColor = styling.backgroundColor;
  } else if (styling.backgroundType === 'gradient' && styling.backgroundColor) {
    containerStyle.background = `linear-gradient(135deg, ${styling.backgroundColor} 0%, #f0f0f0 100%)`;
  } else if (styling.backgroundType === 'image' && styling.backgroundImage) {
    containerStyle.backgroundImage = `url(${styling.backgroundImage})`;
    containerStyle.backgroundSize = 'cover';
    containerStyle.backgroundPosition = 'center';
  }

  const fontFamily = styling.fontFamily || 'inter';
  const fontSize = styling.fontSize || 'base';
  const layout = styling.layout || 'vertical';
  
  // Detect template types
  const isBasic = styling.customCss?.includes('card-basic-container');
  const isPhotographerSplit = styling.customCss?.includes('card-split-container');
  const isPhotographerWave = styling.customCss?.includes('card-wave-divider') && styling.customCss?.includes('card-photo-section');
  const templateTheme = getTemplateTheme(styling.customCss);

  // Basic Card Template Layout
  if (isBasic) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
        {styling.customCss && (
          <style dangerouslySetInnerHTML={{ __html: styling.customCss }} />
        )}

        <div className="card-basic-container">
          <div className="card-basic-header">
            <div className="card-basic-avatar">
              {identityHeader.avatarUrl ? (
                <img
                  src={identityHeader.avatarUrl}
                  alt={`${identityHeader.firstName} ${identityHeader.lastName}`}
                  className="card-basic-avatar-img"
                />
              ) : (
                <div className="card-basic-avatar-fallback" />
              )}
            </div>
            <div className="card-basic-name">
              {identityHeader.firstName} {identityHeader.lastName}
            </div>
            {identityHeader.jobTitle && (
              <div className="card-basic-title">{identityHeader.jobTitle}</div>
            )}
            {identityHeader.company && (
              <div className="card-basic-company">{identityHeader.company}</div>
            )}
          </div>

          <div className="card-basic-contact">
            {identityHeader.phone && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon phone">
                  <Phone size={20} />
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Phone</div>
                  <div className="card-basic-contact-value">{identityHeader.phone}</div>
                </div>
              </div>
            )}

            {identityHeader.email && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon email">
                  <Mail size={20} />
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Email</div>
                  <div className="card-basic-contact-value">{identityHeader.email}</div>
                </div>
              </div>
            )}

            {identityHeader.website && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon website">
                  <Globe size={20} />
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Website</div>
                  <div className="card-basic-contact-value">{identityHeader.website}</div>
                </div>
              </div>
            )}

            {identityHeader.socialLinks?.address && (
              <div className="card-basic-contact-item">
                <div className="card-basic-contact-icon location">
                  <MapPin size={20} />
                </div>
                <div className="card-basic-contact-text">
                  <div className="card-basic-contact-label">Location</div>
                  <div className="card-basic-contact-value">{identityHeader.socialLinks.address}</div>
                </div>
              </div>
            )}
          </div>

          {identityHeader.socialLinks && (identityHeader.socialLinks.linkedinUrl || identityHeader.socialLinks.twitterUrl || identityHeader.socialLinks.githubUrl) && (
            <div className="card-basic-social">
              <div className="card-basic-social-title">Connect with me</div>
              <div className="card-basic-social-links">
                {identityHeader.socialLinks.linkedinUrl && (
                  <a
                    href={identityHeader.socialLinks.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-basic-social-link linkedin"
                  >
                    <Linkedin size={20} />
                  </a>
                )}
                {identityHeader.socialLinks.twitterUrl && (
                  <a
                    href={identityHeader.socialLinks.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-basic-social-link twitter"
                  >
                    <Twitter size={20} />
                  </a>
                )}
                {identityHeader.socialLinks.githubUrl && (
                  <a
                    href={identityHeader.socialLinks.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-basic-social-link github"
                  >
                    <Github size={20} />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="card-basic-actions">
            <button className="card-basic-button" onClick={downloadVCard}>
              Save Contact
            </button>
          </div>

          {components && components.length > 0 && (
            <div
              className="card-basic-components"
              style={{ padding: '1.25rem 1.5rem 2rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              {components
                .filter((c: any) => c.enabled)
                .sort((a: any, b: any) => a.order - b.order)
                .map((component: any) => (
                  <CardComponentRenderer
                    key={component.id}
                    component={component}
                    cardData={card}
                    isEditing={false}
                    templateTheme={templateTheme}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Photographer Split Template Layout
  if (isPhotographerSplit) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E8E8' }}>
        {styling.customCss && (
          <style dangerouslySetInnerHTML={{ __html: styling.customCss }} />
        )}

        <div className="card-split-container">
          {/* Left section - Text with horizontal two-line name */}
          <div className="card-split-text-section">
            <div className="card-split-name-vertical">
              <span className="card-split-name-line">{identityHeader.firstName}</span>
              <span className="card-split-name-line">{identityHeader.lastName}</span>
            </div>
            {identityHeader.jobTitle && (
              <div className="card-split-title-script">
                {identityHeader.jobTitle}
              </div>
            )}
          </div>

          {/* Right section - Photo */}
          <div className="card-split-photo-section">
            {identityHeader.avatarUrl ? (
              <img 
                src={identityHeader.avatarUrl} 
                alt={`${identityHeader.firstName} ${identityHeader.lastName}`}
                className="card-split-photo"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#E8E8E8' }} />
            )}
          </div>

          {/* Contact footer */}
          <div className="card-split-contact-footer">
            {identityHeader.phone && (
              <div className="card-split-contact-item">
                <span>{identityHeader.phone}</span>
                <Phone className="contact-icon" />
              </div>
            )}
            {identityHeader.email && (
              <div className="card-split-contact-item">
                <span>{identityHeader.email}</span>
                <Mail className="contact-icon" />
              </div>
            )}
            {identityHeader.address && (
              <div className="card-split-contact-item">
                <span>{identityHeader.address}</span>
                <MapPin className="contact-icon" />
              </div>
            )}
            {identityHeader.website && (
              <div className="card-split-contact-item">
                <span>{identityHeader.website}</span>
                <Globe className="contact-icon" />
              </div>
            )}

            {/* Decorative shapes */}
            <div className="card-split-decorative-shapes">
              <svg viewBox="0 0 100 100">
                <polygon points="60,10 110,110 10,110" fill="none" stroke="#D4AF37" strokeWidth="2" />
                <polygon points="70,25 120,115 30,115" fill="#B4E7CE" opacity="0.55" />
                <polygon points="50,35 95,115 15,115" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.65" />
              </svg>
            </div>
          </div>

          {/* Components section */}
          {components && components.length > 0 && (
            <div className="card-split-components-section">
              {components
                .filter((c: any) => c.enabled)
                .sort((a: any, b: any) => a.order - b.order)
                .map((component: any) => (
                  <CardComponentRenderer
                    key={component.id}
                    component={component}
                    cardData={card}
                    isEditing={false}
                    templateTheme={templateTheme}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Action buttons overlay */}
        <div style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.75rem',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.95)',
          padding: '1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <Button onClick={downloadVCard} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Save Contact
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={() => setShowContactForm(!showContactForm)}
            variant="default"
            size="sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}>
            <Card className="p-6 max-w-md w-full" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">Thanks for connecting. I'll get back to you soon.</p>
                  <Button onClick={() => { setShowContactForm(false); setSubmitted(false); }}>
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-4">Send a Message</h3>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={contactForm.firstName}
                          onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={contactForm.lastName}
                          onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={contactForm.notes}
                        onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={submitting} className="flex-1">
                        {submitting ? 'Sending...' : 'Send Message'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowContactForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Photographer Wave Template Layout
  if (isPhotographerWave) {
    return (
      <div className={containerClasses} style={containerStyle}>
        {styling.customCss && (
          <style dangerouslySetInnerHTML={{ __html: styling.customCss }} />
        )}

        <div className="container max-w-4xl mx-auto p-4 py-8">
          <div className="card-container" style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {/* Photo Section with Wave Divider */}
            <div className="card-photo-section">
              {identityHeader.coverImageUrl || identityHeader.avatarUrl ? (
                <img 
                  src={identityHeader.coverImageUrl || identityHeader.avatarUrl} 
                  alt="Cover" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', position: 'absolute', top: 0, left: 0 }} />
              )}
              
              {/* Vertical Name Text */}
              <div className="photographer-name-vertical">
                {identityHeader.firstName} {identityHeader.lastName}
              </div>

              {/* Wave Divider */}
              <div className="card-wave-divider">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                  <path d="M0,0 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z" />
                </svg>
              </div>
            </div>

            {/* Info Section */}
            <div className="card-info-section">
              {/* Identity Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#2C2C2C' }}>
                  {identityHeader.firstName} {identityHeader.lastName}
                </h1>
                {identityHeader.jobTitle && (
                  <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    {identityHeader.jobTitle}
                  </p>
                )}
                {identityHeader.company && (
                  <p style={{ fontSize: '0.875rem', color: '#666' }}>
                    {identityHeader.company}
                  </p>
                )}
                {identityHeader.bio && (
                  <p style={{ fontSize: '0.875rem', color: '#2C2C2C', marginTop: '0.75rem', lineHeight: '1.5' }}>
                    {identityHeader.bio}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                {identityHeader.email && (
                  <div className="contact-info-item">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${identityHeader.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {identityHeader.email}
                    </a>
                  </div>
                )}
                {identityHeader.phone && (
                  <div className="contact-info-item">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${identityHeader.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {identityHeader.phone}
                    </a>
                  </div>
                )}
                {identityHeader.website && (
                  <div className="contact-info-item">
                    <Globe className="w-4 h-4" />
                    <a href={identityHeader.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      Website
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {identityHeader.socialLinks && Object.keys(identityHeader.socialLinks).length > 0 && (
                <div className="social-icons-row">
                  {identityHeader.socialLinks.linkedin && (
                    <a href={identityHeader.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {identityHeader.socialLinks.twitter && (
                    <a href={identityHeader.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-icon">
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {identityHeader.socialLinks.github && (
                    <a href={identityHeader.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-icon">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <Button onClick={downloadVCard} variant="outline" size="sm" style={{ flex: 1 }}>
                  <Download className="w-4 h-4 mr-2" />
                  Save Contact
                </Button>
                <Button onClick={handleShare} variant="outline" size="sm" style={{ flex: 1 }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={() => setShowContactForm(!showContactForm)}
                  variant="default"
                  size="sm"
                  style={{ flex: '1 1 100%' }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          {showContactForm && (
            <Card className="p-6 mt-6 max-w-xl mx-auto">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
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
                    Thank you!
                  </h3>
                  <p className="text-gray-600">
                    Your information has been shared successfully.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Share Your Contact Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        required
                        value={contactForm.firstName}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, firstName: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        required
                        value={contactForm.lastName}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
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

                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={contactForm.company}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, company: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={contactForm.notes}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, notes: e.target.value })
                      }
                      placeholder="Add a note about how you met or what you discussed..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? 'Submitting...' : 'Share Contact'}
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

          {/* Card Components */}
          <div className="space-y-6 mt-6">
            {components
              .filter((c: any) => c.enabled)
              .sort((a: any, b: any) => a.order - b.order)
              .map((component: any) => (
                <CardComponentRenderer
                  key={component.id}
                  component={component}
                  cardData={card}
                  isEditing={false}
                />
              ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Powered by{' '}
              <a
                href="https://nexus.cards"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Nexus Cards
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default Component-Based Layout
  return (
    <div className={containerClasses} style={containerStyle}>
      {styling.customCss && (
        <style dangerouslySetInnerHTML={{ __html: styling.customCss }} />
      )}

      <div className="container max-w-4xl mx-auto p-4 py-8">
        {/* Identity Header */}
        <Card className={`p-8 mb-6 ${styling.borderRadius === 'pill' ? 'rounded-full' : styling.borderRadius === 'rounded' ? 'rounded-2xl' : 'rounded-lg'} ${styling.shadowPreset === 'strong' ? 'shadow-2xl' : styling.shadowPreset === 'medium' ? 'shadow-lg' : 'shadow-md'}`}>
          <div className={`${layout === 'horizontal' ? 'flex items-center gap-6' : 'text-center'}`}>
            {identityHeader.avatarUrl && (
              <img
                src={identityHeader.avatarUrl}
                alt={`${identityHeader.firstName} ${identityHeader.lastName}`}
                className={`${layout === 'horizontal' ? 'w-24 h-24' : 'w-32 h-32 mx-auto'} rounded-full object-cover mb-4`}
              />
            )}

            <div className={layout === 'horizontal' ? 'flex-1' : ''}>
              <h1 className={`font-bold mb-2 ${fontSize === 'lg' ? 'text-3xl' : fontSize === 'sm' ? 'text-xl' : 'text-2xl'}`} style={{ fontFamily }}>
                {identityHeader.firstName} {identityHeader.lastName}
              </h1>

              {identityHeader.jobTitle && (
                <p className="text-gray-600 flex items-center gap-2 justify-center mb-2">
                  <Briefcase className="w-4 h-4" />
                  {identityHeader.jobTitle}
                </p>
              )}

              {identityHeader.company && (
                <p className="text-gray-600 flex items-center gap-2 justify-center mb-2">
                  <Building2 className="w-4 h-4" />
                  {identityHeader.company}
                </p>
              )}

              {identityHeader.bio && (
                <p className="text-gray-700 mt-4 max-w-2xl mx-auto">
                  {identityHeader.bio}
                </p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mt-6 justify-center">
                {identityHeader.email && (
                  <a
                    href={`mailto:${identityHeader.email}`}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="hidden sm:inline">{identityHeader.email}</span>
                  </a>
                )}

                {identityHeader.phone && (
                  <a
                    href={`tel:${identityHeader.phone}`}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="hidden sm:inline">{identityHeader.phone}</span>
                  </a>
                )}

                {identityHeader.website && (
                  <a
                    href={identityHeader.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="hidden sm:inline">Website</span>
                  </a>
                )}
              </div>

              {/* Social Links */}
              {identityHeader.socialLinks && Object.keys(identityHeader.socialLinks).length > 0 && (
                <div className="flex gap-4 mt-6 justify-center">
                  {identityHeader.socialLinks.linkedin && (
                    <a
                      href={identityHeader.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <Linkedin className="w-6 h-6" />
                    </a>
                  )}
                  {identityHeader.socialLinks.twitter && (
                    <a
                      href={identityHeader.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <Twitter className="w-6 h-6" />
                    </a>
                  )}
                  {identityHeader.socialLinks.github && (
                    <a
                      href={identityHeader.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <Github className="w-6 h-6" />
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 justify-center flex-wrap">
                <Button onClick={downloadVCard} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Save Contact
                </Button>
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={() => setShowContactForm(!showContactForm)}
                  variant="default"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Form */}
        {showContactForm && (
          <Card className="p-6 mb-6">
            {submitted ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
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
                  Thank you!
                </h3>
                <p className="text-gray-600">
                  Your information has been shared successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Share Your Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={contactForm.firstName}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, firstName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={contactForm.lastName}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                  />
                </div>

                <div>
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

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, company: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={contactForm.notes}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, notes: e.target.value })
                    }
                    placeholder="Add a note about how you met or what you discussed..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? 'Submitting...' : 'Share Contact'}
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

        {/* Card Components */}
        <div className="space-y-6">
          {components
            .filter((c: any) => c.enabled)
            .sort((a: any, b: any) => a.order - b.order)
            .map((component: any) => (
              <CardComponentRenderer
                key={component.id}
                component={component}
                cardData={card}
                isEditing={false}
              />
            ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a
              href="https://nexus.cards"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Nexus Cards
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
