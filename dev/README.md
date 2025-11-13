# Browser Testing Guide

This directory contains files for testing the Decky Spotify plugin in a browser environment.

## Quick Start

1. **Build the plugin:**

   ```bash
   pnpm run build
   ```

2. **Start the test server:**

   ```bash
   pnpm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Watch Mode (Recommended)

For development with auto-reload:

**Terminal 1:**

```bash
pnpm run watch
```

**Terminal 2:**

```bash
pnpm run dev
```

Then refresh your browser after each change.

## What's Included

- **`index.html`**: Test page with Decky API mocks
- **`server.js`**: Simple HTTP server for local testing

## Limitations

⚠️ **Note**: This is a simplified test environment. Some features may not work exactly as in the real Decky Loader:

- Navigation between pages may be limited
- Some Decky-specific APIs are mocked
- Backend Python functions won't work (they're mocked)
- OAuth redirects may need manual handling

## Testing Checklist

- [ ] Plugin loads without errors
- [ ] UI components render correctly
- [ ] Language selector works
- [ ] Store state persists (localStorage)
- [ ] Buttons and inputs are functional
- [ ] Toast notifications appear
- [ ] No console errors

## Troubleshooting

### Plugin doesn't load

- Make sure you ran `pnpm run build` first
- Check browser console for errors
- Verify `dist/index.js` exists

### Styles look wrong

- The mock environment uses basic CSS
- Real Decky Loader has its own styling system
- Focus on functionality, not exact appearance

### OAuth doesn't work

- OAuth redirects need to be handled manually in browser
- Copy the redirect URL and open it in a new tab
- The callback will work if you manually navigate

## Alternative: Use Decky Loader Dev Mode

For more accurate testing, use the actual Decky Loader:

1. Install Decky Loader on your Steam Deck or development environment
2. Copy the plugin to the plugins directory
3. Enable developer mode
4. Test directly in the Decky interface
