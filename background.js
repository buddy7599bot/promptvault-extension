const API_BASE = 'https://promptvault-pied.vercel.app/api';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-promptvault',
    title: 'Save to PromptVault',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-promptvault' && info.selectionText) {
    const { access_token } = await chrome.storage.local.get('access_token');
    if (!access_token) {
      chrome.action.openPopup?.() || chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert('Please log in to PromptVault first.')
      });
      return;
    }

    const text = info.selectionText;
    const title = text.split('\n')[0].substring(0, 80);

    try {
      const res = await fetch(`${API_BASE}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({ title, content: text, category: 'uncategorized', tags: [] })
      });

      if (res.ok) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const d = document.createElement('div');
            d.textContent = 'Saved to PromptVault!';
            Object.assign(d.style, {
              position: 'fixed', top: '20px', right: '20px', zIndex: '999999',
              background: '#10b981', color: '#fff', padding: '12px 20px',
              borderRadius: '8px', fontSize: '14px', fontFamily: 'sans-serif',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            });
            document.body.appendChild(d);
            setTimeout(() => d.remove(), 2500);
          }
        });
      }
    } catch (e) {
      console.error('PromptVault save error:', e);
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getSelection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return sendResponse({ text: '' });
      chrome.tabs.sendMessage(tabs[0].id, { type: 'getSelection' }, (res) => {
        sendResponse(res || { text: '' });
      });
    });
    return true;
  }
});
