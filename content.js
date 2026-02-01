chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getSelection') {
    sendResponse({ text: window.getSelection().toString() });
  }
});
