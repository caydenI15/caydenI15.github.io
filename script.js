import { GoogleGenerativeAI } from "@google/generative-ai";

// --- PASTE YOUR KEY HERE ---
const SITE_API_KEY = "AIzaSyC5Rc5lbdbYuQKRwPzAts5S09eRL6eex7w"; 
// ---------------------------

let editor; // Global variable for the Monaco editor instance

// --- 1. INITIALIZE MONACO EDITOR ---
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: '// Write your JavaScript code here!\nconsole.log("Hello from the editor!");',
        language: 'javascript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        automaticLayout: true // Crucial for resizing
    });
});


// --- 2. INITIALIZE XTERM TERMINAL ---
const term = new Terminal({
    cursorBlink: true,
    fontFamily: '"Fira Code", courier-new, courier, monospace',
    fontSize: 14,
    theme: {
        background: '#000000',
        foreground: '#39ff14', 
        cursor: '#39ff14'
    }
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();
window.addEventListener('resize', () => fitAddon.fit());

// --- 3. TERMINAL AND AI SETUP ---
const genAI = new GoogleGenerativeAI(SITE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let currentLine = '';

// Initial welcome message
term.writeln('System Initialized.');
term.writeln('----------------------------------------');
term.writeln('Commands in Terminal: \x1b[1;33mai "prompt"\x1b[0m');
term.writeln('Code in Editor: \x1b[1;36mPress RUN or Ctrl+Enter\x1b[0m');
term.writeln('----------------------------------------');
prompt();

// --- 4. TERMINAL INPUT HANDLING (for AI commands only) ---
term.onData(e => {
    switch (e) {
        case '\r': // Enter
            term.write('\r\n');
            processTerminalCommand(currentLine);
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

// --- 5. RUN BUTTON & KEYBINDING LOGIC ---
const runButton = document.getElementById('run-button');
runButton.addEventListener('click', runCode);

// Add Ctrl+Enter binding to the editor
document.addEventListener('keydown', function(event) {
    // Check if the editor exists and if Ctrl/Cmd + Enter is pressed
    if (editor && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault(); // Stop default behavior
        runCode();
    }
});


// --- 6. CORE EXECUTION FUNCTIONS ---

// Executes the code from the Monaco Editor
function runCode() {
    if (!editor) {
        term.writeln('\x1b[33mEditor not ready yet. Please wait.\x1b[0m');
        return;
    }

    const code = editor.getValue();
    
    term.writeln('\r\n\x1b[34m[Code Run]\x1b[0m');
    
    // Clear the terminal's prompt area
    term.write('\r');
    
    // ⚠️ Overriding console.log temporarily to print to the terminal
    const originalLog = console.log;
    console.log = function(...args) {
        term.writeln(args.map(a => String(a)).join(' '));
    };

    try {
        // Execute the code using new Function, which is safer than eval for blocks
        new Function(code)();
    } catch (error) {
        term.writeln(`\x1b[31mCode Error: ${error.message}\x1b[0m`);
    } finally {
        // Restore console.log
        console.log = originalLog;
        prompt();
    }
}

// Handles commands typed directly into the Terminal (for AI or 'clear')
async function processTerminalCommand(input) {
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

    // If it's not AI or clear, assume it's simple JS command execution for convenience
     try {
        const result = eval(command);
        if (result !== undefined) {
            term.writeln(`\x1b[36m< ${result}\x1b[0m`);
        }
    } catch (error) {
        term.writeln(`\x1b[31mTerminal Error: ${error.message}\x1b[0m`);
    }
    prompt();
}

// Handles AI integration
async function handleAI(promptText) {
    try {
        term.writeln('Accessing Neural Network...');
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();
        
        term.writeln(`\r\n\x1b[35mGemini:\x1b[0m`);
        const lines = text.split('\n');
        lines.forEach(line => term.writeln(line));
    } catch (error) {
        term.writeln(`\x1b[31mConnection Failed: ${error.message}\x1b[0m`);
    }
    prompt();
}
