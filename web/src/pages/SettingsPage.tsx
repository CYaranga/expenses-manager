import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';

export default function SettingsPage() {
  const { user } = useAuthStore();
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
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>

        {message && (
          <div
            className={`rounded-md p-4 mb-4 ${
              message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
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
              className="input bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
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
              className="input bg-gray-50 text-gray-500 capitalize"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-gray-500">Account created</dt>
            <dd className="text-gray-900">
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
            <dt className="text-sm text-gray-500">User ID</dt>
            <dd className="text-gray-900 font-mono text-xs sm:text-sm break-all">{user?.id}</dd>
          </div>
        </dl>
      </div>

      {/* Password change section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Password change feature coming soon.
        </p>
        <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
          Change Password
        </button>
      </div>

      {/* App info */}
      <div className="card bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          About Expenses Manager
        </h2>
        <p className="text-gray-600 text-sm">
          A family expense tracking application built with React, Hono, and
          Cloudflare Workers.
        </p>
        <p className="text-gray-500 text-xs mt-4">Version 1.0.0</p>
      </div>
    </div>
  );
}
