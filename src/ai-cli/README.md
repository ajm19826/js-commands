---------------------------------------------------------
| AI CONSOLE CLI (AI-CLI) - USAGE GUIDE                 |
---------------------------------------------------------

1.  SETUP
    Load AI-CLI.js (or AI-CLI.min.js) via a script type="module" tag
    in your HTML file. Open the browser Dev Console (F12).

    IMPORTANT API KEY NOTE: **You MUST replace '*const apiKey = "";*' in the JS file with your 
    actual Gemini API Key for the calls to succeed.**

2.  USAGE SYNTAX
    Call the global function 'ai()'. The function is flexible and joins
    all arguments into a single query string:

    - Standard Query:
      ai("What is the best way to center a div in CSS?")

    - Multi-Argument Query (less common):
      ai('Explain', 'the', 'concept', 'of', 'hoisting', 'in', 'JS')

3.  OUTPUT
    Responses are formatted in the console with:
    - Query (Green)
    - Response (Blue header, text body)
    - Sources Found (Orange header, numbered list of citations)
---------------------------------------------------------
| PICTURE PREVIEW                                       |
---------------------------------------------------------
<img src="https://raw.githubusercontent.com/ajm19826/js-commands/refs/heads/main/src/ai-cli/img/preview.png">

---------------------------------------------------------
| MINIFIED AI TERMS OF SERVICE & PRIVACY POLICY         |
---------------------------------------------------------

TOS: Use is subject to Google's standard API terms. Do not use for illegal/harmful/confidential data. Output provided 'AS IS'. No warranty implied. User assumes all risk. 

PRIVACY POLICY: Query input collected solely for service processing (via Google's API); not stored persistently for identification. We use API to process requests; refer to Google's privacy policy for their data handling. Usage implies consent.

---

### Thank you for using this project! - Alex Manochio

