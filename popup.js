const API_BASE = 'https://promptvault-pied.vercel.app/api';
const SUPABASE_URL = 'https://gbcigenlvchpphlbtfnr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiY2lnZW5sdmNocHBobGJ0Zm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYzNDAsImV4cCI6MjA4NTQ2MjM0MH0.WkTVhSFg2KfQtng2qltcUXCEDgy5e4B96YTJnDBkDUQ';

const $ = (s) => document.querySelector(s);
let cachedPrompts = [];

// Elements
const loginView = $('#loginView');
const mainView = $('#mainView');
const logoutBtn = $('#logoutBtn');
const loginBtn = $('#loginBtn');
const loginMsg = $('#loginMsg');
const saveMsg = $('#saveMsg');
const saveBtn = $('#saveBtn');
const selectionText = $('#selectionText');
const titleInput = $('#titleInput');
const searchInput = $('#searchInput');
const promptList = $('#promptList');

// Init
document.addEventListener('DOMContentLoaded', async () => {
  const { access_token, refresh_token } = await chrome.storage.local.get(['access_token', 'refresh_token']);
  if (access_token) {
    showMain();
    loadSelection();
    loadPrompts(access_token);
  }
});

// Auth
loginBtn.addEventListener('click', async () => {
  const email = $('#emailInput').value.trim();
  const pass = $('#passInput').value;
  if (!email || !pass) return showMsg(loginMsg, 'Please fill in both fields.', 'error');

  loginBtn.disabled = true;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');

    await chrome.storage.local.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token
    });
    showMain();
    loadSelection();
    loadPrompts(data.access_token);
  } catch (e) {
    showMsg(loginMsg, e.message, 'error');
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['access_token', 'refresh_token']);
  mainView.classList.add('hidden');
  logoutBtn.classList.add('hidden');
  loginView.classList.remove('hidden');
  loginMsg.className = 'msg';
});

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    $('#saveTab').classList.toggle('hidden', target !== 'save');
    $('#browseTab').classList.toggle('hidden', target !== 'browse');
    if (target === 'browse') {
      chrome.storage.local.get('access_token', ({ access_token }) => {
        if (access_token) loadPrompts(access_token);
      });
    }
  });
});

// Save
saveBtn.addEventListener('click', async () => {
  const content = selectionText.value.trim();
  const title = titleInput.value.trim();
  if (!content) return showMsg(saveMsg, 'No text to save.', 'error');
  if (!title) return showMsg(saveMsg, 'Please add a title.', 'error');

  const category = $('#categorySelect').value;
  const tags = $('#tagsInput').value.split(',').map(t => t.trim()).filter(Boolean);

  saveBtn.disabled = true;
  try {
    const { access_token } = await chrome.storage.local.get('access_token');
    const res = await fetch(`${API_BASE}/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({ title, content, category, tags })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save');
    }
    showMsg(saveMsg, 'Prompt saved!', 'success');
    selectionText.value = '';
    titleInput.value = '';
    $('#tagsInput').value = '';
  } catch (e) {
    showMsg(saveMsg, e.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

// Search
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = q ? cachedPrompts.filter(p =>
    p.title?.toLowerCase().includes(q) ||
    p.content?.toLowerCase().includes(q) ||
    (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
    p.category?.toLowerCase().includes(q)
  ) : cachedPrompts;
  renderPrompts(filtered);
});

// Helpers
function showMain() {
  loginView.classList.add('hidden');
  mainView.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = `msg ${type}`;
  setTimeout(() => { el.className = 'msg'; }, 4000);
}

function loadSelection() {
  chrome.runtime.sendMessage({ type: 'getSelection' }, (res) => {
    if (res?.text) {
      selectionText.value = res.text;
      titleInput.value = res.text.split('\n')[0].substring(0, 80);
    }
  });
}

async function loadPrompts(token) {
  try {
    const res = await fetch(`${API_BASE}/prompts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    cachedPrompts = Array.isArray(data) ? data : (data.prompts || data.data || []);
    renderPrompts(cachedPrompts);
  } catch (e) {
    console.error('Load prompts error:', e);
  }
}

function renderPrompts(prompts) {
  if (!prompts.length) {
    promptList.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px;">No prompts found.</p>';
    return;
  }
  promptList.innerHTML = prompts.map(p => `
    <div class="prompt-card" data-content="${escHtml(p.content || '')}">
      <h3>${escHtml(p.title || 'Untitled')}</h3>
      <p>${escHtml((p.content || '').substring(0, 100))}</p>
      <div class="meta">
        ${p.category ? `<span class="tag">${escHtml(p.category)}</span>` : ''}
        ${(p.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
      </div>
      <button class="copy-btn">Copy</button>
    </div>
  `).join('');

  promptList.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.closest('.prompt-card').dataset.content;
      navigator.clipboard.writeText(content).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
