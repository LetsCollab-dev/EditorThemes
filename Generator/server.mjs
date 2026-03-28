#!/usr/bin/env node
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(__dirname, "public");
const palettePath = path.join(rootDir, "theme", "palette.json");
const syncScriptPath = path.join(rootDir, "scripts", "sync-theme-palette.mjs");
const port = Number(process.env.PORT || 4173);

const requiredKeys = [
  "bg",
  "second",
  "fg",
  "secondFg",
  "selBg",
  "selFg",
  "border",
  "dis",
  "accent",
  "shadow",
  "deepBg",
  "white",
  "blue",
  "red",
  "yellow",
  "green",
  "gray",
  "purple",
  "orange",
  "error",
  "separator",
  "highlightFg",
  "scroll",
  "syntaxComment",
  "syntaxDocComment",
  "syntaxDocTag",
  "syntaxKeyword",
  "syntaxString",
  "syntaxNumber",
  "syntaxFunction",
  "syntaxMethod",
  "syntaxClass",
  "syntaxInterface",
  "syntaxEnum",
  "syntaxStruct",
  "syntaxTypeParameter",
  "syntaxVariable",
  "syntaxParameter",
  "syntaxProperty",
  "syntaxConstant",
  "syntaxOperator",
  "syntaxPreprocessor",
  "syntaxInvalid"
];

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
      sendJson(res, 200, { palette });
      return;
    }

    if (req.method === "POST" && req.url === "/api/palette") {
      const raw = await readRequestBody(req);
      const parsed = JSON.parse(raw || "{}");
      const palette = validatePalette(parsed.palette || {});
      writePalette(palette);
      const syncOutput = await runSyncScript();
      sendJson(res, 200, { ok: true, message: syncOutput || "Palette saved and synced." });
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
