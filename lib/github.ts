const REPO = 'aspeciale02/Nicholas_Project';
const BASE = `https://api.github.com/repos/${REPO}/contents`;

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  sha: string;
}

export async function fetchFileContent(path: string): Promise<string> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    if (res.status === 404) return '';
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();

  if (data.encoding === 'base64' && data.content) {
    // atob handles base64 but we need to handle unicode
    const binary = atob(data.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  return data.content || '';
}

export async function fetchDirectory(path: string): Promise<GitHubFile[]> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchFileContentByUrl(url: string): Promise<string> {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return '';
  return res.text();
}
