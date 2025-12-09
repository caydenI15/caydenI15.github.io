// Import the AI functions from the new file
import { initAI, handleAIGeneral, handleAICode } from './aiHandler.js'; 

// ⚠️ API KEY MUST BE HERE, CORRECTLY QUOTED!
const SITE_API_KEY = "AIzaSyALyRbtMjiaWDbl1z7-G8xM5-hJFUcgxyE"; 

let editor; 
const term = new Terminal({
    cursorBlink: true,
    fontFamily: '"Fira Code", courier-new, courier, monospace',
    fontSize: 14,
    theme: { background: '#000000', foreground: '#39ff14', cursor: '#39ff14' }
});
const fitAddon = new FitAddon.FitAddon();

// --- 1. INITIALIZATION ---
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: '// Write your JavaScript code here!\nconsole.log("Hello from the editor!");',
        language: 'javascript', theme: 'vs-dark', minimap: { enabled: false }, automaticLayout: true
    });
});

term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();
window.addEventListener('resize', () => fitAddon.fit());

// Initialize AI Handler (Passing the key and terminal instance)
initAI(SITE_API_KEY, term);

term.writeln('System Initialized. Running on \x1b[1;36mGemini 2.5 Flash\x1b[0m.');
term.writeln('Commands: \x1b[1;33mai "prompt"\x1b[0m or \x1b[1;33mhey ai "code"\x1b[0m');
term.writeln('----------------------------------------');
prompt();

let currentLine = '';

// --- 2. COMMAND ROUTING & INPUT ---
term.onData(e => {
    switch (e) {
        case '\r':
            term.write('\r\n');
            processTerminalCommand(currentLine);
            currentLine = '';
            break;
        case '\u007F':
            if (currentLine.length > 0) { term.write('\b \b'); currentLine = currentLine.slice(0, -1); }
            break;
        default:
            currentLine += e;
            term.write(e);
    }
});

function prompt() { term.write('\r\nroot@cayden:~$ '); }

async function processTerminalCommand(input) {
    const command = input.trim();
    if (!command) { prompt(); return; }

    if (command === 'clear') { term.clear(); prompt(); return; }
    
    if (command.startsWith('hey ai ')) { 
        await handleAICode(command.substring(7));
        return;
    }
    
    if (command.startsWith('ai ')) {
        await handleAIGeneral(command.substring(3));
        return;
    }

     try {
        const result = eval(command);
        if (result !== undefined) { term.writeln(`\x1b[36m< ${result}\x1b[0m`); }
    } catch (error) {
        term.writeln(`\x1b[31mTerminal Error: ${error.message}\x1b[0m`);
    }
    prompt();
}

// --- 3. RUN BUTTON LOGIC ---
const runButton = document.getElementById('run-button');
runButton.addEventListener('click', runCode);

document.addEventListener('keydown', function(event) {
    if (editor && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault(); 
        runCode();
    }
});

function runCode() {
    if (!editor) { term.writeln('\x1b[33mEditor not ready yet. Please wait.\x1b[0m'); return; }

    const code = editor.getValue();
    term.writeln('\r\n\x1b[34m[Code Run]\x1b[0m');
    term.write('\r');
    
    const originalLog = console.log;
    console.log = function(...args) { term.writeln(args.map(a => String(a)).join(' ')); };

    try { new Function(code)(); } 
    catch (error) { term.writeln(`\x1b[31mCode Error: ${error.message}\x1b[0m`); } 
    finally { console.log = originalLog; prompt(); }
}
