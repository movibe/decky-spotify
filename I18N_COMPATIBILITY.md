# i18next Compatibility with Decky

## Overview

This document outlines the i18next configuration and compatibility considerations for the Decky Spotify plugin.

## Packages

- **i18next**: `25.6.2` (latest stable)
- **react-i18next**: `16.3.1` (latest stable)

Both packages are up-to-date and compatible with Decky Loader.

## Configuration

### Key Features

1. **Safe localStorage Access**: The i18n configuration includes error handling for localStorage access, which may not be immediately available in the Decky environment.

2. **No Suspense**: React Suspense is disabled (`useSuspense: false`) for better compatibility with Decky's React implementation.

3. **JSON Format**: Using `compatibilityJSON: 'v4'` (the latest i18next format).

4. **Initialization Guard**: Prevents multiple initializations with `if (!i18n.isInitialized)` check.

### Bundle Inclusion

- All translation JSON files are bundled directly into `dist/index.js` via Rollup's JSON plugin (included in `@decky/rollup`).
- No external files are needed at runtime.
- Translations are embedded in the bundle for optimal performance.

## Supported Languages

- English (`en`)
- Portuguese (`pt`) - Default
- French (`fr`)

## Storage

Language preference is stored in `localStorage` with the key `spotify_language`. The store also persists this value via Zustand.

## Build Verification

The build process:
1. ✅ TypeScript compiles successfully
2. ✅ JSON files are imported and bundled
3. ✅ i18next code is included in the output
4. ✅ No runtime dependencies on external files

## Testing

To verify i18next is working:

1. Build the plugin: `pnpm run build`
2. Check that translations are in the bundle: `grep -i "Client ID\|Conectar\|Se connecter" dist/index.js`
3. Verify i18next is included: `grep -i "i18next" dist/index.js`

## Troubleshooting

### Translations not loading

- Check browser console for errors
- Verify `localStorage` is accessible
- Ensure i18n is initialized before use

### Build errors

- Ensure `resolveJsonModule: true` in `tsconfig.json`
- Verify `@decky/rollup` includes JSON plugin (it does by default)

## References

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Decky Plugin Template](https://github.com/SteamDeckHomebrew/decky-plugin-template)

