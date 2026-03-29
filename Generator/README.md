# Palette Generator

This project provides a local GUI to edit the shared palette in `theme/palette.json`.

## Run

From the repository root:

```bash
npm --prefix ./Generator start
```

Then open:

- <http://localhost:4173>

## What it does

- Loads current values from `theme/palette.json`
- Loads current shared version from `version.json`
- Lets you edit each key with a compact row (name, hex text, swatch button) and popover HSB/alpha controls
- Lets you edit the shared release version used by Rider, Visual Studio, and VS Code package metadata
- Shows a split-view C# syntax preview with target selector (Visual Studio, Rider, VS Code)
- Saves updates back to `theme/palette.json`
- Saves version updates back to `version.json`
- Automatically runs `scripts/sync-theme-palette.mjs`
- Regenerates Rider, Visual Studio, and VS Code theme outputs
