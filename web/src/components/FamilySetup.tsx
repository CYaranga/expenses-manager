import { useState } from 'react';
import { useCreateFamily, useJoinFamily } from '../hooks/useFamily';
import { useAuthStore } from '../store/auth.store';
import { useTranslation } from '../hooks/useTranslation';

export default function FamilySetup() {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const createFamily = useCreateFamily();
  const joinFamily = useJoinFamily();
  const { checkAuth } = useAuthStore();
  const { t } = useTranslation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFamily.mutateAsync({ name: familyName });
      await checkAuth();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('failedToCreateFamily'));
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinFamily.mutateAsync(inviteCode);
      await checkAuth();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('failedToJoinFamily'));
    }
  };

  if (mode === 'choice') {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <h2 className="text-xl font-bold text-primary-700 dark:text-cream-100 mb-2">
          {t('welcome')}
        </h2>
        <p className="text-primary-500 dark:text-cream-300 mb-6">
          {t('familySetupDescription')}
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => setMode('create')} className="btn-accent py-3">
            {t('createFamily')}
          </button>
          <button onClick={() => setMode('join')} className="btn-secondary py-3">
            {t('joinWithInviteCode')}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <button
          onClick={() => setMode('choice')}
          className="text-sm text-primary-500 dark:text-cream-300 hover:underline mb-4 inline-block"
        >
          &larr; {t('back')}
        </button>
        <h2 className="text-xl font-bold text-primary-700 dark:text-cream-100 mb-4">
          {t('createFamily')}
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">{t('familyName')}</label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="input"
              placeholder={t('familyNamePlaceholder')}
              required
            />
          </div>
          <button
            type="submit"
            disabled={createFamily.isPending}
            className="btn-accent w-full py-3"
          >
            {createFamily.isPending ? t('creating') : t('create')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <button
        onClick={() => setMode('choice')}
        className="text-sm text-primary-500 dark:text-cream-300 hover:underline mb-4 inline-block"
      >
        &larr; {t('back')}
      </button>
      <h2 className="text-xl font-bold text-primary-700 dark:text-cream-100 mb-4">
        {t('joinFamily')}
      </h2>
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="label">{t('inviteCode')}</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="input font-mono tracking-widest"
            placeholder="ABCD1234"
            required
          />
        </div>
        <button
          type="submit"
          disabled={joinFamily.isPending}
          className="btn-accent w-full py-3"
        >
          {joinFamily.isPending ? t('joining') : t('join')}
        </button>
      </form>
    </div>
  );
}
