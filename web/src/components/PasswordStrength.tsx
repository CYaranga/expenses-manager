import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  suggestions: string[];
}

function calculatePasswordStrength(password: string): StrengthResult {
  let score = 0;
  const suggestions: string[] = [];

  if (!password) {
    return {
      score: 0,
      label: '',
      color: 'text-primary-400 dark:text-cream-400',
      bgColor: 'bg-cream-300 dark:bg-primary-700',
      suggestions: [],
    };
  }

  // Length checks
  if (password.length >= 8) score += 1;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else suggestions.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else suggestions.push('Add special characters (!@#$%^&*)');

  // Penalty for common patterns
  if (/^[a-zA-Z]+$/.test(password)) score -= 1;
  if (/^[0-9]+$/.test(password)) score -= 1;
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    suggestions.push('Avoid repeated characters');
  }
  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score -= 2;
    suggestions.push('Avoid common patterns');
  }

  // Normalize score to 0-4 range
  const normalizedScore = Math.max(0, Math.min(4, Math.round(score / 2)));

  const levels: { label: string; color: string; bgColor: string }[] = [
    { label: 'Very weak', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500' },
    { label: 'Weak', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500' },
    { label: 'Fair', color: 'text-accent-500', bgColor: 'bg-accent-400' },
    { label: 'Good', color: 'text-primary-500 dark:text-primary-300', bgColor: 'bg-primary-500' },
    { label: 'Strong', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500' },
  ];

  return {
    score: normalizedScore,
    label: levels[normalizedScore].label,
    color: levels[normalizedScore].color,
    bgColor: levels[normalizedScore].bgColor,
    suggestions: suggestions.slice(0, 2), // Show max 2 suggestions
  };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              level <= strength.score ? strength.bgColor : 'bg-cream-300 dark:bg-primary-700'
            }`}
          />
        ))}
      </div>

      {/* Label and suggestions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs font-medium ${strength.color}`}>
          {strength.label}
        </span>
        {strength.suggestions.length > 0 && (
          <span className="text-xs text-primary-400 dark:text-cream-400">
            {strength.suggestions[0]}
          </span>
        )}
      </div>
    </div>
  );
}
