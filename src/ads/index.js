/**
 * Ad Experiment Algorithm (ad_experiment_v6.js)
 * - Adds a 10-second inactivity timer that triggers a full-screen "Screen Ad."
 */

(function() {

    // --- 1. EMBEDDED CSS STYLES ---
    function injectCSS() {
        const css = `
            /* --- AD INJECTION STYLES --- */
            .experiment-ad-container {
                display: block; 
                margin: 15px auto; 
                text-align: center;
                border: 2px solid #FF5733;
                padding: 8px;
                background-color: #FFF3E0;
            }

            /* --- GLOBAL POPUP STYLES (Used for both Link Hijack and Screen Ad) --- */

            /* Overlay covers the entire screen */
            #custom-ad-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(8px);
            }

            /* Popup container */
            #custom-ad-popup-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 15px 40px rgba(255, 87, 51, 0.8);
                max-width: 90%;
                width: 480px;
                text-align: center;
                position: relative; /* For the close button */
            }
            
            #custom-ad-popup-content h3 {
                margin-top: 0;
                color: #FF5733;
                font-size: 1.5em;
            }
            
            #custom-ad-popup-content img {
                border: 1px solid #ddd;
            }

            /* Progress Bar Styling */
            #progress-container {
                width: 100%;
                margin: 25px 0 15px 0;
                background-color: #ffe0b2;
                border-radius: 5px;
                overflow: hidden;
            }

            #progress-bar {
                height: 28px;
                width: 0%;
                background-color: #FF5733;
                transition: width 0.05s linear; 
            }
            
            #countdown-text {
                font-weight: bold;
                color: #555;
                margin-top: 10px;
            }

            /* Continue Button Styling */
            #continue-button {
                padding: 15px 30px;
                margin-top: 25px;
                font-size: 1.1em;
                border: none;
                border-radius: 8px;
                background-color: #FFC300;
                color: #333;
                cursor: not-allowed;
                opacity: 0.7;
                transition: opacity 0.3s, background-color 0.3s;
            }

            #continue-button:not([disabled]) {
                background-color: #28a745; 
                color: white;
                cursor: pointer;
                opacity: 1;
            }

            /* Close Button for Screen Ad */
            .screen-ad-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #ccc;
                color: black;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                font-size: 18px;
                cursor: pointer;
                line-height: 1;
                text-align: center;
            }
        `;

        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    // --- 2. AD INVENTORY & HELPERS ---

    const adInventory = [
		{ image: "https://houselearning.github.io/ad-system/ads/img-1.jpg", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-2.png", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-3.gif", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-4.jpg", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-5.gif", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-6.png", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-7.png", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-8.jpg", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-9.png", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-10.gif", url: "" },
        { image: "https://houselearning.github.io/ad-system/ads/img-11.jpg", url: "" }
    ];

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function getRandomAd() {
        const randomIndex = Math.floor(Math.random() * adInventory.length);
        return adInventory[randomIndex];
    }

    // --- 3. CONFIGURATION & STATE ---

    const MAX_ADS_TO_PLACE = Math.min(20, adInventory.length); 
    const potentialContainersSelector = 'div, p, aside, section, article, li, h1, h2, h3, h4, header, footer, main, form'; 
    let adsPlacedCount = 0;
    
    // Inactivity Timer Variables
    const INACTIVITY_TIMEOUT = 10000; // 10 seconds in milliseconds
    let activityTimer;
    let screenAdShown = false; // Flag to ensure it only shows once per page load

    // --- 4. POPUP LOGIC (Unified for both triggers) ---

    // This function can be called by the link hijack or the inactivity timer
    function showAdPopup(adData, destinationUrl, type = 'hijack') {
        
        // Prevent showing multiple popups at once
        if (document.getElementById('custom-ad-popup-overlay')) {
            return; 
        }
        
        // --- A. Build and Display Popup ---
        const isScreenAd = (type === 'screen');
        const headerText = isScreenAd ? "Don't Go Yet! Special Offer Awaits" : "Important Security Check";
        const imageSource = adData.image;
        const finalUrl = isScreenAd ? adData.url : destinationUrl;
        
        // Conditional Close Button for Screen Ad
        const closeButtonHTML = isScreenAd ? '<button class="screen-ad-close" id="screen-ad-close-btn">X</button>' : '';
        const countdownCaption = isScreenAd ? "Unlock Offer: 5.0 seconds..." : "Verifying link access: 5.0 seconds...";

        const popupHTML = `
            <div id="custom-ad-popup-overlay">
                <div id="custom-ad-popup-content">
                    ${closeButtonHTML}
                    <h3>${headerText}</h3>
                    <img src="${imageSource}" alt="Advertisement" style="max-width: 100%; height: auto; display: block; margin: 15px auto;">
                    <div id="progress-container">
                        <div id="progress-bar"></div>
                    </div>
                    <p id="countdown-text">${countdownCaption}</p>
                    <button id="continue-button" disabled>Continue</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);

        const progressBar = document.getElementById('progress-bar');
        const countdownText = document.getElementById('countdown-text');
        const continueButton = document.getElementById('continue-button');

        // --- B. Start Countdown and Progress Bar ---
        let elapsed = 0;
        const interval = 50; 
        const duration = 5000; 
        let countdownInterval;

        const startCountdown = () => {
            countdownInterval = setInterval(() => {
                elapsed += interval;
                let timeRemaining = Math.max(0, (duration - elapsed) / 1000);
                
                const progressPercent = (elapsed / duration) * 100;
                progressBar.style.width = `${Math.min(100, progressPercent)}%`;

                countdownText.textContent = countdownCaption.replace('5.0', timeRemaining.toFixed(1));

                if (elapsed >= duration) {
                    clearInterval(countdownInterval);
                    countdownText.textContent = isScreenAd ? "Ready to view the offer." : "Verification complete. Click 'Continue' to proceed.";
                    continueButton.disabled = false;
                }
            }, interval);
        };
        startCountdown();

        // --- C. Add Continue/Close Button Actions ---
        const removePopup = () => {
            clearInterval(countdownInterval);
            const overlay = document.getElementById('custom-ad-popup-overlay');
            if (overlay) overlay.remove();
        };

        continueButton.addEventListener('click', () => {
            removePopup();
            // Navigate to the correct destination URL
            window.location.href = finalUrl; 
        });

        // Add close button functionality for the screen ad
        if (isScreenAd) {
            document.getElementById('screen-ad-close-btn').addEventListener('click', removePopup);
        }
        
        // Reset timer if the screen ad was manually closed before timeout
        resetActivityTimer(); 
    }

    // --- 5. INACTIVITY TRACKING ---

    function resetActivityTimer() {
        // Clear any existing timer
        clearTimeout(activityTimer); 

        // Set a new timer
        activityTimer = setTimeout(triggerInactivityAd, INACTIVITY_TIMEOUT);
    }

    function triggerInactivityAd() {
        // Only show the screen ad once per page load
        if (screenAdShown) {
            return;
        }

        const ad = getRandomAd();
        showAdPopup(ad, ad.url, 'screen');
        screenAdShown = true;
    }

    function setupActivityListeners() {
        // List of events that indicate user activity
        const activityEvents = ['mousemove', 'keypress', 'scroll', 'touchstart'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, resetActivityTimer, { passive: true });
        });
        
        // Start the initial timer
        resetActivityTimer(); 
    }

    // --- 6. GLOBAL LINK HIJACKING ---

    function setupLinkHijacking() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');

            if (link && !link.classList.contains('experiment-ad-container')) {
                
                e.preventDefault(); 
                const destinationUrl = link.href;

                // Use the link's destination and a random ad for the popup image
                showAdPopup(getRandomAd(), destinationUrl, 'hijack');
            }
        });
    }
    
    // --- 7. MAIN EXECUTION ---
    
    // Inject the necessary styles immediately
    injectCSS();

    // Set up global listeners for link hijacking and inactivity
    setupLinkHijacking(); 
    setupActivityListeners();

    // 1. Shuffle the list of ads for placement rotation
    shuffleArray(adInventory);

    // 2. Get all potential container elements on the page
    const potentialContainers = document.querySelectorAll(potentialContainersSelector);

    // 3. Iterate and place ads (Flooding)
    potentialContainers.forEach(container => {
        if (adsPlacedCount >= MAX_ADS_TO_PLACE) {
            return;
        }

        // Flooding Check: Place ad if the container is relatively empty
        if (container.children.length < 2 && container.innerHTML.trim().length < 50) {
            
            const currentAd = adInventory[adsPlacedCount];

            const adWrapper = document.createElement('a');
            adWrapper.href = currentAd.url;        
            adWrapper.classList.add('experiment-ad-container');

            // For the injected ads, keep the direct popup handler
            adWrapper.addEventListener('click', (e) => {
                e.preventDefault();
                showAdPopup(currentAd, currentAd.url, 'hijack');
            });

            const adImage = document.createElement('img');
            adImage.src = currentAd.image;
            adImage.alt = `Ad Slot ${adsPlacedCount + 1}`;
            adImage.style.maxWidth = '100%';
            adImage.style.height = 'auto';
            adImage.style.display = 'block';

            adWrapper.appendChild(adImage);
            
            container.prepend(adWrapper); 
            
            adsPlacedCount++;
        }
    });

    console.log(`[Ad Experiment] Extreme Flooding setup complete. Inactivity timer is active.`);
})();
