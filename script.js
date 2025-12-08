import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize Terminal
const term = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    theme: {
        background: '#000000',
        foreground: '#00ff00', // Hacker green text
        cursor: '#00ff00'
    }
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();

// Resize terminal if window changes
window.addEventListener('resize', () => fitAddon.fit());

// 2. State Management
let currentLine = '';
let apiKey = null;
let genAI = null;
let model = null;

// Welcome Message
term.writeln('Welcome to \x1b[1;34mGemini AI Terminal\x1b[0m');
term.writeln('Type standard JS to run it, or use \x1b[1;33mai "prompt"\x1b[0m to ask Gemini.');
term.writeln('');
prompt();

// 3. Handle Input
term.onData(e => {
    switch (e) {
        case '\r': // Enter key
            term.write('\r\n');
            processCommand(currentLine);
            currentLine = '';
            break;
        case '\u007F': // Backspace
            if (currentLine.length > 0) {
                term.write('\b \b');
                currentLine = currentLine.slice(0, -1);
            }
            break;
        default: // Normal typing
            currentLine += e;
            term.write(e);
    }
});

function prompt() {
    term.write('\r\n$ ');
}

// 4. Process Commands
async function processCommand(input) {
    const command = input.trim();

    if (!command) {
        prompt();
        return;
    }

    // Check if user wants to clear terminal
    if (command === 'clear') {
        term.clear();
        prompt();
        return;
    }

    // Check if command is an AI request
    if (command.startsWith('ai ')) {
        const promptText = command.substring(3); // Remove "ai "
        await handleAI(promptText);
        return;
    }

    // Otherwise, try to run it as JavaScript
    try {
        // Use eval to run JS code (Note: eval is risky in production, but okay for a personal playground)
        const result = eval(command);
        if (result !== undefined) {
            term.writeln(`\x1b[36m< ${result}\x1b[0m`); // Cyan color for output
        }
    } catch (error) {
        term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`); // Red color for errors
    }
    
    prompt();
}

// 5. Gemini AI Logic
async function handleAI(promptText) {
    // If we don't have a key, ask for it
    if (!apiKey) {
        term.writeln('\x1b[33m[System]: Gemini API Key required for this session.\x1b[0m');
        term.writeln('Please paste your API Key below (it will not be saved permanently):');
        
        // Simple trick to get key securely without showing it
        const key = await promptSecret();
        if (!key) {
            term.writeln('Cancelled.');
            prompt();
            return;
        }
        
        apiKey = key;
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        term.writeln('\x1b[32mKey accepted. Asking Gemini...\x1b[0m');
    }

    try {
        term.writeln('Thinking...');
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();
        
        // Formatting the output slightly
        term.writeln(`\r\n\x1b[35mGemini:\x1b[0m`);
        
        // Split by newlines to keep terminal clean
        const lines = text.split('\n');
        lines.forEach(line => term.writeln(line));
        
    } catch (error) {
        term.writeln(`\x1b[31mAI Error: ${error.message}\x1b[0m`);
    }
    prompt();
}

// Helper to ask for password/key without echoing to screen
function promptSecret() {
    return new Promise((resolve) => {
        let secret = '';
        term.write('Key: ');
        
        const disposable = term.onData(e => {
            if (e === '\r') { // Enter
                term.write('\r\n');
                disposable.dispose();
                resolve(secret.trim());
            } else if (e === '\u007F') { // Backspace
                if (secret.length > 0) {
                    secret = secret.slice(0, -1);
                }
            } else {
                secret += e;
                // Don't write to terminal (hidden input)
                term.write('*'); 
            }
        });
    });
}
