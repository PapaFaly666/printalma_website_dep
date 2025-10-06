import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './input';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface ChipsInputProps {
  value: string[];
  onChange: (chips: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxChips?: number;
}

export const ChipsInput: React.FC<ChipsInputProps> = ({
  value = [],
  onChange,
  placeholder = "Ajouter des variations...",
  className,
  disabled = false,
  maxChips
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (chipValue: string) => {
    const trimmedValue = chipValue.trim();
    if (!trimmedValue) return;

    // Éviter les doublons
    if (value.includes(trimmedValue)) return;

    // Vérifier la limite max
    if (maxChips && value.length >= maxChips) return;

    onChange([...value, trimmedValue]);
    setInputValue('');
  };

  const removeChip = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 p-3 min-h-[2.5rem] border rounded-md cursor-text transition-all duration-200",
        "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
        isInputFocused && "ring-2 ring-blue-500/20 border-blue-500",
        disabled && "bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50",
        className
      )}
      onClick={handleContainerClick}
    >
      {value.map((chip, index) => (
        <Badge
          key={index}
          className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors duration-150 group animate-in slide-in-from-left-2"
        >
          <span className="mr-1">{chip}</span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChip(index);
              }}
              className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors duration-150"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}

      {(!maxChips || value.length < maxChips) && !disabled && (
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="border-none bg-transparent p-0 flex-1 min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={disabled}
        />
      )}

      {maxChips && (
        <div className="text-xs text-gray-500 dark:text-gray-400 self-center ml-auto">
          {value.length}/{maxChips}
        </div>
      )}
    </div>
  );
};