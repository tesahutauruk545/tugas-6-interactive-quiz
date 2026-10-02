/* ============================================================
   DATA SOAL (7 soal, akan diacak dan diambil 5 setiap sesi)
   ============================================================ */
const QUESTIONS = [
  { category: "Sains", question: "Planet terbesar di tata surya kita adalah?", options: ["Mars", "Jupiter", "Saturnus", "Bumi"], answer: 1 },
  { category: "Teknologi", question: "Bahasa pemrograman apa yang berjalan di browser?", options: ["Python", "Java", "JavaScript", "C++"], answer: 2 },
  { category: "Geografi", question: "Ibu kota Jepang adalah?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], answer: 2 },
  { category: "Sejarah", question: "Tahun berapa Indonesia merdeka?", options: ["1942", "1945", "1950", "1965"], answer: 1 },
  { category: "Matematika", question: "Berapa hasil dari 8 × 7?", options: ["54", "56", "63", "48"], answer: 1 },
  { category: "Sains", question: "Simbol kimia untuk air adalah?", options: ["CO2", "O2", "H2O", "NaCl"], answer: 2 },
  { category: "Teknologi", question: "Siapa pendiri Microsoft?", options: ["Steve Jobs", "Elon Musk", "Bill Gates", "Mark Zuckerberg"], answer: 2 }
];

/* ============================================================
   STATE MANAGEMENT
   ============================================================ */
const state = {
  questions: [],
  current: 0,
  score: 0,
  timer: null,
  timeLeft: 15,
  TIME_PER_Q: 15,
  answered: false
};

/* ============================================================
   DOM HELPERS
   ============================================================ */
const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

/* ============================================================
   LOCALSTORAGE — HIGH SCORE & THEME (TesaQuiz)
   ============================================================ */
function getHighScore() { return parseInt(localStorage.getItem('tesaquizHighScore') || '0', 10); }
function setHighScore(score) {
  const current = getHighScore();
  if (score > current) { localStorage.setItem('tesaquizHighScore', score); return true; }
  return false;
}
function updateHighScoreDisplay() { $('highScoreValue').textContent = getHighScore(); }

/* ============================================================
   TIMER LOGIC
   ============================================================ */
const CIRCUMFERENCE = 2 * Math.PI * 30; // r=30

function startTimer() {
  state.timeLeft = state.TIME_PER_Q;
  updateTimerUI();
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();
    if (state.timeLeft <= 0) { clearInterval(state.timer); handleTimeout(); }
  }, 1000);
}

function updateTimerUI() {
  const t = state.timeLeft;
  const ratio = t / state.TIME_PER_Q;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const circle = $('timerCircle');
  circle.style.strokeDashoffset = offset;
  circle.classList.remove('warning', 'danger');
  if (t <= 5) circle.classList.add('danger');
  else if (t <= 10) circle.classList.add('warning');
  $('timerText').textContent = t;
}

function handleTimeout() {
  if (state.answered) return;
  state.answered = true;
  const opts = document.querySelectorAll('.option');
  opts[state.questions[state.current].answer].classList.add('correct');
  opts.forEach(o => o.classList.add('disabled'));
  setTimeout(nextQuestion, 1400);
}

/* ============================================================
   RENDER SOAL (Menggunakan createElement & textContent)
   ============================================================ */
function renderQuestion() {
  state.answered = false;
  const q = state.questions[state.current];

  $('progressBar').style.width = ((state.current) / state.questions.length * 100) + '%';
  $('questionCounter').textContent = `${state.current + 1} / ${state.questions.length}`;

  $('categoryTag').textContent = q.category;
  $('questionText').textContent = q.question;

  const container = $('optionsContainer');
  container.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.dataset.index = i;

    const letter = document.createElement('span');
    letter.className = 'letter';
    letter.textContent = letters[i];

    const text = document.createElement('span');
    text.textContent = opt;

    btn.appendChild(letter);
    btn.appendChild(text);
    container.appendChild(btn);
  });

  // Trigger reflow untuk restart animasi
  const card = $('questionCard');
  card.style.animation = 'none';
  card.offsetHeight; 
  card.style.animation = 'screenIn 0.5s var(--ease)';

  startTimer();
}

/* ============================================================
   EVENT DELEGATION UNTUK JAWABAN
   ============================================================ */
$('optionsContainer').addEventListener('click', (e) => {
  if (state.answered) return;
  const btn = e.target.closest('.option');
  if (!btn) return;

  state.answered = true;
  clearInterval(state.timer);

  const idx = parseInt(btn.dataset.index, 10);
  const correctIdx = state.questions[state.current].answer;

  document.querySelectorAll('.option').forEach(o => o.classList.add('disabled'));

  if (idx === correctIdx) {
    btn.classList.add('correct');
    state.score++;
    miniConfetti(btn);
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.option')[correctIdx].classList.add('correct');
  }

  setTimeout(nextQuestion, 1300);
});

/* ============================================================
   NAVIGASI & HASIL
   ============================================================ */
function nextQuestion() {
  state.current++;
  if (state.current >= state.questions.length) { finishQuiz(); } 
  else { renderQuestion(); }
}

function finishQuiz() {
  clearInterval(state.timer);
  $('progressBar').style.width = '100%';

  const score = state.score;
  const total = state.questions.length;
  const pct = Math.round((score / total) * 100);
  const isNew = setHighScore(score);
  const high = getHighScore();

  $('finalScore').textContent = `${score} / ${total}`;
  $('finalHigh').textContent = high;
  $('finalHigh').classList.toggle('new-record', isNew);

  let emoji, title, subtitle;
  if (pct === 100)      { emoji='👑'; title='SEMPURNA!'; subtitle='Kamu jenius banget!'; }
  else if (pct >= 80)   { emoji='🎉'; title='HEBAT!'; subtitle='Hampir sempurna!'; }
  else if (pct >= 60)   { emoji='😊'; title='BAGUS!'; subtitle='Terus tingkatkan ya!'; }
  else if (pct >= 40)   { emoji='💪'; title='LUMAYAN!'; subtitle='Ayo coba lagi!'; }
  else                  { emoji='📚'; title='JANGAN MENYERAH!'; subtitle='Belajar lagi ya!'; }

  $('resultEmoji').textContent = emoji;
  $('resultTitle').textContent = title;
  $('resultSubtitle').textContent = subtitle;

  showScreen('resultScreen');
  if (pct >= 60) launchConfetti();
}

function startQuiz() {
  state.current = 0;
  state.score = 0;
  state.questions = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  showScreen('quizScreen');
  renderQuestion();
}

/* ============================================================
   CONFETTI SYSTEM (Canvas)
   ============================================================ */
const canvas = $('confetti');
const ctx = canvas.getContext('2d');
let particles = [];
let animFrame;

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function launchConfetti() {
  particles = [];
  const colors = ['#ec4899','#06b6d4','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2,
      size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }
  cancelAnimationFrame(animFrame);
  animateConfetti();
}

function miniConfetti(el) {
  const rect = el.getBoundingClientRect();
  const colors = ['#10b981','#06b6d4','#ec4899'];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
      vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 3,
      size: Math.random() * 5 + 3, color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 15,
      shape: 'circle', life: 60
    });
  }
  if (!animFrame) animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.rot += p.rotSpeed;
    if (p.life !== undefined) p.life--;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life !== undefined ? p.life / 60 : 1;
    if (p.shape === 'rect') ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
    else { ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();

    return p.y < canvas.height + 50 && (p.life === undefined || p.life > 0);
  });
  if (particles.length > 0) animFrame = requestAnimationFrame(animateConfetti);
  else { animFrame = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

/* ============================================================
   EVENT LISTENERS & INIT
   ============================================================ */
$('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  $('themeToggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('tesaquizTheme', isDark ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem('tesaquizTheme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  $('themeToggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
}

$('startBtn').addEventListener('click', startQuiz);
$('restartBtn').addEventListener('click', startQuiz);
$('homeBtn').addEventListener('click', () => { updateHighScoreDisplay(); showScreen('startScreen'); });

document.addEventListener('keydown', (e) => {
  if (!$('quizScreen').classList.contains('active') || state.answered) return;
  const key = parseInt(e.key, 10);
  if (key >= 1 && key <= 4) {
    const opts = document.querySelectorAll('.option');
    if (opts[key - 1]) opts[key - 1].click();
  }
});

updateHighScoreDisplay();