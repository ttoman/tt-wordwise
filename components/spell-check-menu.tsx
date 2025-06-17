'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { SpellCheckError } from '@/lib/hooks/useSpellCheck';

console.log('🔄 SpellCheckMenu: Component loaded');

export interface SpellCheckMenuProps {
  error: SpellCheckError | null;
  position: { x: number; y: number } | null;
  onSuggestionSelect: (suggestion: string) => void;
  onIgnore: () => void;
  onClose: () => void;
}

/**
 * Context menu that appears when right-clicking on misspelled words
 * Shows up to 5 spelling suggestions with apply/ignore options
 */
export function SpellCheckMenu({
  error,
  position,
  onSuggestionSelect,
  onIgnore,
  onClose
}: SpellCheckMenuProps) {
  console.log('🔄 SpellCheckMenu: Rendering', {
    hasError: !!error,
    hasPosition: !!position,
    suggestionsCount: error?.suggestions.length || 0
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('🔄 SpellCheckMenu: Clicked outside, closing menu');
        onClose();
      }
    };

    if (position) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [position, onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🔄 SpellCheckMenu: Escape pressed, closing menu');
        onClose();
      }
    };

    if (position) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [position, onClose]);

  // Don't render if no error or position
  if (!error || !position) {
    return null;
  }

  const handleSuggestionClick = (suggestion: string) => {
    console.log(`✅ SpellCheckMenu: Suggestion "${suggestion}" selected for word "${error.word}"`);
    onSuggestionSelect(suggestion);
    onClose();
  };

  const handleIgnoreClick = () => {
    console.log(`🔄 SpellCheckMenu: Ignoring word "${error.word}"`);
    onIgnore();
    onClose();
  };

  // Calculate menu position to keep it on screen
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 1000,
    maxWidth: '250px',
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="animate-in fade-in-0 zoom-in-95 duration-200"
    >
      <Card className="shadow-lg border">
        <CardContent className="p-2">
          {/* Misspelled word header */}
          <div className="px-2 py-1 border-b mb-2">
            <span className="text-sm font-medium text-destructive">
              "{error.word}"
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              Misspelled
            </span>
          </div>

          {/* Suggestions */}
          {error.suggestions.length > 0 ? (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground px-2 mb-1">
                Suggestions:
              </div>
              {error.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left p-2 h-auto font-normal"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Check size={14} className="mr-2 text-green-600" />
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-2">
              No suggestions available
            </div>
          )}

          {/* Actions */}
          <div className="border-t mt-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left p-2 h-auto font-normal"
              onClick={handleIgnoreClick}
            >
              <X size={14} className="mr-2 text-orange-600" />
              Ignore
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook for managing spell check menu state and positioning
 */
export function useSpellCheckMenu() {
  console.log('🔄 useSpellCheckMenu: Hook initialized');

  const [menuState, setMenuState] = useState<{
    error: SpellCheckError | null;
    position: { x: number; y: number } | null;
  }>({
    error: null,
    position: null
  });

  const showMenu = (error: SpellCheckError, event: MouseEvent) => {
    console.log(`🔄 useSpellCheckMenu: Showing menu for word "${error.word}" at position`, {
      x: event.clientX,
      y: event.clientY
    });

    setMenuState({
      error,
      position: {
        x: event.clientX,
        y: event.clientY
      }
    });
  };

  const hideMenu = () => {
    console.log('🔄 useSpellCheckMenu: Hiding menu');
    setMenuState({
      error: null,
      position: null
    });
  };

  return {
    menuState,
    showMenu,
    hideMenu
  };
}

console.log('✅ SpellCheckMenu: Component exported');