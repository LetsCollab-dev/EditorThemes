#!/usr/bin/env node
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import {
  requiredKeys,
  riderForegroundMappings,
  visualStudioForegroundMappings,
  vscodeSemanticTokenMap,
  vscodeTokenRuleMap,
  vscodeSupplementalTokenRules
} from "../scripts/theme-sync-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(__dirname, "public");
const palettePath = path.join(rootDir, "theme", "palette.json");
const versionPath = path.join(rootDir, "version.json");
const syncScriptPath = path.join(rootDir, "scripts", "sync-theme-palette.mjs");
const vscodeThemePath = path.join(rootDir, "VSCode", "themes", "letscollab-dark-color-theme.json");
const visualStudioThemePath = path.join(rootDir, "VisualStudio", "CustomTheme.vstheme");
const port = Number(process.env.PORT || 4173);

function requireMapValue(map, sourceName, context) {
  const paletteKey = map[sourceName];
  if (!paletteKey) {
    throw new Error(`Missing ${context} mapping source: ${sourceName}`);
  }
  return paletteKey;
}

function requireVscodeSupplementalPaletteKey(ruleName) {
  const rule = vscodeSupplementalTokenRules.find((entry) => entry.name === ruleName);
  if (!rule || !rule.paletteKey) {
    throw new Error(`Missing VS Code supplemental token rule mapping: ${ruleName}`);
  }
  return rule.paletteKey;
}

function buildPreviewMappings() {
  return {
    rider: {
      label: "Rider",
      source: "Rider editor scheme options",
      tokens: {
        preprocessor: requireMapValue(riderForegroundMappings, "DEFAULT_METADATA", "Rider"),
        keyword: requireMapValue(riderForegroundMappings, "DEFAULT_KEYWORD", "Rider"),
        class: requireMapValue(riderForegroundMappings, "DEFAULT_CLASS_REFERENCE", "Rider"),
        interface: requireMapValue(riderForegroundMappings, "CUSTOM_KEYWORD2_ATTRIBUTES", "Rider"),
        enum: requireMapValue(riderForegroundMappings, "CUSTOM_KEYWORD3_ATTRIBUTES", "Rider"),
        struct: requireMapValue(riderForegroundMappings, "CUSTOM_KEYWORD4_ATTRIBUTES", "Rider"),
        typeParameter: requireMapValue(riderForegroundMappings, "TYPE_PARAMETER_NAME_ATTRIBUTES", "Rider"),
        property: requireMapValue(riderForegroundMappings, "DEFAULT_INSTANCE_FIELD", "Rider"),
        method: requireMapValue(riderForegroundMappings, "DEFAULT_INSTANCE_METHOD", "Rider"),
        function: requireMapValue(riderForegroundMappings, "DEFAULT_FUNCTION_DECLARATION", "Rider"),
        parameter: requireMapValue(riderForegroundMappings, "DEFAULT_REASSIGNED_PARAMETER", "Rider"),
        variable: requireMapValue(riderForegroundMappings, "DEFAULT_IDENTIFIER", "Rider"),
        constant: requireMapValue(riderForegroundMappings, "DEFAULT_CONSTANT", "Rider"),
        number: requireMapValue(riderForegroundMappings, "DEFAULT_NUMBER", "Rider"),
        string: requireMapValue(riderForegroundMappings, "DEFAULT_STRING", "Rider"),
        operator: requireMapValue(riderForegroundMappings, "DEFAULT_OPERATION_SIGN", "Rider"),
        comment: requireMapValue(riderForegroundMappings, "DEFAULT_LINE_COMMENT", "Rider"),
        docComment: requireMapValue(riderForegroundMappings, "DEFAULT_DOC_COMMENT", "Rider"),
        docTag: requireMapValue(riderForegroundMappings, "DEFAULT_DOC_COMMENT_TAG", "Rider")
      },
      tokenTargets: {
        preprocessor: ["DEFAULT_METADATA"],
        keyword: ["DEFAULT_KEYWORD", "CUSTOM_KEYWORD1_ATTRIBUTES"],
        class: ["DEFAULT_CLASS_REFERENCE"],
        interface: ["CUSTOM_KEYWORD2_ATTRIBUTES"],
        enum: ["CUSTOM_KEYWORD3_ATTRIBUTES"],
        struct: ["CUSTOM_KEYWORD4_ATTRIBUTES"],
        typeParameter: ["TYPE_PARAMETER_NAME_ATTRIBUTES"],
        property: ["DEFAULT_INSTANCE_FIELD", "DEFAULT_STATIC_FIELD", "Static property reference ID"],
        method: ["DEFAULT_INSTANCE_METHOD", "DEFAULT_STATIC_METHOD", "Static method access", "JS.INSTANCE_MEMBER_FUNCTION"],
        function: ["DEFAULT_FUNCTION_DECLARATION"],
        parameter: ["DEFAULT_REASSIGNED_PARAMETER", "IMPLICIT_ANONYMOUS_CLASS_PARAMETER_ATTRIBUTES", "KOTLIN_NAMED_ARGUMENT"],
        variable: ["DEFAULT_IDENTIFIER", "DEFAULT_REASSIGNED_LOCAL_VARIABLE", "JS.GLOBAL_VARIABLE", "KOTLIN_MUTABLE_VARIABLE", "TEMPLATE_VARIABLE_ATTRIBUTES"],
        constant: ["DEFAULT_CONSTANT"],
        number: ["DEFAULT_NUMBER"],
        string: ["DEFAULT_STRING"],
        operator: ["DEFAULT_OPERATION_SIGN"],
        comment: ["DEFAULT_LINE_COMMENT", "DEFAULT_BLOCK_COMMENT"],
        docComment: ["DEFAULT_DOC_COMMENT"],
        docTag: ["DEFAULT_DOC_COMMENT_TAG", "DEFAULT_DOC_MARKUP", "DEFAULT_DOC_COMMENT_TAG_VALUE"]
      }
    },
    visualStudio: {
      label: "Visual Studio",
      source: "Visual Studio classification foreground names",
      tokens: {
        preprocessor: requireMapValue(visualStudioForegroundMappings, "preprocessor text", "Visual Studio"),
        keyword: requireMapValue(visualStudioForegroundMappings, "Keyword", "Visual Studio"),
        class: requireMapValue(visualStudioForegroundMappings, "class name", "Visual Studio"),
        interface: requireMapValue(visualStudioForegroundMappings, "interface name", "Visual Studio"),
        enum: requireMapValue(visualStudioForegroundMappings, "enum name", "Visual Studio"),
        struct: requireMapValue(visualStudioForegroundMappings, "struct name", "Visual Studio"),
        typeParameter: requireMapValue(visualStudioForegroundMappings, "type parameter name", "Visual Studio"),
        property: requireMapValue(visualStudioForegroundMappings, "property name", "Visual Studio"),
        method: requireMapValue(visualStudioForegroundMappings, "Method", "Visual Studio"),
        function: requireMapValue(visualStudioForegroundMappings, "Function", "Visual Studio"),
        parameter: requireMapValue(visualStudioForegroundMappings, "parameter name", "Visual Studio"),
        variable: requireMapValue(visualStudioForegroundMappings, "local name", "Visual Studio"),
        constant: requireMapValue(visualStudioForegroundMappings, "constant name", "Visual Studio"),
        number: requireMapValue(visualStudioForegroundMappings, "Number", "Visual Studio"),
        string: requireMapValue(visualStudioForegroundMappings, "String", "Visual Studio"),
        operator: requireMapValue(visualStudioForegroundMappings, "Operator", "Visual Studio"),
        comment: requireMapValue(visualStudioForegroundMappings, "Comment", "Visual Studio"),
        docComment: requireMapValue(visualStudioForegroundMappings, "xml doc comment - comment", "Visual Studio"),
        docTag: requireMapValue(visualStudioForegroundMappings, "xml doc comment - name", "Visual Studio")
      },
      tokenTargets: {
        preprocessor: ["preprocessor text", "Preprocessor Keyword"],
        keyword: ["Keyword", "keyword - control"],
        class: ["class name", "record class name"],
        interface: ["interface name"],
        enum: ["enum name"],
        struct: ["struct name", "record struct name"],
        typeParameter: ["type parameter name"],
        property: ["property name", "json - property name"],
        method: ["Method", "method name", "extension method name"],
        function: ["Function"],
        parameter: ["parameter name", "inlay hints parameter"],
        variable: ["local name"],
        constant: ["constant name", "enum member name"],
        number: ["Number", "json - number", "VBScript Number"],
        string: ["String", "string - verbatim", "json - string"],
        operator: ["Operator", "operator - overloaded", "json - operator"],
        comment: ["Comment", "XML Comment", "CSS Comment", "HTML Comment", "VBScript Comment", "regex - comment", "json - comment"],
        docComment: ["xml doc comment - comment", "xml doc comment - delimiter", "xml doc comment - text", "XML Doc Comment"],
        docTag: ["xml doc comment - name", "xml doc comment - attribute name", "xml doc comment - attribute value", "xml doc comment - cdata section"]
      }
    },
    vscode: {
      label: "VS Code",
      source: "VS Code semantic tokens and token color rules",
      tokens: {
        preprocessor: requireMapValue(vscodeSemanticTokenMap, "macro", "VS Code"),
        keyword: requireMapValue(vscodeSemanticTokenMap, "keyword", "VS Code"),
        class: requireMapValue(vscodeSemanticTokenMap, "class", "VS Code"),
        interface: requireMapValue(vscodeSemanticTokenMap, "interface", "VS Code"),
        enum: requireMapValue(vscodeSemanticTokenMap, "enum", "VS Code"),
        struct: requireMapValue(vscodeSemanticTokenMap, "struct", "VS Code"),
        typeParameter: requireMapValue(vscodeSemanticTokenMap, "typeParameter", "VS Code"),
        property: requireMapValue(vscodeSemanticTokenMap, "property", "VS Code"),
        method: requireMapValue(vscodeSemanticTokenMap, "method", "VS Code"),
        function: requireMapValue(vscodeSemanticTokenMap, "function", "VS Code"),
        parameter: requireMapValue(vscodeSemanticTokenMap, "parameter", "VS Code"),
        variable: requireMapValue(vscodeSemanticTokenMap, "variable", "VS Code"),
        constant: requireMapValue(vscodeSemanticTokenMap, "enumMember", "VS Code"),
        number: requireMapValue(vscodeSemanticTokenMap, "number", "VS Code"),
        string: requireMapValue(vscodeSemanticTokenMap, "string", "VS Code"),
        operator: requireMapValue(vscodeSemanticTokenMap, "operator", "VS Code"),
        comment: requireMapValue(vscodeSemanticTokenMap, "comment", "VS Code"),
        docComment: requireVscodeSupplementalPaletteKey("Doc Comments"),
        docTag: requireVscodeSupplementalPaletteKey("Doc Tags")
      },
      tokenTargets: {
        preprocessor: ["macro"],
        keyword: ["keyword"],
        class: ["class"],
        interface: ["interface"],
        enum: ["enum"],
        struct: ["struct"],
        typeParameter: ["typeParameter"],
        property: ["property"],
        method: ["method"],
        function: ["function"],
        parameter: ["parameter"],
        variable: ["variable"],
        constant: ["enumMember"],
        number: ["number"],
        string: ["string"],
        operator: ["operator"],
        comment: ["comment", "Comments"],
        docComment: ["Doc Comments"],
        docTag: ["Doc Tags"]
      }
    }
  };
}

function appendUnique(target, entries) {
  for (const entry of entries) {
    if (typeof entry !== "string" || !entry.trim()) {
      continue;
    }

    if (!target.includes(entry)) {
      target.push(entry);
    }
  }
}

function reverseMapByPalette(source) {
  const reversed = {};

  for (const [targetKey, paletteKey] of Object.entries(source)) {
    if (!reversed[paletteKey]) {
      reversed[paletteKey] = [];
    }

    appendUnique(reversed[paletteKey], [targetKey]);
  }

  return reversed;
}

function tryNormalizeHex(value) {
  if (typeof value !== "string") {
    return null;
  }

  const hex = value.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) {
    return null;
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

function hexMatchesPalette(valueHex, paletteHex) {
  if (valueHex === paletteHex) {
    return true;
  }

  // Treat #RRGGBB and #RRGGBBAA variants as related so alpha overlays stay discoverable.
  if (paletteHex.length === 7 && valueHex.startsWith(paletteHex) && valueHex.length === 9) {
    return true;
  }

  if (paletteHex.length === 9 && paletteHex.startsWith(valueHex) && valueHex.length === 7) {
    return true;
  }

  return false;
}

function extractSemanticTokenForeground(value) {
  if (typeof value === "string") {
    return tryNormalizeHex(value);
  }

  if (value && typeof value === "object") {
    return tryNormalizeHex(value.foreground);
  }

  return null;
}

function mapHexValueToPaletteTargets(valueHex, paletteHexByKey, targetName, targetMap) {
  for (const [paletteKey, paletteHex] of Object.entries(paletteHexByKey)) {
    if (hexMatchesPalette(valueHex, paletteHex)) {
      appendUnique(targetMap[paletteKey], [targetName]);
    }
  }
}

function buildVscodeValueTargets(paletteHexByKey) {
  const targetMap = Object.fromEntries(requiredKeys.map((key) => [key, []]));

  try {
    const theme = JSON.parse(fs.readFileSync(vscodeThemePath, "utf8"));

    const colors = theme && typeof theme.colors === "object" ? theme.colors : {};
    for (const [colorKey, colorValue] of Object.entries(colors)) {
      const normalizedHex = tryNormalizeHex(colorValue);
      if (!normalizedHex) {
        continue;
      }

      mapHexValueToPaletteTargets(normalizedHex, paletteHexByKey, `colors.${colorKey}`, targetMap);
    }

    const tokenColors = Array.isArray(theme.tokenColors) ? theme.tokenColors : [];
    for (const tokenRule of tokenColors) {
      if (!tokenRule || typeof tokenRule !== "object") {
        continue;
      }

      const normalizedHex = tryNormalizeHex(tokenRule?.settings?.foreground);
      if (!normalizedHex) {
        continue;
      }

      const tokenRuleName =
        typeof tokenRule.name === "string" && tokenRule.name.trim()
          ? tokenRule.name.trim()
          : "unnamed";

      mapHexValueToPaletteTargets(normalizedHex, paletteHexByKey, `tokenColors.${tokenRuleName}`, targetMap);
    }

    const semanticTokenColors =
      theme && typeof theme.semanticTokenColors === "object" ? theme.semanticTokenColors : {};
    for (const [tokenName, tokenValue] of Object.entries(semanticTokenColors)) {
      const normalizedHex = extractSemanticTokenForeground(tokenValue);
      if (!normalizedHex) {
        continue;
      }

      mapHexValueToPaletteTargets(
        normalizedHex,
        paletteHexByKey,
        `semanticTokenColors.${tokenName}`,
        targetMap
      );
    }
  } catch {
    // Keep explicit mappings available even when value-correlation sources are unavailable.
  }

  return targetMap;
}

function buildVisualStudioValueTargets(paletteHexByKey) {
  const targetMap = Object.fromEntries(requiredKeys.map((key) => [key, []]));
  const paletteVsArgbByKey = Object.fromEntries(
    Object.entries(paletteHexByKey).map(([key, hex]) => [key, toVsArgb(hex)])
  );

  try {
    const xml = fs.readFileSync(visualStudioThemePath, "utf8");
    const colorBlockPattern = /<Color\s+Name="([^"]+)">([\s\S]*?)<\/Color>/gi;

    let colorMatch;
    while ((colorMatch = colorBlockPattern.exec(xml)) !== null) {
      const colorName = colorMatch[1];
      const block = colorMatch[2];
      const sourcePattern = /<(Foreground|Background)\b[^>]*\bSource="([0-9A-Fa-f]{8})"/gi;

      let sourceMatch;
      while ((sourceMatch = sourcePattern.exec(block)) !== null) {
        const colorKind = sourceMatch[1];
        const sourceArgb = sourceMatch[2].toUpperCase();

        for (const [paletteKey, paletteArgb] of Object.entries(paletteVsArgbByKey)) {
          if (paletteArgb === sourceArgb) {
            appendUnique(targetMap[paletteKey], [`${colorKind}.${colorName}`]);
          }
        }
      }
    }
  } catch {
    // Keep explicit mappings available even when value-correlation sources are unavailable.
  }

  return targetMap;
}

function buildPaletteTargets(palette) {
  const paletteHexByKey = Object.fromEntries(
    requiredKeys.map((key) => [key, normalizeHex(palette[key])])
  );

  const riderTargets = reverseMapByPalette(riderForegroundMappings);
  const visualStudioTargets = reverseMapByPalette(visualStudioForegroundMappings);
  const vscodeSemanticTargets = reverseMapByPalette(vscodeSemanticTokenMap);
  const vscodeTokenRuleTargets = reverseMapByPalette(vscodeTokenRuleMap);
  const vscodeValueTargets = buildVscodeValueTargets(paletteHexByKey);
  const visualStudioValueTargets = buildVisualStudioValueTargets(paletteHexByKey);

  const vscodeSupplementalTargets = {};
  for (const rule of vscodeSupplementalTokenRules) {
    if (!vscodeSupplementalTargets[rule.paletteKey]) {
      vscodeSupplementalTargets[rule.paletteKey] = [];
    }

    appendUnique(vscodeSupplementalTargets[rule.paletteKey], [rule.name]);
  }

  const result = {};

  for (const paletteKey of requiredKeys) {
    const riderKeys = [`colors.${paletteKey}`];
    appendUnique(riderKeys, riderTargets[paletteKey] || []);

    const visualStudioKeys = [];
    appendUnique(visualStudioKeys, visualStudioTargets[paletteKey] || []);
    appendUnique(visualStudioKeys, visualStudioValueTargets[paletteKey] || []);

    const vscodeKeys = [];
    appendUnique(vscodeKeys, vscodeSemanticTargets[paletteKey] || []);
    appendUnique(vscodeKeys, vscodeTokenRuleTargets[paletteKey] || []);
    appendUnique(vscodeKeys, vscodeSupplementalTargets[paletteKey] || []);
    appendUnique(vscodeKeys, vscodeValueTargets[paletteKey] || []);

    result[paletteKey] = {
      rider: riderKeys,
      visualStudio: visualStudioKeys,
      vscode: vscodeKeys
    };
  }

  return result;
}

const previewMappings = buildPreviewMappings();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(text);
}

function readPalette() {
  return JSON.parse(fs.readFileSync(palettePath, "utf8"));
}

function readVersionConfig() {
  return JSON.parse(fs.readFileSync(versionPath, "utf8"));
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

function normalizeSharedVersion(value) {
  if (typeof value !== "string") {
    throw new Error(`Expected version string but got ${typeof value}`);
  }

  const version = value.trim();
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid version value: ${value}`);
  }

  return version;
}

function readSharedVersion() {
  const config = readVersionConfig();

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("version.json must be a JSON object with a string 'version' field");
  }

  if (!("version" in config)) {
    throw new Error("version.json is missing required key: version");
  }

  return normalizeSharedVersion(config.version);
}

function validatePalette(palette) {
  const normalized = {};
  for (const key of requiredKeys) {
    if (!(key in palette)) {
      throw new Error(`Missing palette key: ${key}`);
    }
    normalized[key] = normalizeHex(palette[key]);
  }
  for (const key of Object.keys(palette)) {
    if (!requiredKeys.includes(key)) {
      throw new Error(`Unexpected palette key: ${key}`);
    }
  }
  return normalized;
}

function writePalette(palette) {
  fs.writeFileSync(palettePath, `${JSON.stringify(palette, null, 2)}\n`, "utf8");
}

function writeSharedVersion(version) {
  const normalizedVersion = normalizeSharedVersion(version);
  fs.writeFileSync(versionPath, `${JSON.stringify({ version: normalizedVersion }, null, 2)}\n`, "utf8");
  return normalizedVersion;
}

function runSyncScript() {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [syncScriptPath], { cwd: rootDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }
      resolve((stdout || "").trim());
    });
  });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  let requestPath = req.url || "/";
  if (requestPath === "/") {
    requestPath = "/index.html";
  }

  const safePath = path.normalize(requestPath).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8"
  }[ext] || "application/octet-stream";

  sendText(res, 200, fs.readFileSync(filePath), contentType);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/palette") {
      const palette = readPalette();
      const version = readSharedVersion();
      const paletteTargets = buildPaletteTargets(palette);
      sendJson(res, 200, { palette, version, previewMappings, paletteTargets });
      return;
    }

    if (req.method === "POST" && req.url === "/api/palette") {
      const raw = await readRequestBody(req);
      const parsed = JSON.parse(raw || "{}");
      const palette = validatePalette(parsed.palette || {});
      const version = writeSharedVersion(parsed.version);
      writePalette(palette);
      const syncOutput = await runSyncScript();
      sendJson(res, 200, { ok: true, version, message: syncOutput || "Palette saved and synced." });
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }

    sendText(res, 405, "Method not allowed");
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Theme generator running at http://localhost:${port}`);
});
