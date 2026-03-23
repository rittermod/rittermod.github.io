# How to Report a Bug  - and Why It Matters

!!! abstract "TL;DR"
    Without a clear description of what you did, the mod version number, and preferably the log file, a mod creator is essentially flying blind. The more context you provide, the faster the bug can get fixed.

!!! tip "Sanitize your log first"
    Use the [Log Parser](../tools/log-parser.md) to strip personal information from your `log.txt` before attaching it to a bug report. We try to remove usernames and file paths, but double-check yourself before adding the log to a bug report.

## Quick checklist

- [ ] I have confirmed the bug exists in the **current version** of the mod
- [ ] I have included the **mod version** number
- [ ] I have included the **FS25 game version**
- [ ] I have noted whether I am in **singleplayer or multiplayer** (and if multiplayer, host or client)
- [ ] I have attached the **`log.txt`** from the session where the bug occurred (with username redacted  - try the [Log Parser](../tools/log-parser.md))
- [ ] I have described **what happened** and **what I expected to happen**
- [ ] I have listed the **steps to reproduce** the bug (even approximately)
- [ ] I have noted the **map** I am playing on
- [ ] I have listed any other **relevant mods** I have active
- [ ] For visual bugs: I have included a **screenshot or video**

If any of these are unfamiliar, keep reading  - each item is explained in detail below.

---

## Why "it doesn't work" is not enough

Mod creators can't look over your shoulder. When something goes wrong in your game, the creator sees nothing  - no error, no screen, no context. All they have is your report.

Compare these two reports:

> :x: *"The mod doesn't work. My progress is lost."*

> :white_check_mark: *"After working on a contract on Riverbend Springs in singleplayer, if I save, exit and reload, its progress resets to zero. I'm on mod v1.3.2.0 and game version 1.17.0.0. Log attached."*

The first report says that *something is wrong somewhere*. The second says *exactly where to look*. The difference is often whether a fix gets released reasonably fast or never at all.

---

## What to include  - in detail

### 1. Mod version

**Why it matters:** Bugs are often fixed in newer releases. Without a version number, the mod creator doesn't know if they're looking at a current bug or something already resolved weeks ago.

**How to find it:**

- Open the **Downloadable Content** in the game's main menu.
- Go to the **Installed Mods** tab and find the mod in question. The version number is listed in the top description on the right when entering the mod's detail screen.
- It is also shown in the **Mods/DLC** screen when you load a savegame with the mod installed.
- The format is usually four numbers separated by dots, like `1.2.3.4`. If you see something like `1.2.3.4-dev` or `1.2.3.4-beta`, include that too.


---

### 2. Game version

**Why it matters:** GIANTS releases updates that change how the game works internally. A bug might only appear on a specific game version, or a feature that worked before may have broken due to a game update.

**How to find it:**

- It is displayed in the **top left corner of the main menu**.
- On **Steam**: right-click the game in your library → *Properties* → the version is shown under *Installed Files*.
- The format is four numbers separated by dots, like `1.17.0.0`.

---

### 3. What happened and what you expected

**Why it matters:** "Doesn't work" could mean a crash, wrong numbers, missing UI, no output, or something else entirely. A clear, factual description of what you were doing, what happened, and what you expected cuts through the ambiguity.

!!! tip "Tips for a good description"
    - Stick to facts, not interpretations. "The counter showed 0" is more useful than "it was completely broken."
    - Include what triggered it. "After finishing a contract" is more useful than "when I use contracts."
    - Note whether it happens every time or only sometimes.

---

### 4. Steps to reproduce

**Why it matters:** A bug that can be reliably reproduced can be reliably fixed. If the mod creator can't trigger the bug themselves, they cannot verify whether a fix actually works. List the exact steps you took before the bug appeared.

**Example:**

> 1. Start a new singleplayer game on Riverbend Springs
> 2. Accept a harvesting contract
> 3. Complete 50% of the required area
> 4. Save and reload the game
> 5. Open the contracts menu  - progress shows 0% instead of 50%

Even approximate steps help. "I think it happened after I reloaded" is better than nothing.

---

### 5. The log file :arrow_right: the most useful info

**What it is:** A plain text file called `log.txt` that FS25 writes every time you run the game. It records errors, warnings, and often the exact line of code where a problem occurred. On servers, the file is `log_<date-time>.txt`.

**Why it matters:** This is the single most useful piece of information for diagnosing a bug. It often points directly to the cause, including which mod triggered an error and why. Without it, many bugs are nearly impossible to investigate.

!!! warning "The log is overwritten every time you start the game"
    If something goes wrong, find the log **before** restarting. Once you restart, the log from that session is gone.

!!! info "Privacy note"
    The log file contains file system paths, which typically include your **Windows or macOS username**. For example, a path in the log might read `C:\Users\YourName\Documents\...` or `/Users/YourName/Library/...`. You can use the [Log Parser](../tools/log-parser.md) to try to automatically remove your username, or open the log in a text editor and use Find & Replace to substitute your name with something like `[username]`.

**How to find `log.txt`:**

| Platform | Path |
|---|---|
| **Windows (Steam / Epic)** | `C:\Users\YourName\Documents\My Games\FarmingSimulator2025\log.txt` |
| **Windows (Microsoft Store)** | `C:\Users\YourName\AppData\Local\Packages\...\LocalCache\Local\log.txt` |
| **macOS** | `~/Library/Application Support/FarmingSimulator2025/log.txt` |

!!! tip "Finding the hidden folders"
    **Windows:** The `AppData` folder is hidden by default. In File Explorer, click the address bar, type `%LOCALAPPDATA%` and press Enter.

    **Mac:** In Finder, press ++cmd+shift+g++ and paste `~/Library/Application Support/FarmingSimulator2025/`. Alternatively, hold ++option++ and click the **Go** menu  - Library will appear in the list.

**How to attach the log:**

- On GitHub, drag and drop the `log.txt` file directly into the issue text field.
- Alternatively, open it in a text editor and paste the relevant section.

**Finding the relevant part:** If you're not sure what to include, attach the whole file. To find the most relevant lines yourself, search for `Error`, `Warning`, or `Callstack`.

---

### 6. Your active mod list

**Why it matters:** Mods interact with each other. The bug you are seeing might be caused by a conflict between two mods rather than a problem in the mod itself. Knowing what else is loaded helps identify or rule out conflicts.

**How to find it:**

- See the **Mods/DLC** screen when you start the savegame and look at your active mods.
- The `log.txt` file lists all active mods near the top  - if you are attaching the log, the mod creator can read the list from there.

---

### 7. Game mode and map

**Why it matters:** Many bugs only occur in multiplayer, or only affect clients rather than the host. Multiplayer adds networking logic that singleplayer doesn't have  - the same action can behave differently depending on who performs it. Similarly, some mod features are map-specific, and a bug on one map might not appear on another.

Include:

- Whether you are in **singleplayer** or **multiplayer**
- If multiplayer, whether you are the **host** or a **client**
- The **name of the map** you are playing on

---

### 8. Screenshots or video (optional but useful)

**Why it matters:** For visual bugs  - incorrect UI, missing elements, wrong layout  - a screenshot is often faster to understand than any written description. It doesn't replace the log file, but it complements it.

**How to take a screenshot:**

- **Windows:** Press ++win+shift+s++ to capture a region, or ++print-screen++ to copy the full screen.
- **Steam:** Press ++f12++ by default. Screenshots are saved to your Steam screenshot library.
- **Mac:** Press ++cmd+shift+4++ to select a region, or ++cmd+shift+3++ for the full screen.

---

## Enabling debug logging (advanced)

If the mod creator asks for more detail, some mods support a debug logging mode that writes much more information to the log. Check the mod's documentation or the issue you have filed for instructions  - usually this involves a console command or a setting in the mod's configuration menu.

Once enabled, reproduce the issue, then retrieve the `log.txt` before restarting the game.

---

Thank you for taking the time to report  - it genuinely helps.
