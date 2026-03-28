#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultPalette,
  requiredKeys,
  riderForegroundMappings,
  uiPaletteKeys,
  visualStudioForegroundMappings,
  vscodeSemanticTokenMap,
  vscodeSupplementalTokenRules,
  vscodeTokenRuleMap
} from "./theme-sync-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const palettePath = path.join(rootDir, "theme", "palette.json");
const riderThemePath = path.join(rootDir, "Rider", "resources", "theme", "LetsCollabThemes.theme.json");
const riderEditorSchemePath = path.join(rootDir, "Rider", "resources", "letscollabDark.theme.xml");
const vscodeThemePath = path.join(rootDir, "VSCode", "themes", "letscollab-dark-color-theme.json");
const visualStudioThemePath = path.join(rootDir, "VisualStudio", "CustomTheme.vstheme");

function writeOrCheckFile(filePath, nextContent, checkOnly, outOfSyncFiles) {
  const currentContent = fs.readFileSync(filePath, "utf8");
  if (currentContent === nextContent) {
    return;
  }

  if (checkOnly) {
    outOfSyncFiles.push(path.relative(rootDir, filePath).replace(/\\/g, "/"));
    return;
  }

  fs.writeFileSync(filePath, nextContent, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeHex(value) {
  if (typeof value !== "string") {
    throw new Error(`Expected hex string but got ${typeof value}`);
  }
  const hex = value.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) {
    throw new Error(`Invalid hex value: ${value}`);
  }
  return hex;
}

function toVsArgb(hex) {
  const normalized = normalizeHex(hex);
  if (normalized.length === 9) {
    return `${normalized.slice(7, 9)}${normalized.slice(1, 7)}`.toUpperCase();
  }
  return `FF${normalized.slice(1)}`.toUpperCase();
}

function toRiderRgb(hex) {
  return normalizeHex(hex).slice(1, 7);
}

function remapHexValue(value, replacements) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  for (const [oldTokenRaw, newTokenRaw] of Object.entries(replacements)) {
    const oldToken = oldTokenRaw.toLowerCase();
    const newToken = newTokenRaw.toLowerCase();

    if (normalized === oldToken) {
      return newToken;
    }

    // Preserve alpha suffixes for #RRGGBBXX style values.
    if (/^#[0-9a-f]{6}$/.test(oldToken) && normalized.startsWith(oldToken) && normalized.length === oldToken.length + 2) {
      const alpha = normalized.slice(oldToken.length);
      if (/^[0-9a-f]{2}$/.test(alpha)) {
        return `${newToken}${alpha}`;
      }
    }
  }

  return value;
}

function remapHexInObject(value, replacements) {
  if (Array.isArray(value)) {
    return value.map((entry) => remapHexInObject(entry, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, remapHexInObject(entry, replacements)])
    );
  }

  return remapHexValue(value, replacements);
}

function upsertVscodeTokenRule(tokenColors, ruleDef, foreground) {
  const nextRule = {
    name: ruleDef.name,
    scope: ruleDef.scope,
    settings: {
      foreground
    }
  };

  const index = tokenColors.findIndex((rule) => rule && typeof rule === "object" && rule.name === ruleDef.name);
  if (index === -1) {
    tokenColors.push(nextRule);
    return tokenColors;
  }

  tokenColors[index] = {
    ...(tokenColors[index] || {}),
    name: ruleDef.name,
    scope: ruleDef.scope,
    settings: {
      ...(tokenColors[index].settings || {}),
      foreground
    }
  };
  return tokenColors;
}

function setRiderForeground(xml, optionName, rgbHex) {
  const escapedName = escapeRegExp(optionName);
  const blockPattern = new RegExp(`(<option name="${escapedName}">[\\s\\S]*?<\\/option>)`, "g");
  return xml.replace(blockPattern, (block) =>
    block.replace(/(<option name="FOREGROUND" value=")([0-9a-fA-F]+)("\s*\/>)/, `$1${rgbHex}$3`)
  );
}

function setVisualStudioForeground(xml, colorName, argbHex) {
  const escapedName = escapeRegExp(colorName);
  const blockPattern = new RegExp(`(<Color Name="${escapedName}">[\\s\\S]*?<\\/Color>)`, "g");
  return xml.replace(blockPattern, (block) =>
    block.replace(/(<Foreground[^>]*Source=")([0-9a-fA-F]{8})(")/, `$1${argbHex}$3`)
  );
}

function validatePalette(palette) {
  for (const key of requiredKeys) {
    if (!(key in palette)) {
      throw new Error(`Missing palette key: ${key}`);
    }
    normalizeHex(palette[key]);
  }
}

function syncRiderTheme(palette, checkOnly, outOfSyncFiles) {
  const riderTheme = readJson(riderThemePath);
  riderTheme.colors = Object.fromEntries(
    Object.entries(palette).map(([key, value]) => [key, normalizeHex(value)])
  );
  const nextContent = `${JSON.stringify(riderTheme, null, 2)}\n`;
  writeOrCheckFile(riderThemePath, nextContent, checkOnly, outOfSyncFiles);
}

function syncRiderEditorScheme(palette, checkOnly, outOfSyncFiles) {
  let source = fs.readFileSync(riderEditorSchemePath, "utf8");

  for (const [optionName, paletteKey] of Object.entries(riderForegroundMappings)) {
    source = setRiderForeground(source, optionName, toRiderRgb(palette[paletteKey]));
  }

  writeOrCheckFile(riderEditorSchemePath, source, checkOnly, outOfSyncFiles);
}

function syncVscodeTheme(palette, checkOnly, outOfSyncFiles) {
  const replacements = {};
  for (const key of uiPaletteKeys) {
    replacements[normalizeHex(defaultPalette[key])] = normalizeHex(palette[key]);
  }

  const theme = readJson(vscodeThemePath);
  const updatedTheme = remapHexInObject(theme, replacements);
  const tokenColors = (updatedTheme.tokenColors || []).map((rule) => {
    if (!rule || typeof rule !== "object") {
      return rule;
    }

    const mappedKey = vscodeTokenRuleMap[rule.name];
    if (!mappedKey) {
      return rule;
    }

    return {
      ...rule,
      settings: {
        ...(rule.settings || {}),
        foreground: normalizeHex(palette[mappedKey])
      }
    };
  });

  for (const ruleDef of vscodeSupplementalTokenRules) {
    upsertVscodeTokenRule(tokenColors, ruleDef, normalizeHex(palette[ruleDef.paletteKey]));
  }

  updatedTheme.tokenColors = tokenColors;

  updatedTheme.semanticTokenColors = {
    ...(updatedTheme.semanticTokenColors || {})
  };

  for (const [tokenName, paletteKey] of Object.entries(vscodeSemanticTokenMap)) {
    updatedTheme.semanticTokenColors[tokenName] = normalizeHex(palette[paletteKey]);
  }

  const nextContent = `${JSON.stringify(updatedTheme, null, 2)}\n`;
  writeOrCheckFile(vscodeThemePath, nextContent, checkOnly, outOfSyncFiles);
}

function syncVisualStudioTheme(palette, checkOnly, outOfSyncFiles) {
  const paletteReplacements = {};
  for (const key of uiPaletteKeys) {
    paletteReplacements[toVsArgb(defaultPalette[key])] = toVsArgb(palette[key]);
  }

  const legacyMappings = {
    FFF2F2F2: toVsArgb(palette.fg),
    FFACACAC: toVsArgb(palette.secondFg),
    FF48B04D: toVsArgb(palette.accent),
    FF57A64A: toVsArgb(palette.accent),
    FF363636: toVsArgb(palette.second),
    FF121212: toVsArgb(palette.shadow)
  };

  const source = fs.readFileSync(visualStudioThemePath, "utf8");
  let updated = source;

  for (const [oldToken, newToken] of Object.entries({ ...paletteReplacements, ...legacyMappings })) {
    const regex = new RegExp(`\\b${oldToken}\\b`, "gi");
    updated = updated.replace(regex, newToken);
  }

  for (const [colorName, paletteKey] of Object.entries(visualStudioForegroundMappings)) {
    updated = setVisualStudioForeground(updated, colorName, toVsArgb(palette[paletteKey]));
  }

  writeOrCheckFile(visualStudioThemePath, updated, checkOnly, outOfSyncFiles);
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const palette = readJson(palettePath);
  const outOfSyncFiles = [];

  validatePalette(palette);

  syncRiderTheme(palette, checkOnly, outOfSyncFiles);
  syncRiderEditorScheme(palette, checkOnly, outOfSyncFiles);
  syncVscodeTheme(palette, checkOnly, outOfSyncFiles);
  syncVisualStudioTheme(palette, checkOnly, outOfSyncFiles);

  if (checkOnly) {
    if (outOfSyncFiles.length > 0) {
      console.error("Generated theme files are out of sync with theme/palette.json:");
      for (const file of outOfSyncFiles) {
        console.error(`- ${file}`);
      }
      console.error("Run node ./scripts/sync-theme-palette.mjs locally and commit the changes.");
      process.exit(1);
    }

    console.log("Generated theme files are in sync with theme/palette.json.");
    return;
  }

  console.log("Synced Rider, Visual Studio, and VS Code themes from theme/palette.json");
}

main();
