import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CardRenderView } from '@/components/nexus';

interface CardRenderModel {
  id: string;
  slug: string;
  status: string;
  identityHeader: {
    firstName: string;
    lastName: string;
    jobTitle?: string;
    company?: string;
    bio?: string;
    phone?: string;
    email?: string;
    website?: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    logoUrl?: string;
    socialLinks?: Record<string, string>;
  };
  styling: {
    templateId?: string;
    fontFamily?: string;
    fontSize?: string;
    layout?: string;
    backgroundType?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    borderRadius?: string;
    shadowPreset?: string;
    customCss?: string;
  };
  components: Array<{
    id: string;
    type: string;
    order: number;
    enabled: boolean;
    locked: boolean;
    config: any;
    backgroundType?: string;
    backgroundColor?: string;
    backgroundImage?: string;
  }>;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getCardRenderModel(slug: string): Promise<CardRenderModel | null> {
  try {
    // Use API_URL_INTERNAL for server-side fetching (Docker network), fallback to NEXT_PUBLIC_API_URL for client-side
    const apiUrl = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://nexus-api:3001';
    const res = await fetch(`${apiUrl}/api/public/cards/${slug}/render-model`, {
      next: {
        revalidate: 60,
        tags: [`card-${slug}`],
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch card');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching card render model:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const card = await getCardRenderModel(params.slug);

  if (!card) {
    return {
      title: 'Card Not Found',
    };
  }

  const { identityHeader } = card;
  const fullName = `${identityHeader.firstName} ${identityHeader.lastName}`;
  const description = identityHeader.bio || `${fullName}${identityHeader.jobTitle ? ` - ${identityHeader.jobTitle}` : ''}`;

  return {
    title: fullName,
    description,
    openGraph: {
      title: fullName,
      description,
      type: 'profile',
      images: identityHeader.avatarUrl ? [identityHeader.avatarUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullName,
      description,
      images: identityHeader.avatarUrl ? [identityHeader.avatarUrl] : [],
    },
  };
}

export default async function PublicCardPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { uid?: string };
}) {
  const card = await getCardRenderModel(params.slug);

  if (!card) {
    notFound();
  }

  if (card.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Card Not Available</h1>
          <p className="text-gray-600">This card is not currently published.</p>
        </div>
      </div>
    );
  }

  return <CardRenderView card={card} nfcUid={searchParams.uid} />;
}

export const revalidate = 60;
export const dynamicParams = true;
