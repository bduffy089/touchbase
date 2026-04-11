document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('save');
  const statusEl = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(
    { touchbaseUrl: 'http://localhost:3000', apiKey: '' },
    (items) => {
      urlInput.value = items.touchbaseUrl;
      apiKeyInput.value = items.apiKey;
    },
  );

  saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim().replace(/\/+$/, '');
    const apiKey = apiKeyInput.value.trim();

    if (!url) {
      statusEl.textContent = 'URL is required';
      statusEl.className = 'status error';
      return;
    }

    if (!apiKey) {
      statusEl.textContent = 'API key is required';
      statusEl.className = 'status error';
      return;
    }

    chrome.storage.sync.set(
      { touchbaseUrl: url, apiKey: apiKey },
      () => {
        statusEl.textContent = 'Settings saved!';
        statusEl.className = 'status';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
      },
    );
  });
});
