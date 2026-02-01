# PromptVault Chrome Extension

Save, search and manage your AI prompts from any webpage.

## Install

1. Download or clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `promptvault-extension` folder
6. The PromptVault icon appears in your toolbar

## Features

- **Save prompts** from selected text on any webpage
- **Right-click context menu** to quick-save selected text
- **Search** your saved prompts with fuzzy matching
- **Copy** any prompt to clipboard with one click
- **Categories and tags** for organization
- Dark theme matching the PromptVault web app

## Usage

1. Click the extension icon and log in with your PromptVault account
2. Select text on any webpage
3. Click the extension icon to save it, or right-click and choose "Save to PromptVault"
4. Browse and search your prompts from the extension popup

## API

- Auth: Supabase REST API
- Prompts: `https://promptvault-pied.vercel.app/api/prompts`
