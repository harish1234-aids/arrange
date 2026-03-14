let allSequences = [];
let availableSequences = [];
let current = null;

function playSound(type) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(f, now + (i * 0.08));
            gain.gain.setValueAtTime(0.05, now + (i * 0.08));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.08) + 0.2);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + (i * 0.08)); osc.stop(now + (i * 0.08) + 0.2);
        });
    }
}

async function initGame() {
    try {
        const res = await fetch('/api/sequences');
        allSequences = await res.json();
        restartGame();
    } catch (e) { console.error("Failed to load sequences"); }
}

function restartGame() {
    availableSequences = [...allSequences];
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('restart-screen').style.display = 'none';
    nextQuestion();
}

function nextQuestion() {
    if (availableSequences.length === 0) {
        document.getElementById('game-area').style.display = 'none';
        document.getElementById('restart-screen').style.display = 'block';
        return;
    }
    const index = Math.floor(Math.random() * availableSequences.length);
    current = availableSequences.splice(index, 1)[0];
    renderCards(current.scrambled);
}

function renderCards(numbers) {
    const container = document.getElementById('display');
    container.innerHTML = "";
    document.getElementById('msg').innerText = "";

    numbers.forEach(num => {
        const div = document.createElement('div');
        div.className = "number-card";
        div.innerText = num;
        div.draggable = true;

        // --- Mouse Events ---
        div.addEventListener('dragstart', () => div.classList.add('dragging'));
        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            checkOrder();
        });

        // --- Touch Events (Mobile Support) ---
        div.addEventListener('touchstart', (e) => {
            div.classList.add('dragging');
        }, {passive: true});

        div.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const afterElement = getDragAfterElement(container, touch.clientX, touch.clientY);
            const dragging = document.querySelector('.dragging');
            if (afterElement == null) container.appendChild(dragging);
            else container.insertBefore(dragging, afterElement);
        }, {passive: false});

        div.addEventListener('touchend', () => {
            div.classList.remove('dragging');
            checkOrder();
        });

        container.appendChild(div);
    });

    // Mouse DragOver Logic
    container.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
        if (afterElement == null) container.appendChild(dragging);
        else container.insertBefore(dragging, afterElement);
    });
}

function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.number-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        // Check both X and Y for mobile wrapping support
        const offset = x - box.left - box.width / 2;
        const yOffset = y - box.top - box.height / 2;
        
        if (Math.abs(yOffset) < 40 && offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function checkOrder() {
    const currentOrder = [...document.querySelectorAll('.number-card')].map(el => parseInt(el.innerText));
    if (JSON.stringify(currentOrder) === JSON.stringify(current.pattern)) {
        playSound('success');
        document.getElementById('msg').innerText = "🌟 Perfectly Sorted!";
        document.querySelectorAll('.number-card').forEach(el => el.classList.add('correct'));
        // Disable dragging once correct
        document.querySelectorAll('.number-card').forEach(el => el.draggable = false);
        setTimeout(nextQuestion, 2000);
    }
}

initGame();