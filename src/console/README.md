# Console.js (Minified) Readme

*A comprehensive console utility that tags all log messages with a unique ID (MID) and enables Text-to-Speech (TTS) for accessibility.*

## Core Functionality

* **Message Tagging:** Overrides `console.log`, `console.warn`, and `console.error` to prepend a unique **Message ID (MID)** to every message.
* **Error Capture:** Captures all synchronous (`window.onerror`) and asynchronous (`unhandledrejection`) JavaScript errors. It uses a **50ms deferred logging** method to ensure the MID tagalog message appears right below the browser's native error.
* **Text-to-Speech (TTS):** Provides a global `play()` function to read any logged message aloud using the browser's native TTS API (with a simulated fallback).

## Global Commands (Access via Console)

| Command | Description |
| :--- | :--- |
| `play(MID)` | Reads the content of the message associated with the given **Message ID (MID)** aloud. |
| `play.mid.recent()` | Displays the **most recent** MID and a snippet of its content. |
| `play.mid.list()` | Lists all MIDs in order with a short summary of each message. |
| `play.vol` | **Getter:** Returns the current TTS volume level (0-100). |
| `play.vol = 75` | **Setter:** Sets the TTS volume level (0 to 100). |
| `play.help()` | Displays a complete guide to all available `play` commands. |

## Error Handling and Synchronization

For fatal, synchronous errors (like `ReferenceError`), the browser's native console output cannot be suppressed or rewritten. To ensure accessibility:

1.  The native, untagged error appears first.
2.  A brief, high-priority **tagalong message** (e.g., `^ [CONSOLE.JS] MID: X`) is logged after a 50ms delay to clearly link the native error to its playable MID.

This guarantees the error is captured and playable via the `play()` command.

## Installation
1.  Download the script from [https://github.com/ajm19826/js-commands/blob/main/src/console/console.min.js](https://github.com/ajm19826/js-commands/blob/main/src/console/console.min.js)
2.  Include this minified script file in your HTML document (before any other scripts if possible) to ensure all console output is tagged:

```html
<script src="console.min.js"></script>
(or wherever the file is located)
```
