# Theme Color Correlations

This document compares the active theme definitions to determine how shared palette colors correlate across:

- Rider: `Rider/resources/theme/LetsCollabThemes.theme.json`
- VS Code: `VSCode/themes/letscollab-dark-color-theme.json`
- Visual Studio: `VisualStudio/CustomTheme.vstheme`
- Source palette: `theme/palette.json`

## Correlation Method

1. Rider correlation is based on palette key references in the Rider UI tree. Example: a Rider value of `"accent"` maps to `palette.accent`.
2. VS Code correlation is based on hex value matches in `colors` and `tokenColors`. For 6-digit colors, 8-digit alpha variants (`#RRGGBBAA`) are also counted as matches.
3. Visual Studio correlation is based on ARGB value matches in `.vstheme` entries (`<Background Source="..."/>` / `<Foreground Source="..."/>`).

Note: the matrix below is value-correlation focused and primarily tracks shared UI palette behavior. Semantic syntax keys (`syntax*`) are synchronized through explicit name-based mappings in `scripts/sync-theme-palette.mjs` to Rider editor options, VS Code `tokenColors`/`semanticTokenColors`, and Visual Studio classification foregrounds.

Hex conversion used for Visual Studio matching:

- `#RRGGBB -> FFRRGGBB`
- `#RRGGBBAA -> AARRGGBB`

## Correlation Matrix

| Palette key | Hex | VS ARGB | Rider refs | VS Code refs | VS refs | Coverage |
| --- | --- | --- | ---: | ---: | ---: | --- |
| bg | `#090909` | `FF090909` | 249 | 22 | 479 | Rider + VS Code + VS |
| second | `#37393c` | `FF37393C` | 21 | 8 | 97 | Rider + VS Code + VS |
| fg | `#d0d0d9` | `FFD0D0D9` | 189 | 22 | 584 | Rider + VS Code + VS |
| secondFg | `#96969d` | `FF96969D` | 1 | 6 | 199 | Rider + VS Code + VS |
| selBg | `#464b50` | `FF464B50` | 135 | 6 | 0 | Rider + VS Code |
| selFg | `#e0e0e9` | `FFE0E0E9` | 53 | 3 | 0 | Rider + VS Code |
| border | `#3f3f3f` | `FF3F3F3F` | 71 | 16 | 0 | Rider + VS Code |
| dis | `#666666` | `FF666666` | 39 | 3 | 0 | Rider + VS Code |
| accent | `#35a348` | `FF35A348` | 126 | 15 | 85 | Rider + VS Code + VS |
| shadow | `#212121` | `FF212121` | 8 | 8 | 170 | Rider + VS Code + VS |
| deepBg | `#090909` | `FF090909` | 1 | 22 | 479 | Rider + VS Code + VS (alias of `bg`) |
| white | `#c8d3f5` | `FFC8D3F5` | 0 | 2 | 0 | VS Code only |
| blue | `#70b0ff` | `FF70B0FF` | 0 | 7 | 0 | VS Code only |
| red | `#ff757f` | `FFFF757F` | 1 | 2 | 0 | Rider + VS Code |
| yellow | `#ffbd76` | `FFFFBD76` | 1 | 6 | 0 | Rider + VS Code |
| green | `#7af8ca` | `FF7AF8CA` | 0 | 5 | 0 | VS Code only |
| gray | `#7e8eda` | `FF7E8EDA` | 0 | 4 | 0 | VS Code only |
| purple | `#baacff` | `FFBAACFF` | 0 | 2 | 0 | VS Code only |
| orange | `#ff9668` | `FFFF9668` | 0 | 1 | 0 | VS Code only |
| error | `#dd3962` | `FFDD3962` | 1 | 5 | 0 | Rider + VS Code |
| separator | `#505050` | `FF505050` | 1 | 6 | 0 | Rider + VS Code |
| highlightFg | `#ffffff` | `FFFFFFFF` | 0 | 1 | 0 | VS Code only |
| scroll | `#4d4e5190` | `904D4E51` | 0 | 1 | 0 | VS Code only |

## Representative Correlations

| Palette key | Rider example | VS Code example | Visual Studio example |
| --- | --- | --- | --- |
| bg | `ui.*.background` | `colors.editor.background` | `Body.Background` |
| second | `ui.Checkbox.Background.Disabled` | `colors.editor.inactiveSelectionBackground` | `NumberedListItemHover.Background` |
| fg | `ui.*.foreground` | `colors.foreground` | `Body.Foreground` |
| secondFg | `ui.Component.infoForeground` | `colors.descriptionForeground` | `ContentSectionHeader.Foreground` |
| accent | `ui.Button.foreground` | `colors.focusBorder` | `XML Doc Comment.Foreground` |
| shadow | `ui.controlShadow` | `colors.textCodeBlock.background` | `ContentSectionHeaderBorder.Foreground` |

## Findings

1. The strongest cross-app correlations today are `bg`, `second`, `fg`, `secondFg`, `accent`, and `shadow`.
2. `deepBg` currently behaves as an alias of `bg` because it shares the same hex value.
3. Several interaction-oriented colors (`selBg`, `selFg`, `border`, `dis`) are strongly aligned between Rider and VS Code but are not currently represented by matching ARGB values in Visual Studio.
4. Semantic programming token colors are now managed through explicit sync mappings (`syntax*` keys) rather than only by raw value-correlation.

## Suggested Next Correlation Improvements

1. Introduce explicit Visual Studio `.vstheme` entries that use ARGB equivalents for `selBg`, `selFg`, `border`, `dis`, `error`, and `separator`.
2. Map VS Code semantic accents (`blue`, `green`, `purple`, etc.) into Rider editor scheme and Visual Studio classification colors where practical.
3. Keep `deepBg` only if semantic aliasing is intentional; otherwise remove it to reduce accidental duplicate meaning.
