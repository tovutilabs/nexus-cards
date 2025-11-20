'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createApiClient } from '@/lib/api-client';
import {
  Lightbulb,
  User,
  Link2,
  Palette,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'profile' | 'link' | 'template' | 'color' | 'feature';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
  metadata?: any;
}

interface ProfileCompleteness {
  score: number;
  maxScore: number;
  percentage: number;
  missingFields: string[];
}

export default function SuggestionsWidget() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSuggestions();
    loadCompleteness();
  }, []);

  const loadSuggestions = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get('/suggestions') as Suggestion[];
      setSuggestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setLoading(false);
    }
  };

  const loadCompleteness = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get('/suggestions/profile-completeness') as ProfileCompleteness;
      setCompleteness(data);
    } catch (error) {
      console.error('Failed to load completeness:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return <User className="h-5 w-5" />;
      case 'link':
        return <Link2 className="h-5 w-5" />;
      case 'template':
      case 'color':
        return <Palette className="h-5 w-5" />;
      case 'feature':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const handleAction = (suggestion: Suggestion) => {
    if (suggestion.actionUrl) {
      router.push(suggestion.actionUrl);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissedIds((prev) => new Set([...prev, suggestionId]));
  };

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {completeness && completeness.percentage < 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Completeness
            </CardTitle>
            <CardDescription>
              Complete your profile to make a better impression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{completeness.percentage}% Complete</span>
                <span className="text-sm text-muted-foreground">
                  {completeness.score}/{completeness.maxScore} points
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Suggestions
          </CardTitle>
          <CardDescription>
            Personalized tips to improve your presence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleSuggestions.slice(0, 5).map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="mt-0.5 text-muted-foreground">{getIcon(suggestion.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDismiss(suggestion.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                    {suggestion.priority}
                  </Badge>
                  {suggestion.actionText && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => handleAction(suggestion)}
                    >
                      {suggestion.actionText}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
