import { useState } from 'react';
import type { Project } from '../types';

interface WelcomeScreenProps {
  onProjectOpened: (project: Project) => void;
}

export function WelcomeScreen({ onProjectOpened }: WelcomeScreenProps) {
  const [opening, setOpening] = useState(false);
  const [gitError, setGitError] = useState(false);

  const handleOpen = async () => {
    setGitError(false);
    setOpening(true);
    try {
      const result = await window.electronAPI.project.open();
      if (result && !('error' in result)) {
        onProjectOpened(result);
      } else if (result && 'error' in result && result.error === 'NOT_GIT_REPO') {
        setGitError(true);
      }
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-950 px-6 text-white">
      <div className="flex max-w-md flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-50">Flux</h1>
        <p className="mt-2 text-sm text-gray-400">AI agent task manager</p>
        <button
          type="button"
          disabled={opening}
          onClick={() => void handleOpen()}
          className="mt-10 rounded-lg bg-white px-8 py-3 text-base font-medium text-gray-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {opening ? 'Opening…' : 'Open project folder'}
        </button>
        <p className="mt-3 text-xs text-gray-500">Opens a local git repository</p>
        {gitError ? (
          <p className="mt-4 max-w-sm text-sm text-red-400/90" role="alert">
            That folder isn&apos;t a git repository. Run git init first.
          </p>
        ) : null}
      </div>
    </div>
  );
}
