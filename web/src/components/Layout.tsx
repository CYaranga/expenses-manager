import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useTranslation } from '../hooks/useTranslation';
import ThemeToggle from './ThemeToggle';
import FamilyDropdown from './FamilyDropdown';
import LanguageToggle from './LanguageToggle';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-primary-900">
      {/* Header bar */}
      <header className="sticky top-0 z-20 bg-white dark:bg-primary-800 border-b border-cream-300 dark:border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-700 dark:bg-accent-400 rounded-lg flex items-center justify-center">
              <span className="text-accent-400 dark:text-primary-900 font-bold text-lg">$</span>
            </div>
            <span className="font-display text-lg font-bold text-primary-700 dark:text-cream-100">{t('appTitle')}</span>
          </div>

          {/* Right: Family dropdown + Language + Theme + User menu */}
          <div className="flex items-center gap-2">
            <FamilyDropdown />
            <LanguageToggle />
            <ThemeToggle />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-primary-700 transition-colors"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                    <span className="text-accent-600 dark:text-accent-400 text-sm font-medium">
                      {user?.display_name?.[0] || user?.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-primary-800 rounded-xl shadow-lg border border-cream-200 dark:border-primary-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-cream-200 dark:border-primary-700">
                    <p className="text-sm font-medium text-primary-700 dark:text-cream-100 truncate">
                      {user?.display_name || user?.email}
                    </p>
                    <p className="text-xs text-primary-400 dark:text-cream-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-cream-100 dark:hover:bg-primary-700"
                  >
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
