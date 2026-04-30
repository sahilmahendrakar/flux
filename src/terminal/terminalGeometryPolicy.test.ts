import { describe, expect, it } from 'vitest';
import {
  getApplyAttachOptionsForViewPolicy,
  INTERACTIVE_MIRROR_TERMINAL_VIEW_POLICY,
  MIRROR_TERMINAL_VIEW_POLICY,
  OWNER_TERMINAL_VIEW_POLICY,
  shouldPostAttachFit,
  terminalOwnsPtyGeometry,
  terminalShouldAutoFit,
  terminalShouldForwardInput,
} from './terminalGeometryPolicy';

describe('terminalGeometryPolicy', () => {
  it('owner uses container fit, input, and PTY geometry ownership', () => {
    expect(getApplyAttachOptionsForViewPolicy(OWNER_TERMINAL_VIEW_POLICY)).toEqual({});
    expect(shouldPostAttachFit(OWNER_TERMINAL_VIEW_POLICY)).toBe(true);
    expect(terminalShouldAutoFit(OWNER_TERMINAL_VIEW_POLICY)).toBe(true);
    expect(terminalShouldForwardInput(OWNER_TERMINAL_VIEW_POLICY)).toBe(true);
    expect(terminalOwnsPtyGeometry(OWNER_TERMINAL_VIEW_POLICY)).toBe(true);
  });

  it('mirror uses snapshot geometry locally without fitting or PTY ownership', () => {
    expect(getApplyAttachOptionsForViewPolicy(MIRROR_TERMINAL_VIEW_POLICY)).toEqual({
      applyGeometry: true,
      useSnapshot: true,
    });
    expect(shouldPostAttachFit(MIRROR_TERMINAL_VIEW_POLICY)).toBe(false);
    expect(terminalShouldAutoFit(MIRROR_TERMINAL_VIEW_POLICY)).toBe(false);
    expect(terminalShouldForwardInput(MIRROR_TERMINAL_VIEW_POLICY)).toBe(false);
    expect(terminalOwnsPtyGeometry(MIRROR_TERMINAL_VIEW_POLICY)).toBe(false);
  });

  it('interactive mirror forwards input but still does not fit or own PTY geometry', () => {
    expect(getApplyAttachOptionsForViewPolicy(INTERACTIVE_MIRROR_TERMINAL_VIEW_POLICY)).toEqual({
      applyGeometry: true,
      useSnapshot: true,
    });
    expect(shouldPostAttachFit(INTERACTIVE_MIRROR_TERMINAL_VIEW_POLICY)).toBe(false);
    expect(terminalShouldAutoFit(INTERACTIVE_MIRROR_TERMINAL_VIEW_POLICY)).toBe(false);
    expect(terminalShouldForwardInput(INTERACTIVE_MIRROR_TERMINAL_VIEW_POLICY)).toBe(true);
    expect(terminalOwnsPtyGeometry(INTERACTIVE_MIRROR_TERMINAL_VIEW_POLICY)).toBe(false);
  });
});
