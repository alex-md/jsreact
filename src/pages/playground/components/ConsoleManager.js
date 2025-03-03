export class ConsoleManager {
    constructor() {
        this.container = document.getElementById('console');
        this.content = document.getElementById('console-content');
    }

    log(message, type = 'log') {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = message;
        this.content.appendChild(line);
        this.content.scrollTop = this.content.scrollHeight;
    }

    clear() {
        this.content.innerHTML = '';
    }

    toggle(state) {
        state.consoleVisible = !state.consoleVisible;
        this.container.classList.toggle('visible');
    }
}
