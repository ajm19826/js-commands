/**
 * Console.js Utility
 *
 * This script intercepts standard console methods (log, warn, error)
 * to assign a unique Message ID (MID) to every output, and provides
 * a global 'play' object for Text-to-Speech (TTS) readout and management.
 */

(function() {
    // --- Internal State and Configuration ---

    let messageCounter = 1;
    // messageMap stores the content of messages, keyed by their MID.
    const messageMap = {};
    // Default TTS volume (0.0 to 1.0)
    let ttsVolume = 1.0; 

    // Preserve references to the original console functions
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        // We use console.debug for internal logs that should not be M-ID'd
        debug: console.debug,
        clear: console.clear 
    };

    // Flag to prevent recursive logging during error handling
    let isHandlingError = false;

    // --- Core Logging Logic ---

    /**
     * Converts arguments array into a single, clean string for storage.
     * @param {Array<any>} args - Arguments passed to the console method.
     * @returns {string} The combined message string.
     */
    const getMessageText = (args) => {
        return args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    // Try to pretty-print objects
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg); // Fallback for circular references
                }
            }
            return String(arg);
        }).join(' ');
    };

    /**
     * Custom handler that assigns a MID, stores the message, and calls the original console function.
     * @param {string} type - The original console method name ('log', 'warn', 'error').
     * @param {Array<any>} args - The arguments passed to the original console method.
     */
    const customConsoleLogger = (type, args) => {
        // Generate and increment the Message ID
        const mid = messageCounter++;
        const midPrefix = `(MID: ${mid})`;

        // Store the message content for the play() function.
        const originalMessageText = getMessageText(args);
        messageMap[mid] = { type, content: originalMessageText };

        // Prepend the MID prefix to the arguments for console display
        const newArgs = [midPrefix, ...args];

        // Call the original console method with the new arguments
        originalConsole[type].apply(console, newArgs);
        return mid;
    };

    // --- Override Console Methods (log, warn, error) ---

    // Apply the custom logging logic to the main console methods
    ['log', 'warn', 'error'].forEach(type => {
        console[type] = function(...args) {
            customConsoleLogger(type, args);
        };
    });

    // --- Capture Global Errors ---
    
    // 1. Capture synchronous fatal errors (e.g., ReferenceError)
    window.onerror = function(message, source, lineno, colno, error) {
        if (isHandlingError) {
            return false; // Prevent infinite recursion
        }
        isHandlingError = true;

        // Check if an actual Error object was passed (more useful)
        const errorStack = error && error.stack ? error.stack : `${message}. Source: ${source}:${lineno}:${colno}`;
        
        const mid = messageCounter++;
        
        // Store the full stack/detailed error for robust TTS playback
        messageMap[mid] = { type: 'error', content: errorStack };

        // FIX: Increase delay to 50ms to ensure the native error display is finalized 
        // before we print the tagalong message, guaranteeing its position below the error.
        setTimeout(() => {
            // \u2B06 is the heavy black up-pointing triangle emoji
            originalConsole.error(
                `%c\u2B06 [CONSOLE.JS] MID: ${mid}. To read aloud, run: play(${mid})`,
                'color: #0D47A1; font-weight: bold; background-color: #E3F2FD; padding: 1px 4px; border-radius: 3px;' // Blue text on light blue background
            );
        }, 50); // Defer to ensure native error prints first

        isHandlingError = false;
        
        // Returning true prevents the native error from being logged twice, 
        // but it doesn't prevent the initial print you are seeing.
        return true; 
    };

    // 2. Capture asynchronous unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        let errorMessage = 'Unhandled Promise Rejection';
        
        if (reason) {
            if (reason instanceof Error) {
                // Use stack trace if available for more detail for TTS
                errorMessage = `Unhandled Promise Rejection: ${reason.stack || reason.message}`;
            } else {
                errorMessage = `Unhandled Promise Rejection: ${String(reason)}`;
            }
        }
        
        // This rejection is handled by the custom logger, which successfully tags it.
        customConsoleLogger('error', [errorMessage, reason]);

        // Prevent the browser's default console logging for this unhandled rejection
        event.preventDefault(); 
    });

    // --- Global 'play' Command Refactor ---

    /**
     * Internal function to handle the TTS reading logic.
     * @param {(string|number)} mid - The Message ID to read.
     */
    const readMessageAloud = (mid) => {
        const id = parseInt(mid, 10);
        const synth = window.speechSynthesis;

        // Validation
        if (isNaN(id) || id < 1) {
            originalConsole.error("Console.js Error: Please provide a valid numeric message ID (e.g., play(5)).");
            return;
        }

        if (!messageMap[id]) {
            originalConsole.error(`Console.js Error: Message ID ${id} not found. The message may have been generated before Console.js was loaded.`);
            return;
        }
        
        const message = messageMap[id];
        
        // 1. Output the required confirmation message to the console
        originalConsole.debug(`Reading message ID: ${id}`);
        
        // 2. Perform the actual Text-to-Speech
        if (synth && synth.speak) {
            // Stop any currently speaking messages
            synth.cancel();

            // Create a custom speaking message
            // Uses the detailed content stored for better TTS
            const readingText = `Message ID ${id}, type ${message.type}. The content is: ${message.content}`;
            
            const utterance = new SpeechSynthesisUtterance(readingText);
            utterance.pitch = 1;
            utterance.rate = 1; 
            utterance.volume = ttsVolume; // Apply the stored volume setting

            synth.speak(utterance);
            
            // Log confirmation of TTS execution (using console.debug for internal log)
            originalConsole.debug(
                `%c[TTS] Message ${id} sent to speaker (Volume: ${ttsVolume * 100}%).`, 
                `color: white; background-color: #03A9F4; padding: 2px 5px; border-radius: 3px; font-weight: bold;`
            );

        } else {
            // Fallback for environments that do not support or restrict TTS
            originalConsole.warn("Console.js Warning: Text-to-Speech API is not available or restricted in this environment. Simulating read aloud...");
            originalConsole.debug(
                `%c[SIMULATED TTS] ${message.type.toUpperCase()} Message ${id}: %c${message.content}`,
                `color: white; background-color: #FF5722; padding: 2px 5px; border-radius: 3px; font-weight: bold;`,
                'color: #212121; font-style: italic;'
            );
        }
    };


    // --- Setup Global 'play' Object ---

    // Create the global 'play' function that defaults to reading a message.
    window.play = readMessageAloud;
    
    // Attach the 'mid' and 'vol' namespace objects
    window.play.mid = {};
    
    // 1. play.mid.recent command
    window.play.mid.recent = function() {
        if (messageCounter <= 1) {
            originalConsole.info("No logged messages yet.");
            return;
        }
        const recentMid = messageCounter - 1;
        const message = messageMap[recentMid];
        
        originalConsole.info(`%cMost Recent MID: ${recentMid}`, 'font-weight: bold;');
        originalConsole.log(`Type: ${message.type.toUpperCase()}`);
        originalConsole.log(`Content: ${message.content.substring(0, 100)}...`);
        // Provide immediate playback option
        originalConsole.log(`To play this message, run: %cplay(${recentMid})`, 'font-family: monospace; background-color: #e0e0e0; padding: 2px 4px; border-radius: 3px;');
    };

    // 2. play.mid.list command
    window.play.mid.list = function() {
        if (messageCounter <= 1) {
            originalConsole.info("No logged messages yet.");
            return;
        }
        
        originalConsole.info("%c--- Console.js Message List ---", 'font-weight: bold; color: #673AB7;');
        for (let i = 1; i < messageCounter; i++) {
            const message = messageMap[i];
            const contentSnippet = message.content.substring(0, 80).replace(/\n/g, ' ') + (message.content.length > 80 ? '...' : '');
            originalConsole.log(`(MID: ${i}) [${message.type.toUpperCase()}]: ${contentSnippet}`);
        }
        originalConsole.info(`Total Messages: ${messageCounter - 1}`);
    };

    // 3. play.vol = {number 0 - 100} command
    Object.defineProperty(window.play, 'vol', {
        get: () => ttsVolume * 100,
        set: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 100) {
                originalConsole.error("Console.js Error: Volume must be a number between 0 and 100.");
                return;
            }
            ttsVolume = num / 100;
            originalConsole.info(`TTS Volume set to: %c${num}%`, 'font-weight: bold; color: #00BCD4;');
        },
        configurable: true
    });
    
    // 4. play.help command
    window.play.help = function() {
        const helpMessage = `
%c--- Console.js Command Help ---%c
The core function is %cplay(mid)%c. Use a Message ID (MID) found next to a console message.

%cMessage Management:%c
- %cplay.mid.recent%c: Shows the last message ID and its content.
- %cplay.mid.list%c: Lists all logged messages with their MIDs and snippets.

%cVolume Control (0-100):%c
- %cplay.vol%c: Displays the current volume (0-100).
- %cplay.vol = 75%c: Sets the TTS volume level. (e.g., setting it to 75%)

%cInformation:%c
- %cplay.help%c: Shows this help message.

Current Volume: ${window.play.vol}%
        `;

        // Apply styles for the help message
        originalConsole.info(
            helpMessage,
            'font-weight: bold; color: #3F51B5;', '', // Header
            'font-family: monospace; background-color: #e0e0e0; padding: 1px 3px; border-radius: 2px;', '', // core play
            'font-weight: bold; color: #4CAF50;', '', // Message Management header
            'font-family: monospace; background-color: #e0e0e0; padding: 1px 3px; border-radius: 2px;', '', // recent
            'font-family: monospace; background-color: #e0e0e0; padding: 1px 3px; border-radius: 2px;', '', // list
            'font-weight: bold; color: #FF9800;', '', // Volume header
            'font-family: monospace; background-color: #e0e0e0; padding: 1px 3px; border-radius: 2px;', // play.vol (getter)
            'font-family: monospace; background-color: #e0e0e0; padding: 1px 3px; border-radius: 2px;', '', // play.vol = X (setter)
            'font-weight: bold; color: #9C27B0;', '', // Information header
            'font-family: monospace; background-color: #e0e0e0; padding: 1px 3px; border-radius: 2px;' // help
        );
    };

    // --- Initialization Message ---

    // Use originalConsole.log for the welcome message to prevent it from getting an MID.
    originalConsole.log("%cConsole.js Initialized", "color: #4CAF50; font-weight: bold; font-size: 14px;");
    originalConsole.log("Thank you for using Console.js.");
    originalConsole.log("To read aloud an error message (TTS/simulation), please look for the %c\u2B06 [CONSOLE.JS]%c message and use its MID, or type %cplay.help%c for a list of commands.", 
        "font-family: monospace; color: #1565C0; font-weight: bold;", "",
        "font-family: monospace; background-color: #e0e0e0; padding: 2px 4px; border-radius: 3px;", ""
    );

})();
