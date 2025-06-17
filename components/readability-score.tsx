'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateReadabilityMetrics, getReadabilityInterpretation } from '@/lib/readabilityScore';

console.log('🔄 ReadabilityScore component loaded');

export interface ReadabilityScoreProps {
  content: string;
  gptGrade?: number | null;
  className?: string;
}

/**
 * Display readability score with color coding
 * Uses GPT-provided grade when available, falls back to local calculation
 */
export function ReadabilityScore({ content, gptGrade, className = '' }: ReadabilityScoreProps) {
  console.log('🔄 ReadabilityScore: Rendering', {
    contentLength: content.length,
    hasGptGrade: gptGrade !== null && gptGrade !== undefined
  });

  const localMetrics = useMemo(() => {
    if (!content || content.trim().length === 0) {
      return null;
    }
    return calculateReadabilityMetrics(content);
  }, [content]);

  // Use GPT grade if available, otherwise use local calculation
  const grade = gptGrade !== null && gptGrade !== undefined ? gptGrade : localMetrics?.fleschKincaidGrade || 0;
  const interpretation = getReadabilityInterpretation(grade);

  // Don't show anything if no content
  if (!content || content.trim().length === 0 || grade === 0) {
    return null;
  }

  const getColorClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'yellow':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      case 'red':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  const getTrendIcon = () => {
    if (grade <= 8) {
      return <TrendingDown size={12} className="text-green-600 dark:text-green-400" />;
    } else if (grade <= 12) {
      return <BookOpen size={12} className="text-yellow-600 dark:text-yellow-400" />;
    } else {
      return <TrendingUp size={12} className="text-red-600 dark:text-red-400" />;
    }
  };

  console.log('📊 ReadabilityScore: Displaying grade', {
    grade,
    source: gptGrade !== null && gptGrade !== undefined ? 'gpt' : 'local',
    interpretation: interpretation.level
  });

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        {getTrendIcon()}
        <span className="text-muted-foreground">Readability:</span>
      </div>

      <Badge
        variant="outline"
        className={`${getColorClasses(interpretation.color)} text-xs px-2 py-0.5`}
      >
        Grade {grade.toFixed(1)} - {interpretation.level}
      </Badge>

      {localMetrics && (
        <span className="text-muted-foreground hidden sm:inline">
          ({localMetrics.averageWordsPerSentence} avg words/sentence)
        </span>
      )}

      {gptGrade !== null && gptGrade !== undefined && (
        <span className="text-xs text-blue-600 dark:text-blue-400 hidden md:inline">
          AI analyzed
        </span>
      )}
    </div>
  );
}

/**
 * Compact readability indicator for tight spaces
 */
export interface ReadabilityBadgeProps {
  content: string;
  gptGrade?: number | null;
  showLabel?: boolean;
  className?: string;
}

export function ReadabilityBadge({
  content,
  gptGrade,
  showLabel = true,
  className = ''
}: ReadabilityBadgeProps) {
  console.log('🔄 ReadabilityBadge: Rendering compact version');

  const localMetrics = useMemo(() => {
    if (!content || content.trim().length === 0) {
      return null;
    }
    return calculateReadabilityMetrics(content);
  }, [content]);

  const grade = gptGrade !== null && gptGrade !== undefined ? gptGrade : localMetrics?.fleschKincaidGrade || 0;
  const interpretation = getReadabilityInterpretation(grade);

  if (!content || content.trim().length === 0 || grade === 0) {
    return null;
  }

  const getColorClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    }
  };

  return (
    <Badge
      variant="outline"
      className={`${getColorClasses(interpretation.color)} text-xs ${className}`}
      title={`${interpretation.description} (${grade.toFixed(1)} grade level)`}
    >
      {showLabel && 'Grade '}
      {grade.toFixed(1)}
    </Badge>
  );
}