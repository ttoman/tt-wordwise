'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertTriangle,
  Edit3,
  BookOpen,
  DollarSign,
  Clock,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { GrammarSuggestions, GrammarSummary } from '@/components/grammar-suggestions';
import { ReadabilityScore, ReadabilityBadge } from '@/components/readability-score';
import { CostIndicator } from '@/components/cost-warning-banner';
import { SpellCheckError } from '@/lib/hooks/useSpellCheck';
import { GrammarSuggestion } from '@/lib/grammarCheck';

console.log('🔄 FeedbackPanel component loaded');

export interface FeedbackPanelProps {
  // Spell check data
  spellErrors: SpellCheckError[];
  isSpellCheckInitialized: boolean;
  isSpellCheckInitializing: boolean;
  spellCheckInitError: string | null;
  onSpellErrorClick: (error: SpellCheckError) => void;
  onSpellErrorIgnore: (error: SpellCheckError) => void;

  // Grammar check data
  grammarSuggestions: GrammarSuggestion[];
  isGrammarChecking: boolean;
  grammarError: string | null;
  grammarScore: number;
  grammarImprovedScore: number;
  grammarReadabilityGrade: number | null;
  grammarCostInfo: {
    totalCost: number;
    remainingBudget: number;
    resetTime: number;
  };
  onGrammarSuggestionApply: (index: number, suggestion: string) => void;
  onGrammarSuggestionDismiss: (index: number) => void;
  onGrammarRecheck: () => void;

  // Document content for readability
  content: string;

  // Panel state
  className?: string;
}

/**
 * Right-side feedback panel containing spell check, grammar check, and readability analysis
 * Provides a dedicated space for all writing feedback without cluttering the document editor
 */
export function FeedbackPanel({
  spellErrors,
  isSpellCheckInitialized,
  isSpellCheckInitializing,
  spellCheckInitError,
  onSpellErrorClick,
  onSpellErrorIgnore,
  grammarSuggestions,
  isGrammarChecking,
  grammarError,
  grammarScore,
  grammarImprovedScore,
  grammarReadabilityGrade,
  grammarCostInfo,
  onGrammarSuggestionApply,
  onGrammarSuggestionDismiss,
  onGrammarRecheck,
  content,
  className = ''
}: FeedbackPanelProps) {
  console.log('🔄 FeedbackPanel: Rendering feedback panel', {
    spellErrorsCount: spellErrors.length,
    grammarSuggestionsCount: grammarSuggestions.length,
    contentLength: content.length,
    isGrammarChecking
  });

  const [expandedSections, setExpandedSections] = useState({
    spelling: true,
    grammar: true,
    readability: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    console.log(`🔄 FeedbackPanel: Toggling ${section} section`);
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSpellErrorClick = (error: SpellCheckError) => {
    console.log(`🔍 FeedbackPanel: Spell error clicked: "${error.word}"`);
    onSpellErrorClick(error);
  };

  const handleSpellErrorIgnore = (error: SpellCheckError) => {
    console.log(`🚫 FeedbackPanel: Ignoring spell error: "${error.word}"`);
    onSpellErrorIgnore(error);
  };

  const getSpellCheckStatus = () => {
    if (isSpellCheckInitializing) {
      return {
        icon: <RefreshCw size={16} className="animate-spin text-blue-600" />,
        text: 'Loading spell check...',
        variant: 'blue' as const
      };
    }

    if (spellCheckInitError) {
      return {
        icon: <AlertTriangle size={16} className="text-red-600" />,
        text: 'Spell check unavailable',
        variant: 'red' as const
      };
    }

    if (!isSpellCheckInitialized) {
      return {
        icon: <AlertTriangle size={16} className="text-yellow-600" />,
        text: 'Spell check not ready',
        variant: 'yellow' as const
      };
    }

    if (spellErrors.length === 0 && content.trim().length > 0) {
      return {
        icon: <CheckCircle size={16} className="text-green-600" />,
        text: 'No spelling errors',
        variant: 'green' as const
      };
    }

    return {
      icon: <AlertTriangle size={16} className="text-red-600" />,
      text: `${spellErrors.length} spelling error${spellErrors.length !== 1 ? 's' : ''}`,
      variant: 'red' as const
    };
  };

  const spellStatus = getSpellCheckStatus();

  return (
    <div className={`w-80 h-full bg-background border-l overflow-y-auto ${className}`}>
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Writing Feedback</h2>
          <p className="text-xs text-muted-foreground">
            Real-time analysis and suggestions for your document
          </p>
        </div>

        {/* Spell Check Section */}
        <Card>
          <CardHeader className="pb-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('spelling')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.spelling ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <CardTitle className="text-sm">Spelling</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {spellStatus.icon}
                <Badge
                  variant={spellStatus.variant === 'green' ? 'default' : 'secondary'}
                  className={`text-xs ${
                    spellStatus.variant === 'red'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      : spellStatus.variant === 'yellow'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                      : spellStatus.variant === 'blue'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                  }`}
                >
                  {spellErrors.length === 0 && content.trim().length > 0 ? '✓' : spellErrors.length}
                </Badge>
              </div>
            </div>
          </CardHeader>

          {expandedSections.spelling && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {spellStatus.text}
                </p>

                {spellErrors.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {spellErrors.map((error, index) => (
                      <div
                        key={`${error.word}-${index}`}
                        className="p-2 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-red-600 dark:text-red-400">
                              "{error.word}"
                            </div>
                            {error.suggestions.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Suggestions: {error.suggestions.slice(0, 3).join(', ')}
                                {error.suggestions.length > 3 && '...'}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSpellErrorClick(error)}
                              className="h-6 px-2 text-xs"
                            >
                              Fix
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSpellErrorIgnore(error)}
                              className="h-6 px-2 text-xs text-muted-foreground"
                            >
                              Ignore
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Grammar Check Section */}
        <Card>
          <CardHeader className="pb-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('grammar')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.grammar ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <CardTitle className="text-sm">Grammar & Style</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {isGrammarChecking ? (
                  <RefreshCw size={16} className="animate-spin text-blue-600" />
                ) : grammarError ? (
                  <AlertTriangle size={16} className="text-red-600" />
                ) : grammarSuggestions.length === 0 && content.trim().length > 0 ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <Edit3 size={16} className="text-yellow-600" />
                )}
                <Badge
                  variant={
                    grammarSuggestions.length === 0 && content.trim().length > 0 && !isGrammarChecking
                      ? 'default'
                      : 'secondary'
                  }
                  className={`text-xs ${
                    grammarSuggestions.length === 0 && content.trim().length > 0 && !isGrammarChecking
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                      : grammarSuggestions.length > 0
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {isGrammarChecking ? '...' : grammarSuggestions.length === 0 && content.trim().length > 0 ? '✓' : grammarSuggestions.length}
                </Badge>
              </div>
            </div>
          </CardHeader>

          {expandedSections.grammar && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Grammar Status & Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {isGrammarChecking
                      ? 'Analyzing writing...'
                      : grammarError
                      ? `Error: ${grammarError}`
                      : grammarSuggestions.length === 0 && content.trim().length > 0
                      ? 'No grammar issues found'
                      : `${grammarSuggestions.length} suggestion${grammarSuggestions.length !== 1 ? 's' : ''} found`
                    }
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onGrammarRecheck}
                    disabled={isGrammarChecking}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw size={12} className={isGrammarChecking ? 'animate-spin' : ''} />
                    Recheck
                  </Button>
                </div>

                {/* Grammar Score */}
                {(grammarScore > 0 || grammarImprovedScore > 0) && (
                  <div className="p-2 bg-muted/30 rounded-md">
                    <GrammarSummary
                      score={grammarScore}
                      improvedScore={grammarImprovedScore}
                      suggestionsCount={grammarSuggestions.length}
                      isChecking={isGrammarChecking}
                      error={grammarError}
                      costInfo={grammarCostInfo}
                    />
                  </div>
                )}

                {/* Grammar Suggestions */}
                {grammarSuggestions.length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    <GrammarSuggestions
                      suggestions={grammarSuggestions}
                      isChecking={isGrammarChecking}
                      onApply={onGrammarSuggestionApply}
                      onDismiss={onGrammarSuggestionDismiss}
                    />
                  </div>
                )}

                {/* Cost Info */}
                <div className="pt-2 border-t">
                  <CostIndicator costInfo={grammarCostInfo} />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Readability Section */}
        <Card>
          <CardHeader className="pb-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('readability')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.readability ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <CardTitle className="text-sm">Readability</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                <ReadabilityBadge
                  content={content}
                  gptGrade={grammarReadabilityGrade}
                  showLabel={false}
                />
              </div>
            </div>
          </CardHeader>

          {expandedSections.readability && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Grade level analysis of your writing
                </div>

                <ReadabilityScore
                  content={content}
                  gptGrade={grammarReadabilityGrade}
                  className="flex-wrap gap-1"
                />

                {content.trim().length > 0 && (
                  <div className="p-2 bg-muted/30 rounded-md text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Characters:</span>
                      <span>{content.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Words:</span>
                      <span>{content.split(/\s+/).filter(word => word.length > 0).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sentences:</span>
                      <span>{content.split(/[.!?]+/).filter(s => s.trim().length > 0).length}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          <div className="flex items-center justify-center gap-1">
            <Clock size={10} />
            <span>Updated in real-time</span>
          </div>
        </div>
      </div>
    </div>
  );
}

console.log('✅ FeedbackPanel: Component exported');