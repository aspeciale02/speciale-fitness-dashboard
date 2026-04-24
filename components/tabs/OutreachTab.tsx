'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchDirectory, fetchFileContentByUrl } from '@/lib/github';

interface OutreachFile {
  name: string;
  path: string;
  download_url: string | null;
  content?: string;
}

interface OutreachGroup {
  handle: string;
  dm?: OutreachFile;
  email?: OutreachFile;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: copied ? '#4ade80' : '#C8A951',
        backgroundColor: copied ? '#1a2a1a' : 'transparent',
        color: copied ? '#4ade80' : '#C8A951',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}

function groupByHandle(files: OutreachFile[]): OutreachGroup[] {
  const map: Record<string, OutreachGroup> = {};

  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    // Try to extract handle from filename patterns like:
    // dm-@handle.md, email-@handle.md, handle-dm.md, handle-email.md, @handle-dm.md
    let handle = file.name.replace('.md', '');
    let type: 'dm' | 'email' | null = null;

    if (nameLower.includes('dm')) {
      type = 'dm';
      handle = handle.replace(/[-_]?dm[-_]?/gi, '').replace(/^[-_@]|[-_]$/g, '').trim();
    } else if (nameLower.includes('email')) {
      type = 'email';
      handle = handle.replace(/[-_]?email[-_]?/gi, '').replace(/^[-_@]|[-_]$/g, '').trim();
    } else {
      // No clear type — treat entire file as DM
      type = 'dm';
    }

    handle = handle.replace(/^@/, '');
    if (!handle) handle = file.name.replace('.md', '');

    if (!map[handle]) map[handle] = { handle };

    if (type === 'dm') map[handle].dm = file;
    else if (type === 'email') map[handle].email = file;
  }

  return Object.values(map).sort((a, b) => a.handle.localeCompare(b.handle));
}

export default function OutreachTab() {
  const [groups, setGroups] = useState<OutreachGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedHandle, setExpandedHandle] = useState<string | null>(null);
  const [loadedContents, setLoadedContents] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

  const loadOutreach = useCallback(async () => {
    setLoading(true);
    try {
      const dir = await fetchDirectory('outreach');
      const mdFiles = dir.filter((f: { name: string }) => f.name.endsWith('.md'));
      setGroups(groupByHandle(mdFiles));
    } catch (_) {
      setError('Failed to load outreach files from GitHub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutreach();
  }, [loadOutreach]);

  async function ensureLoaded(file: OutreachFile) {
    if (loadedContents[file.name] || !file.download_url) return;
    setLoadingFiles((prev) => new Set(prev).add(file.name));
    try {
      const content = await fetchFileContentByUrl(file.download_url);
      setLoadedContents((prev) => ({ ...prev, [file.name]: content }));
    } finally {
      setLoadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(file.name);
        return next;
      });
    }
  }

  async function handleExpand(group: OutreachGroup) {
    if (expandedHandle === group.handle) {
      setExpandedHandle(null);
      return;
    }
    setExpandedHandle(group.handle);
    // Pre-load both files
    if (group.dm) ensureLoaded(group.dm);
    if (group.email) ensureLoaded(group.email);
  }

  if (loading) return <LoadingState />;
  if (error) return <div style={{ textAlign: 'center', padding: '48px', color: '#f87171' }}>{error}</div>;
  if (groups.length === 0) return <EmptyState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {groups.map((group) => {
        const isExpanded = expandedHandle === group.handle;
        const dmContent = group.dm ? loadedContents[group.dm.name] : undefined;
        const emailContent = group.email ? loadedContents[group.email.name] : undefined;

        return (
          <div
            key={group.handle}
            style={{
              backgroundColor: '#141414',
              border: `1px solid ${isExpanded ? '#C8A951' : '#222'}`,
              borderRadius: '10px',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
          >
            {/* Header */}
            <div
              onClick={() => handleExpand(group)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f0' }}>
                  @{group.handle}
                </span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {group.dm && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1a1f2a', color: '#60a5fa' }}>
                      DM
                    </span>
                  )}
                  {group.email && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#2a1a1a', color: '#fb923c' }}>
                      Email
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isExpanded && dmContent && (
                  <CopyButton text={dmContent} label="Copy DM" />
                )}
                {isExpanded && emailContent && (
                  <CopyButton text={emailContent} label="Copy Email" />
                )}
                <span style={{ color: '#555', fontSize: '14px' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #222' }}>
                {group.dm && (
                  <MessageBlock
                    label="Direct Message"
                    content={dmContent}
                    isLoading={loadingFiles.has(group.dm.name)}
                    copyLabel="Copy DM"
                  />
                )}
                {group.email && (
                  <MessageBlock
                    label="Email"
                    content={emailContent}
                    isLoading={loadingFiles.has(group.email.name)}
                    copyLabel="Copy Email"
                    borderTop={!!group.dm}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MessageBlock({
  label,
  content,
  isLoading,
  copyLabel,
  borderTop,
}: {
  label: string;
  content?: string;
  isLoading: boolean;
  copyLabel: string;
  borderTop?: boolean;
}) {
  return (
    <div style={{ padding: '16px 20px', borderTop: borderTop ? '1px solid #1a1a1a' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {content && <CopyButton text={content} label={copyLabel} />}
      </div>
      {isLoading ? (
        <div style={{ color: '#555', fontSize: '13px' }}>Loading...</div>
      ) : content ? (
        <pre
          style={{
            fontSize: '13px',
            color: '#ccc',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
            lineHeight: '1.6',
            margin: 0,
            backgroundColor: '#0a0a0a',
            padding: '14px',
            borderRadius: '6px',
            border: '1px solid #1a1a1a',
          }}
        >
          {content}
        </pre>
      ) : (
        <div style={{ color: '#555', fontSize: '13px' }}>No content available</div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px', height: '80px' }}>
          <div style={{ color: '#555', fontSize: '14px' }}>Loading outreach files...</div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
      No data yet — routine is still running
    </div>
  );
}
