import { useState, useRef, useEffect } from 'react';
import { useFamily, useLeaveFamily, useRegenerateInviteCode } from '../hooks/useFamily';
import { useAuthStore } from '../store/auth.store';
import { useTranslation } from '../hooks/useTranslation';

export default function FamilyDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: familyData } = useFamily();
  const leaveFamily = useLeaveFamily();
  const regenerateCode = useRegenerateInviteCode();
  const { user, checkAuth } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!familyData?.family) return null;

  const family = familyData.family;
  const isAdmin = user?.role === 'admin';

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(family.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (window.confirm(t('regenerateConfirm'))) {
      try {
        await regenerateCode.mutateAsync();
      } catch (err) {
        alert(err instanceof Error ? err.message : t('failedToRegenerateCode'));
      }
    }
  };

  const handleLeave = async () => {
    if (window.confirm(t('leaveConfirm'))) {
      try {
        await leaveFamily.mutateAsync();
        await checkAuth();
      } catch (err) {
        alert(err instanceof Error ? err.message : t('failedToLeaveFamily'));
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-primary-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="hidden sm:inline">{family.name}</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-primary-800 rounded-xl shadow-lg border border-cream-200 dark:border-primary-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-cream-200 dark:border-primary-700">
            <p className="font-medium text-primary-700 dark:text-cream-100">{family.name}</p>
            <p className="text-xs text-primary-400 dark:text-cream-400 mt-0.5">
              {family.currency}
            </p>
          </div>

          <div className="px-4 py-2 border-b border-cream-200 dark:border-primary-700">
            <p className="text-xs text-primary-500 dark:text-cream-300 mb-1">{t('inviteCode')}</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-primary-700 dark:text-cream-100 tracking-widest">
                {family.invite_code}
              </code>
              <button
                onClick={handleCopyCode}
                className="text-xs text-accent-500 hover:text-accent-600"
              >
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleRegenerateCode}
              disabled={regenerateCode.isPending}
              className="w-full text-left px-4 py-2 text-sm text-primary-600 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-primary-700"
            >
              {t('regenerateInviteCode')}
            </button>
          )}

          <button
            onClick={handleLeave}
            disabled={leaveFamily.isPending}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-cream-100 dark:hover:bg-primary-700"
          >
            {t('leaveFamily')}
          </button>
        </div>
      )}
    </div>
  );
}
