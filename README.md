# Decky Spotify Plugin

A Spotify Web Player plugin for the Steam Deck using Decky Loader.

## Features

- 🎵 Spotify Web Player integration
- 🔐 OAuth authentication with PKCE
- 🌍 Multi-language support (English, Portuguese, French)
- 🔍 Track search and playback
- 🎮 Optimized for Steam Deck

## Installation

### From GitHub Releases

1. Go to the [Releases](https://github.com/SteamDeckHomebrew/decky-spotify/releases) page
2. Download the latest `decky-spotify-v*.zip` file
3. Extract the zip file
4. Copy the `decky-spotify` folder to your Decky Loader plugins directory

### Manual Build

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Build the plugin: `pnpm run build`
4. Create release zip: `pnpm run release:build`

## Development

### Prerequisites

- Node.js v16.14+
- pnpm v9

### Setup

```bash
pnpm install
pnpm run build
```

### Scripts

- `pnpm run build` - Build the plugin
- `pnpm run watch` - Watch mode for development
- `pnpm run test` - Run tests
- `pnpm run dev` - Start local test server (browser testing)
- `pnpm run dev:watch` - Watch mode + test server (recommended for development)
- `pnpm run release:build` - Build and create release zip
- `pnpm run release` - Build and create release zip (alias)

### Browser Testing

You can test the plugin interface in your browser:

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

**For development with auto-reload:**

Terminal 1:
```bash
pnpm run watch
```

Terminal 2:
```bash
pnpm run dev
```

See [`dev/README.md`](dev/README.md) for more details and limitations.

### Creating a Release

#### Automatic Release on Main Merge (Recommended)

When you merge code to the `main` branch, GitHub Actions will automatically:
1. Check if the version in `package.json` has changed
2. If a new version is detected and no tag exists for it:
   - Build the plugin
   - Create a zip archive
   - Create a git tag automatically
   - Create a GitHub release with the zip attached

**To trigger a release:**
1. Update version in `package.json`: `pnpm run version:patch` (or `minor`/`major`)
2. Commit and push to main: `git commit -am "chore: bump version" && git push origin main`
3. Merge to main (via PR or direct push)
4. The release will be created automatically!

#### Manual Release with Script

1. Update version: `pnpm run version:patch` (or `minor`/`major`)
2. Create release: `bash scripts/create-release.sh patch`
3. Push tag: `git push origin v<version>`

#### Manual Release

1. Update version in `package.json`
2. Build: `pnpm run build`
3. Create zip: `pnpm run release:build`
4. Create git tag: `git tag v<version>`
5. Push tag: `git push origin v<version>`

## Configuration

1. Open the plugin settings in Decky Loader
2. Enter your Spotify Client ID
3. Click "Connect to Spotify" to authenticate
4. Start using the player!

## License

BSD-3-Clause

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
