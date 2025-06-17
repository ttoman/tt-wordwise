'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Lightbulb, AlertCircle, Edit3 } from 'lucide-react';
import { GrammarSuggestion } from '@/lib/grammarCheck';

console.log('🔄 GrammarSuggestions: Component loaded');

export interface GrammarSuggestionsProps {
  suggestions: GrammarSuggestion[];
  isChecking: boolean;
  onApply: (index: number, suggestion: string) => void;
  onDismiss: (index: number) => void;
  className?: string;
}

/**
 * Inline suggestion chips that appear when grammar/style improvements are found
 * Shows suggestions with Accept/Ignore buttons
 */
export function GrammarSuggestions({
  suggestions,
  isChecking,
  onApply,
  onDismiss,
  className = ''
}: GrammarSuggestionsProps) {
  console.log('🔄 GrammarSuggestions: Rendering', {
    suggestionsCount: suggestions.length,
    isChecking
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (isChecking) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Analyzing writing...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const getTypeIcon = (type: GrammarSuggestion['type']) => {
    switch (type) {
      case 'grammar':
        return <AlertCircle size={14} className="text-red-600" />;
      case 'style':
        return <Edit3 size={14} className="text-blue-600" />;
      case 'clarity':
        return <Lightbulb size={14} className="text-yellow-600" />;
      default:
        return <Edit3 size={14} className="text-gray-600" />;
    }
  };

  const getTypeColor = (type: GrammarSuggestion['type']) => {
    switch (type) {
      case 'grammar':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      case 'style':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'clarity':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const handleApply = (index: number, suggestion: string) => {
    console.log(`✅ GrammarSuggestions: Applying suggestion ${index}: "${suggestion}"`);
    onApply(index, suggestion);
    setExpandedIndex(null);
  };

  const handleDismiss = (index: number) => {
    console.log(`🚫 GrammarSuggestions: Dismissing suggestion ${index}`);
    onDismiss(index);
    setExpandedIndex(null);
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <Card
          key={index}
          className={`border transition-all duration-200 ${getTypeColor(suggestion.type)} hover:shadow-md`}
        >
          <CardContent className="p-3">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(suggestion.type)}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {suggestion.type}
                  </Badge>
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="text-sm font-medium hover:underline cursor-pointer"
                  >
                    {suggestion.original}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApply(index, suggestion.suggestion)}
                    className="h-6 px-2 text-xs hover:bg-green-100 dark:hover:bg-green-900"
                  >
                    <Check size={12} className="mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(index)}
                    className="h-6 px-2 text-xs hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    <X size={12} className="mr-1" />
                    Ignore
                  </Button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedIndex === index && (
                <div className="space-y-2 pt-2 border-t border-current/20">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Original:</div>
                    <div className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {suggestion.original}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Suggestion:</div>
                    <div className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {suggestion.suggestion}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Reason:</div>
                    <div className="text-sm">
                      {suggestion.reason}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick preview */}
              {expandedIndex !== index && (
                <div className="text-sm">
                  <span className="text-muted-foreground">→ </span>
                  <span className="font-medium">{suggestion.suggestion}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Summary component showing grammar check results
 */
export interface GrammarSummaryProps {
  score: number;
  improvedScore: number;
  suggestionsCount: number;
  isChecking: boolean;
  error: string | null;
  costInfo: {
    totalCost: number;
    remainingBudget: number;
    resetTime: number;
  } | null;
}

export function GrammarSummary({
  score,
  improvedScore,
  suggestionsCount,
  isChecking,
  error,
  costInfo
}: GrammarSummaryProps) {
  console.log('🔄 GrammarSummary: Rendering', {
    score,
    improvedScore,
    suggestionsCount,
    isChecking,
    hasError: !!error
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
        <AlertCircle size={12} />
        <span>{error}</span>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
        <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
        <span>Checking grammar...</span>
      </div>
    );
  }

  if (suggestionsCount === 0 && score > 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
        <Check size={12} />
        <span>Writing looks good! Score: {score}/100</span>
      </div>
    );
  }

  if (suggestionsCount > 0) {
    const improvement = improvedScore - score;
    return (
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <Edit3 size={12} />
          <span>{suggestionsCount} suggestion{suggestionsCount !== 1 ? 's' : ''}</span>
        </div>

        {score > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Score: {score}/100</span>
            {improvement > 0 && (
              <span className="text-green-600 dark:text-green-400">
                → {improvedScore}/100 (+{improvement})
              </span>
            )}
          </div>
        )}

        {costInfo && (
          <div className="text-muted-foreground">
            Cost: ${costInfo.totalCost.toFixed(4)}
          </div>
        )}
      </div>
    );
  }

  return null;
}

console.log('✅ GrammarSuggestions: Component exported');