'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, DollarSign } from 'lucide-react';

console.log('🔄 CostWarningBanner component loaded');

export interface CostWarningBannerProps {
  costInfo: {
    totalCost: number;
    remainingBudget: number;
    resetTime: number;
  } | null;
  className?: string;
}

/**
 * Display cost warning banner when usage exceeds monthly budget
 * Shows warning at $1 monthly spend and can be dismissed
 */
export function CostWarningBanner({ costInfo, className = '' }: CostWarningBannerProps) {
  console.log('🔄 CostWarningBanner: Rendering', { costInfo });

  const [isDismissed, setIsDismissed] = useState(false);

  // Check if we should show the warning
  const shouldShowWarning = costInfo && costInfo.totalCost >= 1.0 && !isDismissed;

  // Reset dismissal when cost resets (new month/hour)
  useEffect(() => {
    if (costInfo && costInfo.remainingBudget > 0) {
      setIsDismissed(false);
    }
  }, [costInfo?.resetTime]);

  const handleDismiss = () => {
    console.log('🔄 CostWarningBanner: Dismissed by user');
    setIsDismissed(true);
  };

  const getTimeUntilReset = () => {
    if (!costInfo) return '';

    const now = Date.now();
    const timeLeft = costInfo.resetTime - now;

    if (timeLeft <= 0) return 'soon';

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!shouldShowWarning) {
    return null;
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400 mt-0.5" />

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-orange-800 dark:text-orange-200">
                Monthly AI Usage Limit Reached
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>

            <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign size={14} />
                <span>
                  You've used <strong>${costInfo.totalCost.toFixed(2)}</strong> this month
                  (limit: $1.00)
                </span>
              </div>

              <p>
                Grammar checking will continue to work, but please monitor your usage.
                Costs reset in <strong>{getTimeUntilReset()}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-orange-600 dark:text-orange-400">
              <div>
                💡 <strong>Tip:</strong> Use fewer grammar checks or shorter text segments to reduce costs
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact cost indicator for display in footers
 */
export interface CostIndicatorProps {
  costInfo: {
    totalCost: number;
    remainingBudget: number;
    resetTime: number;
  } | null;
  className?: string;
}

export function CostIndicator({ costInfo, className = '' }: CostIndicatorProps) {
  if (!costInfo || costInfo.totalCost < 0.01) {
    return null;
  }

  const warningLevel = costInfo.totalCost >= 1.0 ? 'high' :
                      costInfo.totalCost >= 0.50 ? 'medium' : 'low';

  const getColorClasses = () => {
    switch (warningLevel) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <div className={`flex items-center gap-1 text-xs ${getColorClasses()} ${className}`}>
      <DollarSign size={10} />
      <span>${costInfo.totalCost.toFixed(3)}</span>
      <span className="text-muted-foreground">
        / $1.00
      </span>
    </div>
  );
}