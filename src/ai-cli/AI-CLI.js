// Helper function to handle fetching with exponential backoff and retries
async function fetchWithRetry(url, options, maxRetries = 5) {
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }
            // Non-OK response (e.g., 429 rate limit or 500 error)
            lastError = new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            console.warn(`%c[AI-CLI] Request failed, retrying in ${Math.pow(2, i)} seconds...`, 'color: orange;');
        } catch (error) {
            // Network errors (e.g., disconnection)
            lastError = error;
            console.warn(`%c[AI-CLI] Network error, retrying in ${Math.pow(2, i)} seconds...`, 'color: orange;');
        }

        // Wait using exponential backoff
        if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    throw new Error(`[AI-CLI] Failed to fetch content after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

/**
 * AI-CLI Bot function. Call this in your browser console:
 * ai("What is the current price of Bitcoin?");
 *
 * @param {...string} queryParts - The parts of the question or command for the AI.
 */
window.ai = async function(...queryParts) {
    // Join all arguments together to form the user query string
    const userQuery = queryParts.join(' ');

    if (userQuery.trim() === '') {
        console.error("Please provide a text query, e.g., ai('write a short poem about coding').");
        return;
    }

    // FIX: Reverted to empty string so the environment can inject the working key.
    const apiKey = " $$$$ REPLACE THIS WITH YOUR API KEY $$$$"; // Canvas will provide the working key.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    // Use the provided __app_id for security rules context
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-cli-app';

    console.log(`%c[AI-CLI] Asking Gemini... (App ID: ${appId})`, 'color: #007bff; font-weight: bold;');
    console.time('AI Response Time');

    try {
        const systemPrompt = "";

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            // Enable Google Search grounding for up-to-date information
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };

        const response = await fetchWithRetry(apiUrl, options);
        const result = await response.json();

        console.timeEnd('AI Response Time');

        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const text = candidate.content.parts[0].text;
            let sources = [];

            // Extract grounding sources/citations
            const groundingMetadata = candidate.groundingMetadata;
            if (groundingMetadata && groundingMetadata.groundingAttributions) {
                sources = groundingMetadata.groundingAttributions
                    .map(attribution => ({
                        uri: attribution.web?.uri,
                        title: attribution.web?.title,
                    }))
                    .filter(source => source.uri && source.title);
            }

            // Output the response in a console-friendly, formatted way
            console.log(`%c=========================================`, 'color: #007bff;');
            console.log(`%cQuery: ${userQuery}`, 'font-weight: bold; color: #1e8449;');
            console.log(`%cResponse:`, 'font-weight: bold; color: #007bff;');
            // Use console.log for the main response text
            console.log(text);
            console.log(`%c=========================================`, 'color: #007bff;');

            if (sources.length > 0) {
                console.log(`%cSources Found:`, 'font-weight: bold; color: #ff9800;');
                sources.forEach((source, index) => {
                    console.log(`[${index + 1}] %c${source.title}`, 'font-weight: 500;', `(${source.uri})`);
                });
                console.log(`%c-----------------------------------------`, 'color: #007bff;');
            }

        } else if (result.error) {
            // Handle API-specific errors
            console.error(`%c[API Error] ${result.error.message}`, 'color: red; font-weight: bold;');
        } else {
            console.error("%c[AI-CLI] No text response received from the API. Check the full response for errors.", 'color: red;');
            console.log("Full API response:", result);
        }

    } catch (error) {
        console.timeEnd('AI Response Time');
        console.error(`%c[AI-CLI Critical Error] An unexpected error occurred: ${error.message}`, 'color: darkred; font-weight: bold;');
    }
};

// Console welcome message upon loading
console.log('%cAI-CLI.js loaded. Type ai("your query") in the console to get started.', 'color: green; font-weight: bold; padding: 5px; border: 1px solid green;');
