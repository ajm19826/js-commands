// BrowserCommands.js
(function() {
    // Run code after DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    function init() {
        console.log("%c[BrowserCommands]", "color: #00c8ff; font-weight: bold; font-size: 16px;");
        console.log(`
Welcome to BrowserCommands!
How it works:
- Use ?cmd={javascript command} in the URL to run JavaScript directly.
- Example: ?cmd=alert('Hello World')
- Use ?cmd=switchtodoc to open a SAFE iframe modal.
- Use ?cmd=switchtodoc.unsafe to run commands directly on the main document.

Security note: Only use .unsafe commands on trusted pages.
        `);

        const params = new URLSearchParams(window.location.search);
        const command = params.get("cmd");
        if (!command) return;

        console.log(`[BrowserCommands] Detected command: "${command}"`);

        // Special commands
        if (command === "switchtodoc") {
            createModalIframe();
            return;
        }
        if (command === "switchtodoc.unsafe") {
            activateUnsafeMode();
            return;
        }

        // Default JS command execution
        try {
            const result = eval(command);
            console.log("[BrowserCommands Output]:", result);
        } catch (err) {
            console.error("[BrowserCommands Error]:", err);
        }
    }

    // === Helper Functions ===
    function createModalIframe() {
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.background = "rgba(0,0,0,0.7)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = "9999";

        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.borderRadius = "12px";
        box.style.padding = "20px";
        box.style.width = "80%";
        box.style.height = "80%";
        box.style.position = "relative";
        box.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";

        const iframe = document.createElement("iframe");
        iframe.src = "about:blank";
        iframe.style.width = "100%";
        iframe.style.height = "calc(100% - 40px)";
        iframe.style.border = "none";
        iframe.style.borderRadius = "8px";

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "10px";
        closeBtn.style.right = "10px";
        closeBtn.style.background = "#ff4747";
        closeBtn.style.color = "#fff";
        closeBtn.style.border = "none";
        closeBtn.style.padding = "8px 14px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.borderRadius = "8px";
        closeBtn.onclick = () => document.body.removeChild(modal);

        box.appendChild(closeBtn);
        box.appendChild(iframe);
        modal.appendChild(box);
        document.body.appendChild(modal);

        console.log("[BrowserCommands] Modal iframe created safely.");
    }

    function activateUnsafeMode() {
        console.warn("[BrowserCommands WARNING]: Running UNSAFE mode — this can modify the main document directly!");
        document.body.innerHTML = `
            <div style="text-align:center; padding-top:20%; color:white; background:#111; height:100vh;">
                <h1>Unsafe Mode Activated ⚠️</h1>
                <p>You are now executing commands on the main document.</p>
            </div>
        `;
    }
})();
