# Log Parser

Sanitize personal information and extract useful diagnostics from your Farming Simulator 25 log file. Everything runs in your browser  - no data is uploaded anywhere.

<div id="log-parser-app" markdown>

<div class="lp-dropzone" id="lp-dropzone">
  <input type="file" id="lp-file-input" accept=".txt,.log">
  <div class="lp-dropzone-icon">📄</div>
  <div class="lp-dropzone-title">Drop your log.txt here</div>
  <div class="lp-dropzone-sub">or click to browse</div>
  <div class="lp-dropzone-path" id="lp-path-hint"></div>
</div>

??? info "Where to find log.txt"

    | Platform | Path |
    |---|---|
    | **Windows (Steam / Epic)** | `C:\Users\<YourName>\Documents\My Games\FarmingSimulator2025\log.txt` |
    | **Windows (Microsoft Store)** | `C:\Users\<YourName>\AppData\Local\Packages\...\LocalCache\Local\log.txt` |
    | **macOS** | `~/Library/Application Support/FarmingSimulator2025/log.txt` |
    | **Linux (Steam / Proton)** | `~/.local/share/FarmingSimulator2025/log.txt` |

    **Windows tip:** The `AppData` folder is hidden by default. In File Explorer, type `%LOCALAPPDATA%` in the address bar.

    **Mac tip:** In Finder, press ++cmd+shift+g++ and paste `~/Library/Application Support/FarmingSimulator2025/`.

    !!! warning "The log is overwritten every time you start the game"
        If something goes wrong, grab the log **before** restarting.

<div id="lp-results" style="display:none">

<div class="lp-tabs" id="lp-tabs">
  <button class="lp-tab active" data-tab="summary">Summary</button>
  <button class="lp-tab" data-tab="errors">Issues <span class="lp-badge" id="lp-issue-count">0</span></button>
  <button class="lp-tab" data-tab="log">Sanitized Log</button>
</div>

<div class="lp-tab-panel active" id="lp-panel-summary"></div>

<div class="lp-tab-panel" id="lp-panel-errors"></div>

<div class="lp-tab-panel" id="lp-panel-log">
<div class="admonition warning">
<p class="admonition-title">Double-check before sharing</p>
<p>The parser tries to remove usernames and file paths, but it may not catch everything. Always review the sanitized output before attaching it to a bug report.</p>
</div>
<div class="lp-log-viewer">
<div class="lp-log-toolbar">
<div class="lp-log-toolbar-left">
<label><input type="checkbox" id="lp-filter-errors"> Errors/Warnings only</label>
<input type="search" id="lp-filter-text" class="lp-filter-input" placeholder="Filter (regex)">
<span class="lp-log-stats" id="lp-log-stats"></span>
</div>
<div class="lp-btn-group">
<button class="md-button" id="lp-copy-btn">📋 Copy Log</button>
<button class="md-button md-button--primary" id="lp-download-btn">⬇ Download</button>
</div>
</div>

<div class="lp-log-content" id="lp-log-content"></div>
</div>
</div>

</div>

</div>
