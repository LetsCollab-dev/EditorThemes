# LetsCollab Themes

This repository holds three editor theme projects:
- Rider (IntelliJ Platform plugin) — in [Rider](Rider)
- Visual Studio — planned
- Visual Studio Code — planned

## Rider: build a plugin JAR

Prereqs:
- JDK 17+ (for the `jar` tool on PATH)

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

From the repo root using the script:

```powershell
./scripts/build-visualstudio-vsix.ps1
```

Output is placed in `dist/visualstudio/`.
