'use client';

import React, { useState } from 'react';
import {
  NexusButton,
  NexusCard,
  NexusInput,
  NexusBadge,
  NexusDialog,
  NexusLayoutShell,
} from '@/components/nexus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <NexusLayoutShell
      maxWidth="2xl"
      header={
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Nexus Design System</h1>
          <NexusBadge variant="primary">v1.0.0</NexusBadge>
        </div>
      }
    >
      <div className="space-y-12">
        <section>
          <h2 className="mb-4 text-3xl font-bold">Design Tokens</h2>
          <p className="mb-6 text-muted-foreground">
            Core visual primitives that define the Nexus Cards brand identity.
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-xl font-semibold">Colors</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <NexusCard title="Primary Blue" variant="outlined">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded bg-nexus-blue-500" />
                      <span className="text-sm">nexus-blue-500</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      <div className="h-8 rounded bg-nexus-blue-50" title="50" />
                      <div className="h-8 rounded bg-nexus-blue-100" title="100" />
                      <div className="h-8 rounded bg-nexus-blue-300" title="300" />
                      <div className="h-8 rounded bg-nexus-blue-500" title="500" />
                      <div className="h-8 rounded bg-nexus-blue-700" title="700" />
                    </div>
                  </div>
                </NexusCard>

                <NexusCard title="Success Green" variant="outlined">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded bg-nexus-green-500" />
                      <span className="text-sm">nexus-green-500</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      <div className="h-8 rounded bg-nexus-green-50" title="50" />
                      <div className="h-8 rounded bg-nexus-green-100" title="100" />
                      <div className="h-8 rounded bg-nexus-green-300" title="300" />
                      <div className="h-8 rounded bg-nexus-green-500" title="500" />
                      <div className="h-8 rounded bg-nexus-green-700" title="700" />
                    </div>
                  </div>
                </NexusCard>

                <NexusCard title="Danger Red" variant="outlined">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded bg-nexus-red-500" />
                      <span className="text-sm">nexus-red-500</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      <div className="h-8 rounded bg-nexus-red-50" title="50" />
                      <div className="h-8 rounded bg-nexus-red-100" title="100" />
                      <div className="h-8 rounded bg-nexus-red-300" title="300" />
                      <div className="h-8 rounded bg-nexus-red-500" title="500" />
                      <div className="h-8 rounded bg-nexus-red-700" title="700" />
                    </div>
                  </div>
                </NexusCard>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold">Typography</h3>
              <NexusCard variant="outlined">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">text-4xl</p>
                    <p className="text-4xl font-bold">Digital Business Cards</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">text-3xl</p>
                    <p className="text-3xl font-bold">Share Your Network</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">text-2xl</p>
                    <p className="text-2xl font-semibold">Modern Networking</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">text-xl</p>
                    <p className="text-xl font-medium">Connect Instantly</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">text-base</p>
                    <p className="text-base">Body text for paragraphs and content</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">text-sm</p>
                    <p className="text-sm">Small text for captions and labels</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">text-xs</p>
                    <p className="text-xs">Extra small text for metadata</p>
                  </div>
                </div>
              </NexusCard>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-semibold">Spacing</h3>
              <NexusCard variant="outlined">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 bg-nexus-blue-500" />
                    <span className="text-sm">4 (1rem / 16px)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-nexus-blue-500" />
                    <span className="text-sm">8 (2rem / 32px)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-nexus-blue-500" />
                    <span className="text-sm">12 (3rem / 48px)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-nexus-blue-500" />
                    <span className="text-sm">16 (4rem / 64px)</span>
                  </div>
                </div>
              </NexusCard>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-3xl font-bold">Components</h2>
          <p className="mb-6 text-muted-foreground">
            Nexus-branded UI components built on top of shadcn/ui primitives.
          </p>

          <Tabs defaultValue="buttons" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="dialogs">Dialogs</TabsTrigger>
            </TabsList>

            <TabsContent value="buttons" className="space-y-4">
              <NexusCard title="Button Variants">
                <div className="flex flex-wrap gap-3">
                  <NexusButton variant="primary">Primary</NexusButton>
                  <NexusButton variant="secondary">Secondary</NexusButton>
                  <NexusButton variant="success">Success</NexusButton>
                  <NexusButton variant="danger">Danger</NexusButton>
                  <NexusButton variant="outline">Outline</NexusButton>
                  <NexusButton variant="ghost">Ghost</NexusButton>
                  <NexusButton variant="link">Link</NexusButton>
                </div>
              </NexusCard>

              <NexusCard title="Button Sizes">
                <div className="flex flex-wrap items-center gap-3">
                  <NexusButton size="sm">Small</NexusButton>
                  <NexusButton size="default">Default</NexusButton>
                  <NexusButton size="lg">Large</NexusButton>
                </div>
              </NexusCard>

              <NexusCard title="Button States">
                <div className="flex flex-wrap gap-3">
                  <NexusButton>Normal</NexusButton>
                  <NexusButton loading>Loading</NexusButton>
                  <NexusButton disabled>Disabled</NexusButton>
                </div>
              </NexusCard>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4">
              <NexusCard title="Input Variants">
                <div className="space-y-4">
                  <NexusInput label="Default Input" placeholder="Enter text..." />
                  <NexusInput
                    label="Success Input"
                    variant="success"
                    placeholder="Valid input"
                    helperText="This looks good!"
                  />
                  <NexusInput
                    label="Error Input"
                    variant="error"
                    placeholder="Invalid input"
                    errorText="This field is required"
                  />
                  <NexusInput
                    label="Warning Input"
                    variant="warning"
                    placeholder="Warning state"
                    helperText="Please verify this information"
                  />
                </div>
              </NexusCard>

              <NexusCard title="Input Sizes">
                <div className="space-y-4">
                  <NexusInput inputSize="sm" placeholder="Small input" />
                  <NexusInput inputSize="default" placeholder="Default input" />
                  <NexusInput inputSize="lg" placeholder="Large input" />
                </div>
              </NexusCard>

              <NexusCard title="Input with Icons">
                <div className="space-y-4">
                  <NexusInput
                    label="Email"
                    placeholder="you@example.com"
                    leftIcon={
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    }
                  />
                  <NexusInput
                    label="Search"
                    placeholder="Search cards..."
                    rightIcon={
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    }
                  />
                </div>
              </NexusCard>
            </TabsContent>

            <TabsContent value="cards" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <NexusCard
                  title="Default Card"
                  description="A basic card with shadow"
                  variant="default"
                >
                  <p className="text-sm text-muted-foreground">
                    Card content goes here. This is the default card style.
                  </p>
                </NexusCard>

                <NexusCard
                  title="Elevated Card"
                  description="Card with stronger shadow"
                  variant="elevated"
                  hover="lift"
                >
                  <p className="text-sm text-muted-foreground">
                    This card has stronger shadows and lifts on hover.
                  </p>
                </NexusCard>

                <NexusCard
                  title="Outlined Card"
                  description="Card with colored border"
                  variant="outlined"
                >
                  <p className="text-sm text-muted-foreground">
                    This card has a distinct colored border.
                  </p>
                </NexusCard>

                <NexusCard
                  title="Gradient Card"
                  description="Card with gradient background"
                  variant="gradient"
                  hover="glow"
                >
                  <p className="text-sm">
                    This card has a subtle gradient background and glows on hover.
                  </p>
                </NexusCard>
              </div>

              <NexusCard
                title="Glass Card"
                description="Modern glassmorphism effect"
                variant="glass"
                hover="scale"
              >
                <p className="text-sm">
                  This card has a frosted glass effect with backdrop blur and scales on hover.
                </p>
              </NexusCard>
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <NexusCard title="Badge Variants">
                <div className="flex flex-wrap gap-2">
                  <NexusBadge variant="primary">Primary</NexusBadge>
                  <NexusBadge variant="success">Success</NexusBadge>
                  <NexusBadge variant="danger">Danger</NexusBadge>
                  <NexusBadge variant="warning">Warning</NexusBadge>
                  <NexusBadge variant="secondary">Secondary</NexusBadge>
                  <NexusBadge variant="outline">Outline</NexusBadge>
                </div>
              </NexusCard>

              <NexusCard title="Badge Sizes">
                <div className="flex flex-wrap items-center gap-2">
                  <NexusBadge size="sm">Small</NexusBadge>
                  <NexusBadge size="default">Default</NexusBadge>
                  <NexusBadge size="lg">Large</NexusBadge>
                </div>
              </NexusCard>

              <NexusCard title="Badge with Dot">
                <div className="flex flex-wrap gap-2">
                  <NexusBadge variant="primary" dot>
                    Active
                  </NexusBadge>
                  <NexusBadge variant="success" dot>
                    Online
                  </NexusBadge>
                  <NexusBadge variant="danger" dot>
                    Offline
                  </NexusBadge>
                  <NexusBadge variant="warning" dot>
                    Pending
                  </NexusBadge>
                </div>
              </NexusCard>

              <NexusCard title="Real-World Examples">
                <div className="flex flex-wrap gap-2">
                  <NexusBadge variant="primary">FREE</NexusBadge>
                  <NexusBadge variant="success">PRO</NexusBadge>
                  <NexusBadge variant="danger">PREMIUM</NexusBadge>
                  <NexusBadge variant="secondary">DRAFT</NexusBadge>
                  <NexusBadge variant="success" dot>
                    Published
                  </NexusBadge>
                  <NexusBadge variant="warning" dot>
                    Expiring Soon
                  </NexusBadge>
                </div>
              </NexusCard>
            </TabsContent>

            <TabsContent value="dialogs" className="space-y-4">
              <NexusCard title="Dialog Example">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click the button below to open a dialog modal.
                  </p>
                  <NexusButton onClick={() => setDialogOpen(true)}>Open Dialog</NexusButton>
                </div>
              </NexusCard>

              <NexusDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title="Welcome to Nexus Cards"
                description="This is an example dialog using the NexusDialog component."
                footer={
                  <div className="flex gap-2">
                    <NexusButton variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </NexusButton>
                    <NexusButton onClick={() => setDialogOpen(false)}>Confirm</NexusButton>
                  </div>
                }
              >
                <div className="space-y-4">
                  <p className="text-sm">
                    This dialog demonstrates the Nexus-branded dialog component with custom
                    header, content, and footer sections.
                  </p>
                  <NexusInput label="Example Input" placeholder="Enter something..." />
                </div>
              </NexusDialog>
            </TabsContent>
          </Tabs>
        </section>

        <section>
          <h2 className="mb-4 text-3xl font-bold">Dark Mode</h2>
          <p className="mb-6 text-muted-foreground">
            All components support dark mode out of the box using CSS variables.
          </p>
          <NexusCard variant="outlined">
            <p className="text-sm">
              Toggle your system dark mode or use the theme switcher (to be implemented) to see
              components adapt automatically.
            </p>
          </NexusCard>
        </section>
      </div>
    </NexusLayoutShell>
  );
}
