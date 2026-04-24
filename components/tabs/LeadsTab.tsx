'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchFileContent } from '@/lib/github';

type Status = 'New' | 'Contacted' | 'Responded' | 'Booked';

interface Lead {
  id: string;
  handle: string;
  location?: string;
  foundVia?: string;
  whyFit?: string;
  suggestedOpener?: string;
  raw: string;
}

const STATUS_ORDER: Status[] = ['New', 'Contacted', 'Responded', 'Booked'];

const STATUS_COLORS: Record<Status, { bg: string; color: string }> = {
  New: { bg: '#1a2a1a', color: '#4ade80' },
  Contacted: { bg: '#1a1f2a', color: '#60a5fa' },
  Responded: { bg: '#2a1f1a', color: '#fb923c' },
  Booked: { bg: '#2a1a2a', color: '#C8A951' },
};

function parseLeads(markdown: string): Lead[] {
  if (!markdown) return [];
  const blocks = markdown.split(/^## Lead:/m).slice(1);
  return blocks.map((block, i) => {
    const lines = block.trim().split('\n');
    const handle = lines[0]?.trim().replace(/^@/, '') || `Lead ${i + 1}`;

    const get = (key: string): string => {
      const re = new RegExp(`(?:^|\\n)(?:\\*{0,2})${key}(?:\\*{0,2})[:\\-]\\s*(.+)`, 'i');
      const m = block.match(re);
      return m ? m[1].trim().replace(/\*+/g, '') : '';
    };

    return {
      id: `lead-${i}-${handle}`,
      handle,
      location: get('location') || get('Location'),
      foundVia: get('found via') || get('Found Via') || get('source') || get('Source'),
      whyFit: get('why.*fit') || get('Why.*Fit') || get('why a fit') || get('Why a fit'),
      suggestedOpener: get('suggested opener') || get('Suggested Opener') || get('opener') || get('Opener'),
      raw: block,
    };
  });
}

function getStatus(handle: string): Status {
  if (typeof window === 'undefined') return 'New';
  const stored = localStorage.getItem(`sf_status_${handle}`);
  if (stored && STATUS_ORDER.includes(stored as Status)) return stored as Status;
  return 'New';
}

function setStatus(handle: string, status: Status) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`sf_status_${handle}`, status);
}

function nextStatus(current: Status): Status {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [filter, setFilter] = useState<Status | 'All'>('All');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const content = await fetchFileContent('leads/prospect-list.md');
      const parsed = parseLeads(content);
      setLeads(parsed);

      const statusMap: Record<string, Status> = {};
      parsed.forEach((l) => {
        statusMap[l.handle] = getStatus(l.handle);
      });
      setStatuses(statusMap);
    } catch (e) {
      setError('Failed to load leads from GitHub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  function handleStatusClick(handle: string) {
    const current = statuses[handle] || 'New';
    const next = nextStatus(current);
    setStatus(handle, next);
    setStatuses((prev) => ({ ...prev, [handle]: next }));
  }

  const filtered = filter === 'All' ? leads : leads.filter((l) => (statuses[l.handle] || 'New') === filter);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (leads.length === 0) return <EmptyState />;

  const filterCounts: Record<string, number> = { All: leads.length };
  STATUS_ORDER.forEach((s) => {
    filterCounts[s] = leads.filter((l) => (statuses[l.handle] || 'New') === s).length;
  });

  return (
    <div>
      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['All', ...STATUS_ORDER] as (Status | 'All')[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: filter === f ? '#C8A951' : '#333',
              backgroundColor: filter === f ? '#C8A951' : 'transparent',
              color: filter === f ? '#0a0a0a' : '#888',
              fontSize: '13px',
              fontWeight: filter === f ? '600' : '400',
              cursor: 'pointer',
            }}
          >
            {f} ({filterCounts[f] || 0})
          </button>
        ))}
      </div>

      {/* Lead Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((lead) => {
          const status = statuses[lead.handle] || 'New';
          const colors = STATUS_COLORS[status];
          return (
            <div
              key={lead.id}
              style={{
                backgroundColor: '#141414',
                border: '1px solid #222',
                borderRadius: '10px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f0' }}>
                    @{lead.handle}
                  </span>
                  {lead.location && (
                    <span style={{ fontSize: '13px', color: '#888', marginLeft: '10px' }}>
                      📍 {lead.location}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleStatusClick(lead.handle)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: colors.bg,
                    color: colors.color,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  title="Click to cycle status"
                >
                  {status}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lead.foundVia && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Found Via</span>
                    <div style={{ fontSize: '14px', color: '#ccc', marginTop: '2px' }}>{lead.foundVia}</div>
                  </div>
                )}
                {lead.whyFit && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Why a Fit</span>
                    <div style={{ fontSize: '14px', color: '#ccc', marginTop: '2px' }}>{lead.whyFit}</div>
                  </div>
                )}
                {lead.suggestedOpener && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suggested Opener</span>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#f0f0f0',
                        marginTop: '4px',
                        padding: '10px 12px',
                        backgroundColor: '#0a0a0a',
                        borderRadius: '6px',
                        border: '1px solid #2a2a2a',
                        fontStyle: 'italic',
                      }}
                    >
                      {lead.suggestedOpener}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
          No leads with status "{filter}"
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px', height: '120px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <div style={{ color: '#555', fontSize: '14px' }}>Loading leads from GitHub...</div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#f87171' }}>{message}</div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
      No data yet — routine is still running
    </div>
  );
}
