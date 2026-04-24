'use client';

import { useState, useEffect, useRef } from 'react';

type AspectRatio = '1:1' | '9:16' | '16:9';

const PRESET_PROMPTS = [
  'EMS training session — athlete in a studio, 20-minute workout, cinematic lighting',
  'Before and after body transformation — fitness studio Vaughan',
  'Busy professional, no time to work out, discovers 20-minute EMS session',
  'FIT-3D body scan visualization — futuristic fitness technology',
  'Two locations: Vaughan and Mississauga — modern EMS fitness studio',
];

export default function AdsTab() {
  const kieApiKey = process.env.NEXT_PUBLIC_KIE_API_KEY;

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setImageUrl(null);
    setError('');

    try {
      const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'flux-2/flex-text-to-image',
          input: {
            prompt: prompt.trim(),
            aspect_ratio: aspectRatio,
            resolution: '1K',
            nsfw_checker: false,
          },
        }),
      });

      const createData = await createRes.json();

      if (createData.code !== 200 || !createData.data?.taskId) {
        throw new Error(createData.message || 'Failed to create task');
      }

      const taskId = createData.data.taskId;

      intervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `https://api.kie.ai/api/v1/jobs/queryTaskStatus?taskId=${taskId}`,
            {
              headers: { 'Authorization': `Bearer ${kieApiKey}` },
            }
          );
          const pollData = await pollRes.json();

          if (pollData.code !== 200) return;

          const status = pollData.data?.status;

          if (status === 'completed') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            const url = pollData.data?.output?.imageUrl;
            if (url) {
              setImageUrl(url);
            } else {
              setError('Generation completed but no image was returned.');
            }
            setGenerating(false);
          } else if (status === 'failed') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setError('Generation failed — try again');
            setGenerating(false);
          }
        } catch {
          // poll errors are transient — keep trying
        }
      }, 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed — try again');
      setGenerating(false);
    }
  }

  if (!kieApiKey) {
    return (
      <div
        style={{
          backgroundColor: '#141414',
          border: '1px solid #222',
          borderRadius: '10px',
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔑</div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f0', marginBottom: '8px' }}>
          API Key Required
        </div>
        <div style={{ fontSize: '14px', color: '#888', maxWidth: '420px', margin: '0 auto' }}>
          Add your <code style={{ color: '#C8A951', backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>KIE_API_KEY</code> in Vercel environment variables to enable ad generation.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f0', margin: '0 0 6px 0' }}>
          Ad Generator
        </h2>
        <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
          Generate image ads for Speciale Fitness using AI
        </p>
      </div>

      {/* Prompt Section */}
      <div
        style={{
          backgroundColor: '#141414',
          border: '1px solid #222',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Preset prompts */}
        <div>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Quick Prompts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PRESET_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: prompt === p ? '#C8A951' : '#2a2a2a',
                  backgroundColor: prompt === p ? '#1a1600' : '#0a0a0a',
                  color: prompt === p ? '#C8A951' : '#aaa',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  lineHeight: '1.4',
                }}
                onMouseEnter={(e) => {
                  if (prompt !== p) {
                    e.currentTarget.style.borderColor = '#444';
                    e.currentTarget.style.color = '#ccc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (prompt !== p) {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                    e.currentTarget.style.color = '#aaa';
                  }
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Your Prompt
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your ad..."
            rows={4}
            style={{
              width: '100%',
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px',
              color: '#f0f0f0',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C8A951'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#333'; }}
          />
        </div>

        {/* Aspect ratio + Generate */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Aspect Ratio
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['1:1', '9:16', '16:9'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: aspectRatio === ratio ? '#C8A951' : '#333',
                    backgroundColor: aspectRatio === ratio ? '#C8A951' : 'transparent',
                    color: aspectRatio === ratio ? '#0a0a0a' : '#888',
                    fontSize: '13px',
                    fontWeight: aspectRatio === ratio ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !prompt.trim() || generating ? '#2a2a2a' : '#C8A951',
              color: !prompt.trim() || generating ? '#555' : '#0a0a0a',
              fontSize: '15px',
              fontWeight: '700',
              cursor: !prompt.trim() || generating ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.03em',
            }}
          >
            {generating ? 'Generating...' : 'Generate Ad'}
          </button>
        </div>
      </div>

      {/* Result */}
      {generating && (
        <div
          style={{
            backgroundColor: '#141414',
            border: '1px solid #222',
            borderRadius: '10px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <SpinnerIcon />
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            Generating your ad — this takes about 15–30 seconds...
          </div>
        </div>
      )}

      {error && !generating && (
        <div
          style={{
            backgroundColor: '#1a0a0a',
            border: '1px solid #4a1a1a',
            borderRadius: '10px',
            padding: '16px 20px',
            color: '#f87171',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {imageUrl && !generating && (
        <div
          style={{
            backgroundColor: '#141414',
            border: '1px solid #222',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Generated Ad
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Generated ad"
            style={{
              width: '100%',
              borderRadius: '8px',
              display: 'block',
              border: '1px solid #2a2a2a',
            }}
          />
          <a
            href={imageUrl}
            download="speciale-fitness-ad.jpg"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #C8A951',
              backgroundColor: 'transparent',
              color: '#C8A951',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#C8A951';
              e.currentTarget.style.color = '#0a0a0a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#C8A951';
            }}
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="#333"
        strokeWidth="3"
      />
      <path
        d="M 16 3 A 13 13 0 0 1 29 16"
        fill="none"
        stroke="#C8A951"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
