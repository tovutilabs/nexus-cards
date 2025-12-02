'use client';

import React, { useState } from 'react';
import { Send, Pencil, FileText } from 'lucide-react';
import { CardComponentRendererProps, FormConfig } from './types';
import { NexusButton } from '@/components/nexus';
import { useToast } from '@/hooks/use-toast';

export function FormComponent({
  component,
  cardData,
  isEditing = false,
  onEdit,
}: CardComponentRendererProps) {
  const config = component.config as FormConfig;
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Show placeholder in edit mode if no form configured
  if (!config?.fields?.length && isEditing) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Contact Form</h3>
        <p className="text-sm text-gray-500 mb-4">
          Capture leads with custom form fields
        </p>
        {onEdit && (
          <NexusButton onClick={() => onEdit(component)} size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Configure Form
          </NexusButton>
        )}
      </div>
    );
  }

  if (!config?.fields?.length) {
    return null;
  }

  const fields = [...config.fields].sort((a, b) => a.order - b.order);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Implement form submission API endpoint
      // For now, just show success message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Form submitted',
        description: config.successMessage || 'Thank you for your submission!',
      });

      setFormData({});
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormConfig['fields'][0]) => {
    const commonClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={commonClasses}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className={commonClasses}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              required={field.required}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor={field.name} className="ml-2 text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <div className="p-6">
      {isEditing && onEdit && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => onEdit(component)}
            className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit Form
          </button>
        </div>
      )}

      {config.title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{config.title}</h3>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            {field.type !== 'checkbox' && (
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {renderField(field)}
          </div>
        ))}

        <div className="pt-4">
          <NexusButton
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {config.submitButtonText || 'Submit'}
              </>
            )}
          </NexusButton>
        </div>
      </form>
    </div>
  );
}
