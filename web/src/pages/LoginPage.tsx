import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useTranslation } from '../hooks/useTranslation';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const { googleSignIn, error, clearError } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    clearError();
    try {
      await googleSignIn(response.credential);
      navigate('/');
    } catch {
      // Error is handled by the store
    }
  }, [googleSignIn, navigate, clearError]);

  useEffect(() => {
    if (initializedRef.current) return;

    function tryInit() {
      if (window.google && buttonRef.current) {
        initializedRef.current = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    }

    tryInit();

    // If Google script hasn't loaded yet, retry
    if (!window.google) {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          tryInit();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleResponse]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-primary-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-6 sm:space-y-8 text-center">
        <div>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-700 dark:bg-accent-400 rounded-xl flex items-center justify-center">
              <span className="text-accent-400 dark:text-primary-900 font-bold text-2xl">$</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 dark:text-cream-100">
            {t('appName')}
          </h1>
          <p className="mt-2 text-sm text-primary-500 dark:text-cream-300">
            {t('appSubtitle')}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <div ref={buttonRef} />
        </div>
      </div>
    </div>
  );
}
