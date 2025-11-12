# Release Guide

This guide explains how to create releases for the Decky Spotify plugin.

## Automated Process (Recommended)

### 1. Create a new release

```bash
# For a bug fix (patch): 0.0.1 -> 0.0.2
bash scripts/create-release.sh patch

# For a new feature (minor): 0.0.1 -> 0.1.0
bash scripts/create-release.sh minor

# For a major change (major): 0.0.1 -> 1.0.0
bash scripts/create-release.sh major
```

The script will:
- Update the version in `package.json`
- Create a commit with the version change
- Build the plugin
- Create the release zip file
- Create a git tag
- Ask if you want to push the tag

### 2. Push the tag

```bash
git push origin v<version>
git push origin main  # or your default branch
```

When you push the tag, GitHub Actions will automatically:
- Detect the new tag
- Build the plugin
- Create the zip file
- Create a GitHub release with the zip attached

## Manual Process

### 1. Update version

```bash
# Update in package.json
pnpm run version:patch  # or version:minor, version:major
```

Or manually edit `package.json`.

### 2. Create release zip

```bash
pnpm run release:build
```

This will create a `release/decky-spotify-v<version>.zip` file.

### 3. Create tag and release

```bash
# Create tag
git tag -a v<version> -m "Release v<version>"

# Push the tag
git push origin v<version>
```

## Zip Structure

The zip file contains:

```
decky-spotify-v<version>.zip
└── decky-spotify/
    ├── dist/          # Compiled JavaScript files
    ├── plugin.json    # Plugin metadata
    ├── main.py        # Python backend
    ├── package.json   # Package information
    ├── LICENSE        # License
    ├── README.md      # Documentation
    ├── assets/        # Assets (if exists)
    ├── defaults/      # Default files (if exists)
    ├── py_modules/    # Python modules (if exists)
    └── bin/           # Backend binaries (if exists)
```

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Incompatible API changes
- **MINOR** (0.1.0): New backwards-compatible functionality
- **PATCH** (0.0.1): Backwards-compatible bug fixes

## Update CHANGELOG.md

Before creating a release, update `CHANGELOG.md` with the changes:

```markdown
## [0.0.2] - 2024-XX-XX

### Added
- New feature X

### Changed
- Improvement Y

### Fixed
- Bug fix Z
```

## Verification

After creating a release, verify:

1. ✅ The zip file was created in `release/`
2. ✅ The tag was created: `git tag -l`
3. ✅ The release appears on GitHub after pushing the tag
4. ✅ The zip file is attached to the release
5. ✅ CHANGELOG.md is updated

## Troubleshooting

### Workflow doesn't run

- Check if the tag follows the format `v*.*.*` (e.g., v1.0.0)
- Check if you pushed the tag: `git push origin v<version>`

### Build error

- Run locally: `pnpm run build`
- Check if all dependencies are installed: `pnpm install`

### Zip doesn't appear in release

- Check GitHub Actions logs
- Make sure the workflow completed successfully
