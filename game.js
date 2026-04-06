console.log("KODARI JAM V2 ENGINE SCRIPT");

// --- CONFIG ---
const KEY_MAPPING = {
    's': 0, 'S': 0,
    'd': 1, 'D': 1,
    'f': 2, 'F': 2,
    ' ': 3, 'Space': 3,
    'j': 4, 'J': 4,
    'k': 5, 'K': 5,
    'l': 6, 'L': 6
};

// Colors for 7 lanes (White, Blue, White, Gold, White, Blue, White)
const LANE_COLORS = ['white', 'blue', 'white', 'gold', 'white', 'blue', 'white'];

// Judge Windows (pixels, assuming speed=600px/s)
const JUDGE_PX = { COOL: 40, GOOD: 80, MISS: 120 };

// --- STATE ---
let isRunning = false;
let isDemoMode = false; // 데모 모드: 노트 100% 히트 + HP 무적
let isAutoPlay = false;
let lastTime = 0;
const noteSpeed = 600;
let notes = [];
let hitLineY = 0;
let activeItems = [];
let hasRevived = false;
let currentConfig = null;

// Scoring & Stats
let score = 0;
let combo = 0;
let hp = 100;
let totalHits = 0;
let totalMisses = 0;

// --- ELEMENTS ---
// --- ELEMENTS (Initialized via initGame or globally) ---
let trackContainer, noteLayer, lanes, scoreEl, comboEl, judgeEl, hpBarFill;

function initGameElements() {
    trackContainer = document.getElementById('track-container');
    noteLayer = document.getElementById('note-layer');
    lanes = document.querySelectorAll('.lane');
    scoreEl = document.getElementById('score-display');
    comboEl = document.getElementById('combo-display');
    judgeEl = document.getElementById('judgment-display');
    hpBarFill = document.getElementById('hp-bar-fill');
}

// Initial attempt at top-level (safe with new window.onload in index.html)
initGameElements();

function updateStats() {
    if (hpBarFill) {
        hpBarFill.style.width = hp + '%';
        if (hp <= 30) {
            hpBarFill.classList.add('critical');
        } else {
            hpBarFill.classList.remove('critical');
        }
    }
}

// --- RESIZE HANDLER ---
function updateMetrics() {
    if (!trackContainer) return;
    const trackRect = trackContainer.getBoundingClientRect();
    hitLineY = trackRect.height - 35; // 20px bottom + 15px height/2 approx
}
window.addEventListener('resize', updateMetrics);

// --- INPUT SYSTEM ---
document.addEventListener('keydown', e => {
    if (KEY_MAPPING.hasOwnProperty(e.key) && !e.repeat) {
        triggerInput(KEY_MAPPING[e.key], true);
    }
});
document.addEventListener('keyup', e => {
    if (KEY_MAPPING.hasOwnProperty(e.key)) {
        triggerInput(KEY_MAPPING[e.key], false);
    }
});

function triggerInput(laneIdx, isDown) {
    const lane = lanes[laneIdx];
    if (!lane) return;

    if (isDown) {
        lane.classList.add('active');
        lane.classList.add('press');
        if (!isAutoPlay) checkHit(laneIdx); // Only check hit if not auto (or hybrid?)
        // Actually for this demo, let's allow manual hit even in auto mode
        checkHit(laneIdx);
    } else {
        lane.classList.remove('active');
        lane.classList.remove('press');
    }
}

function checkHit(laneIdx) {
    const laneNotes = notes.filter(n => n.lane === laneIdx && n.active);
    if (laneNotes.length === 0) return;

    laneNotes.sort((a, b) => Math.abs(a.y - hitLineY) - Math.abs(b.y - hitLineY));

    const target = laneNotes[0];
    const dist = Math.abs(target.y - hitLineY);

    if (dist <= getJudgeWindow('MISS')) {
        let type = 'MISS';
        let point = 0;

        if (dist <= getJudgeWindow('COOL')) { type = 'COOL'; point = 300; }
        else if (dist <= getJudgeWindow('GOOD')) { type = 'GOOD'; point = 100; }

        target.active = false;
        target.el.remove();

        const idx = notes.indexOf(target);
        if (idx > -1) notes.splice(idx, 1);

        if (type === 'MISS') {
            totalMisses++;
            resetCombo();
            showJudge(type, laneIdx);
            manager.pulseMiss();
        } else {
            totalHits++;
            addCombo();
            addScore(point);
            showJudge(type, laneIdx);
            manager.pulseHit();
        }
    }
}

function getJudgeWindow(type) {
    const base = JUDGE_PX[type];
    if (activeItems.includes('wide')) return base * 1.5;
    return base;
}

// --- LOGIC ---
// --- MANAGER CHARACTER ---
class Manager {
    constructor() {
        this.portraitEl = document.getElementById('manager-portrait');
        this.dialogueEl = document.getElementById('dialogue-text');
        this.overlayEl = document.getElementById('manager-overlay');
        this.dialogueBox = document.getElementById('manager-dialogue');
        this.loginPortraitEl = document.getElementById('login-manager-portrait');
        this.isTyping = false;

        this.init();
    }

    init() {
        // Set placeholder image if generation fails or is pending
        const placeholder = 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)';
        if (this.portraitEl) this.portraitEl.style.backgroundImage = placeholder;
        if (this.loginPortraitEl) this.loginPortraitEl.style.backgroundImage = placeholder;
    }

    updateImage(url) {
        if (this.portraitEl) this.portraitEl.style.backgroundImage = `url(${url})`;
        if (this.loginPortraitEl) this.loginPortraitEl.style.backgroundImage = `url(${url})`;
    }

    say(text, type = 'normal') {
        if (!this.dialogueEl) return;

        this.dialogueEl.innerText = text;

        // Visual Reaction
        if (this.portraitEl) {
            this.portraitEl.classList.remove('manager-react');
            void this.portraitEl.offsetWidth;
            this.portraitEl.classList.add('manager-react');
        }

        if (type === 'hit') {
            this.portraitEl.style.borderColor = 'var(--primary-color)';
        } else if (type === 'miss') {
            this.portraitEl.style.borderColor = 'var(--secondary-color)';
        }
    }

    pulseHit() {
        if (!this.dialogueBox) return;
        this.dialogueBox.classList.remove('pulse-blue');
        void this.dialogueBox.offsetWidth;
        this.dialogueBox.classList.add('pulse-blue');
    }

    pulseMiss() {
        if (!this.dialogueBox) return;
        this.dialogueBox.classList.remove('pulse-red');
        void this.dialogueBox.offsetWidth;
        this.dialogueBox.classList.add('pulse-red');
    }

    reactToCombo(combo) {
        if (combo % 50 === 0 && combo > 0) {
            this.say(`${combo} Combo! Keep the pace, trainee!`, 'hit');
        } else if (combo === 10) {
            this.say("Good start. Focus on the tempo.", 'hit');
        }
    }

    reactToMiss() {
        const lines = [
            "Focus! The system demands precision.",
            "Latency detected. Calibration required.",
            "Watch the judgment line, trainee.",
            "Don't lose the rhythm!"
        ];
        this.say(lines[Math.floor(Math.random() * lines.length)], 'miss');
    }

    reactToGameOver() {
        this.say("System Failure. Performance below KODARI standards.", 'miss');
    }

    reactToLowHP() {
        this.say("WARNING: System stability collapsing. Recover immediately!", 'miss');
    }
}

const manager = new Manager();

// --- LOGIC ---
function addCombo() {
    combo++;
    if (comboEl) {
        comboEl.innerText = combo;
        comboEl.classList.remove('pulse');
        void comboEl.offsetWidth;
        comboEl.classList.add('pulse');
        
        // Bloom 효과 (최대 100px까지 제한)
        const bloomSize = Math.min(100, 10 + (combo * 1.5));
        document.documentElement.style.setProperty('--combo-bloom', `${bloomSize}px`);
    }
    manager.reactToCombo(combo);
}

function resetCombo() {
    if (combo > 5) manager.reactToMiss();
    combo = 0;
    if (comboEl) {
        comboEl.innerText = "";
        document.documentElement.style.setProperty('--combo-bloom', '10px');
    }
}

function addScore(pts) {
    score += pts + (combo * 10);
    if (scoreEl) scoreEl.innerText = score.toString().padStart(6, '0');

    // HP Gain on COOL
    if (pts >= 300) updateHP(2);
}

function updateHP(amount) {
    // 데모/오토플레이 모드에서는 HP 감소 무시 (HP 항상 100 유지)
    if (isDemoMode && amount < 0) {
        hp = 100;
        if (hpBarFill) {
            hpBarFill.style.width = '100%';
            hpBarFill.classList.remove('critical');
        }
        return;
    }

    hp = Math.min(100, Math.max(0, hp + amount));
    if (hpBarFill) {
        hpBarFill.style.width = hp + '%';
        if (hp <= 30) {
            hpBarFill.classList.add('critical');
            if (amount < 0) manager.reactToLowHP();
        } else {
            hpBarFill.classList.remove('critical');
        }
    }

    if (hp <= 0) {
        hp = 0;
        updateStats();

        // New Revive Logic for interactive use
        if (activeItems.includes('revive') && !hasRevived) {
            hasRevived = true;
            showRevivePrompt();
        } else {
            window.gameOver();
        }
    }
}

function showRevivePrompt() {
    isRunning = false;
    if (window.onReviveRequested) {
        window.onReviveRequested();
    }
}

// Attach to window so index.html can call it
window.executeRevive = function () {
    hp = 50;
    updateStats();

    if (window.onReviveCountdownStarted) {
        window.onReviveCountdownStarted(5, () => {
            lastTime = performance.now();
            isRunning = true;
            requestAnimationFrame(gameLoop);
        });
    }
};


function showJudge(text, laneIdx) {
    if (!judgeEl) return;

    // WIDE LENS Effect
    let visualText = text;
    let effectClass = text.toLowerCase();

    judgeEl.innerText = visualText;
    judgeEl.className = '';
    judgeEl.classList.add(`judge-${effectClass}`);
    judgeEl.style.opacity = 1;
    judgeEl.style.transform = 'scale(1.2)';
    setTimeout(() => judgeEl.style.transform = 'scale(1)', 50);

    // Trigger Explosion Effect
    if (text === 'COOL' || text === 'GOOD') {
        createExplosion(laneIdx, text);
    }
}

function createExplosion(laneIdx, type) {
    if (laneIdx === undefined) return;

    const lane = lanes[laneIdx];
    const rect = lane.getBoundingClientRect();
    const trackRect = trackContainer.getBoundingClientRect();

    // Create Explosion Element (Base bloom)
    const explosion = document.createElement('div');
    explosion.className = `hit-explosion hit-${type.toLowerCase()}`;

    // Position: Center of Lane, at Hit Line
    const centerX = (rect.left - trackRect.left) + (rect.width / 2);
    const centerY = hitLineY + 10; // Slightly lower to cover receptor

    explosion.style.left = `${centerX}px`;
    explosion.style.top = `${centerY}px`;

    trackContainer.appendChild(explosion);

    // ── 파티클(파편) 폭발 효과 ──
    const numParticles = type === 'COOL' ? 12 : (type === 'GOOD' ? 6 : 0);
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = `hit-particle particle-${type.toLowerCase()}`;
        
        // Random angle and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 80; // 30 ~ 110px
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        trackContainer.appendChild(particle);
        // 애니메이션 끝나면 DOM에서 제거 (0.4s)
        setTimeout(() => particle.remove(), 400); 
    }

    // Lane Flash Effect
    lane.classList.add('hit-flash');
    setTimeout(() => lane.classList.remove('hit-flash'), 100);

    // Remove after animation
    setTimeout(() => explosion.remove(), 400);
}

// --- GAME LOOP ---
// import { LEVELS } from './levels.js'; // Now globally available via window.LEVELS

let timer = 0;
let spawnTimer = 0;
let spawnInterval = 500; // ms between spawns

function initGame(config, items = [], onConsume = null) {
    console.log("Initializing Game with config:", config);
    initGameElements(); // Ensure elements are fresh
    if (!config) config = window.LEVELS[0];

    currentConfig = { ...config };
    activeItems = [...items];
    hasRevived = false;

    // Trigger item consumption callback
    if (onConsume && activeItems.length > 0) {
        onConsume(activeItems);
    }

    // Apply Speed Modifiers
    if (activeItems.includes('speedup')) currentConfig.speed += 150;
    if (activeItems.includes('speeddown')) currentConfig.speed -= 150;

    // Apply Guide Lines
    lanes.forEach(lane => {
        if (activeItems.includes('guide')) lane.classList.add('show-guide');
        else lane.classList.remove('show-guide');
    });

    // Apply Hazards (Flip/Fog)
    document.getElementById('game-stage').classList.remove('flip-view');

    if (currentConfig.fogView && !activeItems.includes('unfog')) {
        trackContainer.classList.add('fog-view');
        manager.say("Visibility degraded. System stability threatened.");
    } else {
        trackContainer.classList.remove('fog-view');
    }

    if (currentConfig.shakeView) {
        trackContainer.classList.add('shake-view');
        if (activeItems.includes('guide')) {
            trackContainer.classList.add('stabilized');
        } else {
            trackContainer.classList.remove('stabilized');
        }
    } else {
        trackContainer.classList.remove('shake-view');
        trackContainer.classList.remove('stabilized');
    }

    if (currentConfig.darknessView && !activeItems.includes('unfog')) {
        trackContainer.classList.add('darkness-view');
    } else {
        trackContainer.classList.remove('darkness-view');
    }

    // Reset State
    isRunning = false;
    lastTime = 0;
    timer = 0;
    spawnTimer = 0;
    notes.forEach(n => {
        if (n.el && n.el.parentNode) n.el.remove();
    });
    notes = [];
    score = 0;
    combo = 0;
    hp = 100;
    if (scoreEl) scoreEl.innerText = "000000";
    if (comboEl) comboEl.innerText = "";
    if (hpBarFill) {
        hpBarFill.style.width = '100%';
        hpBarFill.classList.remove('critical');
    }

    // Calculate Spawn Interval based on BPM and Density
    // BPM = Beats Per Minute
    // Density 4 = Quarter Notes, 8 = Eighth, etc.
    // Interval = 60000 / (BPM * (Density / 4))
    spawnInterval = 60000 / (config.bpm * (config.density / 4));

    console.log(`Starting ${config.msg} (BPM: ${config.bpm}, Density: 1/${config.density}, Interval: ${spawnInterval.toFixed(2)}ms)`);

    manager.say(`${config.msg} initiated. Do not disappoint me.`);

    // UI Update
    const levelInfo = document.getElementById('level-info');
    if (levelInfo) {
        levelInfo.innerText = `${config.phaseNum}. ${config.phaseTitle} | LVL ${String(config.id).padStart(2, '0')}`;
        levelInfo.style.color = "#00f3ff"; // Cyan glow
    }

    const musicMetadata = document.getElementById('music-metadata');
    if (musicMetadata) {
        musicMetadata.innerText = `${config.title} (${config.subTitle || config.msg})`;
        musicMetadata.style.textTransform = "uppercase";
    }

    const startGameLoop = () => {
        if (isRunning) return; // Prevent double start
        updateMetrics();
        isRunning = true;
        requestAnimationFrame(gameLoop);
        manager.say(`${config.msg} initiated. Do not disappoint me.`);
    };

    const countdownEl = document.getElementById('countdown-display');

    if (config.videoId) {
        // We are abandoning YouTube iframe due to embedding restrictions.
        // Using a reliable local MP3 instead.
        // Remove immediate systemAudio creation from here.
        // It will be handled globally by MISSION CONTROL.
        
        // Speed up logic will be applied to the global gameAudio

        // The countdown and audio play is already handled by prepareMission/startCountdown
        // We just start the game loop when this initGame is finally called.
        // Sync BGM
        if (window.gameAudio) {
             const targetBPM = config.bpm || 100;
             const playbackSpeed = targetBPM / 100.0;
             window.gameAudio.playbackRate = playbackSpeed;
             window.gameAudio.preservesPitch = false;
        }
        startGameLoop();

    } else {
        // Fallback or early start if no video
        startGameLoop();
    }
}
// Globals for engine (consolidated at top)


window.stopGame = function () {
    isRunning = false;
    document.getElementById('game-stage').classList.remove('flip-view');
    trackContainer.classList.remove('fog-view');

    // Stop logic handled by MISSION CONTROL or here
    if (window.gameAudio) {
        window.gameAudio.pause();
        window.gameAudio.currentTime = 0;
    }
}

// --- MISSION CONTROL : 오디오 및 게임 제어 엔진 ---
window.gameAudio = new Audio('bgm.mp3'); 
window.gameAudio.loop = true; 

window.prepareMission = function(config) {
    // 이미 게임 화면이 보이는 상태 (openMissionBriefing에서 전환됨)
    // 오디오를 잠금 해제 후 인게임 카운트다운 시작
    window.gameAudio.volume = 0.0;
    window.gameAudio.play().then(() => {
        window.gameAudio.pause();
        window.gameAudio.volume = 1.0;
        window.gameAudio.currentTime = config.startSeconds || 0;

        startMissionCountdown(config);
    }).catch(error => {
        console.error("브라우저가 오디오를 차단했습니다:", error);
        startMissionCountdown(config);
    });
};

function startMissionCountdown(config) {
    try {
        let count = 3;

        // 게임 화면 위에 카운트다운 오버레이 생성
        const overlay = document.createElement('div');
        overlay.id = 'ingame-countdown-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.6);
            z-index: 9999;
            pointer-events: none;
        `;

        const numEl = document.createElement('div');
        numEl.style.cssText = `
            font-family: 'Orbitron', sans-serif;
            font-size: 160px;
            font-weight: 900;
            color: #00f3ff;
            text-shadow: 0 0 40px rgba(0, 243, 255, 0.9), 0 0 80px rgba(0, 243, 255, 0.5);
            animation: countPulse 0.8s ease-out;
            line-height: 1;
        `;
        numEl.innerText = count;

        // Phase / Level / Mission Title 표시
        const phaseEl = document.createElement('div');
        phaseEl.style.cssText = `
            font-family: 'Orbitron', sans-serif;
            font-size: 10px; letter-spacing: 4px;
            color: #00f3ff; margin-top: 24px;
            text-transform: uppercase; font-weight: 700;
        `;
        phaseEl.innerText = `PHASE: ${config.phase || 'ALPHA'}  ·  ${config.phaseTitle || ''}`;

        const lvlEl = document.createElement('div');
        lvlEl.style.cssText = `
            font-family: 'Orbitron', sans-serif;
            font-size: 13px; letter-spacing: 6px;
            color: #555; margin-top: 6px;
            text-transform: uppercase; font-weight: 800;
        `;
        lvlEl.innerText = `LVL ${String(config.id || '01').padStart(2, '0')}`;

        const titleEl = document.createElement('div');
        titleEl.style.cssText = `
            font-family: 'Orbitron', sans-serif;
            font-size: 20px; letter-spacing: 3px;
            color: #eee; margin-top: 4px;
            text-transform: uppercase; font-weight: 900;
        `;
        titleEl.innerText = config.title || config.msg || 'STAGE START';

        const subEl = document.createElement('div');
        subEl.style.cssText = `
            font-family: 'Orbitron', sans-serif;
            font-size: 11px; letter-spacing: 2px;
            color: #666; margin-top: 4px;
        `;
        subEl.innerText = config.subTitle ? `( ${config.subTitle} )` : '';

        overlay.appendChild(numEl);
        overlay.appendChild(phaseEl);
        overlay.appendChild(lvlEl);
        overlay.appendChild(titleEl);
        overlay.appendChild(subEl);
        document.body.appendChild(overlay);

        // 카운트다운 pulse 애니메이션 스타일 추가 (한 번만)
        if (!document.getElementById('countdown-style')) {
            const style = document.createElement('style');
            style.id = 'countdown-style';
            style.textContent = `
                @keyframes countPulse {
                    0%   { transform: scale(1.4); opacity: 0; }
                    30%  { opacity: 1; transform: scale(1); }
                    100% { transform: scale(0.9); opacity: 0.8; }
                }
            `;
            document.head.appendChild(style);
        }

        const tick = setInterval(() => {
            count--;
            if (count > 0) {
                numEl.innerText = count;
                // 애니메이션 재트리거
                numEl.style.animation = 'none';
                void numEl.offsetWidth;
                numEl.style.animation = 'countPulse 0.8s ease-out';
            } else {
                clearInterval(tick);
                numEl.innerText = 'GO!';
                numEl.style.color = '#ff0055';
                numEl.style.textShadow = '0 0 40px rgba(255,0,85,0.9), 0 0 80px rgba(255,0,85,0.5)';
                numEl.style.animation = 'none';
                void numEl.offsetWidth;
                numEl.style.animation = 'countPulse 0.8s ease-out';

                setTimeout(() => {
                    // 오버레이 제거
                    overlay.remove();

                    // 아이템 적용 후 게임 루프 시작 (onConsume 콜백 포함)
                    if (window.initGame) {
                        const active = Array.from(window._equippedItems || []);

                        // 아이템 소비 콜백: 인벤토리에서 count 차감
                        const onConsume = (consumedIds) => {
                            consumedIds.forEach(id => {
                                const inv = window.inventoryData ? window.inventoryData[id] : null;
                                if (inv) {
                                    // 기간제(unlimited) 아이템은 차감하지 않음
                                    if (!inv.unlimitedUntil || inv.unlimitedUntil < Date.now()) {
                                        inv.count = Math.max(0, inv.count - 1);
                                    }
                                }
                            });
                            // 저장 및 인벤토리 UI 갱신
                            if (window.saveUserData) window.saveUserData();
                            if (window.updateInventoryUI) window.updateInventoryUI();
                        };

                        window.initGame(config, active, onConsume);
                    }

                    // 자동 녹화 시작
                    if (window.startAutoRecording) window.startAutoRecording();

                    // 노래 동시 시작
                    window.gameAudio.currentTime = config.startSeconds || 0;
                    window.gameAudio.play();

                }, 600);
            }
        }, 1000);

    } catch (err) {
        alert("카운트다운 오류: " + err.message);
    }
}

function spawnNote(laneIdx) {
    const noteEl = document.createElement('div');
    noteEl.className = `note ${LANE_COLORS[laneIdx]}`;

    // Calculate Left position based on Lane
    const laneRect = lanes[laneIdx].getBoundingClientRect();
    const trackRect = trackContainer.getBoundingClientRect();

    noteEl.style.left = (laneRect.left - trackRect.left) + 'px';
    noteEl.style.width = laneRect.width + 'px';

    noteLayer.appendChild(noteEl);

    // 데모 모드에서는 100% COOL, 일반 오토플레이도 MISS 없음
    const rand = Math.random();
    let fate = 'COOL';
    if (!isDemoMode) {
        if (rand > 0.85) fate = 'GOOD';
        if (rand > 0.95) fate = 'MISS';
    }

    notes.push({
        el: noteEl,
        y: -50,
        lane: laneIdx,
        active: true,
        fate: fate,
        hitProcessed: false
    });
}

function gameLoop(timestamp) {
    if (!isRunning) return;

    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    timer += deltaTime;
    spawnTimer += deltaTime * 1000; // ms

    // Spawn Logic based on interval
    if (spawnTimer >= spawnInterval) {
        spawnNote(Math.floor(Math.random() * lanes.length));
        spawnTimer = 0;
    }

    // CHECK CLEAR CONDITION
    if (timer >= currentConfig.duration) {
        levelClear();
        return;
    }

    // Move Notes
    for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        if (!note.active) continue;

        let speed = currentConfig.speed || 600;

        // Apply Speed Jitter
        if (currentConfig.speedJitter) {
            // Jitter range based on intensity, mitigated slightly by WIDE item
            const jitterRange = activeItems.includes('wide') ? currentConfig.speedJitter * 0.5 : currentConfig.speedJitter;
            speed += (Math.sin(timestamp * 0.01 + i) * speed * jitterRange);
        }

        note.y += speed * deltaTime;
        note.el.style.top = `${note.y}px`;

        // AUTO PLAY LOGIC
        if ((isAutoPlay || (activeItems.includes('auto-space') && note.lane === 3)) && !note.hitProcessed) {
            const dist = Math.abs(note.y - hitLineY);

            if ((note.fate === 'COOL' && dist < 10) || (note.fate === 'GOOD' && note.y > hitLineY + 20)) {
                if (!isAutoPlay && activeItems.includes('auto-space')) {
                    triggerAutoHit(note.lane, true);
                } else {
                    triggerAutoHit(note.lane);
                }
                note.hitProcessed = true;
            }
        }

        // Miss Logic
        if (note.y > hitLineY + getJudgeWindow('MISS')) {
            // 데모 모드: 미스 노트도 자동으로 COOL 처리
            if (isDemoMode) {
                totalHits++;
                addCombo();
                addScore(300);
                showJudge('COOL', note.lane);
                createExplosion(note.lane, 'COOL');
                manager.pulseHit();
            } else {
                totalMisses++;
                resetCombo();
                showJudge('MISS');
                updateHP(-10);
                manager.pulseMiss();
            }
            note.active = false;
            note.el.remove();
            notes.splice(i, 1);
        }
    }

    // HAZARD INJECTION: Screen Flip (Mid-Game)
    if (currentConfig.flipView && !activeItems.includes('screen-flip-off')) {
        // Swap positions every 6 seconds to disorient the player
        const isFlipped = Math.floor(timer / 6) % 2 === 1; 
        const stage = document.getElementById('game-stage');
        
        if (isFlipped && !stage.classList.contains('flip-view')) {
            stage.classList.add('flip-view');
            if (manager) manager.say("WARNING: Screen Flip initiated.", 'miss');
            stage.style.boxShadow = "inset 0 0 50px rgba(255,0,85,0.8)";
            setTimeout(() => stage.style.boxShadow = "", 300);
        } else if (!isFlipped && stage.classList.contains('flip-view')) {
            stage.classList.remove('flip-view');
            stage.style.boxShadow = "inset 0 0 50px rgba(0,243,255,0.8)";
            setTimeout(() => stage.style.boxShadow = "", 300);
        }
    }

    requestAnimationFrame(gameLoop);
}

function levelClear() {
    console.log("STAGE CLEAR!");
    stopGame();
    if (window.stopAndUploadRecording) window.stopAndUploadRecording();

    const totalNotes = totalHits + totalMisses;
    const accuracy = totalNotes === 0 ? 0 : Math.floor((totalHits / totalNotes) * 100);

    let rankSub = "SYSTEM FAILURE";
    let rankMain = "FAILED";
    let rankColor = "#ff0055";
    let isPerfect = false;

    if (accuracy === 100) {
        rankSub = "MISSION CLEAR";
        rankMain = "PERFECT OVER-BEAT";
        rankColor = "gold";
        isPerfect = true;
    } else if (accuracy >= 70) {
        rankSub = "MISSION CLEAR";
        rankMain = "GREAT";
        rankColor = "#00f3ff";
    } else if (accuracy >= 40) {
        rankSub = "MISSION CLEAR";
        rankMain = "GOOD";
        rankColor = "#00ff00";
    }

    const rankText = `${rankSub} : ${rankMain}`;
    manager.say(`Evaluation: ${rankMain} (${accuracy}%). Performance analyzed.`, 'hit');

    // 최고 점수 갱신 및 클라우드 저장
    if (score > (window._bestScore || 0)) {
        window._bestScore = score;
    }
    if (window.saveUserData) window.saveUserData();

    // 부드러운 팝업/스케일 애니메이션 동시 생성용 css
    if(!document.getElementById('scaleInBounce-style')){
        const s = document.createElement('style');
        s.id = 'scaleInBounce-style';
        s.innerHTML = `@keyframes scaleInBounce { 0% { transform: translate(-50%, -50%) scale(0); } 80% { transform: translate(-50%, -50%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); } }`;
        document.head.appendChild(s);
    }

    const massiveText = document.createElement('div');
    massiveText.innerHTML = `
        <div style="font-size: 24px; letter-spacing: 12px; color: rgba(255,255,255,0.9); text-transform: uppercase; margin-bottom: -5px; text-shadow: 0 0 10px rgba(255,255,255,0.5);">${rankSub}</div>
        <div style="font-size: ${isPerfect ? '65px' : '85px'}; font-weight: 900; color: ${rankColor}; text-shadow: 0 0 30px ${rankColor}, 0 0 60px ${rankColor}; text-transform: uppercase;">${rankMain}</div>
    `;
    massiveText.style.cssText = `
        position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
        font-family: 'Orbitron', sans-serif; 
        z-index: 9999; text-align: center; white-space: nowrap;
        animation: scaleInBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        background: radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 75%);
        padding: 40px 120px;
        border-radius: 20px;
    `;
    
    if (isPerfect) {
        massiveText.classList.add('neon-flash');
        document.body.classList.add('neon-bg-flash');
    }
    
    document.getElementById('game-stage').appendChild(massiveText);

    // 5초 뒤 팝업 모달창 띄우기
    setTimeout(() => {
        massiveText.remove();
        if (isPerfect) {
            document.body.classList.remove('neon-bg-flash');
            if (window.showPerfectReward) window.showPerfectReward();
        }
        
        // Unlock next level on any clear
        if (window.unlockNextLevel) window.unlockNextLevel(currentConfig.id);
        
        const modal = document.getElementById('game-result-modal');
        const modalText = document.getElementById('result-modal-text');
        if(modalText) {
            modalText.innerText = rankText;
            modalText.style.color = rankColor;
        }
        if(modal) modal.style.display = 'flex';
        // Update real-time rank tier from script.js
        if (window.updatePlayerRank) window.updatePlayerRank();
    }, 5000);
}

window.gameOver = function () {
    console.log("GAME OVER");
    stopGame();
    if (window.stopAndUploadRecording) window.stopAndUploadRecording();
    manager.say("System Breakdown. Your evaluation ends here.", 'miss');

    if (score > (window._bestScore || 0)) { window._bestScore = score; }
    if (window.saveUserData) window.saveUserData();

    // 스케일 애니메이션 동시 생성용 css
    if(!document.getElementById('scaleInBounce-style')){
        const s = document.createElement('style');
        s.id = 'scaleInBounce-style';
        s.innerHTML = `@keyframes scaleInBounce { 0% { transform: translate(-50%, -50%) scale(0); } 80% { transform: translate(-50%, -50%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); } }`;
        document.head.appendChild(s);
    }

    const massiveText = document.createElement('div');
    massiveText.innerHTML = `
        <div style="font-size: 24px; letter-spacing: 12px; color: rgba(255,0,85,0.9); text-transform: uppercase; margin-bottom: -5px; text-shadow: 0 0 10px rgba(255,0,85,0.5);">SYSTEM FAILURE</div>
        <div style="font-size: 85px; font-weight: 900; color: #ff0055; text-shadow: 0 0 30px #ff0055, 0 0 60px #ff0055; text-transform: uppercase;">FAILED</div>
    `;
    massiveText.style.cssText = `
        position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
        font-family: 'Orbitron', sans-serif; 
        z-index: 9999; text-align: center; white-space: nowrap;
        animation: scaleInBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        background: radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 75%);
        padding: 40px 120px;
        border-radius: 20px;
    `;
    document.getElementById('game-stage').appendChild(massiveText);

    // 5초 뒤 팝업 모달창 띄우기
    setTimeout(() => {
        massiveText.remove();
        const modal = document.getElementById('game-result-modal');
        const modalText = document.getElementById('result-modal-text');
        if(modalText) {
            modalText.innerText = "SYSTEM FAILURE : FAILED";
            modalText.style.color = "#ff0055";
        }
        if(modal) modal.style.display = 'flex';
        // Update real-time rank tier from script.js
        if (window.updatePlayerRank) window.updatePlayerRank();
    }, 5000);
}

// 결과 모달창 버튼 전역 이벤트 리스너
window.addEventListener('DOMContentLoaded', () => {
    // DOM 로드 전에 존재하지 않을수 있으므로 위임 위주로 처리하거나 버튼 찾기 시도
    setTimeout(() => {
        const btnLobby = document.getElementById('btn-result-lobby');
        const btnReplay = document.getElementById('btn-result-replay');

        if(btnLobby) {
            btnLobby.addEventListener('click', () => {
                document.getElementById('game-result-modal').style.display = 'none';
                const btnBack = document.getElementById('btn-back-level');
                if (btnBack) btnBack.click();
                else location.reload();
            });
        }

        if(btnReplay) {
            btnReplay.addEventListener('click', () => {
                document.getElementById('game-result-modal').style.display = 'none';
                if (currentConfig && window.openMissionBriefing) {
                    window.openMissionBriefing(currentConfig);
                } else {
                    location.reload();
                }
            });
        }
    }, 1000); // Wait for modal injection if domcontentloaded already passed
});

function triggerAutoHit(laneIdx, isItemAuto = false) {
    const lane = lanes[laneIdx];
    if (!lane) return;

    if (isItemAuto) {
        lane.classList.add('auto-hit-neon');
        setTimeout(() => lane.classList.remove('auto-hit-neon'), 100);
    } else {
        lane.classList.add('active');
        lane.classList.add('press');
        setTimeout(() => {
            lane.classList.remove('active');
            lane.classList.remove('press');
        }, 100);
    }

    checkHit(laneIdx);
}

// ─── 부활 프롬프트 UI ─────────────────────────────────────────────
window.onReviveRequested = function () {
    // 이미 오버레이 있을 경우 중복 방지
    if (document.getElementById('revive-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'revive-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        background: rgba(0, 0, 0, 0.82);
        z-index: 99999;
        font-family: 'Orbitron', sans-serif;
        animation: fadeIn 0.4s ease;
    `;

    overlay.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 16px; animation: pulse-revive 1s infinite;">🔄</div>
        <div style="font-size: 18px; font-weight: 900; color: #ff0055; letter-spacing: 3px; margin-bottom: 8px;">
            SYSTEM CRITICAL
        </div>
        <div style="font-size: 13px; color: #888; margin-bottom: 36px; letter-spacing: 2px;">
            Would you like to use a REVIVE item?
        </div>
        <div style="display: flex; gap: 20px;">
            <button id="btn-do-revive" style="
                font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700;
                letter-spacing: 2px; padding: 12px 30px; cursor: pointer;
                background: rgba(0,243,255,0.08); border: 2px solid #00f3ff;
                color: #00f3ff; border-radius: 4px;
                transition: all 0.2s;
            ">🔄 USE REVIVE</button>
            <button id="btn-skip-revive" style="
                font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700;
                letter-spacing: 2px; padding: 12px 30px; cursor: pointer;
                background: rgba(255,0,85,0.08); border: 2px solid #ff0055;
                color: #ff0055; border-radius: 4px;
                transition: all 0.2s;
            ">GIVE UP</button>
        </div>
    `;

    // pulse 애니메이션 (한 번만 등록)
    if (!document.getElementById('revive-anim-style')) {
        const style = document.createElement('style');
        style.id = 'revive-anim-style';
        style.textContent = `
            @keyframes pulse-revive {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px #00f3ff); }
                50% { transform: scale(1.15); filter: drop-shadow(0 0 25px #00f3ff); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    // 부활 버튼
    document.getElementById('btn-do-revive').onclick = () => {
        overlay.remove();
        if (window.executeRevive) window.executeRevive();
    };

    // 포기 버튼
    document.getElementById('btn-skip-revive').onclick = () => {
        overlay.remove();
        if (window.gameOver) window.gameOver();
    };
};

// 부활 후 재개 카운트다운
window.onReviveCountdownStarted = function (seconds, onDone) {
    if (document.getElementById('revive-countdown-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'revive-countdown-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        background: rgba(0, 0, 0, 0.6);
        z-index: 99998;
        font-family: 'Orbitron', sans-serif;
        pointer-events: none;
    `;

    const numEl = document.createElement('div');
    numEl.style.cssText = `
        font-size: 120px; font-weight: 900;
        color: #00f3ff;
        text-shadow: 0 0 40px rgba(0,243,255,0.9);
    `;
    numEl.innerText = seconds;

    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
        font-size: 13px; color: #00f3ff; letter-spacing: 4px; margin-top: 16px;
    `;
    labelEl.innerText = 'SYSTEM REBOOTING...';

    overlay.appendChild(numEl);
    overlay.appendChild(labelEl);
    document.body.appendChild(overlay);

    let count = seconds;
    const tick = setInterval(() => {
        count--;
        if (count > 0) {
            numEl.innerText = count;
        } else {
            clearInterval(tick);
            overlay.remove();
            if (onDone) onDone();
        }
    }, 1000);
};

// Export initialization for script.js and inline scripts
window.initGame = initGame;

// ── Demo Mode 전역 토글 ──────────────────────────────────────
window.startDemoMode = function() {
    isDemoMode = true;
    isAutoPlay = true;
    console.log('🎮 DEMO MODE ON - AutoPlay + Invincible HP');
};
window.stopDemoMode = function() {
    isDemoMode = false;
    isAutoPlay = false;
    console.log('🎮 DEMO MODE OFF');
};
// 콘솔에서 window.isAutoPlay 로도 접근 가능하게
Object.defineProperty(window, 'isAutoPlay', {
    get: () => isAutoPlay,
    set: (v) => { isAutoPlay = v; }
});
Object.defineProperty(window, 'isDemoMode', {
    get: () => isDemoMode,
    set: (v) => { isDemoMode = v; isAutoPlay = v; }
});
