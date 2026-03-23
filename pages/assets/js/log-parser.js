/**
 * FS25 Log Parser  - client-side log sanitization and analysis
 * Runs entirely in the browser. No data leaves the page.
 */
(function () {
  "use strict";

  // Only init on the log parser page
  function init() {
    const app = document.getElementById("log-parser-app");
    if (!app) return;

    // Inject toast element
    if (!document.getElementById("lp-toast")) {
      const toast = document.createElement("div");
      toast.className = "lp-toast";
      toast.id = "lp-toast";
      document.body.appendChild(toast);
    }

    setupDropzone();
    setupTabs();
    setupToolbar();
  }

  // ─── State ───────────────────────────────────────────────────
  let parsedData = null;
  let sanitizedLines = [];
  let sanitizedText = "";

  // ─── Sanitization ──────────────────────────────────────────
  const PATH_PATTERNS = [
    /\/Users\/[^\/\s]+/g,
    /\/home\/[^\/\s]+/g,
    /[A-Z]:\\Users\\[^\\\/\s]+/gi,
    /[A-Z]:\/Users\/[^\/\s]+/gi,
    /[A-Z]:\\[^\\\/\s]+\\AppData/gi,
  ];

  function sanitizeLine(line) {
    let out = line;
    for (const pat of PATH_PATTERNS) {
      out = out.replace(pat, function (match) {
        if (match.includes("/Users/")) {
          const username = match.split("/Users/")[1];
          return match.replace(username, "<user>");
        }
        if (match.includes("/home/")) {
          const username = match.split("/home/")[1];
          return match.replace(username, "<user>");
        }
        if (match.includes("\\Users\\")) {
          const username = match.split("\\Users\\")[1];
          return match.replace(username, "<user>");
        }
        return match.replace(/[^\/\\]+$/, "<user>");
      });
    }
    return out;
  }

  // ─── Parsing ───────────────────────────────────────────────
  function parseLog(text) {
    var lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var data = {
      engine: null,
      gameVersion: null,
      os: null,
      cpu: null,
      memory: null,
      gpu: null,
      renderDriver: null,
      timestamp: null,
      language: null,
      modDescVersion: null,
      cheats: null,
      multiplayer: false,
      startParams: [],
      mods: [],
      dlcs: [],
      loadedMods: new Set(),
      loadedDlcs: new Set(),
      errors: [],
      warnings: [],
      perfWarnings: [],
      savegameSettings: [],
      hwProfile: null,
    };

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      var m;

      if (i === 0 && (m = trimmed.match(/GIANTS Engine Runtime ([\d.]+\s*\(\d+\))/))) {
        data.engine = m[1];
      }

      if ((m = trimmed.match(/CPU:\s*(.+)/))) data.cpu = m[1];
      if ((m = trimmed.match(/Memory:\s*(\d+)\s*MB/))) data.memory = m[1] + " MB";
      if ((m = trimmed.match(/OS:\s*(.+)/))) data.os = m[1];
      if ((m = trimmed.match(/Renderer:\s*(.+)/)) && !data.gpu) data.gpu = m[1];
      if ((m = trimmed.match(/Driver:\s*Metal\s*(.*)/)))
        data.renderDriver = "Metal " + m[1];
      else if ((m = trimmed.match(/Driver:\s*(Vulkan.*|Direct\s*3\s*D.*|OpenGL.*)/)))
        data.renderDriver = m[1];

      if ((m = trimmed.match(/Version:\s*(\d+\.\d+\.\d+\.\d+\s*b?\d*)/)) && !data.gameVersion) {
        data.gameVersion = m[1];
      }

      if (
        (m = trimmed.match(/Time:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/)) &&
        !data.timestamp
      ) {
        data.timestamp = m[1];
      }

      if ((m = trimmed.match(/^\s*Language:\s*(\w+)/)) && !data.language) {
        data.language = m[1];
      }

      if ((m = trimmed.match(/ModDesc Version:\s*(\d+)/))) data.modDescVersion = m[1];
      if ((m = trimmed.match(/Cheats:\s*(\w+)/))) data.cheats = m[1];
      if (trimmed.includes("Starting multiplayer")) data.multiplayer = true;

      if (trimmed.endsWith("Used Start Parameters:") && data.startParams.length === 0) {
        for (var sp = i + 1; sp < lines.length; sp++) {
          var spLine = lines[sp];
          var spTrimmed = spLine.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+\s*/, "").trim();
          if (spTrimmed && /^\s/.test(spLine.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+\s*/, ""))) {
            if (!/^(exe |name |profile )/i.test(spTrimmed)) {
              data.startParams.push(spTrimmed);
            }
          } else {
            break;
          }
        }
      }

      if ((m = trimmed.match(/Level:\s*(.+)\s*\(auto\)/))) data.hwProfile = m[1];
      else if (
        (m = trimmed.match(/Level:\s*(.+)/)) &&
        trimmed.includes("Level:") &&
        !data.hwProfile
      )
        data.hwProfile = m[1];

      if (
        (m = trimmed.match(
          /Available dlc:.*?\(Version:\s*([\d.]+)\)\s*(\w+)/
        ))
      ) {
        if (!data.dlcs.find(function (d) { return d.name === m[2]; })) {
          data.dlcs.push({ name: m[2], version: m[1] });
        }
      }

      if ((m = trimmed.match(/Load dlc:\s*(\w+)/))) {
        data.loadedDlcs.add(m[1]);
      }

      if (
        (m = trimmed.match(
          /Available mod:.*?\(Hash:\s*([a-f0-9]+)\).*?\(Version:\s*([\d.\-a-zA-Z]+)\)\s*(\S+)/
        ))
      ) {
        if (!data.mods.find(function (mod) { return mod.name === m[3]; })) {
          data.mods.push({ name: m[3], version: m[2], hash: m[1] });
        }
      }

      if ((m = trimmed.match(/Load mod:\s*(\S+)/))) {
        data.loadedMods.add(m[1]);
      }

      if (/\bError[:\s]/i.test(trimmed) && !trimmed.includes("console.error")) {
        var errLine = i + 1;
        var stack = [];
        while (i + 1 < lines.length) {
          var nextRaw = lines[i + 1];
          var nextTrimmed = nextRaw.trim();
          if (nextTrimmed.match(/LUA call stack:/i)) {
            stack.push(nextTrimmed);
            i++;
          } else if (nextTrimmed.charAt(0) === "=") {
            stack.push(nextTrimmed);
            i++;
          } else if (/\.lua:\d+:/.test(nextTrimmed)) {
            stack.push(nextTrimmed);
            i++;
          } else {
            break;
          }
        }
        data.errors.push({ line: errLine, text: trimmed, stack: stack });
      }

      if (/\bWarning\b/i.test(trimmed)) {
        if (/performance/i.test(trimmed)) {
          data.perfWarnings.push({ line: i + 1, text: trimmed });
        } else {
          data.warnings.push({ line: i + 1, text: trimmed });
        }
      }

      if ((m = trimmed.match(/Savegame Setting '([^']+)':\s*(.+)/))) {
        if (!data.savegameSettings.find(function (s) { return s.key === m[1]; })) {
          data.savegameSettings.push({ key: m[1], value: m[2] });
        }
      }

    }

    return data;
  }

  // ─── Rendering helpers ─────────────────────────────────────
  function esc(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function infoItem(label, value) {
    return (
      '<div class="lp-info-item"><div class="lp-info-label">' +
      esc(label) +
      '</div><div class="lp-info-value">' +
      esc(value || "\u2014") +
      "</div></div>"
    );
  }

  // ─── Summary tab ───────────────────────────────────────────
  function renderSummary(data) {
    var el = document.getElementById("lp-panel-summary");
    var html = "";

    // System card
    html +=
      '<div class="lp-card open"><div class="lp-card-header" onclick="window._lpToggle(this)">' +
      '<span class="lp-card-title"><span class="lp-dot" style="background:#56c8d8"></span>System &amp; Game</span>' +
      '<span class="lp-card-chevron">▶</span></div><div class="lp-card-body"><div class="lp-info-grid">' +
      infoItem("Game Version", data.gameVersion) +
      infoItem("Multiplayer", data.multiplayer ? "Yes" : "No") +
      infoItem("OS", data.os) +
      infoItem("CPU", data.cpu) +
      infoItem("Memory", data.memory) +
      infoItem("GPU", data.gpu) +
      infoItem("Render", data.renderDriver) +
      infoItem("HW Profile", data.hwProfile) +
      infoItem("Language", data.language) +
      infoItem("ModDesc", data.modDescVersion) +
      infoItem("Cheats", data.cheats) +
      infoItem("Session", data.timestamp) +
      (data.startParams.length > 0
        ? '<div class="lp-info-item lp-info-wide"><div class="lp-info-label">Start Params</div>' +
          '<div class="lp-info-value">' + esc(sanitizeLine(data.startParams.join(", "))) + "</div></div>"
        : "") +
      "</div></div></div>";

    // DLC card
    if (data.dlcs.length > 0) {
      data.dlcs.sort(function (a, b) { return a.name.localeCompare(b.name); });
      var loadedDlcCount = 0;
      data.dlcs.forEach(function (d) { if (data.loadedDlcs.has(d.name)) loadedDlcCount++; });
      html +=
        '<div class="lp-card"><div class="lp-card-header" onclick="window._lpToggle(this)">' +
        '<span class="lp-card-title"><span class="lp-dot" style="background:#a78bfa"></span>DLC</span>' +
        '<span class="lp-card-count">' + loadedDlcCount + " / " + data.dlcs.length + "</span>" +
        '<span class="lp-card-chevron">▶</span></div><div class="lp-card-body">' +
        '<table class="lp-mod-table"><thead><tr><th>Name</th><th>Version</th><th>Status</th></tr></thead><tbody>';
      data.dlcs.forEach(function (dlc) {
        var loaded = data.loadedDlcs.has(dlc.name);
        html +=
          "<tr><td><span class='lp-mod-name'>" + esc(dlc.name) +
          '</span></td><td class="lp-mod-version">' + esc(dlc.version) +
          "</td><td>" +
          (loaded
            ? '<span class="lp-mod-loaded">active</span>'
            : '<span class="lp-mod-notloaded">available</span>') +
          "</td></tr>";
      });
      html += "</tbody></table></div></div>";
    }

    // Mods card - loaded first
    var loadedMods = data.mods.filter(function (m) { return data.loadedMods.has(m.name); });
    var availableMods = data.mods.filter(function (m) { return !data.loadedMods.has(m.name); });
    var byName = function (a, b) { return a.name.localeCompare(b.name); };
    loadedMods.sort(byName);
    availableMods.sort(byName);
    html +=
      '<div class="lp-card open"><div class="lp-card-header" onclick="window._lpToggle(this)">' +
      '<span class="lp-card-title"><span class="lp-dot" style="background:#a78bfa"></span>Mods</span>' +
      '<span class="lp-card-count">' + loadedMods.length + " loaded / " + data.mods.length + " available</span>" +
      '<span class="lp-card-chevron">▶</span></div><div class="lp-card-body">' +
      '<table class="lp-mod-table"><thead><tr><th>Name</th><th>Version</th></tr></thead><tbody>';

    loadedMods.forEach(function (mod) {
      html +=
        "<tr><td><span class='lp-mod-name'>" + esc(mod.name) +
        '</span></td><td class="lp-mod-version">' + esc(mod.version) + "</td></tr>";
    });

    if (availableMods.length > 0) {
      html +=
        '<tr><td colspan="2" style="padding:0.6rem 0.5rem;color:var(--md-default-fg-color--lighter);font-size:0.75rem">' +
        availableMods.length + ' more available (not loaded)</td></tr>';
    }

    html += "</tbody></table></div></div>";

    // Savegame settings
    if (data.savegameSettings.length > 0) {
      html +=
        '<div class="lp-card"><div class="lp-card-header" onclick="window._lpToggle(this)">' +
        '<span class="lp-card-title"><span class="lp-dot" style="background:#3dd68c"></span>Savegame Settings</span>' +
        '<span class="lp-card-count">' + data.savegameSettings.length + "</span>" +
        '<span class="lp-card-chevron">▶</span></div><div class="lp-card-body"><div class="lp-info-grid">';
      data.savegameSettings.forEach(function (s) {
        html += infoItem(s.key, s.value);
      });
      html += "</div></div></div>";
    }

    el.innerHTML = html;
  }

  // ─── Errors tab ────────────────────────────────────────────
  function renderErrors(data) {
    var el = document.getElementById("lp-panel-errors");
    var countEl = document.getElementById("lp-issue-count");
    var total = data.errors.length + data.warnings.length + data.perfWarnings.length;
    countEl.textContent = total;

    if (total === 0) {
      el.innerHTML =
        '<div class="lp-card open"><div class="lp-card-body" style="padding:2rem;text-align:center;color:#3dd68c">' +
        '<div style="font-size:1.5rem;margin-bottom:0.5rem">✓</div>No errors or warnings found</div></div>';
      return;
    }

    var html = "";

    if (data.errors.length > 0) {
      html +=
        '<div class="lp-card open"><div class="lp-card-header" onclick="window._lpToggle(this)">' +
        '<span class="lp-card-title"><span class="lp-dot" style="background:#f06060"></span>Errors</span>' +
        '<span class="lp-card-count">' + data.errors.length + "</span>" +
        '<span class="lp-card-chevron">▶</span></div><div class="lp-card-body">';
      data.errors.forEach(function (e) {
        html +=
          '<div class="lp-log-line error"><span style="color:var(--md-default-fg-color--lighter);user-select:none">L' +
          e.line + " </span>" + esc(sanitizeLine(e.text)) + "</div>";
        if (e.stack && e.stack.length > 0) {
          html += '<div class="lp-callstack">';
          e.stack.forEach(function (frame) {
            html += '<div class="lp-log-line" style="color:var(--md-default-fg-color--light);font-size:0.7rem;padding-left:1.5rem">' +
              esc(sanitizeLine(frame)) + "</div>";
          });
          html += "</div>";
        }
      });
      html += "</div></div>";
    }

    if (data.warnings.length > 0) {
      html +=
        '<div class="lp-card open"><div class="lp-card-header" onclick="window._lpToggle(this)">' +
        '<span class="lp-card-title"><span class="lp-dot" style="background:#f0a050"></span>Warnings</span>' +
        '<span class="lp-card-count">' + data.warnings.length + "</span>" +
        '<span class="lp-card-chevron">▶</span></div><div class="lp-card-body">';
      data.warnings.forEach(function (e) {
        html +=
          '<div class="lp-log-line warning"><span style="color:var(--md-default-fg-color--lighter);user-select:none">L' +
          e.line + " </span>" + esc(sanitizeLine(e.text)) + "</div>";
      });
      html += "</div></div>";
    }

    if (data.perfWarnings.length > 0) {
      html +=
        '<div class="lp-card"><div class="lp-card-header" onclick="window._lpToggle(this)">' +
        '<span class="lp-card-title"><span class="lp-dot" style="background:#f0a050"></span>Performance Warnings</span>' +
        '<span class="lp-card-count">' + data.perfWarnings.length + "</span>" +
        '<span class="lp-card-chevron">▶</span></div><div class="lp-card-body">';
      data.perfWarnings.forEach(function (e) {
        html +=
          '<div class="lp-log-line warning"><span style="color:var(--md-default-fg-color--lighter);user-select:none">L' +
          e.line + " </span>" + esc(sanitizeLine(e.text)) + "</div>";
      });
      html += "</div></div>";
    }

    el.innerHTML = html;
  }

  // ─── Sanitized log tab ─────────────────────────────────────
  function renderLog() {
    var container = document.getElementById("lp-log-content");
    var filterEl = document.getElementById("lp-filter-errors");
    var filterErrors = filterEl ? filterEl.checked : false;

    var lines = sanitizedLines;
    if (filterErrors) {
      var filtered = [];
      for (var fi = 0; fi < lines.length; fi++) {
        if (/\b(Error|Warning)\b/i.test(lines[fi])) {
          filtered.push(lines[fi]);
          while (fi + 1 < lines.length) {
            var nextT = lines[fi + 1].trim();
            if (/LUA call stack/i.test(nextT) || nextT.charAt(0) === "=" || /\.lua:\d+:/.test(nextT)) {
              filtered.push(lines[++fi]);
            } else {
              break;
            }
          }
        }
      }
      lines = filtered;
    }

    // Text / regex filter
    var filterTextEl = document.getElementById("lp-filter-text");
    var filterValue = filterTextEl ? filterTextEl.value : "";
    if (filterValue) {
      var re;
      try {
        re = new RegExp(filterValue, "i");
        filterTextEl.classList.remove("lp-filter-invalid");
      } catch (e) {
        re = new RegExp(filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filterTextEl.classList.add("lp-filter-invalid");
      }
      lines = lines.filter(function (line) { return re.test(line); });
    } else if (filterTextEl) {
      filterTextEl.classList.remove("lp-filter-invalid");
    }

    var frag = document.createDocumentFragment();
    lines.forEach(function (line) {
      var div = document.createElement("div");
      div.className =
        "lp-log-line" +
        (/\bError[:\s]/i.test(line) ? " error" : "") +
        (/\bWarning\b/i.test(line) ? " warning" : "");

      var escaped = esc(line);
      div.innerHTML = escaped.replace(
        /&lt;user&gt;/g,
        '<span class="lp-sanitized">&lt;user&gt;</span>'
      );
      frag.appendChild(div);
    });

    container.innerHTML = "";
    container.appendChild(frag);

    var statsEl = document.getElementById("lp-log-stats");
    if (statsEl) {
      statsEl.textContent = lines.length + " / " + sanitizedLines.length + " lines";
    }
  }

  // ─── File handling ─────────────────────────────────────────
  function processFile(file) {
    if (!file) return;

    var titleEl = document.querySelector(".lp-dropzone-title");
    var subEl = document.querySelector(".lp-dropzone-sub");
    var hintEl = document.getElementById("lp-path-hint");
    if (titleEl) titleEl.textContent = file.name;
    if (subEl) subEl.textContent = (file.size / 1024).toFixed(1) + " KB";
    if (hintEl) hintEl.textContent = "";

    var reader = new FileReader();
    reader.onload = function (e) {
      var raw = e.target.result;
      var lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      sanitizedLines = lines.map(sanitizeLine);
      sanitizedText = sanitizedLines.join("\n");

      parsedData = parseLog(raw);

      renderSummary(parsedData);
      renderErrors(parsedData);
      renderLog();

      var results = document.getElementById("lp-results");
      if (results) results.style.display = "block";
    };
    reader.readAsText(file);
  }

  // ─── Dropzone setup ────────────────────────────────────────
  function setupDropzone() {
    var dz = document.getElementById("lp-dropzone");
    var input = document.getElementById("lp-file-input");
    if (!dz || !input) return;

    dz.addEventListener("dragover", function (e) {
      e.preventDefault();
      dz.classList.add("dragover");
    });
    dz.addEventListener("dragleave", function () {
      dz.classList.remove("dragover");
    });
    dz.addEventListener("drop", function (e) {
      e.preventDefault();
      dz.classList.remove("dragover");
      processFile(e.dataTransfer.files[0]);
    });
    input.addEventListener("change", function (e) {
      processFile(e.target.files[0]);
    });
  }

  // ─── Tabs ──────────────────────────────────────────────────
  function setupTabs() {
    var tabs = document.querySelectorAll(".lp-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".lp-tab").forEach(function (t) {
          t.classList.remove("active");
        });
        document.querySelectorAll(".lp-tab-panel").forEach(function (p) {
          p.classList.remove("active");
        });
        tab.classList.add("active");
        var panel = document.getElementById("lp-panel-" + tab.dataset.tab);
        if (panel) panel.classList.add("active");
      });
    });
  }

  // ─── Toolbar buttons ──────────────────────────────────────
  function setupToolbar() {
    var copyBtn = document.getElementById("lp-copy-btn");
    var dlBtn = document.getElementById("lp-download-btn");
    var filterEl = document.getElementById("lp-filter-errors");

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(sanitizedText).then(function () {
          showToast("Copied to clipboard");
        });
      });
    }
    if (dlBtn) {
      dlBtn.addEventListener("click", function () {
        var blob = new Blob([sanitizedText], { type: "text/plain" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "log_sanitized.txt";
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("Downloaded log_sanitized.txt");
      });
    }
    if (filterEl) {
      filterEl.addEventListener("change", renderLog);
    }
    var filterText = document.getElementById("lp-filter-text");
    if (filterText) {
      filterText.addEventListener("input", renderLog);
      filterText.addEventListener("search", renderLog);
    }
  }

  // ─── Toast ─────────────────────────────────────────────────
  function showToast(msg) {
    var el = document.getElementById("lp-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function () {
      el.classList.remove("show");
    }, 2000);
  }

  // ─── Card toggle (exposed globally for onclick) ───────────
  window._lpToggle = function (header) {
    header.closest(".lp-card").classList.toggle("open");
  };

  // ─── Boot ──────────────────────────────────────────────────
  // MkDocs Material with instant navigation fires a custom event
  if (typeof document$ !== "undefined") {
    document$.subscribe(function () { init(); });
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
