/** Bump when generated `planning/CLAUDE.md` / `AGENTS.md` should be refreshed on disk. */
export const PLANNING_ASSISTANT_MARKDOWN_VERSION = 2;

export const PLANNING_ASSISTANT_MARKDOWN_VERSION_MARKER = `<!-- flux-assistant-version:${PLANNING_ASSISTANT_MARKDOWN_VERSION} -->`;

/** Shared body for `planning/CLAUDE.md` and `planning/AGENTS.md`. */
export function planningAssistantMarkdown(
  projectName: string,
  rootPath: string,
  multiRepoGuide: boolean,
): string {
  const workspaceIntro = multiRepoGuide
    ? `This directory is the Flux **planning** workspace for \`${projectName}\`. The team may use **several** application repositories; each has a stable \`id\` in Flux. Run \`flux project info --json\` before repo-specific work: it returns \`repos[]\` (with \`id\`, \`label\`, \`isPrimary\`, \`configuredDefaultBranch\`, optional \`defaultBranchShort\`, clone \`rootPath\` when known, plus \`pathStatus\` locally or \`binding\` in the cloud), \`primaryRepoId\`, and a backwards-compatible top-level \`rootPath\` pointing at the **primary** repository clone. Planning sessions still use **this** directory as the process working directory — open code under each repo's \`rootPath\` from the CLI output, not only the path embedded below.

When user intent spans more than one repository and is ambiguous, **ask once** which repo (or \`repoId\`) they mean before creating tasks.`
    : `This directory is the Flux **planning** workspace for \`${projectName}\`. Application code lives in the git repository at \`${rootPath}\` (embedded here when these files were created). The **canonical** path for reading code is the \`rootPath\` field returned by \`flux project info --json\` — prefer that after you run the command. Planning sessions use this directory as the process working directory.`;

  const contextSteps = multiRepoGuide
    ? `  1. Run \`flux project info --json\` once (unless you already have current \`repos\`, \`primaryRepoId\`, and primary \`rootPath\` from this turn). Use each repo's \`rootPath\` when reading that repository's code; use \`primaryRepoId\` / \`isPrimary\` to spot the default repo.
  2. Read team planning documents under \`docs/\` relative to this directory (for example \`docs/vision.md\`, \`docs/architecture.md\`, sprint notes, ADRs). Older projects may still have markdown at the planning root outside \`docs/\` until migrated — prefer \`docs/\` for new material.
  3. Explore each relevant repository under the \`rootPath\` values from the CLI as needed.
  4. Only then respond, revise planning docs, list tasks if relevant, or create/update tasks. For **new** tasks, pass \`--repo-id\` (matching \`repos[].id\`) when work belongs to a non-primary repository; omit \`--repo-id\` to target the primary repo.`
    : `  1. Run \`flux project info --json\` once (unless you already have the current \`rootPath\` and project name from a call in this turn). Use the returned \`rootPath\` as the application codebase location.
  2. Read team planning documents under \`docs/\` relative to this directory (for example \`docs/vision.md\`, \`docs/architecture.md\`). Older projects may still have markdown at the planning root outside \`docs/\` until migrated — prefer \`docs/\` for new material.
  3. Explore the repository under that \`rootPath\` as needed for the user\u2019s question.
  4. Only then respond, revise planning docs, list tasks if relevant, or create/update tasks so titles and descriptions match reality.`;

  const createTaskLine = multiRepoGuide
    ? `- \`flux tasks create --json --title "..." --description "..." --agent <claude-code|cursor|codex|none>\` — optional repeated \`--label <label>\`, repeated \`--depends-on-task-id <taskId>\`, \`--assignee-email\` (cloud; use \`flux members list --json\`), \`--repo-id <repos[].id>\` (omit for primary), \`--source-branch <git-branch>\` (alias: \`--feature-branch\`), \`--create-source-branch-if-missing=true\` when a missing branch should be created on first session start`
    : `- \`flux tasks create --json --title "..." --description "..." --agent <claude-code|cursor|codex|none>\` — optional repeated \`--label <label>\`, repeated \`--depends-on-task-id <taskId>\`, \`--assignee-email\` (cloud; use \`flux members list --json\`), \`--source-branch <git-branch>\` (alias: \`--feature-branch\`), \`--create-source-branch-if-missing=true\``;

  const updateTaskLine = multiRepoGuide
    ? `- \`flux tasks update --json --id <taskId>\` — optional \`--title\`, \`--description\`, \`--status\`, \`--agent\`, repeated \`--label <label>\` (replace labels), \`--clear-labels\`, repeated \`--depends-on-task-id <taskId>\` (replace dependencies), \`--clear-dependencies\`, \`--assignee-email\`, \`--unassign-assignee=true\`, \`--repo-id <repos[].id>\` (only while no session/worktree/PR — same as UI), \`--source-branch <git-branch>\` (alias: \`--feature-branch\`), \`--create-source-branch-if-missing\`. Branch edits fail safely if a session or worktree already exists`
    : `- \`flux tasks update --json --id <taskId>\` — optional \`--title\`, \`--description\`, \`--status\`, \`--agent\`, repeated \`--label <label>\` (replace labels), \`--clear-labels\`, repeated \`--depends-on-task-id <taskId>\` (replace dependencies), \`--clear-dependencies\`, \`--assignee-email\`, \`--unassign-assignee=true\`, \`--source-branch <git-branch>\` (alias: \`--feature-branch\`), \`--create-source-branch-if-missing\`. Branch edits fail safely if a session or worktree already exists`;

  const projectInfoLine = `- \`flux project info --json\` — project \`name\`, \`rootPath\` (primary clone), ${multiRepoGuide ? '`repos` / `primaryRepoId` when multi-repo is active, ' : ''}\`taskCounts\`, and \`defaultBranchShort\` when git discovery succeeds (see \`branchDiscoveryError\` if not)`;

  const listBranchesLine = multiRepoGuide
    ? `- \`flux repo branches --json\` — local + origin branch lists, default branch, optional \`--classify-branch <name>\`; add \`--repo-id\` to scope a non-primary repository`
    : `- \`flux repo branches --json\` — local + origin branch lists, default branch, optional \`--classify-branch <name>\` before batch-creating tasks`;

  return `${PLANNING_ASSISTANT_MARKDOWN_VERSION_MARKER}

# Planning workspace — ${projectName}

${workspaceIntro}

## Flux CLI

Planning sessions inject bridge env and prepend the packaged \`flux\` shim to \`PATH\` when Flux starts a session. Use the command as \`flux ...\`; do **not** create a \`FLUX_BIN\` variable, paste the absolute shim path, or run \`which flux\` except when troubleshooting a missing command. **Always pass \`--json\`** on board commands so you can parse stdout. Run \`flux tasks create --help\` or \`flux tasks update --help\` for the full flag list. If \`flux\` is missing, ask the user to start planning from the Flux app (not a bare shell).

## Your role

You are a planning assistant. Help the developer think through features, maintain documentation under \`docs/\` in this workspace, and manage tasks on the Flux board via the CLI.

## Turn-taking

- Do **not** start a substantive planning pass, repository exploration, or CLI use until the user has asked a question or given a concrete task.
- **After they do**, gather context **before** you give substantive answers, update planning docs, or run Flux CLI commands, unless the request is purely meta and needs no repository or board context. Follow this order:
${contextSteps}

## Available commands

Board and project operations (run in the planning shell):

- \`flux tasks list --json\` — list tasks (includes \`sourceBranch\` / \`createSourceBranchIfMissing\` when set). Optional repeated \`--exclude-status <column>\` (\`backlog\`, \`in-progress\`, \`needs-input\`, \`done\`) — e.g. \`--exclude-status done\` for active work only
${createTaskLine}
- \`flux tasks start --json --id <taskId>\` — move a task to **In progress** (\`in-progress\`)
${updateTaskLine}
- \`flux tasks delete --json --id <taskId> --confirm\` — permanently remove a task; **only** after the user clearly asked to delete. If intent is ambiguous, ask once before deleting
${projectInfoLine}
${listBranchesLine}
- \`flux members list --json\` — cloud projects: team roster (\`email\`, \`displayName\`, \`role\`); local projects return an empty list with a note

Board relationship: new tasks land in **Backlog**. \`flux tasks start\` is the usual way to mark work actively in flight. Use \`flux tasks update\` for other status changes (e.g. **Needs input**, **Review**, **Done**) or edits to title/description/agent.

## Multi-task features (required)

When you split one user-facing feature or initiative into **two or more** board tasks, treat them as a single feature batch. **Do this on every \`flux tasks create\` in the batch — not in a follow-up \`flux tasks update\`:**

1. **Feature branch** — Choose one git branch (e.g. \`feature/list-view\`). Pass \`--source-branch <branch> --create-source-branch-if-missing=true\` on **each** task in the batch. If the user named a branch, use it; otherwise derive a short \`feature/<slug>\` from the feature name.
2. **Labels** — Pass at least two repeated \`--label\` flags on **each** create: one area (e.g. \`frontend\`, \`backend\`, \`planning\`) and one kind (e.g. \`enhancement\`, \`bugfix\`). Add a feature slug label when helpful (e.g. \`list-view\`).
3. **Dependencies** — The CLI supports \`--depends-on-task-id\` on **create and update** (aliases: \`--blocked-by-task-id\`). Create foundation tasks first; for later tasks in the batch, pass \`--depends-on-task-id <id>\` for each prerequisite using ids from \`flux tasks list --json\` or from earlier creates in the same turn. Typical order: toggle/shell → core component → sorting → polish. Do **not** tell the user dependencies are UI-only.

**Single-task requests:** Still add sensible \`--label\` flags. Use \`--source-branch\` when the user names a branch or the work clearly belongs on a named feature branch.

**Task branches (all creates):** \`--source-branch\` / \`--feature-branch\` set the git branch for agent sessions. \`--create-source-branch-if-missing=true\` creates the branch on first session start when it does not exist yet.

**Task labels and dependencies:** Use repeated flags, not JSON: \`--label frontend --label enhancement\`, \`--depends-on-task-id <taskId>\` (repeat per blocker), \`--clear-labels\`, \`--clear-dependencies\` on update. Reference only tasks in the current project.

**Team (cloud) projects:** CLI commands route through the running Flux app. It must be **open and signed in**; if you see auth or “open Flux” errors, ask the user to bring Flux to the foreground and try again.

## Files in this workspace

Maintain team planning markdown under \`docs/\` (relative to this directory) as living documents:
- \`docs/vision.md\` — long-term project goals and direction
- \`docs/architecture.md\` — technical decisions and system design
- \`docs/YYYY-MM-sprint.md\` — time-boxed planning (create as needed)
- \`CLAUDE.md\` and \`AGENTS.md\` **in this directory** (not under \`docs/\`) — agent instructions for this workspace (keep them aligned if you edit one)

## Guidelines

- Do not create, update, start, or delete tasks until the context pass above is done (when the question touches the codebase or board).
- Update planning documents under \`docs/\` when decisions are made
- Create tasks for concrete, actionable work items
- Keep \`docs/vision.md\` and \`docs/architecture.md\` up to date as the project evolves
`;
}
