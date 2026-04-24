'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchDirectory, fetchFileContentByUrl } from '@/lib/github';

interface SEOFile {
  name: string;
  path: string;
  download_url: string | null;
}

interface LoadedFile extends SEOFile {
  content: string;
  preview: string;
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
        padding: '6px 14px',
        borderRadius: '6px',
        border: '1px solid #333',
        backgroundColor: copied ? '#1a2a1a' : 'transparent',
        color: copied ? '#4ade80' : '#888',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

export default function SEOTab() {
  const [files, setFiles] = useState<SEOFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [loadedContents, setLoadedContents] = useState<Record<string, LoadedFile>>({});
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const dir = await fetchDirectory('seo-pages');
      const mdFiles = dir.filter((f: { name: string }) => f.name.endsWith('.md'));
      setFiles(mdFiles);
    } catch (_) {
      setError('Failed to load SEO pages from GitHub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function handleExpand(file: SEOFile) {
    if (expandedFile === file.name) {
      setExpandedFile(null);
      return;
    }

    setExpandedFile(file.name);

    if (!loadedContents[file.name] && file.download_url) {
      setLoadingFile(file.name);
      try {
        const content = await fetchFileContentByUrl(file.download_url);
        const preview = content.slice(0, 200) + (content.length > 200 ? '...' : '');
        setLoadedContents((prev) => ({
          ...prev,
          [file.name]: { ...file, content, preview },
        }));
      } catch (_) {
        // ignore
      } finally {
        setLoadingFile(null);
      }
    }
  }

  function slugToTitle(filename: string): string {
    return filename
      .replace('.md', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (loading) return <LoadingState />;
  if (error) return <div style={{ textAlign: 'center', padding: '48px', color: '#f87171' }}>{error}</div>;
  if (files.length === 0) return <EmptyState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {files.map((file) => {
        const isExpanded = expandedFile === file.name;
        const loaded = loadedContents[file.name];
        const isLoadingThis = loadingFile === file.name;

        return (
          <div
            key={file.name}
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
              onClick={() => handleExpand(file)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f0', marginBottom: '4px' }}>
                  {slugToTitle(file.name)}
                </div>
                <div style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
                  {file.name}
                </div>
                {!isExpanded && loaded && (
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>
                    {loaded.preview}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {loaded && (
                  <CopyButton text={loaded.content} label="Copy Content" />
                )}
                <span style={{ color: '#555', fontSize: '14px' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #222', padding: '20px' }}>
                {isLoadingThis ? (
                  <div style={{ color: '#888', fontSize: '14px' }}>Loading content...</div>
                ) : loaded ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                      <CopyButton text={loaded.content} label="Copy Full Content" />
                    </div>
                    <pre
                      style={{
                        fontSize: '13px',
                        color: '#ccc',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        lineHeight: '1.6',
                        margin: 0,
                        backgroundColor: '#0a0a0a',
                        padding: '16px',
                        borderRadius: '6px',
                        border: '1px solid #1a1a1a',
                      }}
                    >
                      {loaded.content}
                    </pre>
                  </div>
                ) : (
                  <div style={{ color: '#888', fontSize: '14px' }}>No download URL available</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px', height: '80px' }}>
          <div style={{ color: '#555', fontSize: '14px' }}>Loading SEO pages...</div>
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
