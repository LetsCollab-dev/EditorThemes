# Palette Generator

This project provides a local GUI to edit the shared palette in `theme/palette.json`.

## Run

From the repository root:

```bash
npm --prefix ./Generator start
```

Then open:

- http://localhost:4173

## What it does

- Loads current values from `theme/palette.json`
- Lets you edit each key with text and color controls
- Saves updates back to `theme/palette.json`
- Automatically runs `scripts/sync-theme-palette.mjs`
- Regenerates Rider, Visual Studio, and VS Code theme outputs
