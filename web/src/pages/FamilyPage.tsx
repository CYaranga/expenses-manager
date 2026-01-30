import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
  useFamily,
  useFamilyMembers,
  useCreateFamily,
  useUpdateFamily,
  useJoinFamily,
  useRegenerateInviteCode,
  useLeaveFamily,
} from '../hooks/useFamily';

export default function FamilyPage() {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  const { data: familyData, isLoading: familyLoading, error: familyError } = useFamily();
  const { data: membersData, isLoading: membersLoading } = useFamilyMembers();

  const createFamily = useCreateFamily();
  const updateFamily = useUpdateFamily();
  const joinFamily = useJoinFamily();
  const regenerateCode = useRegenerateInviteCode();
  const leaveFamily = useLeaveFamily();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasFamily = !!user?.family_id;
  const isAdmin = user?.role === 'admin';

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createFamily.mutateAsync({
        name: familyName,
        description: familyDescription || undefined,
      });
      await checkAuth();
      setShowCreateForm(false);
      setFamilyName('');
      setFamilyDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family');
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await joinFamily.mutateAsync(inviteCode);
      await checkAuth();
      setShowJoinForm(false);
      setInviteCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join family');
    }
  };

  const handleUpdateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await updateFamily.mutateAsync({
        name: familyName,
        description: familyDescription || undefined,
      });
      setShowEditForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update family');
    }
  };

  const handleRegenerateCode = async () => {
    if (
      !window.confirm(
        'Are you sure you want to regenerate the invite code? The old code will stop working.'
      )
    ) {
      return;
    }

    try {
      await regenerateCode.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate code');
    }
  };

  const handleLeaveFamily = async () => {
    const message = isAdmin
      ? 'As the admin, leaving will delete the family if you are the only member. Are you sure?'
      : 'Are you sure you want to leave this family?';

    if (!window.confirm(message)) {
      return;
    }

    try {
      await leaveFamily.mutateAsync();
      await checkAuth();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave family');
    }
  };

  const copyInviteCode = async () => {
    if (familyData?.family.invite_code) {
      await navigator.clipboard.writeText(familyData.family.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!hasFamily) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-cream-100">Family Setup</h1>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Create family card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-2">
              Create a Family
            </h2>
            <p className="text-primary-500 dark:text-cream-300 text-sm mb-4">
              Start a new family and invite others to join.
            </p>
            {showCreateForm ? (
              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label className="label">Family Name</label>
                  <input
                    type="text"
                    required
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="input"
                    placeholder="e.g., The Smiths"
                  />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <input
                    type="text"
                    value={familyDescription}
                    onChange={(e) => setFamilyDescription(e.target.value)}
                    className="input"
                    placeholder="A short description"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createFamily.isPending}
                    className="btn-accent flex-1"
                  >
                    {createFamily.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-accent w-full"
              >
                Create Family
              </button>
            )}
          </div>

          {/* Join family card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-2">
              Join a Family
            </h2>
            <p className="text-primary-500 dark:text-cream-300 text-sm mb-4">
              Enter an invite code to join an existing family.
            </p>
            {showJoinForm ? (
              <form onSubmit={handleJoinFamily} className="space-y-4">
                <div>
                  <label className="label">Invite Code</label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="input font-mono tracking-wider text-center"
                    placeholder="XXXXXXXX"
                    maxLength={8}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joinFamily.isPending}
                    className="btn-accent flex-1"
                  >
                    {joinFamily.isPending ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowJoinForm(true)}
                className="btn-accent w-full"
              >
                Join Family
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (familyLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-accent-400"></div>
      </div>
    );
  }

  if (familyError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Failed to load family data.</p>
      </div>
    );
  }

  const family = familyData?.family;
  const members = membersData?.members || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-cream-100">Family</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setFamilyName(family?.name || '');
              setFamilyDescription(family?.description || '');
              setShowEditForm(true);
            }}
            className="btn-secondary"
          >
            Edit Family
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Edit form modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-primary-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">Edit Family</h2>
            <form onSubmit={handleUpdateFamily} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={familyDescription}
                  onChange={(e) => setFamilyDescription(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateFamily.isPending}
                  className="btn-accent flex-1"
                >
                  {updateFamily.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-2">
          {family?.name}
        </h2>
        {family?.description && (
          <p className="text-primary-500 dark:text-cream-300 mb-4">{family.description}</p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-cream-100 dark:bg-primary-900 rounded-lg">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm text-primary-500 dark:text-cream-300">Invite Code</p>
            <p className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-primary-700 dark:text-accent-400">
              {family?.invite_code}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyInviteCode} className="btn-secondary flex-1 sm:flex-none">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {isAdmin && (
              <button
                onClick={handleRegenerateCode}
                disabled={regenerateCode.isPending}
                className="btn-secondary flex-1 sm:flex-none"
              >
                {regenerateCode.isPending ? '...' : 'Regenerate'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-700 dark:text-cream-100 mb-4">
          Members ({members.length})
        </h2>
        <div className="divide-y divide-cream-200 dark:divide-primary-700 -mx-4 sm:-mx-6 px-4 sm:px-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="py-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-600 dark:text-accent-400 font-medium">
                    {member.display_name?.[0] || member.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-primary-700 dark:text-cream-100 truncate">
                    {member.display_name || member.email.split('@')[0]}
                    {member.id === user?.id && (
                      <span className="text-primary-400 dark:text-cream-400 text-sm ml-1">(you)</span>
                    )}
                  </p>
                  <p className="text-sm text-primary-500 dark:text-cream-300 truncate">{member.email}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                  member.role === 'admin'
                    ? 'bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-400'
                    : 'bg-cream-200 dark:bg-primary-700 text-primary-600 dark:text-cream-200'
                }`}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave family */}
      <div className="card border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
        <p className="text-primary-500 dark:text-cream-300 text-sm mb-4">
          {isAdmin
            ? 'As the admin, leaving will delete the family if you are the only member.'
            : 'Leave this family to join or create another one.'}
        </p>
        <button
          onClick={handleLeaveFamily}
          disabled={leaveFamily.isPending}
          className="btn-danger"
        >
          {leaveFamily.isPending ? 'Leaving...' : 'Leave Family'}
        </button>
      </div>
    </div>
  );
}
