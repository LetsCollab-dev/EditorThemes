const statusEl = document.getElementById("status");
const gridEl = document.getElementById("grid");
const formEl = document.getElementById("palette-form");
const reloadBtn = document.getElementById("reload");
const resetBtn = document.getElementById("reset");
const versionInputEl = document.getElementById("theme-version");
const previewPaneEl = document.getElementById("preview-pane");
const previewCodeEl = document.getElementById("preview-code");
const previewTargetEl = document.getElementById("preview-target");
const previewMappingEl = document.getElementById("preview-mapping");

let loadedPalette = null;
let loadedVersion = "";
let previewMappings = {};
let paletteTargets = {};
let activePicker = null;
const paletteFieldControls = new Map();

const fallbackPreviewMappings = {
  rider: {
    label: "Rider",
    source: "Rider editor scheme options",
    tokens: {
      preprocessor: "syntaxPreprocessor",
      keyword: "syntaxKeyword",
      class: "syntaxClass",
      interface: "syntaxInterface",
      enum: "syntaxEnum",
      struct: "syntaxStruct",
      typeParameter: "syntaxTypeParameter",
      property: "syntaxProperty",
      method: "syntaxMethod",
      function: "syntaxFunction",
      parameter: "syntaxParameter",
      variable: "syntaxVariable",
      constant: "syntaxConstant",
      number: "syntaxNumber",
      string: "syntaxString",
      operator: "syntaxOperator",
      comment: "syntaxComment",
      docComment: "syntaxDocComment",
      docTag: "syntaxDocTag"
    }
  },
  visualStudio: {
    label: "Visual Studio",
    source: "Visual Studio classification foreground names",
    tokens: {
      preprocessor: "syntaxPreprocessor",
      keyword: "syntaxKeyword",
      class: "syntaxClass",
      interface: "syntaxInterface",
      enum: "syntaxEnum",
      struct: "syntaxStruct",
      typeParameter: "syntaxTypeParameter",
      property: "syntaxProperty",
      method: "syntaxMethod",
      function: "syntaxFunction",
      parameter: "syntaxParameter",
      variable: "syntaxVariable",
      constant: "syntaxConstant",
      number: "syntaxNumber",
      string: "syntaxString",
      operator: "syntaxOperator",
      comment: "syntaxComment",
      docComment: "syntaxDocComment",
      docTag: "syntaxDocTag"
    }
  },
  vscode: {
    label: "VS Code",
    source: "VS Code semantic tokens and token color rules",
    tokens: {
      preprocessor: "syntaxPreprocessor",
      keyword: "syntaxKeyword",
      class: "syntaxClass",
      interface: "syntaxInterface",
      enum: "syntaxEnum",
      struct: "syntaxStruct",
      typeParameter: "syntaxTypeParameter",
      property: "syntaxProperty",
      method: "syntaxMethod",
      function: "syntaxFunction",
      parameter: "syntaxParameter",
      variable: "syntaxVariable",
      constant: "syntaxConstant",
      number: "syntaxNumber",
      string: "syntaxString",
      operator: "syntaxOperator",
      comment: "syntaxComment",
      docComment: "syntaxDocComment",
      docTag: "syntaxDocTag"
    }
  }
};

const sampleCSharpHtml = `
<span data-token="preprocessor">#nullable enable</span>
<span data-token="keyword">using</span> <span data-token="class">System</span>;
<span data-token="keyword">using</span> <span data-token="class">System.Collections.Generic</span>;

<span data-token="keyword">namespace</span> <span data-token="class">LetsCollab.Preview</span>
{
    <span data-token="docComment">/// </span><span data-token="docTag">&lt;summary&gt;</span><span data-token="docComment">Theme preview model.</span><span data-token="docTag">&lt;/summary&gt;</span>
    <span data-token="keyword">public</span> <span data-token="keyword">interface</span> <span data-token="interface">IRenderer</span>&lt;<span data-token="typeParameter">TTheme</span>&gt;
    {
        <span data-token="class">string</span> <span data-token="property">Name</span> { <span data-token="keyword">get</span>; }
        <span data-token="keyword">void</span> <span data-token="method">Render</span>(<span data-token="typeParameter">TTheme</span> <span data-token="parameter">theme</span>, <span data-token="class">int</span> <span data-token="parameter">repeatCount</span> <span data-token="operator">=</span> <span data-token="number">2</span>);
    }

    <span data-token="keyword">public</span> <span data-token="keyword">enum</span> <span data-token="enum">RenderMode</span> { <span data-token="constant">Fast</span> <span data-token="operator">=</span> <span data-token="number">1</span>, <span data-token="constant">Accurate</span> <span data-token="operator">=</span> <span data-token="number">2</span> }

    <span data-token="keyword">public</span> <span data-token="keyword">readonly</span> <span data-token="keyword">struct</span> <span data-token="struct">ConsoleRenderer</span> <span data-token="operator">:</span> <span data-token="interface">IRenderer</span>&lt;<span data-token="enum">RenderMode</span>&gt;
    {
        <span data-token="keyword">private</span> <span data-token="keyword">const</span> <span data-token="class">string</span> <span data-token="constant">Banner</span> <span data-token="operator">=</span> <span data-token="string">"LetsCollab"</span>;
        <span data-token="keyword">public</span> <span data-token="class">string</span> <span data-token="property">Name</span> <span data-token="operator">=&gt;</span> <span data-token="string">"Console"</span>;

        <span data-token="keyword">public</span> <span data-token="keyword">void</span> <span data-token="method">Render</span>(<span data-token="enum">RenderMode</span> <span data-token="parameter">theme</span>, <span data-token="class">int</span> <span data-token="parameter">repeatCount</span>)
        {
            <span data-token="comment">// Local function sample for syntaxFunction mapping.</span>
            <span data-token="class">string</span> <span data-token="function">FormatLine</span>(<span data-token="class">int</span> <span data-token="parameter">index</span>) <span data-token="operator">=&gt;</span> <span data-token="string">$"{Banner} {Name}: {theme} [{index}]"</span>;

            <span data-token="keyword">for</span> (<span data-token="keyword">var</span> <span data-token="variable">index</span> <span data-token="operator">=</span> <span data-token="number">0</span>; <span data-token="variable">index</span> <span data-token="operator">&lt;</span> <span data-token="parameter">repeatCount</span>; <span data-token="variable">index</span><span data-token="operator">++</span>)
            {
                <span data-token="class">Console</span>.<span data-token="method">WriteLine</span>(<span data-token="function">FormatLine</span>(<span data-token="variable">index</span>));
            }
        }
    }
}
`;

previewCodeEl.innerHTML = sampleCSharpHtml.trim();

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.borderColor = isError ? "#dd3962" : "#3f3f3f";
}

function toUpperHex(hex) {
  return String(hex || "").trim().toLowerCase();
}

function splitHex(hex) {
  const normalized = toUpperHex(hex);
  const base = normalized.slice(0, 7);
  const alpha = normalized.length === 9 ? normalized.slice(7, 9) : "";
  return { base, alpha };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isValidHex(value) {
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(value);
}

function normalizeVersion(value) {
  const version = String(value || "").trim();
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid version value: ${value}`);
  }

  return version;
}

function hexToRgb(hex) {
  const normalized = toUpperHex(hex);
  if (!/^#[0-9a-f]{6}$/.test(normalized)) {
    throw new Error(`Invalid base hex color: ${hex}`);
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
}

function rgbToHex(rgb) {
  const toHexPart = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHexPart(rgb.r)}${toHexPart(rgb.g)}${toHexPart(rgb.b)}`;
}

function rgbToHsb(rgb) {
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * (((blue - red) / delta) + 2);
    } else {
      hue = 60 * (((red - green) / delta) + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation = max === 0 ? 0 : (delta / max) * 100;
  const brightness = max * 100;

  return {
    h: clamp(Math.round(hue), 0, 360),
    s: clamp(Math.round(saturation), 0, 100),
    b: clamp(Math.round(brightness), 0, 100)
  };
}

function hsbToRgb(hsb) {
  const hue = ((hsb.h % 360) + 360) % 360;
  const saturation = clamp(hsb.s, 0, 100) / 100;
  const brightness = clamp(hsb.b, 0, 100) / 100;

  const chroma = brightness * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = brightness - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255)
  };
}

function hexToHsb(baseHex) {
  return rgbToHsb(hexToRgb(baseHex));
}

function hsbToHex(hsb) {
  return rgbToHex(hsbToRgb(hsb));
}

function createHsbControl(labelText, min, max, value) {
  const wrap = document.createElement("div");
  wrap.className = "hsb-row";

  const label = document.createElement("label");
  label.textContent = labelText;

  const inputRow = document.createElement("div");
  inputRow.className = "hsb-input-row";

  const range = document.createElement("input");
  range.type = "range";
  range.min = String(min);
  range.max = String(max);
  range.step = "1";
  range.value = String(value);

  const number = document.createElement("input");
  number.type = "number";
  number.min = String(min);
  number.max = String(max);
  number.step = "1";
  number.value = String(value);

  inputRow.appendChild(range);
  inputRow.appendChild(number);
  wrap.appendChild(label);
  wrap.appendChild(inputRow);

  return { wrap, range, number };
}

function normalizePreviewMappings(source) {
  const normalized = {};
  const input = source && typeof source === "object" ? source : {};

  for (const editorKey of Object.keys(fallbackPreviewMappings)) {
    const fallback = fallbackPreviewMappings[editorKey];
    const provided = input[editorKey] && typeof input[editorKey] === "object" ? input[editorKey] : {};
    const providedTokens =
      provided.tokens && typeof provided.tokens === "object" ? provided.tokens : {};
    const fallbackTokenTargets =
      fallback.tokenTargets && typeof fallback.tokenTargets === "object" ? fallback.tokenTargets : {};
    const providedTokenTargets =
      provided.tokenTargets && typeof provided.tokenTargets === "object" ? provided.tokenTargets : {};

    normalized[editorKey] = {
      label: typeof provided.label === "string" ? provided.label : fallback.label,
      source: typeof provided.source === "string" ? provided.source : fallback.source,
      tokens: {
        ...fallback.tokens,
        ...providedTokens
      },
      tokenTargets: {
        ...fallbackTokenTargets,
        ...providedTokenTargets
      }
    };
  }

  return normalized;
}

function normalizePaletteTargets(source, palette) {
  const normalized = {};
  const input = source && typeof source === "object" ? source : {};
  const paletteKeys = palette && typeof palette === "object" ? Object.keys(palette) : [];

  for (const paletteKey of paletteKeys) {
    const entry = input[paletteKey] && typeof input[paletteKey] === "object" ? input[paletteKey] : {};
    normalized[paletteKey] = {
      rider: normalizeTargetNames(entry.rider),
      visualStudio: normalizeTargetNames(entry.visualStudio),
      vscode: normalizeTargetNames(entry.vscode)
    };
  }

  return normalized;
}

function summarizeTargetNames(names, maxItems = 8) {
  const unique = [];
  for (const name of names) {
    if (!unique.includes(name)) {
      unique.push(name);
    }
  }

  if (unique.length === 0) {
    return "No explicit mapped keys";
  }

  if (unique.length <= maxItems) {
    return unique.join(", ");
  }

  return `${unique.slice(0, maxItems).join(", ")}, +${unique.length - maxItems} more`;
}

function buildPaletteNameTooltip(paletteKey, paletteValue) {
  const entry = paletteTargets[paletteKey] || {};
  return [
    `Shared color: ${paletteKey} (${paletteValue})`,
    `Rider key(s): ${summarizeTargetNames(normalizeTargetNames(entry.rider))}`,
    `Visual Studio key(s): ${summarizeTargetNames(normalizeTargetNames(entry.visualStudio))}`,
    `VS Code key(s): ${summarizeTargetNames(normalizeTargetNames(entry.vscode))}`
  ].join("\n");
}

function getActivePreviewMapping() {
  const selectedKey = previewTargetEl.value;
  return previewMappings[selectedKey] || fallbackPreviewMappings[selectedKey] || fallbackPreviewMappings.rider;
}

function getPaletteKeyForToken(tokenName) {
  if (!tokenName) {
    return "fg";
  }

  const mapping = getActivePreviewMapping();
  return mapping.tokens[tokenName] || "fg";
}

function normalizeTargetNames(value) {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function getTargetColorNamesForToken(tokenName) {
  const mapping = getActivePreviewMapping();
  const names = normalizeTargetNames(mapping.tokenTargets?.[tokenName]);
  if (names.length > 0) {
    return names;
  }

  if (!tokenName) {
    return ["Editor foreground"];
  }

  return [tokenName];
}

function applyPreviewTokenColors(palette) {
  const mapping = getActivePreviewMapping();
  previewMappingEl.textContent = `${mapping.label} syntax mapping from ${mapping.source}.`;
  const fallbackValue = palette.fg || "#d0d0d9";
  const fallbackTargets = getTargetColorNamesForToken("").join(", ");
  previewCodeEl.title = `Shared color: fg (${fallbackValue})\n${mapping.label} target color(s): ${fallbackTargets}`;

  for (const tokenEl of previewCodeEl.querySelectorAll("[data-token]")) {
    const tokenName = tokenEl.dataset.token;
    const paletteKey = getPaletteKeyForToken(tokenName);
    const paletteValue = palette[paletteKey] || fallbackValue;
    const targetNames = getTargetColorNamesForToken(tokenName).join(", ");
    tokenEl.style.color = paletteValue;
    tokenEl.title = `Shared color: ${paletteKey} (${paletteValue})\n${mapping.label} target color(s): ${targetNames}`;
  }
}

function closeActivePicker() {
  if (!activePicker) {
    return;
  }

  activePicker.popover.hidden = true;
  activePicker.toggleBtn.setAttribute("aria-expanded", "false");
  activePicker = null;
}

function openPicker(toggleBtn, popover) {
  if (activePicker && activePicker.popover === popover) {
    closeActivePicker();
    return;
  }

  closeActivePicker();
  popover.hidden = false;
  toggleBtn.setAttribute("aria-expanded", "true");
  activePicker = { toggleBtn, popover };
}

function revealPaletteField(paletteKey) {
  const control = paletteFieldControls.get(paletteKey);
  if (!control) {
    return false;
  }

  control.card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  openPicker(control.pickerBtn, control.pickerPopover);

  control.card.classList.remove("card-jump-highlight");
  // Force reflow so repeated clicks retrigger the animation.
  void control.card.offsetWidth;
  control.card.classList.add("card-jump-highlight");

  control.text.focus({ preventScroll: true });
  control.text.select();
  return true;
}

function buildField(key, value) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.paletteKey = key;

  const field = document.createElement("div");
  field.className = "field";

  const row = document.createElement("div");
  row.className = "row";

  const keyLabel = document.createElement("span");
  keyLabel.className = "palette-key";
  keyLabel.textContent = key;
  keyLabel.title = key;

  const text = document.createElement("input");
  text.type = "text";
  text.name = key;
  text.value = value;
  text.pattern = "^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$";
  text.setAttribute("aria-label", `${key} hex color value`);

  const pickerBtn = document.createElement("button");
  pickerBtn.type = "button";
  pickerBtn.className = "picker-toggle";
  pickerBtn.title = `Open color picker for ${key}`;
  pickerBtn.setAttribute("aria-label", `Open color picker for ${key}`);
  pickerBtn.setAttribute("aria-expanded", "false");

  const pickerPopover = document.createElement("div");
  pickerPopover.className = "picker-popover";
  pickerPopover.hidden = true;

  const pickerTitle = document.createElement("p");
  pickerTitle.className = "picker-popover-title";
  pickerTitle.textContent = "Color Picker";
  pickerPopover.appendChild(pickerTitle);

  const initialParts = splitHex(value);
  let baseHex = initialParts.base;
  let hasExplicitAlpha = initialParts.alpha.length === 2;
  const initialAlphaByte = hasExplicitAlpha ? Number.parseInt(initialParts.alpha, 16) : 255;

  pickerBtn.style.background = baseHex;

  function syncPaletteNameTooltip() {
    keyLabel.title = buildPaletteNameTooltip(key, toUpperHex(text.value));
  }

  row.appendChild(keyLabel);
  row.appendChild(text);
  row.appendChild(pickerBtn);

  const initialHsb = hexToHsb(baseHex);
  const hueControl = createHsbControl("Hue", 0, 360, initialHsb.h);
  const saturationControl = createHsbControl("Saturation", 0, 100, initialHsb.s);
  const brightnessControl = createHsbControl("Brightness", 0, 100, initialHsb.b);
  const alphaControl = createHsbControl("Alpha", 0, 100, Math.round((initialAlphaByte / 255) * 100));

  pickerPopover.appendChild(hueControl.wrap);
  pickerPopover.appendChild(saturationControl.wrap);
  pickerPopover.appendChild(brightnessControl.wrap);
  pickerPopover.appendChild(alphaControl.wrap);

  function syncControl(control, nextValue) {
    const min = Number(control.range.min);
    const max = Number(control.range.max);
    const normalized = String(clamp(Math.round(nextValue), min, max));
    control.range.value = normalized;
    control.number.value = normalized;
  }

  function syncPickerControlsFromParts(parts) {
    baseHex = parts.base;
    const hsb = hexToHsb(baseHex);
    syncControl(hueControl, hsb.h);
    syncControl(saturationControl, hsb.s);
    syncControl(brightnessControl, hsb.b);
    const alphaByte = parts.alpha ? Number.parseInt(parts.alpha, 16) : 255;
    syncControl(alphaControl, Math.round((alphaByte / 255) * 100));
    pickerBtn.style.background = baseHex;
  }

  function composeHexValue() {
    const alphaPercent = Number(alphaControl.range.value);
    const alphaByte = Math.round((clamp(alphaPercent, 0, 100) / 100) * 255);
    const alphaHex = alphaByte.toString(16).padStart(2, "0");
    const includeAlpha = hasExplicitAlpha || alphaByte < 255;
    return `${baseHex}${includeAlpha ? alphaHex : ""}`;
  }

  function applyPickerToText() {
    baseHex = hsbToHex({
      h: Number(hueControl.range.value),
      s: Number(saturationControl.range.value),
      b: Number(brightnessControl.range.value)
    });

    if (Number(alphaControl.range.value) < 100) {
      hasExplicitAlpha = true;
    }

    pickerBtn.style.background = baseHex;
    text.value = composeHexValue();
    syncPaletteNameTooltip();
    renderPreview(readFormPalette());
  }

  function bindPickerControl(control) {
    control.range.addEventListener("input", () => {
      control.number.value = control.range.value;
      applyPickerToText();
    });

    control.number.addEventListener("input", () => {
      const parsed = Number(control.number.value);
      if (Number.isNaN(parsed)) {
        return;
      }

      syncControl(control, parsed);
      applyPickerToText();
    });
  }

  bindPickerControl(hueControl);
  bindPickerControl(saturationControl);
  bindPickerControl(brightnessControl);
  bindPickerControl(alphaControl);

  pickerBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openPicker(pickerBtn, pickerPopover);
  });

  pickerPopover.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  text.addEventListener("input", () => {
    const valueNow = toUpperHex(text.value);
    if (isValidHex(valueNow)) {
      const parts = splitHex(valueNow);
      hasExplicitAlpha = parts.alpha.length === 2;
      syncPickerControlsFromParts(parts);
    }
    syncPaletteNameTooltip();
    renderPreview(readFormPalette());
  });

  syncPickerControlsFromParts(initialParts);
  syncPaletteNameTooltip();

  field.appendChild(row);
  field.appendChild(pickerPopover);
  card.appendChild(field);
  card.addEventListener("animationend", () => {
    card.classList.remove("card-jump-highlight");
  });

  paletteFieldControls.set(key, {
    card,
    text,
    pickerBtn,
    pickerPopover
  });

  gridEl.appendChild(card);
}

function renderGrid(palette) {
  closeActivePicker();
  gridEl.innerHTML = "";
  paletteFieldControls.clear();
  Object.entries(palette).forEach(([key, value]) => buildField(key, value));
}

function readFormPalette() {
  const values = {};
  for (const input of gridEl.querySelectorAll("input[type='text'][name]")) {
    values[input.name] = toUpperHex(input.value);
  }
  return values;
}

function renderPreview(palette) {
  document.documentElement.style.setProperty("--bg", palette.bg || "#090909");
  document.documentElement.style.setProperty("--text", palette.fg || "#d0d0d9");
  document.documentElement.style.setProperty("--muted", palette.secondFg || "#96969d");
  document.documentElement.style.setProperty("--accent", palette.accent || "#35a348");
  document.documentElement.style.setProperty("--border", palette.border || "#3f3f3f");

  previewPaneEl.style.borderColor = palette.border || "#3f3f3f";
  previewCodeEl.style.background = palette.bg || "#090909";
  previewCodeEl.style.color = palette.fg || "#d0d0d9";

  applyPreviewTokenColors(palette);
}

async function loadPalette() {
  setStatus("Loading palette...");
  const res = await fetch("/api/palette");
  const data = await res.json();
  loadedPalette = data.palette;
  loadedVersion = normalizeVersion(data.version);
  versionInputEl.value = loadedVersion;
  previewMappings = normalizePreviewMappings(data.previewMappings);
  paletteTargets = normalizePaletteTargets(data.paletteTargets, loadedPalette);
  renderGrid(loadedPalette);
  renderPreview(loadedPalette);
  setStatus("Palette loaded.");
}

reloadBtn.addEventListener("click", async () => {
  try {
    await loadPalette();
  } catch (error) {
    setStatus(`Reload failed: ${error.message}`, true);
  }
});

resetBtn.addEventListener("click", () => {
  if (!loadedPalette) {
    return;
  }

  versionInputEl.value = loadedVersion;
  renderGrid(loadedPalette);
  renderPreview(loadedPalette);
  setStatus("Reset to last loaded values.");
});

document.addEventListener("click", () => {
  closeActivePicker();
});

previewTargetEl.addEventListener("change", () => {
  renderPreview(readFormPalette());
});

previewCodeEl.addEventListener("click", (event) => {
  const target = event.target;
  const tokenEl = target instanceof Element ? target.closest("[data-token]") : null;
  const tokenName = tokenEl?.dataset.token;
  const paletteKey = getPaletteKeyForToken(tokenName);
  const didReveal = revealPaletteField(paletteKey);

  if (didReveal) {
    event.stopPropagation();
  }
});

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const palette = readFormPalette();
  const version = normalizeVersion(versionInputEl.value);

  setStatus("Saving and syncing themes...");

  try {
    const res = await fetch("/api/palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palette, version })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Unknown save error");
    }

    loadedPalette = palette;
    loadedVersion = version;
    versionInputEl.value = loadedVersion;
    renderPreview(loadedPalette);
    setStatus(`Saved. ${data.message}`);
  } catch (error) {
    setStatus(`Save failed: ${error.message}`, true);
  }
});

loadPalette().catch((error) => {
  setStatus(`Initial load failed: ${error.message}`, true);
});
