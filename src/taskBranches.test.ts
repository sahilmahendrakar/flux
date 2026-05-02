import { describe, expect, it } from 'vitest';
import type { Task } from './types';
import {
  classifyGitBranchPresence,
  effectiveTaskSourceBranchShort,
  normalizeGitBranchShortName,
  planTaskSourceBranchFieldsForCreate,
  resolveCreateSourceBranchIfMissingForStart,
} from './taskBranches';

describe('normalizeGitBranchShortName', () => {
  it('trims and strips refs/heads', () => {
    expect(normalizeGitBranchShortName('  refs/heads/feature/x  ')).toBe('feature/x');
  });

  it('maps origin/foo to foo', () => {
    expect(normalizeGitBranchShortName('origin/main')).toBe('main');
  });

  it('strips refs/remotes/origin/', () => {
    expect(normalizeGitBranchShortName('refs/remotes/origin/develop')).toBe('develop');
  });
});

describe('classifyGitBranchPresence', () => {
  const locals = ['main', 'dev'];
  const remotes = ['origin/side', 'origin/main'];

  it('classifies both', () => {
    const r = classifyGitBranchPresence('main', locals, remotes);
    expect(r.normalizedShort).toBe('main');
    expect(r.presence).toBe('both');
  });

  it('classifies local-only', () => {
    const r = classifyGitBranchPresence('dev', locals, remotes);
    expect(r.presence).toBe('local');
  });

  it('classifies remote-only', () => {
    const r = classifyGitBranchPresence('side', locals, remotes);
    expect(r.presence).toBe('remote');
  });

  it('classifies missing', () => {
    const r = classifyGitBranchPresence('new-branch', locals, remotes);
    expect(r.presence).toBe('missing');
  });

  it('normalizes origin/ prefix in the request', () => {
    const r = classifyGitBranchPresence('origin/main', [], ['main']);
    expect(r.normalizedShort).toBe('main');
    expect(r.presence).toBe('remote');
  });
});

describe('effectiveTaskSourceBranchShort', () => {
  it('falls back to project default when task omits sourceBranch', () => {
    const task = {} as Pick<Task, 'sourceBranch'>;
    expect(effectiveTaskSourceBranchShort(task, 'main')).toBe('main');
  });

  it('uses task.sourceBranch when set', () => {
    expect(
      effectiveTaskSourceBranchShort({ sourceBranch: 'origin/foo' } as Task, 'main'),
    ).toBe('foo');
  });
});

describe('resolveCreateSourceBranchIfMissingForStart', () => {
  it('returns false when branch exists', () => {
    expect(
      resolveCreateSourceBranchIfMissingForStart({ createSourceBranchIfMissing: true }, 'both'),
    ).toBe(false);
  });

  it('returns false when missing but flag is false', () => {
    expect(
      resolveCreateSourceBranchIfMissingForStart(
        { createSourceBranchIfMissing: false },
        'missing',
      ),
    ).toBe(false);
  });

  it('returns true when missing and flag true', () => {
    expect(
      resolveCreateSourceBranchIfMissingForStart(
        { createSourceBranchIfMissing: true },
        'missing',
      ),
    ).toBe(true);
  });

  it('defaults true when missing and flag omitted', () => {
    expect(resolveCreateSourceBranchIfMissingForStart({} as Task, 'missing')).toBe(true);
  });
});

describe('planTaskSourceBranchFieldsForCreate', () => {
  const disc = {
    defaultBranchShort: 'main',
    localBranches: ['main'],
    remoteBranches: ['origin/release'],
  };

  it('defaults source to project default and create false when branch exists', () => {
    const p = planTaskSourceBranchFieldsForCreate(disc, {});
    expect(p.sourceBranch).toBe('main');
    expect(p.createSourceBranchIfMissing).toBe(false);
  });

  it('sets create true for new branch name by default', () => {
    const p = planTaskSourceBranchFieldsForCreate(disc, { sourceBranch: 'feature-xyz' });
    expect(p.sourceBranch).toBe('feature-xyz');
    expect(p.createSourceBranchIfMissing).toBe(true);
  });

  it('honors explicit create false for missing branch', () => {
    const p = planTaskSourceBranchFieldsForCreate(disc, {
      sourceBranch: 'feature-xyz',
      createSourceBranchIfMissing: false,
    });
    expect(p.createSourceBranchIfMissing).toBe(false);
  });
});
