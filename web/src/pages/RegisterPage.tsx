import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import PasswordStrength from '../components/PasswordStrength';

type FamilyAction = 'create' | 'join';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [familyAction, setFamilyAction] = useState<FamilyAction>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await register({
        email,
        password,
        display_name: displayName || undefined,
        family_action: familyAction,
        family_name: familyAction === 'create' ? familyName : undefined,
        invite_code: familyAction === 'join' ? inviteCode : undefined,
      });
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-center text-2xl sm:text-3xl font-bold text-primary-600">
            Expenses Manager
          </h1>
          <h2 className="mt-4 sm:mt-6 text-center text-xl sm:text-2xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="At least 8 characters"
              />
              <PasswordStrength password={password} />
            </div>

            <div>
              <label htmlFor="displayName" className="label">
                Display name (optional)
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
                placeholder="How should we call you?"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="label">Family</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="familyAction"
                    value="create"
                    checked={familyAction === 'create'}
                    onChange={() => setFamilyAction('create')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Create a new family
                    </span>
                    <p className="text-xs text-gray-500">Start fresh and invite others</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="familyAction"
                    value="join"
                    checked={familyAction === 'join'}
                    onChange={() => setFamilyAction('join')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Join an existing family
                    </span>
                    <p className="text-xs text-gray-500">Use an invite code</p>
                  </div>
                </label>
              </div>
            </div>

            {familyAction === 'create' && (
              <div>
                <label htmlFor="familyName" className="label">
                  Family name
                </label>
                <input
                  id="familyName"
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="input"
                  placeholder="e.g., The Smiths"
                />
              </div>
            )}

            {familyAction === 'join' && (
              <div>
                <label htmlFor="inviteCode" className="label">
                  Invite code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="input font-mono tracking-wider text-center"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
