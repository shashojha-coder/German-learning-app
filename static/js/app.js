/* ===== MOBILE MENU ===== */
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

/* ===== TAB SWITCHING ===== */
function switchTab(tabId, btn) {
    // Hide all tab contents at the same level
    const parent = btn.closest('.container') || document.querySelector('.container');
    parent.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    parent.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    btn.classList.add('active');
}

/* ===== VOCAB CARD FLIP ===== */
function flipCard(card) {
    card.classList.toggle('flipped');
}

function toggleAll(sectionId) {
    const grid = document.getElementById('grid-' + sectionId);
    const cards = grid.querySelectorAll('.vocab-card');
    const anyFlipped = Array.from(cards).some(c => c.classList.contains('flipped'));
    cards.forEach(c => {
        if (anyFlipped) c.classList.remove('flipped');
        else c.classList.add('flipped');
    });
}

function shuffleCards(sectionId) {
    const grid = document.getElementById('grid-' + sectionId);
    const cards = Array.from(grid.children);
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        grid.appendChild(cards[j]);
        cards.splice(j, 1);
        /* re-push to keep consistent */
    }
    // Simpler: just shuffle the DOM
    const shuffled = Array.from(grid.children).sort(() => Math.random() - 0.5);
    shuffled.forEach(card => grid.appendChild(card));
}

/* ===== VOCAB QUIZ ===== */
const quizState = {};

function startQuiz(sectionId) {
    const section = vocabData.find(s => s.id === sectionId);
    if (!section) return;
    const words = [...section.words].sort(() => Math.random() - 0.5);
    quizState[sectionId] = { words, index: 0, correct: 0, total: 0 };
    document.getElementById('quiz-' + sectionId).classList.add('active');
    showQuizWord(sectionId);
}

function showQuizWord(sectionId) {
    const state = quizState[sectionId];
    if (!state || state.index >= state.words.length) {
        document.getElementById('quizWord-' + sectionId).textContent =
            `Done! ${state.correct}/${state.total} correct 🎉`;
        document.getElementById('quizInput-' + sectionId).style.display = 'none';
        return;
    }
    document.getElementById('quizWord-' + sectionId).textContent = state.words[state.index].de;
    document.getElementById('quizInput-' + sectionId).value = '';
    document.getElementById('quizInput-' + sectionId).style.display = '';
    document.getElementById('quizInput-' + sectionId).focus();
    document.getElementById('quizFeedback-' + sectionId).textContent = '';
}

function checkQuiz(sectionId) {
    const state = quizState[sectionId];
    if (!state || state.index >= state.words.length) return;
    const input = document.getElementById('quizInput-' + sectionId).value.trim().toLowerCase();
    const correct = state.words[state.index].en.toLowerCase();
    const feedback = document.getElementById('quizFeedback-' + sectionId);
    state.total++;
    if (input === correct || correct.includes(input) && input.length > 2) {
        state.correct++;
        feedback.textContent = '✅ Correct!';
        feedback.style.color = '#4CAF50';
    } else {
        feedback.textContent = `❌ Answer: ${state.words[state.index].en}`;
        feedback.style.color = '#f44336';
    }
    document.getElementById('quizScore-' + sectionId).textContent =
        `Score: ${state.correct} / ${state.total}`;
    state.index++;
    setTimeout(() => showQuizWord(sectionId), 1200);
}

function nextQuiz(sectionId) {
    const state = quizState[sectionId];
    if (!state) return;
    state.index++;
    showQuizWord(sectionId);
}

/* ===== SHUFFLE WORD BANKS ON PAGE LOAD ===== */
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.word-bank').forEach(function(bank) {
        const tiles = Array.from(bank.children);
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            bank.appendChild(tiles[j]);
            tiles.splice(j, 1);
        }
        // Final Fisher-Yates on DOM
        const shuffled = Array.from(bank.children).sort(() => Math.random() - 0.5);
        shuffled.forEach(el => bank.appendChild(el));
    });
});

/* ===== SENTENCE BUILDING (WORD BANK) ===== */
function selectWord(tile, sectionId, exIndex) {
    const answerArea = document.getElementById('answer-' + sectionId + '-' + exIndex);
    // Remove placeholder
    const placeholder = answerArea.querySelector('.answer-placeholder');
    if (placeholder) placeholder.remove();
    // Clone tile into answer area
    tile.classList.add('used');
    const answerTile = document.createElement('button');
    answerTile.className = 'word-tile';
    answerTile.textContent = tile.textContent;
    answerTile.onclick = function () {
        // Move back to bank
        tile.classList.remove('used');
        answerTile.remove();
        // If answer area empty, add placeholder back
        if (!answerArea.querySelector('.word-tile')) {
            const ph = document.createElement('span');
            ph.className = 'answer-placeholder';
            ph.textContent = 'Click words above to build your sentence...';
            answerArea.appendChild(ph);
        }
    };
    answerArea.appendChild(answerTile);
}

/* ===== CHECK SENTENCE ===== */
function checkSentence(sectionId, exIndex) {
    const inputEl = document.getElementById('input-' + sectionId + '-' + exIndex);
    const answerArea = document.getElementById('answer-' + sectionId + '-' + exIndex);
    const feedback = document.getElementById('feedback-' + sectionId + '-' + exIndex);
    const card = document.getElementById('ex-' + sectionId + '-' + exIndex);
    const correct = inputEl.dataset.correct;

    // Get answer from typed input or word bank
    let userAnswer = inputEl.value.trim();
    if (!userAnswer) {
        const tiles = answerArea.querySelectorAll('.word-tile');
        userAnswer = Array.from(tiles).map(t => t.textContent.trim()).join(' ');
    }
    if (!userAnswer) {
        feedback.textContent = 'Please build or type a sentence first.';
        feedback.className = 'exercise-feedback incorrect';
        return;
    }

    // Clean comparison
    const clean = s => s.replace(/[.!?]/g, '').trim().toLowerCase();
    const isCorrect = clean(userAnswer) === clean(correct);

    if (isCorrect) {
        feedback.textContent = '✅ Richtig! (Correct!)';
        feedback.className = 'exercise-feedback correct';
        card.classList.add('correct');
        card.classList.remove('incorrect');
    } else {
        feedback.innerHTML = `❌ Not quite. Expected: <strong>${correct}</strong>`;
        feedback.className = 'exercise-feedback incorrect';
        card.classList.add('incorrect');
        card.classList.remove('correct');
    }

    updateProgress(sectionId);
}

function revealAnswer(sectionId, exIndex) {
    const inputEl = document.getElementById('input-' + sectionId + '-' + exIndex);
    const feedback = document.getElementById('feedback-' + sectionId + '-' + exIndex);
    feedback.innerHTML = `💡 Answer: <strong>${inputEl.dataset.correct}</strong>`;
    feedback.className = 'exercise-feedback';
    feedback.style.background = '#eff6ff';
    feedback.style.color = '#1a56db';
}

function showHint(sectionId, exIndex) {
    const hint = document.getElementById('hint-' + sectionId + '-' + exIndex);
    hint.style.display = hint.style.display === 'none' ? 'inline-block' : 'none';
}

function updateProgress(sectionId) {
    if (typeof sentenceData === 'undefined') return;
    const section = sentenceData.find(s => s.id === sectionId);
    if (!section) return;
    const total = section.exercises.length;
    let correct = 0;
    for (let i = 0; i < total; i++) {
        const card = document.getElementById('ex-' + sectionId + '-' + i);
        if (card && card.classList.contains('correct')) correct++;
    }
    const pct = Math.round((correct / total) * 100);
    const fill = document.getElementById('progress-' + sectionId);
    const text = document.getElementById('scoreText-' + sectionId);
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = `${correct} / ${total} correct`;
}
