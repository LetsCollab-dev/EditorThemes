const statusEl = document.getElementById("status");
const gridEl = document.getElementById("grid");
const formEl = document.getElementById("palette-form");
const reloadBtn = document.getElementById("reload");
const resetBtn = document.getElementById("reset");
const previewCard = document.getElementById("preview-card");

let loadedPalette = null;

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

function buildField(key, value) {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = key;

  const field = document.createElement("div");
  field.className = "field";

  const row = document.createElement("div");
  row.className = "row";

  const text = document.createElement("input");
  text.type = "text";
  text.name = key;
  text.value = value;
  text.pattern = "^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$";

  const color = document.createElement("input");
  color.type = "color";
  color.value = splitHex(value).base;

  row.appendChild(text);
  row.appendChild(color);

  const alphaWrap = document.createElement("div");
  alphaWrap.className = "field";

  const alphaLabel = document.createElement("label");
  alphaLabel.textContent = "Alpha (optional 00-FF)";

  const alphaInput = document.createElement("input");
  alphaInput.type = "text";
  alphaInput.maxLength = 2;
  alphaInput.placeholder = "ff";
  alphaInput.value = splitHex(value).alpha;

  alphaWrap.appendChild(alphaLabel);
  alphaWrap.appendChild(alphaInput);

  color.addEventListener("input", () => {
    const alpha = alphaInput.value.trim();
    text.value = `${color.value}${alpha ? alpha : ""}`;
    renderPreview(readFormPalette());
  });

  alphaInput.addEventListener("input", () => {
    alphaInput.value = alphaInput.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 2);
    text.value = `${color.value}${alphaInput.value}`;
    renderPreview(readFormPalette());
  });

  text.addEventListener("input", () => {
    const valueNow = toUpperHex(text.value);
    if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(valueNow)) {
      const parts = splitHex(valueNow);
      color.value = parts.base;
      alphaInput.value = parts.alpha;
    }
    renderPreview(readFormPalette());
  });

  field.appendChild(row);
  field.appendChild(alphaWrap);
  card.appendChild(title);
  card.appendChild(field);
  gridEl.appendChild(card);
}

function renderGrid(palette) {
  gridEl.innerHTML = "";
  Object.entries(palette).forEach(([key, value]) => buildField(key, value));
}

function readFormPalette() {
  const values = {};
  for (const input of formEl.querySelectorAll("input[type='text'][name]")) {
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

  previewCard.style.background = palette.bg || "#090909";
  previewCard.style.borderColor = palette.border || "#3f3f3f";
  previewCard.style.color = palette.fg || "#d0d0d9";
}

async function loadPalette() {
  setStatus("Loading palette...");
  const res = await fetch("/api/palette");
  const data = await res.json();
  loadedPalette = data.palette;
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
  renderGrid(loadedPalette);
  renderPreview(loadedPalette);
  setStatus("Reset to last loaded values.");
});

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const palette = readFormPalette();

  setStatus("Saving and syncing themes...");

  try {
    const res = await fetch("/api/palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palette })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Unknown save error");
    }

    loadedPalette = palette;
    setStatus(`Saved. ${data.message}`);
  } catch (error) {
    setStatus(`Save failed: ${error.message}`, true);
  }
});

loadPalette().catch((error) => {
  setStatus(`Initial load failed: ${error.message}`, true);
});
