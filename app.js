const API_BASE = (window.API_BASE || 'http://localhost:3000');
async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

async function shorten() {
  const url = document.getElementById('url').value.trim();
  const slug = document.getElementById('slug').value.trim();
  const output = document.getElementById('output');
  output.style.display = 'none';
  if (!url) { alert('Please enter a URL.'); return; }

  try {
    const res = await fetch(`${API_BASE}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, slug: slug || undefined })
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Request failed');
    output.innerHTML = `
      <div><strong>Short URL:</strong> <a href="${data.short_url}" target="_blank" rel="noopener">${data.short_url}</a></div>
      <div class="stats">Clicks: ${data.clicks} · Created: ${new Date(data.created_at).toLocaleString()}</div>
    `;
    output.style.display = 'block';
    const copyBtn = document.getElementById('copyBtn');
copyBtn.style.display = 'inline-block';
copyBtn.onclick = () => {
  navigator.clipboard.writeText(data.short_url)
    .then(() => {
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => (copyBtn.textContent = '📋 Copy Link'), 1500);
    })
    .catch(() => alert('Failed to copy link'));
};
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
    output.style.display = 'block';
  }
}

async function getStats() {
  const slug = document.getElementById('statsSlug').value.trim();
  const statsOut = document.getElementById('statsOut');
  statsOut.style.display = 'none';
  if (!slug) { alert('Enter a slug.'); return; }
  try {
    const res = await fetch(`${API_BASE}/api/stats/${encodeURIComponent(slug)}`);
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Not found');
    statsOut.innerHTML = `
      <div><strong>Slug:</strong> ${data.slug}</div>
      <div><strong>Target:</strong> <a href="${data.target}" target="_blank" rel="noopener">${data.target}</a></div>
      <div class="stats">Clicks: ${data.clicks} · Created: ${new Date(data.created_at).toLocaleString()} ${data.last_accessed_at ? '· Last accessed: ' + new Date(data.last_accessed_at).toLocaleString() : ''}</div>
    `;
    statsOut.style.display = 'block';
  } catch (err) {
    statsOut.textContent = 'Error: ' + err.message;
    statsOut.style.display = 'block';
  }
}

document.getElementById('shortenBtn').addEventListener('click', shorten);
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('url').value = '';
  document.getElementById('slug').value = '';
  const output = document.getElementById('output');
  output.style.display = 'none';
  output.textContent = '';
});
document.getElementById('statsBtn').addEventListener('click', getStats);
