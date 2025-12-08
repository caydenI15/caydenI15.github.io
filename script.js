import { GoogleGenerativeAI } from "@google/generative-ai";

// --- PASTE YOUR KEY HERE ---
// Anyone who views the website code can see this key.
const SITE_API_KEY = "AIzaSyBJzNK3wElCfWy1KWl2xSEY8eOUcHtLj8A"; 
// ---------------------------

// 1. Setup Terminal
const term = new Terminal({
    cursorBlink: true,
    fontFamily: '"Fira Code", courier-new, courier, monospace',
    fontSize: 15,
    theme: {
        background: '#000000',
        foreground: '#39ff14', // Neon Green
        cursor: '#39ff14'
    }
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();

window.addEventListener('resize', () => fitAddon.fit());

// 2. Initialize AI Immediately
const genAI = new GoogleGenerativeAI(SITE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 3. Welcome Message
term.writeln('Initializing System for \x1b[1;36mCayden\x1b[0m...');
term.writeln('Connect Status: \x1b[1;32mONLINE\x1b[0m');
term.writeln('----------------------------------------');
term.writeln('COMMANDS:');
term.writeln('  > Type JS code to run it (e.g. 100/4)');
term.writeln('  > Type \x1b[1;33mai "question"\x1b[0m to ask Gemini');
term.writeln('  > Type \x1b[1;31mclear\x1b[0m to clean screen');
term.writeln('----------------------------------------');
prompt();

let currentLine = '';

// 4. Typing Handler
term.onData(e => {
    switch (e) {
        case '\r': // Enter
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
        default:
            currentLine += e;
            term.write(e);
    }
});

function prompt() {
    term.write('\r\nroot@cayden:~$ ');
}

// 5. Logic
async function processCommand(input) {
    const command = input.trim();
    if (!command) { prompt(); return; }

    if (command === 'clear') {
        term.clear();
        prompt();
        return;
    }

    if (command.startsWith('ai ')) {
        const promptText = command.substring(3);
        await handleAI(promptText);
        return;
    }

    try {
        const result = eval(command);
        if (result !== undefined) {
            term.writeln(`\x1b[36m< ${result}\x1b[0m`);
        }
    } catch (error) {
        term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
    }
    prompt();
}

async function handleAI(promptText) {
    try {
        term.writeln('Thinking...');
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();
        
        term.writeln(`\r\n\x1b[35mGemini:\x1b[0m`);
        const lines = text.split('\n');
        lines.forEach(line => term.writeln(line));
    } catch (error) {
        term.writeln(`\x1b[31mConnection Failed: ${error.message}\x1b[0m`);
        term.writeln('Note: The API Key might have exceeded its free limit.');
    }
    prompt();
}
