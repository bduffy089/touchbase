# TouchBase LinkedIn Import — Chrome Extension

One-click import LinkedIn profiles into your TouchBase CRM.

## Install (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` directory
5. The TouchBase icon appears in your toolbar

## Setup

1. Click the TouchBase extension icon in your toolbar
2. Set your **TouchBase URL** (default: `http://localhost:3000`)
3. Set your **API Key** — must match the `TOUCHBASE_API_KEY` env var in your TouchBase app
4. Click **Save Settings**

### Server-side API Key

Add to your `.env` or environment:

```
TOUCHBASE_API_KEY=your-secret-key-here
```

The extension sends this key as an `X-API-Key` header with every request. The TouchBase middleware validates it before allowing the request.

## Usage

1. Navigate to any LinkedIn profile page (`linkedin.com/in/...`)
2. Click the **"Add to TouchBase"** button (amber button, bottom-right corner)
3. The extension scrapes visible profile data, sends it to TouchBase's AI parser, and creates a contact
4. A toast notification confirms success or shows any error

## What Gets Imported

- Name
- Headline
- Location
- About section
- Experience (up to 3 most recent)
- Education (up to 2)

The AI parser extracts structured data (company, email if visible, etc.) from the raw profile text.

## Architecture

```
content.js    → Runs on linkedin.com/in/* pages, injects the import button
content.css   → Styles for the button and toast notifications
popup.html/js → Settings UI for URL and API key (stored in chrome.storage.sync)
manifest.json → Manifest V3 extension config
```

## Troubleshooting

- **Button not showing?** Make sure you're on a `linkedin.com/in/` profile page. Refresh if the page loaded before the extension.
- **"Set your API key" error?** Open the extension popup and enter your API key.
- **CORS errors?** Make sure your TouchBase app is running and `next.config.mjs` has the CORS headers configured (already done if you're on the latest main branch).
- **"Invalid API key"?** Ensure the key in the extension matches `TOUCHBASE_API_KEY` in your server environment.
