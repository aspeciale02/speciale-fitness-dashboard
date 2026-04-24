'use client';

interface WelcomeModalProps {
  onDismiss: () => void;
}

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const sections = [
    {
      title: 'Leads',
      what: 'A list of real people in Vaughan and Mississauga who are likely interested in EMS training.',
      how: 'Browse the leads, read the suggested opener, then DM them on Instagram. Mark each lead as Contacted once you\'ve reached out, and update the status as they respond.',
    },
    {
      title: 'SEO Pages',
      what: 'Ready-to-publish web pages written to rank on Google for searches like "EMS training Vaughan" and "fitness studio Mississauga."',
      how: 'Click a page to expand it, copy the content, then paste it into a new page on your WordPress site (specialefitness.ca). Each page targets a different search term — the more you publish, the more Google finds you.',
    },
    {
      title: 'Outreach',
      what: 'Personalized DM and email scripts for each lead.',
      how: 'Find the lead\'s handle, click "Copy DM" and send it on Instagram, or click "Copy Email" if you have their email. Each message is written specifically for that person — don\'t change it too much.',
    },
    {
      title: 'Content Calendar',
      what: 'A 30-day plan of Instagram Reels, TikToks, and carousels with full scripts and captions ready to go.',
      how: 'Pick a post, film it using the script, copy the caption and hashtags, and post. Aim for 3-4 posts per week. Reels and TikToks get the most reach.',
    },
    {
      title: 'Ad Generator',
      what: 'An AI image generator for creating ad visuals for Speciale Fitness.',
      how: 'Click one of the preset prompts or write your own, then click Generate. Download the image and use it in your Instagram posts, stories, or Meta ads.',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#141414',
          border: '1px solid #C8A951',
          borderRadius: '14px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px 28px 28px',
          boxSizing: 'border-box',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#C8A951',
            margin: '0 0 8px',
            lineHeight: '1.3',
            letterSpacing: '0.02em',
          }}
        >
          Welcome to Your Speciale Fitness Dashboard
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: '#aaa',
            margin: '0 0 28px',
            lineHeight: '1.5',
          }}
        >
          Here&apos;s everything you need to know to get started.
        </p>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
          {sections.map((section) => (
            <div
              key={section.title}
              style={{
                borderLeft: '2px solid #C8A951',
                paddingLeft: '14px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#C8A951',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                {section.title}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#f0f0f0', lineHeight: '1.55' }}>
                <span style={{ fontWeight: '600', color: '#ccc' }}>What it is: </span>
                {section.what}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#f0f0f0', lineHeight: '1.55' }}>
                <span style={{ fontWeight: '600', color: '#ccc' }}>How to use: </span>
                {section.how}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '13px 20px',
            backgroundColor: '#C8A951',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '0.03em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Got it, let&apos;s go
        </button>
      </div>
    </div>
  );
}
