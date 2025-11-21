'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

interface Variant {
  name: string;
  weight: number;
}

export default function NewExperimentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [conversionGoal, setConversionGoal] = useState('');
  const [variants, setVariants] = useState<Variant[]>([
    { name: 'control', weight: 50 },
    { name: 'variant', weight: 50 },
  ]);

  const addVariant = () => {
    setVariants([...variants, { name: `variant${variants.length}`, weight: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) {
      alert('Experiment must have at least 2 variants');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: 'name' | 'weight', value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetPath || !conversionGoal) {
      alert('Please fill in all required fields');
      return;
    }

    const variantsObj = variants.reduce((acc, v) => {
      if (v.name && v.weight > 0) {
        acc[v.name] = v.weight;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(variantsObj).length < 2) {
      alert('Please add at least 2 variants with positive weights');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/experiments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name,
            description: description || undefined,
            targetPath,
            conversionGoal,
            variants: variantsObj,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create experiment');
      }

      const experiment = await response.json();
      router.push(`/admin/experiments/${experiment.id}`);
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert(error instanceof Error ? error.message : 'Failed to create experiment');
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Experiment
        </h1>
        <p className="text-gray-600">
          Set up a new A/B testing experiment
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Experiment Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Homepage Hero Test"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Testing new hero design against control"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="targetPath">Target Path *</Label>
                <Input
                  id="targetPath"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="/homepage"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  The page where this experiment will run
                </p>
              </div>

              <div>
                <Label htmlFor="conversionGoal">Conversion Goal *</Label>
                <Input
                  id="conversionGoal"
                  value={conversionGoal}
                  onChange={(e) => setConversionGoal(e.target.value)}
                  placeholder="signup_click"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  The event type that counts as a conversion
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Variants</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-start p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <Label htmlFor={`variant-name-${index}`}>Variant Name</Label>
                    <Input
                      id={`variant-name-${index}`}
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      placeholder="control"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`variant-weight-${index}`}>Weight</Label>
                    <Input
                      id={`variant-weight-${index}`}
                      type="number"
                      min="0"
                      value={variant.weight}
                      onChange={(e) => updateVariant(index, 'weight', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  {variants.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total Weight:</span>
                <span className="text-sm font-medium text-gray-900">{totalWeight}</span>
              </div>

              <p className="text-sm text-gray-500">
                Traffic will be split proportionally based on weights. 
                For example, weights of 50/50 means equal traffic split.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Experiment'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
