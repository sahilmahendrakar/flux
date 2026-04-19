import { useEffect, type RefObject } from 'react';
import type { TerminalHandle } from '../components/Terminal';

/**
 * Simulates streaming terminal output for development.
 * Pass `sessionId` when a session is active so streaming runs after the xterm instance exists.
 */
export function useFakeSession(
  terminalRef: RefObject<TerminalHandle | null>,
  sessionId: string | null,
) {
  useEffect(() => {
    if (!sessionId || !terminalRef.current) {
      return;
    }

    const lines = [
      '\x1b[32m✓\x1b[0m Claude Code v1.0.0\r\n',
      '\x1b[36m>\x1b[0m Reading project files...\r\n',
      '\x1b[36m>\x1b[0m Found src/main.ts, src/App.tsx, ...\r\n',
      '\x1b[33m?\x1b[0m What would you like to work on?\r\n',
      '\x1b[2m  Type your task or press Ctrl+C to exit\x1b[0m\r\n',
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length && terminalRef.current) {
        terminalRef.current.write(lines[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [sessionId]);
}
