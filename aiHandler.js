import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;
let model;
let termInstance;

// --- 1. Initialization ---
// This function must be called first from script.js
export function initAI(apiKey, term) {
    if (!apiKey) {
        term.writeln('\x1b[31mError: API Key is missing. Check your script.js file.\x1b[0m');
        return;
    }
    termInstance = term;
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

function prompt() {
    termInstance.write('\r\nroot@cayden:~$ ');
}

// --- 2. General AI Conversation Handler (ai "prompt") ---
export async function handleAIGeneral(promptText) {
    try {
        termInstance.writeln('Accessing Neural Network...');
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.split('\n');
        
        termInstance.writeln(`\r\n\x1b[35mGemini:\x1b[0m`);
        text.forEach(line => termInstance.writeln(line));
    } catch (error) {
        termInstance.writeln(`\x1b[31mConnection Failed: ${error.message}\x1b[0m`);
    }
    prompt();
}

// --- 3. Code Generation Handler (hey ai "make code") ---
export async function handleAICode(promptText) {
    const codeRequest = `Generate a complete JavaScript code snippet for the following task: "${promptText}". Respond only with the markdown code block itself (e.g., \`\`\`javascript...\`\`\`). Do not include any explanatory text or notes.`;

    try {
        termInstance.writeln('Accessing Code Generation Module...');

        const result = await model.generateContent(codeRequest);
        const responseText = result.response.text().trim();
        
        // --- Code Extraction and Copy ---
        const codeStart = responseText.indexOf('```javascript') + 14;
        const codeEnd = responseText.lastIndexOf('```');
        const codeToCopy = responseText.substring(codeStart, codeEnd).trim();

        await navigator.clipboard.writeText(codeToCopy);
        
        // --- Terminal Output ---
        termInstance.writeln(`\r\n\x1b[35mGemini Code:\x1b[0m`);
        
        const lines = responseText.split('\n');
        lines.forEach(line => termInstance.writeln(line));
        
        termInstance.writeln(`\r\n\x1b[32m[Code copied to clipboard automatically!]\x1b[0m`);

    } catch (error) {
        termInstance.writeln(`\x1b[31mCode Generation Failed: ${error.message}\x1b[0m`);
    }
    prompt();
}
