import React from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';

interface CommandProps {
  children: React.ReactNode;
  className?: string;
}

interface CommandInputProps {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface CommandListProps {
  children: React.ReactNode;
}

interface CommandEmptyProps {
  children: React.ReactNode;
}

interface CommandGroupProps {
  children: React.ReactNode;
  heading?: string;
}

interface CommandItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  value?: string;
}

export const Command: React.FC<CommandProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {children}
    </div>
  );
};

export const CommandInput: React.FC<CommandInputProps> = ({ 
  placeholder = "Rechercher...", 
  value, 
  onValueChange 
}) => {
  return (
    <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3">
      <Search className="h-4 w-4 text-gray-400 mr-2" />
      <Input
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={placeholder}
        className="border-0 bg-transparent p-2 focus:ring-0 focus:outline-none"
      />
    </div>
  );
};

export const CommandList: React.FC<CommandListProps> = ({ children }) => {
  return (
    <div className="max-h-64 overflow-y-auto p-1">
      {children}
    </div>
  );
};

export const CommandEmpty: React.FC<CommandEmptyProps> = ({ children }) => {
  return (
    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
      {children}
    </div>
  );
};

export const CommandGroup: React.FC<CommandGroupProps> = ({ children, heading }) => {
  return (
    <div className="overflow-hidden p-1">
      {heading && (
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
};

export const CommandItem: React.FC<CommandItemProps> = ({ children, onSelect, value }) => {
  return (
    <div
      onClick={onSelect}
      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
    >
      {children}
    </div>
  );
}; 