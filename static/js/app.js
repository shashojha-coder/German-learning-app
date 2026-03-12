// ===== GLOBAL ERROR BANNER =====
function showError(msg) {
    const el = document.getElementById('globalError');
    if (el) {
        el.textContent = msg;
        el.style.display = '';
        setTimeout(() => { el.style.display = 'none'; }, 6000);
    } else {
        alert(msg);
    }
}

function hideError() {
    const el = document.getElementById('globalError');
    if (el) el.style.display = 'none';
}
// ====== AUDIO (TTS) SUPPORT ======
function playAudio(text) {
    try {
        if (!window.speechSynthesis) throw new Error('Speech synthesis not supported.');
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = 'de-DE';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    } catch (e) {
        showError(e.message || 'Audio playback failed.');
    }
}

function playQuizAudio(sectionId) {
    if (typeof quizState === 'undefined' || !quizState[sectionId]) return;
    const state = quizState[sectionId];
    if (!state.words || state.index >= state.words.length) return;
    const word = state.words[state.index]?.de;
    if (word) playAudio(word);
}

function playSentenceAudio(sectionId) {
    if (typeof unlimitedState === 'undefined' || !unlimitedState[sectionId]) return;
    const state = unlimitedState[sectionId];
    const sentence = state.exercise?.answer;
    if (sentence) playAudio(sentence);
}
// ====== PERSISTENT PROGRESS HELPERS ======
function saveUnlimitedProgress(sectionId) {
    try {
        const state = unlimitedState[sectionId];
        if (!state) return;
        localStorage.setItem('unlimited_' + sectionId, JSON.stringify({
            correct: state.correct,
            wrong: state.wrong,
            total: state.total
        }));
    } catch (e) {
        showError('Could not save progress.');
    }
}

function loadUnlimitedProgress(sectionId) {
    try {
        const raw = localStorage.getItem('unlimited_' + sectionId);
        if (!raw) return { correct: 0, wrong: 0, total: 0 };
        const obj = JSON.parse(raw);
        return {
            correct: obj.correct || 0,
            wrong: obj.wrong || 0,
            total: obj.total || 0
        };
    } catch (e) { return { correct: 0, wrong: 0, total: 0 }; }
}

function saveQuizProgress(sectionId) {
    try {
        const state = quizState[sectionId];
        if (!state) return;
        localStorage.setItem('quiz_' + sectionId, JSON.stringify({
            index: state.index,
            correct: state.correct,
            total: state.total
        }));
    } catch (e) {
        showError('Could not save quiz progress.');
    }
}

function loadQuizProgress(sectionId) {
    try {
        const raw = localStorage.getItem('quiz_' + sectionId);
        if (!raw) return { index: 0, correct: 0, total: 0 };
        const obj = JSON.parse(raw);
        return {
            index: obj.index || 0,
            correct: obj.correct || 0,
            total: obj.total || 0
        };
    } catch (e) { return { index: 0, correct: 0, total: 0 }; }
}
/* ===== MOBILE MENU ===== */
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

/* ===== THEME TOGGLE ===== */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}
// Initialize theme on page load
// Initialize theme on page load
(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Update icon after DOM is ready
    document.addEventListener('DOMContentLoaded', () => updateThemeIcon(theme));
})();

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
    quizState[sectionId] = {
        words,
        index: 0,
        correct: 0,
        total: 0,
        missed: [], // store missed word indices
        streak: 0 // correct answer streak
    };
    document.getElementById('quiz-' + sectionId).classList.add('active');
    showQuizWord(sectionId);
}

function showQuizWord(sectionId) {
    const state = quizState[sectionId];
    // If missed words exist, prioritize them
    if (state.missed && state.missed.length > 0) {
        state.index = state.missed.shift();
    }
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
    // If streak >= 3, hide placeholder to increase challenge
    if (state.streak >= 3) {
        document.getElementById('quizInput-' + sectionId).placeholder = '';
    } else {
        document.getElementById('quizInput-' + sectionId).placeholder = 'Type the English meaning...';
    }
}

function checkQuiz(sectionId) {
    const state = quizState[sectionId];
    if (!state || state.index >= state.words.length) {
        showError('Quiz state error. Please restart the quiz.');
        return;
    }
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
    state.total++;
    if (input === correct || (correct.includes(input) && input.length > 2)) {
        state.correct++;
        state.streak = (state.streak || 0) + 1;
        feedback.textContent = '✅ Correct!';
        feedback.style.color = '#4CAF50';
    } else {
        feedback.textContent = `❌ Answer: ${state.words[state.index].en}`;
        feedback.style.color = '#f44336';
        // Add missed index to repeat soon
        if (!state.missed) state.missed = [];
        state.missed.push(state.index);
        state.streak = 0;
    }
    document.getElementById('quizScore-' + sectionId).textContent =
        `Score: ${state.correct} / ${state.total}`;
    // Save progress
    saveQuizProgress(sectionId);
    // Next: if missed, repeat soon; else, go to next
    if (state.missed && state.missed.length > 0) {
        setTimeout(() => showQuizWord(sectionId), 1200);
    } else {
        state.index++;
        setTimeout(() => showQuizWord(sectionId), 1200);
    }
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            bank.appendChild(tiles[j]);
            tiles.splice(j, 1);
        }
        // Final Fisher-Yates on DOM
        const shuffled = Array.from(bank.children).sort(() => Math.random() - 0.5);
        shuffled.forEach(el => bank.appendChild(el));
    });

    // Restore unlimited progress stats on load
    if (typeof sentenceData !== 'undefined') {
        sentenceData.forEach(function(sec) {
            const stats = loadUnlimitedProgress(sec.id);
            document.getElementById('uCorrect-' + sec.id).textContent = '✅ ' + stats.correct;
            document.getElementById('uWrong-' + sec.id).textContent = '❌ ' + stats.wrong;
            document.getElementById('uTotal-' + sec.id).textContent = '📝 ' + stats.total + ' practiced';
            const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            const fill = document.getElementById('uProgress-' + sec.id);
            const scoreText = document.getElementById('uScoreText-' + sec.id);
            if (fill) fill.style.width = pct + '%';
            if (scoreText) scoreText.textContent = stats.correct + ' / ' + stats.total + ' correct (' + pct + '%)';
        });
    }

    // Restore quiz progress stats on load
    if (typeof vocabData !== 'undefined') {
        vocabData.forEach(function(sec) {
            const stats = loadQuizProgress(sec.id);
            const score = document.getElementById('quizScore-' + sec.id);
            if (score) score.textContent = `Score: ${stats.correct} / ${stats.total}`;
        });
    }
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
    try {
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
    } catch (e) {
        showError('An error occurred while checking your answer.');
    }
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

/* ===== UNLIMITED PRACTICE MODE ===== */
const unlimitedState = {};

function nextUnlimited(sectionId) {
    if (typeof SentenceGenerator === 'undefined') return;
    const exercise = SentenceGenerator.getExercise(sectionId);
    if (!exercise) return;

    // Store current exercise
    unlimitedState[sectionId] = {
        exercise: exercise,
        answered: false,
        correct: unlimitedState[sectionId] ? unlimitedState[sectionId].correct : 0,
        wrong: unlimitedState[sectionId] ? unlimitedState[sectionId].wrong : 0,
        total: unlimitedState[sectionId] ? unlimitedState[sectionId].total : 0,
    };

    // Update prompt
    document.getElementById('uPrompt-' + sectionId).textContent = exercise.prompt;

    // Clear feedback
    const feedback = document.getElementById('uFeedback-' + sectionId);
    feedback.textContent = '';
    feedback.className = 'exercise-feedback';

    // Clear input
    document.getElementById('uInput-' + sectionId).value = '';

    // Hide hint
    document.getElementById('uHint-' + sectionId).style.display = 'none';
    document.getElementById('uHint-' + sectionId).textContent = exercise.hint;

    // Build word bank
    const bank = document.getElementById('uBank-' + sectionId);
    bank.innerHTML = '';
    exercise.words.forEach(function(word) {
        const btn = document.createElement('button');
        btn.className = 'word-tile';
        btn.textContent = word;
        btn.onclick = function() { selectUnlimitedWord(btn, sectionId); };
        bank.appendChild(btn);
    });

    // Clear answer area
    const answerArea = document.getElementById('uAnswer-' + sectionId);
    answerArea.innerHTML = '<span class="answer-placeholder">Click words above to build your sentence...</span>';

    // Reset card style
    const card = document.getElementById('uCard-' + sectionId);
    card.classList.remove('correct', 'incorrect');
}

function selectUnlimitedWord(tile, sectionId) {
    const answerArea = document.getElementById('uAnswer-' + sectionId);
    const placeholder = answerArea.querySelector('.answer-placeholder');
    if (placeholder) placeholder.remove();

    tile.classList.add('used');
    const answerTile = document.createElement('button');
    answerTile.className = 'word-tile';
    answerTile.textContent = tile.textContent;
    answerTile.onclick = function() {
        tile.classList.remove('used');
        answerTile.remove();
        if (!answerArea.querySelector('.word-tile')) {
            const ph = document.createElement('span');
            ph.className = 'answer-placeholder';
            ph.textContent = 'Click words above to build your sentence...';
            answerArea.appendChild(ph);
        }
    };
    answerArea.appendChild(answerTile);
}

function checkUnlimited(sectionId) {
    const state = unlimitedState[sectionId];
    if (!state || !state.exercise || state.answered) return;

    const input = document.getElementById('uInput-' + sectionId);
    const answerArea = document.getElementById('uAnswer-' + sectionId);
    const feedback = document.getElementById('uFeedback-' + sectionId);
    const card = document.getElementById('uCard-' + sectionId);

    // Get user answer from typed input or word bank
    let userAnswer = input.value.trim();
    if (!userAnswer) {
        const tiles = answerArea.querySelectorAll('.word-tile');
        userAnswer = Array.from(tiles).map(t => t.textContent.trim()).join(' ');
    }
    if (!userAnswer) {
        feedback.textContent = 'Please build or type a sentence first.';
        feedback.className = 'exercise-feedback incorrect';
        return;
    }

    const clean = s => s.replace(/[.!?,]/g, '').trim().toLowerCase();
    const isCorrect = clean(userAnswer) === clean(state.exercise.answer);

    state.answered = true;
    state.total++;

    if (isCorrect) {
        state.correct++;
        feedback.textContent = '✅ Richtig! (Correct!)';
        feedback.className = 'exercise-feedback correct';
        card.classList.add('correct');
    } else {
        state.wrong++;
        feedback.innerHTML = '❌ Not quite. Expected: <strong>' + state.exercise.answer + '</strong>';
        feedback.className = 'exercise-feedback incorrect';
        card.classList.add('incorrect');
    }

    // Update stats
    document.getElementById('uCorrect-' + sectionId).textContent = '✅ ' + state.correct;
    document.getElementById('uWrong-' + sectionId).textContent = '❌ ' + state.wrong;
    document.getElementById('uTotal-' + sectionId).textContent = '📝 ' + state.total + ' practiced';

    // Update progress bar
    const pct = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;
    const fill = document.getElementById('uProgress-' + sectionId);
    const scoreText = document.getElementById('uScoreText-' + sectionId);
    if (fill) fill.style.width = pct + '%';
    if (scoreText) scoreText.textContent = state.correct + ' / ' + state.total + ' correct (' + pct + '%)';
}

function revealUnlimited(sectionId) {
    const state = unlimitedState[sectionId];
    if (!state || !state.exercise) return;
    const feedback = document.getElementById('uFeedback-' + sectionId);
    feedback.innerHTML = '💡 Answer: <strong>' + state.exercise.answer + '</strong>';
    feedback.className = 'exercise-feedback';
    feedback.style.background = '#eff6ff';
    feedback.style.color = '#1a56db';
}

function toggleUnlimitedHint(sectionId) {
    const hint = document.getElementById('uHint-' + sectionId);
    hint.style.display = hint.style.display === 'none' ? 'inline-block' : 'none';
}

function clearUnlimitedAnswer(sectionId) {
    // Reset word bank tiles
    const bank = document.getElementById('uBank-' + sectionId);
    bank.querySelectorAll('.word-tile.used').forEach(function(tile) {
        tile.classList.remove('used');
    });
    // Reset answer area
    const answerArea = document.getElementById('uAnswer-' + sectionId);
    answerArea.innerHTML = '<span class="answer-placeholder">Click words above to build your sentence...</span>';
    // Clear typed input
    document.getElementById('uInput-' + sectionId).value = '';
}

/* ===== CANVAS-BASED BURST ANIMATION (5000 particles, smooth) ===== */
function burstAndNavigate(event, href) {
    event.preventDefault();
    event.stopPropagation();
    
    const container = document.getElementById('bubble-container');
    if (!container) {
        window.location.href = href;
        return;
    }
    
    // Create canvas for GPU-accelerated rendering
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const colors = ['#667eea', '#764ba2', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    const rect = event.target.getBoundingClientRect();
    const clickX = event.clientX || (rect.left + rect.width / 2);
    const clickY = event.clientY || (rect.top + rect.height / 2);
    
    // Create ~600 particles (lightweight, smooth on mobile)
    const particles = [];
    
    // Expanding from click (200)
    for (let i = 0; i < 200; i++) {
        const angle = (Math.PI * 2 / 200) * i + Math.random() * 0.3;
        const speed = Math.random() * 8 + 3;
        particles.push({
            x: clickX,
            y: clickY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 6 + 2,
            color: colors[i % colors.length],
            alpha: 1,
            decay: Math.random() * 0.02 + 0.015
        });
    }
    
    // Rising bubbles (150)
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * screenW,
            y: screenH + Math.random() * 100,
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 6 + 4),
            size: Math.random() * 5 + 2,
            color: colors[i % colors.length],
            alpha: 1,
            decay: Math.random() * 0.015 + 0.01
        });
    }
    
    // Sparkles everywhere (150)
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * screenW,
            y: Math.random() * screenH,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: Math.random() * 4 + 1,
            color: colors[i % colors.length],
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02
        });
    }
    
    // Falling confetti (100)
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * screenW,
            y: -Math.random() * 100,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 5 + 3,
            size: Math.random() * 5 + 2,
            color: colors[i % colors.length],
            alpha: 1,
            decay: Math.random() * 0.012 + 0.008,
            isRect: i % 2 === 0
        });
    }
    
    let animationId;
    const startTime = performance.now();
    
    function animate() {
        ctx.clearRect(0, 0, screenW, screenH);
        
        let alive = false;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.alpha <= 0) continue;
            
            alive = true;
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            
            if (p.isRect) {
                ctx.fillRect(p.x, p.y, p.size, p.size * 1.5);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        if (alive && performance.now() - startTime < 800) {
            animationId = requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }
    
    animationId = requestAnimationFrame(animate);
    
    // Page transition
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        mainContainer.classList.add('page-transitioning');
    }
    
    // Navigate (quick transition)
    setTimeout(() => {
        window.location.href = href;
    }, 600);
}
