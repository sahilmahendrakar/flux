import { createRoot } from 'react-dom/client';
import '@xterm/xterm/css/xterm.css';
import './index.css';
import App from './App';
import TerminalWindowPage from './components/TerminalWindowPage';
import { getStoredTheme, isVisuallyDark } from './renderer/theme';

function parseTerminalSessionIdFromLocation(): string | null {
  const raw = window.location.hash.replace(/^#/, '');
  const m = raw.match(/^terminal=(.+)$/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

const terminalSessionId = parseTerminalSessionIdFromLocation();
const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element');
}
const root = createRoot(rootEl);

void window.electronAPI.theme.syncChrome({
  visuallyDark: isVisuallyDark(getStoredTheme()),
});

if (terminalSessionId) {
  root.render(<TerminalWindowPage sessionId={terminalSessionId} />);
} else {
  root.render(<App />);
}
