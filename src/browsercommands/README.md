**BrowserCommands**
lets you execute JavaScript commands directly from the URL using the <code>?cmd=</code> parameter. It also includes safe and unsafe modes for DOM manipulation.

# How to Use: 
1. Include the script in your HTML page:
<code>&lt;script src="browsercommands.min.js"&gt;&lt;/script&gt;</code>

2. Run commands using URL parameters. For example:
<code>?cmd=alert('Hello')</code> — Runs JavaScript and shows output in the console.
<code>?cmd=switchtodoc</code> — Opens a safe iframe modal inside the page.
<code>?cmd=switchtodoc.unsafe</code> — Executes commands directly on the main document (use with caution).

# Console Output: 
When the script loads successfully, it displays:
<code>[BrowserCommands]</code> followed by a short “how it works” section in the browser console.

# Notes: 
- The modal created by <code>switchtodoc</code> includes a Close button and a blank iframe preview.
- The <code>.unsafe</code> command replaces the page content and should only be used for testing or trusted environments.
- All commands run automatically after the DOM has loaded, so the script works even if it’s placed in the <code>&lt;head&gt;</code>.

# Example URLs: 
<code>yourpage.html?cmd=alert('hi')</code>
<code>yourpage.html?cmd=switchtodoc</code>
<code>yourpage.html?cmd=switchtodoc.unsafe</code>
# Preview
<img src="https://raw.githubusercontent.com/ajm19826/js-commands/refs/heads/main/src/browsercommands/img/preview.png">

**Author:  BrowserCommands.js Script**<br>
**Version:  1.0.0**
