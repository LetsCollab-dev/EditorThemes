# LetsCollab Themes

This repository holds three editor theme projects:

- Rider (IntelliJ Platform plugin) — in [Rider](Rider)
- Visual Studio extension — in [VisualStudio](VisualStudio)
- Visual Studio Code theme extension — in [VSCode](VSCode)

## Shared color palette

All three theme targets are synchronized from [theme/palette.json](theme/palette.json).
The shared palette now includes both UI keys (backgrounds, borders, accents) and semantic syntax keys (for example `syntaxKeyword`, `syntaxClass`, `syntaxParameter`, `syntaxComment`).
Shared extension version is synchronized from `version.json`.

Run this from the repository root whenever you update colors:

```bash
node ./scripts/sync-theme-palette.mjs
```

Validate that generated files are already in sync (non-mutating):

```bash
node ./scripts/sync-theme-palette.mjs --check
```

Validate semantic coverage mappings after sync:

```bash
node ./scripts/verify-theme-sync-coverage.mjs
```

This script updates:

- Rider: `Rider/resources/theme/LetsCollabThemes.theme.json`
- Rider editor syntax scheme: `Rider/resources/letscollabDark.theme.xml`
- Rider plugin version: `Rider/resources/META-INF/plugin.xml`
- Visual Studio Code: `VSCode/themes/letscollab-dark-color-theme.json`
- Visual Studio Code extension version: `VSCode/package.json`
- Visual Studio: `VisualStudio/CustomTheme.vstheme` (core palette, legacy substitutions, and semantic classifications)
- Visual Studio extension version: `VisualStudio/source.extension.vsixmanifest`

Detailed cross-app mapping: [theme/COLOR_CORRELATIONS.md](theme/COLOR_CORRELATIONS.md)

## Generator GUI

Use the local Generator app to edit the shared palette through a GUI:

```bash
npm --prefix ./Generator start
```

Open `http://localhost:4173` in your browser.

Saving in the GUI writes `theme/palette.json` and runs the sync script automatically.

## Rider: build a plugin JAR

Prereqs:

- JDK 17+ (for the `jar` tool on PATH)
- Node.js 20+ (for palette sync)

From the repo root using the script:

```bash
./scripts/build-rider-plugin.sh
```

Or run the `jar` command directly:

```bash
mkdir -p dist/rider
jar --create --file dist/rider/LetsCollabThemes-<version>.jar -C Rider/resources .
```

The script (and command) package the plugin contents so `META-INF/plugin.xml` is at the root of the JAR.

## Rider: verify the JAR

```bash
jar --list --file dist/rider/LetsCollabThemes-<version>.jar | head -n 20
```

You should see `META-INF/plugin.xml` near the top of the listing.

## Visual Studio: build a VSIX

Prereqs:

- Visual Studio Build Tools (with VSSDK) or full Visual Studio
- Node.js 20+ (for palette sync)

From the repo root using the script:

```bash
./scripts/build-visualstudio-vsix.sh
```

Output is placed in `dist/visualstudio/`.

## VS Code: package VSIX

Prereqs:

- Node.js 20+

From the repo root:

```bash
cd VSCode
npm install
npm run package
```

This runs the shared palette sync first, then packages the extension VSIX.
