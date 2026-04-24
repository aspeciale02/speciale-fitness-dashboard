'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LeadsTab from '@/components/tabs/LeadsTab';
import SEOTab from '@/components/tabs/SEOTab';
import OutreachTab from '@/components/tabs/OutreachTab';
import ContentTab from '@/components/tabs/ContentTab';
import AdsTab from '@/components/tabs/AdsTab';
import { fetchFileContent, fetchDirectory, fetchFileContentByUrl } from '@/lib/github';
import WelcomeModal from '@/components/WelcomeModal';

type Tab = 'leads' | 'seo' | 'outreach' | 'content' | 'ads';

interface Stats {
  leads: number;
  seoPages: number;
  outreachFiles: number;
  contentPosts: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [stats, setStats] = useState<Stats>({ leads: 0, seoPages: 0, outreachFiles: 0, contentPosts: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('sf_auth');
      if (auth !== 'true') {
        router.replace('/login');
      } else {
        setChecked(true);
        const welcomed = localStorage.getItem('sf_welcome_seen');
        if (!welcomed) {
          setShowWelcome(true);
        }
      }
    }
  }, [router]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [leadsContent, seoFiles, outreachFiles, contentContent] = await Promise.all([
        fetchFileContent('leads/prospect-list.md').catch(() => ''),
        fetchDirectory('seo-pages').catch(() => []),
        fetchDirectory('outreach').catch(() => []),
        fetchFileContent('content/content-calendar.md').catch(() => ''),
      ]);

      const leadCount = (leadsContent.match(/^## Lead:/gm) || []).length;
      const seoCount = seoFiles.filter((f: { name: string }) => f.name.endsWith('.md')).length;
      const outreachCount = outreachFiles.filter((f: { name: string }) => f.name.endsWith('.md')).length;
      const postCount = (contentContent.match(/^## Week/gm) || []).length;

      setStats({
        leads: leadCount,
        seoPages: seoCount,
        outreachFiles: outreachCount,
        contentPosts: postCount,
      });
    } catch (_) {
      // silently fail stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (checked) loadStats();
  }, [checked, loadStats]);

  function handleDismissWelcome() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sf_welcome_seen', 'true');
    }
    setShowWelcome(false);
  }

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sf_auth');
    }
    router.push('/login');
  }

  if (!checked) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'leads', label: 'Leads' },
    { id: 'seo', label: 'SEO Pages' },
    { id: 'outreach', label: 'Outreach' },
    { id: 'content', label: 'Content Calendar' },
    { id: 'ads', label: 'Ad Generator' },
  ];

  const statCards = [
    { label: 'Total Leads', value: stats.leads, icon: '👤' },
    { label: 'SEO Pages', value: stats.seoPages, icon: '📄' },
    { label: 'Outreach Drafted', value: stats.outreachFiles, icon: '✉️' },
    { label: 'Content Posts', value: stats.contentPosts, icon: '📅' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f0f0f0' }}>
      {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
      {/* Header */}
      <div style={{ borderBottom: '1px solid #222', backgroundColor: '#141414', padding: '0 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#C8A951', letterSpacing: '0.05em' }}>
              SPECIALE FITNESS
            </span>
            <span style={{ fontSize: '13px', color: '#888', marginLeft: '12px' }}>
              Lead Gen Dashboard
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #333',
              color: '#888',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#C8A951';
              e.currentTarget.style.color = '#C8A951';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.color = '#888';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: '#141414',
                border: '1px solid #222',
                borderRadius: '10px',
                padding: '20px 16px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', letterSpacing: '0.05em' }}>
                {card.label.toUpperCase()}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: statsLoading ? '#333' : '#C8A951' }}>
                {statsLoading ? '—' : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '4px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#C8A951' : 'transparent',
                color: activeTab === tab.id ? '#0a0a0a' : '#888',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'seo' && <SEOTab />}
        {activeTab === 'outreach' && <OutreachTab />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'ads' && <AdsTab />}
      </div>
    </div>
  );
}
