import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    setTimeout(() => {
      setIsSaving(false);
      setMessage({
        type: 'success',
        text: 'Profile update feature coming soon!',
      });
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-cream-100">Settings</h1>

      {/* Appearance section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">Appearance</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-primary-700 dark:text-cream-100">Theme</p>
            <p className="text-sm text-primary-500 dark:text-cream-300">Choose your preferred color scheme</p>
          </div>
          <div className="flex rounded-lg border border-cream-300 dark:border-primary-600 overflow-hidden">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-primary-700 text-white dark:bg-accent-400 dark:text-primary-900'
                  : 'bg-white dark:bg-primary-800 text-primary-600 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-primary-700'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-primary-700 text-white dark:bg-accent-400 dark:text-primary-900'
                  : 'bg-white dark:bg-primary-800 text-primary-600 dark:text-cream-200 hover:bg-cream-100 dark:hover:bg-primary-700'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Profile section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">Profile</h2>

        {message && (
          <div
            className={`rounded-md p-4 mb-4 ${
              message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input bg-cream-100 dark:bg-primary-900 text-primary-400 dark:text-cream-400"
            />
            <p className="text-xs text-primary-400 dark:text-cream-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="label">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              placeholder="How should we call you?"
            />
          </div>

          <div>
            <label className="label">Role</label>
            <input
              type="text"
              value={user?.role || 'member'}
              disabled
              className="input bg-cream-100 dark:bg-primary-900 text-primary-400 dark:text-cream-400 capitalize"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-accent w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">
          Account Information
        </h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-primary-500 dark:text-cream-300">Account created</dt>
            <dd className="text-primary-700 dark:text-cream-100">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-primary-500 dark:text-cream-300">User ID</dt>
            <dd className="text-primary-700 dark:text-cream-100 font-mono text-xs sm:text-sm break-all">{user?.id}</dd>
          </div>
        </dl>
      </div>

      {/* Password change section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">
          Change Password
        </h2>
        <p className="text-primary-500 dark:text-cream-300 text-sm mb-4">
          Password change feature coming soon.
        </p>
        <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
          Change Password
        </button>
      </div>

      {/* App info */}
      <div className="card bg-cream-100 dark:bg-primary-900">
        <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-2">
          About Expenses Manager
        </h2>
        <p className="text-primary-500 dark:text-cream-300 text-sm">
          A family expense tracking application built with React, Hono, and
          Cloudflare Workers.
        </p>
        <p className="text-primary-400 dark:text-cream-400 text-xs mt-4">Version 1.0.0</p>
      </div>
    </div>
  );
}
