import { describe, expect, it } from 'vitest';
import { augmentPathForMacOS } from './userShellEnv';

describe('augmentPathForMacOS', () => {
  it('no-ops on non-darwin platforms', () => {
    const env = { PATH: '/usr/bin' };
    augmentPathForMacOS(env, 'linux');
    expect(env.PATH).toBe('/usr/bin');
  });

  it('prepends missing homebrew + /usr/local slots on darwin', () => {
    const env = { PATH: '/usr/bin:/bin:/usr/sbin:/sbin' };
    augmentPathForMacOS(env, 'darwin');
    expect(env.PATH.split(':')).toEqual([
      '/opt/homebrew/bin',
      '/opt/homebrew/sbin',
      '/usr/local/bin',
      '/usr/local/sbin',
      '/usr/bin',
      '/bin',
      '/usr/sbin',
      '/sbin',
    ]);
  });

  it('does not duplicate entries already present', () => {
    const env = { PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin' };
    augmentPathForMacOS(env, 'darwin');
    expect(env.PATH.split(':')).toEqual([
      '/opt/homebrew/sbin',
      '/usr/local/sbin',
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
    ]);
  });

  it('handles empty PATH', () => {
    const env: Record<string, string> = {};
    augmentPathForMacOS(env, 'darwin');
    expect(env.PATH.split(':')).toEqual([
      '/opt/homebrew/bin',
      '/opt/homebrew/sbin',
      '/usr/local/bin',
      '/usr/local/sbin',
    ]);
  });

  it('does not mutate PATH when nothing is missing', () => {
    const env = {
      PATH: '/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:/usr/bin',
    };
    const before = env.PATH;
    augmentPathForMacOS(env, 'darwin');
    expect(env.PATH).toBe(before);
  });
});
