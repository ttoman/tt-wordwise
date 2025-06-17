'use client';

import { AutosaveState } from '@/lib/autosave';
import { Check, Clock, Save, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

console.log('🔄 SaveStatus component loaded');

export interface SaveStatusProps {
  state: AutosaveState;
  className?: string;
}

/**
 * Component that displays the current autosave status
 */
export function SaveStatus({ state, className }: SaveStatusProps) {
  console.log('📊 SaveStatus: Rendering with state', state);

  const getStatusConfig = () => {
    switch (state.status) {
      case 'idle':
        return {
          icon: Clock,
          text: state.lastSaved
            ? `Last saved ${formatRelativeTime(state.lastSaved)}`
            : 'Ready',
          className: 'text-muted-foreground',
        };

      case 'pending':
        return {
          icon: Clock,
          text: 'Autosave pending...',
          className: 'text-yellow-600 dark:text-yellow-400',
        };

      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'text-blue-600 dark:text-blue-400',
          spinning: true,
        };

      case 'saved':
        return {
          icon: Check,
          text: '✓ Saved',
          className: 'text-green-600 dark:text-green-400',
        };

      case 'error':
        return {
          icon: AlertCircle,
          text: state.error || 'Save failed',
          className: 'text-red-600 dark:text-red-400',
        };

      default:
        return {
          icon: Clock,
          text: 'Ready',
          className: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs font-medium transition-colors',
      config.className,
      className
    )}>
      <Icon
        size={14}
        className={cn(
          'flex-shrink-0',
          config.spinning && 'animate-spin'
        )}
      />
      <span className="truncate">
        {config.text}
      </span>
      {state.isDirty && state.status !== 'saving' && (
        <span className="text-orange-500 dark:text-orange-400 ml-1">•</span>
      )}
    </div>
  );
}

/**
 * Format relative time for last saved timestamp
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

console.log('✅ SaveStatus: Component exported');