#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  requiredKeys,
  riderForegroundMappings,
  syntaxPaletteKeys,
  visualStudioForegroundMappings,
  vscodeSemanticTokenMap,
  vscodeSupplementalTokenRules,
  vscodeTokenRuleMap
} from "./theme-sync-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const palettePath = path.join(rootDir, "theme", "palette.json");
const riderEditorSchemePath = path.join(rootDir, "Rider", "resources", "letscollabDark.theme.xml");
const vscodeThemePath = path.join(rootDir, "VSCode", "themes", "letscollab-dark-color-theme.json");
const visualStudioThemePath = path.join(rootDir, "VisualStudio", "CustomTheme.vstheme");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function collectRegexGroupValues(source, pattern) {
  const values = new Set();
  for (const match of source.matchAll(pattern)) {
    values.add(match[1]);
  }
  return values;
}

function assertMappingValuesAreSyntaxKeys(mappingName, values, errors) {
  for (const paletteKey of values) {
    if (!syntaxPaletteKeys.includes(paletteKey)) {
      errors.push(`${mappingName} contains non-syntax key: ${paletteKey}`);
    }
  }
}

function assertCoverage(targetName, usedSyntaxKeys, errors) {
  const missing = syntaxPaletteKeys.filter((key) => !usedSyntaxKeys.has(key));
  if (missing.length > 0) {
    errors.push(`${targetName} mapping is missing syntax coverage for: ${missing.join(", ")}`);
  }
}

function assertMappedNamesExist(targetName, mappedNames, actualNames, errors) {
  for (const mappedName of mappedNames) {
    if (!actualNames.has(mappedName)) {
      errors.push(`${targetName} maps a missing name: ${mappedName}`);
    }
  }
}

function verifyPalette(errors) {
  const palette = readJson(palettePath);

  for (const key of requiredKeys) {
    if (!(key in palette)) {
      errors.push(`theme/palette.json is missing required key: ${key}`);
      continue;
    }

    try {
      normalizeHex(palette[key]);
    } catch (error) {
      errors.push(`theme/palette.json has invalid value for ${key}: ${error.message}`);
    }
  }
}

function verifyRider(errors) {
  const riderSource = fs.readFileSync(riderEditorSchemePath, "utf8");
  const riderOptionNames = collectRegexGroupValues(riderSource, /<option name="([^"]+)"/g);
  const riderMappedNames = Object.keys(riderForegroundMappings);
  const riderUsedSyntaxKeys = new Set(Object.values(riderForegroundMappings));

  assertMappingValuesAreSyntaxKeys("Rider", riderUsedSyntaxKeys, errors);
  assertCoverage("Rider", riderUsedSyntaxKeys, errors);
  assertMappedNamesExist("Rider", riderMappedNames, riderOptionNames, errors);
}

function verifyVscode(errors) {
  const theme = readJson(vscodeThemePath);
  const tokenColors = Array.isArray(theme.tokenColors) ? theme.tokenColors : [];
  const tokenRuleNames = new Set(
    tokenColors
      .map((rule) => (rule && typeof rule === "object" ? rule.name : null))
      .filter((name) => typeof name === "string")
  );

  const mappedTokenRuleNames = [
    ...Object.keys(vscodeTokenRuleMap),
    ...vscodeSupplementalTokenRules.map((rule) => rule.name)
  ];

  for (const ruleName of mappedTokenRuleNames) {
    if (!tokenRuleNames.has(ruleName)) {
      errors.push(`VS Code theme is missing tokenColors rule: ${ruleName}`);
    }
  }

  const semanticTokenColors =
    theme.semanticTokenColors && typeof theme.semanticTokenColors === "object"
      ? theme.semanticTokenColors
      : {};

  for (const semanticToken of Object.keys(vscodeSemanticTokenMap)) {
    if (!(semanticToken in semanticTokenColors)) {
      errors.push(`VS Code theme is missing semanticTokenColors entry: ${semanticToken}`);
    }
  }

  const vscodeUsedSyntaxKeys = new Set([
    ...Object.values(vscodeTokenRuleMap),
    ...Object.values(vscodeSemanticTokenMap),
    ...vscodeSupplementalTokenRules.map((rule) => rule.paletteKey)
  ]);

  assertMappingValuesAreSyntaxKeys("VS Code", vscodeUsedSyntaxKeys, errors);
  assertCoverage("VS Code", vscodeUsedSyntaxKeys, errors);
}

function verifyVisualStudio(errors) {
  const source = fs.readFileSync(visualStudioThemePath, "utf8");
  const visualStudioNames = collectRegexGroupValues(source, /<Color Name="([^"]+)"/g);
  const mappedNames = Object.keys(visualStudioForegroundMappings);
  const visualStudioUsedSyntaxKeys = new Set(Object.values(visualStudioForegroundMappings));

  assertMappingValuesAreSyntaxKeys("Visual Studio", visualStudioUsedSyntaxKeys, errors);
  assertCoverage("Visual Studio", visualStudioUsedSyntaxKeys, errors);
  assertMappedNamesExist("Visual Studio", mappedNames, visualStudioNames, errors);
}

function main() {
  const errors = [];

  verifyPalette(errors);
  verifyRider(errors);
  verifyVscode(errors);
  verifyVisualStudio(errors);

  if (errors.length > 0) {
    console.error("Theme sync coverage verification failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Theme sync coverage verification passed.");
  console.log(`Verified ${syntaxPaletteKeys.length} syntax keys across Rider, VS Code, and Visual Studio mappings.`);
}

main();
