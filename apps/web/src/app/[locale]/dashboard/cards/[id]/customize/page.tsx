'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NexusCard, NexusButton } from '@/components/nexus';
import { useAuth } from '@/contexts/auth-context';

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  industry: string[];
  previewImageUrl: string | null;
  config: any;
  minTier: string;
  isFeatured: boolean;
}

interface CustomizeCardPageProps {
  params: {
    id: string;
  };
}

export default function CustomizeCardPage({ params }: CustomizeCardPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [card, setCard] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'colors' | 'typography' | 'layout' | 'advanced'>('templates');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Customization state
  const [fontFamily, setFontFamily] = useState('inter');
  const [fontSize, setFontSize] = useState('base');
  const [layout, setLayout] = useState('vertical');
  const [backgroundType, setBackgroundType] = useState('solid');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [borderRadius, setBorderRadius] = useState('md');
  const [shadowPreset, setShadowPreset] = useState('sm');
  const [customCss, setCustomCss] = useState('');

  useEffect(() => {
    fetchCard();
    fetchTemplates();
  }, [params.id]);

  const fetchCard = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/cards/${params.id}`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCard(data);
        
        // Initialize customization state from card
        setFontFamily(data.fontFamily || 'inter');
        setFontSize(data.fontSize || 'base');
        setLayout(data.layout || 'vertical');
        setBackgroundType(data.backgroundType || 'solid');
        setBackgroundColor(data.backgroundColor || '#ffffff');
        setBackgroundImage(data.backgroundImage || '');
        setBorderRadius(data.borderRadius || 'md');
        setShadowPreset(data.shadowPreset || 'sm');
        setCustomCss(data.customCss || '');
      } else {
        setError('Failed to load card');
      }
    } catch (err) {
      setError('Failed to load card');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const userTier = user?.subscription?.tier || 'FREE';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/templates?tier=${userTier}`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const applyTemplate = async (templateId: string) => {
    try {
      setSaving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/templates/apply/${params.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            templateId,
            preserveContent: true,
          }),
        }
      );

      if (response.ok) {
        const updatedCard = await response.json();
        setCard(updatedCard);
        
        // Update local state
        setFontFamily(updatedCard.fontFamily || 'inter');
        setLayout(updatedCard.layout || 'vertical');
        setBackgroundColor(updatedCard.backgroundColor || '#ffffff');
        setBorderRadius(updatedCard.borderRadius || 'md');
        setShadowPreset(updatedCard.shadowPreset || 'sm');
      } else {
        setError('Failed to apply template');
      }
    } catch (err) {
      setError('Failed to apply template');
    } finally {
      setSaving(false);
    }
  };

  const saveCustomization = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/cards/${params.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            fontFamily,
            fontSize,
            layout,
            backgroundType,
            backgroundColor,
            backgroundImage: backgroundImage || null,
            borderRadius,
            shadowPreset,
          }),
        }
      );

      if (response.ok) {
        const updatedCard = await response.json();
        setCard(updatedCard);
      } else {
        setError('Failed to save customization');
      }
    } catch (err) {
      setError('Failed to save customization');
    } finally {
      setSaving(false);
    }
  };

  const saveCustomCss = async () => {
    if (user?.subscription?.tier !== 'PREMIUM') {
      setError('Custom CSS is only available for Premium users');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/templates/custom-css/${params.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            customCss,
          }),
        }
      );

      if (response.ok) {
        const updatedCard = await response.json();
        setCard(updatedCard);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save custom CSS');
      }
    } catch (err) {
      setError('Failed to save custom CSS');
    } finally {
      setSaving(false);
    }
  };

  const fontFamilies = [
    { value: 'inter', label: 'Inter (Sans-serif)' },
    { value: 'sans', label: 'System Sans' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Monospace' },
    { value: 'display', label: 'Display' },
  ];

  const fontSizes = [
    { value: 'sm', label: 'Small' },
    { value: 'base', label: 'Base' },
    { value: 'lg', label: 'Large' },
  ];

  const layouts = [
    { value: 'vertical', label: 'Vertical', description: 'Traditional vertical card layout' },
    { value: 'horizontal', label: 'Horizontal', description: 'Side-by-side layout' },
    { value: 'center', label: 'Centered', description: 'Minimal centered layout' },
    { value: 'image-first', label: 'Image First', description: 'Image-focused layout' },
    { value: 'compact', label: 'Compact', description: 'Space-efficient layout' },
  ];

  const borderRadiusOptions = [
    { value: 'none', label: 'None' },
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'Extra Large' },
    { value: '2xl', label: '2X Large' },
  ];

  const shadowOptions = [
    { value: 'none', label: 'None' },
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'Extra Large' },
    { value: '2xl', label: '2X Large' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading customization options...</p>
        </div>
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <NexusCard className="max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <NexusButton onClick={() => router.push('/dashboard/cards')}>
              Back to Cards
            </NexusButton>
          </div>
        </NexusCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/cards/${params.id}`)}
            className="text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            ← Back to Card Editor
          </button>
          <h1 className="text-3xl font-bold">Customize Card Design</h1>
          <p className="text-muted-foreground">Personalize your card&apos;s appearance</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customization Panel */}
          <div className="lg:col-span-2">
            <NexusCard>
              {/* Tabs */}
              <div className="border-b border-border mb-6">
                <div className="flex space-x-6 overflow-x-auto">
                  {[
                    { key: 'templates', label: 'Templates' },
                    { key: 'colors', label: 'Colors & Background' },
                    { key: 'typography', label: 'Typography' },
                    { key: 'layout', label: 'Layout' },
                    { key: 'advanced', label: 'Advanced' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === tab.key
                          ? 'border-primary text-primary font-medium'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        {template.previewImageUrl && (
                          <img
                            src={template.previewImageUrl}
                            alt={template.name}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          {template.isFeatured && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground capitalize">{template.category}</span>
                          <span className="text-xs font-medium">{template.minTier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedTemplate && (
                    <div className="mt-6 flex justify-end">
                      <NexusButton
                        onClick={() => applyTemplate(selectedTemplate.id)}
                        disabled={saving}
                      >
                        {saving ? 'Applying...' : 'Apply Template'}
                      </NexusButton>
                    </div>
                  )}
                </div>
              )}

              {/* Colors & Background Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['solid', 'gradient', 'image'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setBackgroundType(type)}
                          className={`p-3 border rounded-lg capitalize ${
                            backgroundType === type
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {backgroundType === 'solid' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Background Color</label>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full h-12 rounded border border-border cursor-pointer"
                      />
                    </div>
                  )}

                  {backgroundType === 'image' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Background Image URL</label>
                      <input
                        type="text"
                        value={backgroundImage}
                        onChange={(e) => setBackgroundImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-border rounded-lg"
                      />
                      {user?.subscription?.tier !== 'PREMIUM' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Premium feature - Upgrade to use custom background images
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <NexusButton onClick={saveCustomization} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </NexusButton>
                  </div>
                </div>
              )}

              {/* Typography Tab */}
              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      {fontFamilies.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Font Size</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      {fontSizes.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <NexusButton onClick={saveCustomization} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </NexusButton>
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-4">Card Layout</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {layouts.map((layoutOption) => (
                        <button
                          key={layoutOption.value}
                          onClick={() => setLayout(layoutOption.value)}
                          className={`p-4 border rounded-lg text-left ${
                            layout === layoutOption.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          <div className="font-medium mb-1">{layoutOption.label}</div>
                          <div className="text-sm text-muted-foreground">{layoutOption.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Border Radius</label>
                    <div className="grid grid-cols-3 gap-3">
                      {borderRadiusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setBorderRadius(option.value)}
                          className={`p-3 border rounded-lg ${
                            borderRadius === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Shadow</label>
                    <div className="grid grid-cols-3 gap-3">
                      {shadowOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setShadowPreset(option.value)}
                          className={`p-3 border rounded-lg ${
                            shadowPreset === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <NexusButton onClick={saveCustomization} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </NexusButton>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Custom CSS</label>
                      {user?.subscription?.tier === 'PREMIUM' ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Premium Feature
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Premium Only
                        </span>
                      )}
                    </div>
                    <textarea
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                      disabled={user?.subscription?.tier !== 'PREMIUM'}
                      placeholder=".card { /* Your custom styles */ }"
                      className="w-full h-64 px-3 py-2 border border-border rounded-lg font-mono text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Add custom CSS to further personalize your card. Premium feature only.
                    </p>
                  </div>

                  {user?.subscription?.tier === 'PREMIUM' && (
                    <div className="flex justify-end">
                      <NexusButton onClick={saveCustomCss} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Custom CSS'}
                      </NexusButton>
                    </div>
                  )}
                </div>
              )}
            </NexusCard>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <NexusCard>
                <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Preview coming soon</p>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Current Settings:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Layout: <span className="capitalize">{layout}</span></li>
                    <li>• Font: <span className="capitalize">{fontFamily}</span></li>
                    <li>• Corners: <span className="capitalize">{borderRadius}</span></li>
                    <li>• Shadow: <span className="capitalize">{shadowPreset}</span></li>
                  </ul>
                </div>
              </NexusCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
