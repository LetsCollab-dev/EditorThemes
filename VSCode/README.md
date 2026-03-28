# LetsCollab Theme for VS Code

This extension provides a VS Code theme aligned to the Rider `LetsCollab Dark` palette in this repository.

## Palette Source

Primary colors are matched from the Rider theme:
- Background: `#090909`
- Foreground: `#d0d0d9`
- Accent: `#35A348`
- Selection: `#464b50`
- Border: `#3f3f3f`
- Error: `#dd3962`

## Local Development

From the `VSCode` folder:

```bash
npm install
npx @vscode/vsce package
```

This generates a `.vsix` file that can be installed with:

```bash
code --install-extension letscollab-vscode-theme-0.0.1.vsix
```

Then choose **LetsCollab Dark** from the Color Theme picker.
