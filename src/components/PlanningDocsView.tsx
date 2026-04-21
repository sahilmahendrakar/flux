import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Project } from '../types';

interface PlanningDocsViewProps {
  project: Project;
}

export function PlanningDocsView({ project }: PlanningDocsViewProps) {
  const api = window.electronAPI.planningDocs;

  const [files, setFiles] = useState<{ relativePath: string }[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [readError, setReadError] = useState<string | null>(null);
  const [loadingRead, setLoadingRead] = useState(false);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const result = await api.list();
      if ('error' in result) {
        setFiles([]);
        setListError(
          result.error === 'NO_PROJECT'
            ? 'No project workspace is open.'
            : 'Could not read the planning folder.',
        );
        return;
      }
      setFiles(result.files);
      setSelectedPath((prev) => {
        if (prev && result.files.some((f) => f.relativePath === prev)) {
          return prev;
        }
        return result.files[0]?.relativePath ?? null;
      });
    } catch {
      setListError('Failed to load planning documents.');
      setFiles([]);
    } finally {
      setLoadingList(false);
    }
  }, [api]);

  useEffect(() => {
    void refreshList();
  }, [project.id, refreshList]);

  useEffect(() => {
    if (!selectedPath) {
      setContent('');
      setReadError(null);
      return;
    }
    let cancelled = false;
    setLoadingRead(true);
    setReadError(null);
    void api.read(selectedPath).then((result) => {
      if (cancelled) return;
      setLoadingRead(false);
      if ('error' in result) {
        setContent('');
        setReadError('Could not open this file.');
        return;
      }
      setContent(result.content);
    });
    return () => {
      cancelled = true;
    };
  }, [api, selectedPath]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#09090b]">
      <nav
        className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0c0e]"
        aria-label="Planning markdown files"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-600">
            planning/
          </span>
          <button
            type="button"
            onClick={() => void refreshList()}
            disabled={loadingList}
            className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-40"
          >
            Refresh
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
          {listError ? (
            <p className="px-2 py-2 text-[12px] text-red-400/90">{listError}</p>
          ) : loadingList && files.length === 0 ? (
            <p className="px-2 py-2 text-[12px] text-zinc-600">Loading…</p>
          ) : files.length === 0 ? (
            <p className="px-2 py-2 text-[12px] leading-relaxed text-zinc-600">
              No markdown files yet. They appear here when the planning assistant
              creates them under{' '}
              <span className="font-mono text-zinc-500">planning/</span>.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {files.map((f) => {
                const active = f.relativePath === selectedPath;
                return (
                  <li key={f.relativePath}>
                    <button
                      type="button"
                      onClick={() => setSelectedPath(f.relativePath)}
                      className={[
                        'w-full truncate rounded-md px-2 py-1.5 text-left font-mono text-[12px] transition-colors',
                        active
                          ? 'bg-white/[0.06] text-zinc-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                          : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200',
                      ].join(' ')}
                      title={f.relativePath}
                    >
                      {f.relativePath}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </nav>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {!selectedPath ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-600">
            Select a document to preview.
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <header className="shrink-0 border-b border-white/[0.06] px-5 py-3">
              <h1 className="truncate font-mono text-[13px] font-medium text-zinc-200">
                {selectedPath}
              </h1>
              {readError ? (
                <p className="mt-1 text-[12px] text-red-400/90">{readError}</p>
              ) : loadingRead ? (
                <p className="mt-1 text-[12px] text-zinc-600">Loading…</p>
              ) : null}
            </header>
            <article
              className={[
                'min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-zinc-300',
                '[&_a]:text-sky-400 [&_a]:underline [&_a]:decoration-sky-400/40 [&_a]:underline-offset-2 hover:[&_a]:text-sky-300',
                '[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-zinc-100 [&_h1]:first:mt-0',
                '[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-zinc-100',
                '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[15px] [&_h3]:font-medium [&_h3]:text-zinc-200',
                '[&_p]:my-3 [&_p]:text-zinc-300',
                '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5',
                '[&_li]:my-1',
                '[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-600 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400',
                '[&_code]:rounded [&_code]:bg-zinc-800/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-emerald-200/90',
                '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/[0.08] [&_pre]:bg-[#0a0a0c] [&_pre]:p-3',
                '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[12px] [&_pre_code]:text-zinc-300',
                '[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left text-[12px]',
                '[&_th]:border [&_th]:border-white/[0.08] [&_th]:bg-white/[0.04] [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-zinc-200',
                '[&_td]:border [&_td]:border-white/[0.06] [&_td]:px-2 [&_td]:py-1.5',
                '[&_hr]:my-6 [&_hr]:border-white/[0.08]',
                '[&_strong]:font-semibold [&_strong]:text-zinc-100',
              ].join(' ')}
            >
              {!readError && !loadingRead ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : null}
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
