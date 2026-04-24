'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchFileContent } from '@/lib/github';

type Platform = 'Reel' | 'TikTok' | 'Carousel' | 'All';

interface ContentPost {
  id: string;
  weekDay: string;
  platform: Platform | string;
  hook?: string;
  script?: string;
  caption?: string;
  hashtags?: string;
  raw: string;
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string }> = {
  Reel: { bg: '#2a1a2a', color: '#c084fc' },
  TikTok: { bg: '#1a1f2a', color: '#60a5fa' },
  Carousel: { bg: '#2a1a1a', color: '#fb923c' },
};

function parsePlatform(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('reel')) return 'Reel';
  if (lower.includes('tiktok') || lower.includes('tik tok')) return 'TikTok';
  if (lower.includes('carousel')) return 'Carousel';
  return text.trim();
}

function parseContentCalendar(markdown: string): ContentPost[] {
  if (!markdown) return [];

  // Split on ## Week headers
  const blocks = markdown.split(/^(?=## Week)/m).filter((b) => b.trim().startsWith('## Week'));

  const posts: ContentPost[] = [];

  blocks.forEach((block, i) => {
    const headerMatch = block.match(/^## (.+)/);
    const weekDay = headerMatch ? headerMatch[1].trim() : `Post ${i + 1}`;

    const get = (key: string): string => {
      const re = new RegExp(`(?:^|\\n)(?:\\*{0,2})${key}(?:\\*{0,2})[:\\-]\\s*([^\\n]+(?:\\n(?!(?:\\*{0,2})\\w)[^\\n]+)*)`, 'i');
      const m = block.match(re);
      return m ? m[1].trim().replace(/\*+/g, '') : '';
    };

    // Get multi-line script/caption
    const getSection = (key: string): string => {
      const re = new RegExp(`(?:^|\\n)\\*{0,2}${key}\\*{0,2}[:\\-]\\s*([\\s\\S]*?)(?=\\n\\*{0,2}\\w|$)`, 'i');
      const m = block.match(re);
      return m ? m[1].trim().replace(/\*+/g, '') : '';
    };

    const platformRaw = get('platform') || get('Platform') || get('format') || get('Format') || '';

    posts.push({
      id: `post-${i}-${weekDay}`,
      weekDay,
      platform: parsePlatform(platformRaw) || 'Reel',
      hook: get('hook') || get('Hook'),
      script: getSection('script') || getSection('Script'),
      caption: getSection('caption') || getSection('Caption'),
      hashtags: get('hashtags') || get('Hashtags') || get('tags') || get('Tags'),
      raw: block,
    });
  });

  return posts;
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
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: copied ? '#4ade80' : '#333',
        backgroundColor: copied ? '#1a2a1a' : 'transparent',
        color: copied ? '#4ade80' : '#888',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}

export default function ContentTab() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Platform | 'All'>('All');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const content = await fetchFileContent('content/content-calendar.md');
      setPosts(parseContentCalendar(content));
    } catch (_) {
      setError('Failed to load content calendar from GitHub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const platforms: (Platform | 'All')[] = ['All', 'Reel', 'TikTok', 'Carousel'];

  const platformCounts: Record<string, number> = { All: posts.length };
  platforms.slice(1).forEach((p) => {
    platformCounts[p] = posts.filter((post) => post.platform === p).length;
  });

  const filtered = filter === 'All' ? posts : posts.filter((p) => p.platform === filter);

  if (loading) return <LoadingState />;
  if (error) return <div style={{ textAlign: 'center', padding: '48px', color: '#f87171' }}>{error}</div>;
  if (posts.length === 0) return <EmptyState />;

  return (
    <div>
      {/* Platform Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {platforms.map((p) => {
          const count = platformCounts[p] || 0;
          const colors = p !== 'All' ? PLATFORM_COLORS[p] : null;
          const isActive = filter === p;

          return (
            <button
              key={p}
              onClick={() => setFilter(p)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: isActive ? (colors?.color || '#C8A951') : '#333',
                backgroundColor: isActive ? (colors?.bg || '#2a2a1a') : 'transparent',
                color: isActive ? (colors?.color || '#C8A951') : '#888',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              {p} ({count})
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((post) => {
          const isExpanded = expandedPost === post.id;
          const colors = PLATFORM_COLORS[post.platform] || { bg: '#1a1a2a', color: '#888' };

          return (
            <div
              key={post.id}
              style={{
                backgroundColor: '#141414',
                border: `1px solid ${isExpanded ? colors.color : '#222'}`,
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f0' }}>
                      {post.weekDay}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: colors.bg,
                        color: colors.color,
                        fontWeight: '600',
                      }}
                    >
                      {post.platform}
                    </span>
                  </div>
                  {post.hook && (
                    <div style={{ fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>
                      "{post.hook.slice(0, 120)}{post.hook.length > 120 ? '...' : ''}"
                    </div>
                  )}
                </div>
                <span style={{ color: '#555', fontSize: '14px', flexShrink: 0 }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #222', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {post.hook && (
                    <Section label="Hook">
                      <p style={{ margin: 0, fontSize: '14px', color: '#f0f0f0', fontStyle: 'italic' }}>
                        "{post.hook}"
                      </p>
                    </Section>
                  )}

                  {post.script && (
                    <Section label="Script" actions={<CopyButton text={post.script} label="Copy Script" />}>
                      <pre style={{ margin: 0, fontSize: '13px', color: '#ccc', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.6' }}>
                        {post.script}
                      </pre>
                    </Section>
                  )}

                  {post.caption && (
                    <Section label="Caption" actions={<CopyButton text={post.caption} label="Copy Caption" />}>
                      <pre style={{ margin: 0, fontSize: '13px', color: '#ccc', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.6' }}>
                        {post.caption}
                      </pre>
                    </Section>
                  )}

                  {post.hashtags && (
                    <Section label="Hashtags" actions={<CopyButton text={post.hashtags} label="Copy Hashtags" />}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#C8A951' }}>
                        {post.hashtags}
                      </p>
                    </Section>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
          No {filter} posts found
        </div>
      )}
    </div>
  );
}

function Section({ label, children, actions }: { label: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {actions}
      </div>
      <div style={{ backgroundColor: '#0a0a0a', padding: '12px 14px', borderRadius: '6px', border: '1px solid #1a1a1a' }}>
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px', height: '100px' }}>
          <div style={{ color: '#555', fontSize: '14px' }}>Loading content calendar...</div>
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
