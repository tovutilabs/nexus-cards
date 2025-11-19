'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { NexusButton } from '@/components/nexus';
import { NexusInput } from '@/components/nexus';
import { NexusCard } from '@/components/nexus';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AccountSettingsPage() {
  const { user, updateProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      phone: user?.profile?.phone || '',
      company: user?.profile?.company || '',
      jobTitle: user?.profile?.jobTitle || '',
      timezone: user?.profile?.timezone || 'UTC',
      language: user?.profile?.language || 'en',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Account Settings
      </h1>

      <NexusCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Profile Information
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Profile updated successfully
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First name
              </label>
              <NexusInput
                id="firstName"
                type="text"
                {...register('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last name
              </label>
              <NexusInput
                id="lastName"
                type="text"
                {...register('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone number
            </label>
            <NexusInput
              id="phone"
              type="tel"
              {...register('phone')}
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Company
            </label>
            <NexusInput
              id="company"
              type="text"
              {...register('company')}
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="jobTitle"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Job title
            </label>
            <NexusInput
              id="jobTitle"
              type="text"
              {...register('jobTitle')}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Timezone
              </label>
              <NexusInput
                id="timezone"
                type="text"
                {...register('timezone')}
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Language
              </label>
              <NexusInput
                id="language"
                type="text"
                {...register('language')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <NexusButton type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save changes'}
            </NexusButton>
          </div>
        </form>
      </NexusCard>

      <NexusCard className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Account Details
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account created</p>
            <p className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </NexusCard>
    </div>
  );
}
