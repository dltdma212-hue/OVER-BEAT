// --- KODARI : OVER-BEAT CORE SCRIPT ---

// Elements
let loginContainer, lobbyContainer, gameInterface, levelList, inventoryList, rankingList;
let sysMsg, inpId, inpPw, shopOverlay, modalOverlay, modalContent, modalBtnOk, modalBtnCancel;

// State
let inventoryData = {};
let equippedItemIds = new Set();
let maxUnlockedLevel = 1;

// 1. SYSTEM INITIALIZATION
function Initialize() {
    console.log("SYSTEM // Initializing...");

    // DOM Elements Mapping
    loginContainer = document.getElementById('login-container');
    lobbyContainer = document.getElementById('lobby-container');
    gameInterface = document.getElementById('game-interface');
    levelList = document.getElementById('level-list');
    inventoryList = document.getElementById('inventory-list');
    rankingList = document.getElementById('ranking-list');
    sysMsg = document.getElementById('sys-msg');
    inpId = document.getElementById('inp-id');
    inpPw = document.getElementById('inp-pw');
    shopOverlay = document.getElementById('shop-overlay');
    modalOverlay = document.getElementById('sys-modal-overlay');
    modalContent = document.getElementById('sys-modal-content');
    modalBtnOk = document.getElementById('btn-modal-ok');
    modalBtnCancel = document.getElementById('btn-modal-cancel');

    // Back4App 연결 설정 (Parse)
    if (typeof Parse !== 'undefined') {
        Parse.initialize(
            "UjvHCehPEYCjpO1N2hhO8EH6uYWIhxNPk96m6ZNI",
            "yOrPls9GO7sANRPMGWYxYqu3cpU5tM2Znof0l9LQ"
        );
        Parse.serverURL = 'https://parseapi.back4app.com/';
    }

    // 구글 로그인 설정 (동적 로딩 대기 루프)
    function checkGoogleAndInit() {
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: "683947471167-nsl8do8gnf7jm03gvr6kpmheao25lftj.apps.googleusercontent.com",
                callback: handleCredentialResponse
            });

            // 버튼 그리기
            const googleBtn = document.getElementById("buttonDiv");
            if (googleBtn) {
                googleBtn.innerHTML = '';
                google.accounts.id.renderButton(
                    googleBtn,
                    { 
                        theme: "filled_black",  // 사이버펑크에 어울리는 블랙 테마 ㅋ
                        size: "large",         // 일단 가장 큰 사이즈로 설정!
                        width: 400,            // 가로 길이를 숫자로 지정 (예: 400px)
                        shape: "rectangular",  // 직사각형 모양
                        text: "signin_with",   // 버튼 문구
                        logo_alignment: "left" 
                    }
                );
            }
        } else {
            setTimeout(checkGoogleAndInit, 100);
        }
    }
    checkGoogleAndInit();

    LoadGameData();

    // Event Listeners
    if (document.getElementById('btn-login')) {
        document.getElementById('btn-login').onclick = () => {
            if (!inpId.value && !inpPw.value) {
                showLobby({ name: 'CEO', role: 'ADMIN', id: 'ceo_root' });
                return;
            }
            if (window.login) {
                const res = window.login(inpId.value, inpPw.value);
                if (res.success) showLobby(res.user);
                else if (sysMsg) sysMsg.innerText = res.msg;
            }
        };
    }

    if (document.getElementById('btn-register') && window.register) {
        document.getElementById('btn-register').onclick = () => {
            const res = window.register(inpId.value, inpPw.value);
            if (sysMsg) sysMsg.innerText = res.msg;
        };
    }

    if (document.getElementById('btn-toggle-shop')) {
        document.getElementById('btn-toggle-shop').onclick = () => {
            if (shopOverlay) shopOverlay.style.display = 'flex';
        };
    }


    if (document.getElementById('btn-back-level')) {
        document.getElementById('btn-back-level').onclick = () => {
            if (gameInterface) gameInterface.style.display = 'none';
            if (lobbyContainer) lobbyContainer.style.display = 'flex';
            // Stop game logic if window.stopGame exists
            if (window.stopGame) window.stopGame();
            
            // Refresh rankings and player tier on return
            renderRanking();
            updatePlayerRank();
        };
    }

    // Global Key Listener for ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameInterface.style.display === 'flex') {
            document.getElementById('btn-back-level').click();
        }
    });

    // Volume & Settings Logic
    const btnSettings = document.getElementById('btn-settings-toggle');
    const volumeMenu = document.getElementById('volume-menu');
    const volSlider = document.getElementById('vol-slider');
    const volMinus = document.getElementById('btn-vol-minus');
    const volPlus = document.getElementById('btn-vol-plus');
    const volGauge = document.querySelector('.vol-gauge-line');

    let currentVolume = parseFloat(localStorage.getItem('kodari_volume') || '0.5');

    function updateVolume(val) {
        currentVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('kodari_volume', currentVolume);
        
        if (volSlider) volSlider.value = currentVolume;
        if (volGauge) volGauge.style.width = (currentVolume * 100) + '%';
        
        // Sync with all possible audio objects
        if (window.gameAudio) window.gameAudio.volume = currentVolume;
        if (window.lobbyBgm) window.lobbyBgm.volume = currentVolume;
        
        playTick();
    }

    function playTick() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(currentVolume * 0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.warn("Tick sound failed", e);
        }
    }

    if (btnSettings && volumeMenu) {
        btnSettings.onclick = (e) => {
            e.stopPropagation();
            volumeMenu.classList.toggle('active');
        };
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!volumeMenu.contains(e.target) && e.target !== btnSettings) {
                volumeMenu.classList.remove('active');
            }
        });
    }

    if (volSlider) {
        volSlider.oninput = (e) => updateVolume(parseFloat(e.target.value));
        volSlider.value = currentVolume;
        if (volGauge) volGauge.style.width = (currentVolume * 100) + '%';
    }

    if (volMinus) volMinus.onclick = () => updateVolume(currentVolume - 0.05);
    if (volPlus) volPlus.onclick = () => updateVolume(currentVolume + 0.05);

    // Initial Volume Sync
    setTimeout(() => {
        if (window.gameAudio) window.gameAudio.volume = currentVolume;
        if (window.lobbyBgm) window.lobbyBgm.volume = currentVolume;
    }, 1000);

    // Attach Start Button (if not started by card click)
    if (document.getElementById('btn-game-start')) {
        document.getElementById('btn-game-start').onclick = () => {
            // Start the first level by default or show alert
            if (window.LEVELS && window.LEVELS.length > 0) {
                startGame(window.LEVELS[0]);
            } else {
                sysAlert("No missions available for deployment.");
            }
        };
    }

    // Attach shop buy buttons → PayPal 결제로 라우팅
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = (e) => {
            const item = btn.closest('.shop-item') || btn.closest('.shop-package');
            if (!item) return;

            const id    = item.dataset.id;
            const nameEl = item.querySelector('.item-name') || item.querySelector('.pkg-name');
            const iconEl = item.querySelector('.item-icon') || item.querySelector('.pkg-icon');
            const name  = nameEl ? nameEl.innerText : id.toUpperCase();
            const icon  = iconEl ? iconEl.innerText : '📦';
            const price = toNumeric(btn.innerText.replace('$', ''));

            if (typeof openPayPalCheckout === 'function') {
                openPayPalCheckout(id, name, icon, price);
            } else {
                sysAlert('Payment system loading. Please try again.');
            }
        };
    });

    // Check session
    if (window.getSession) {
        const session = window.getSession();
        if (session) showLobby(session);
    }
}

// 2. AUTH & JWT HANDLING
async function handleCredentialResponse(response) {
    console.log("GOOGLE // Login Success, Token Received");
    try {
        const responsePayload = decodeJwtResponse(response.credential);
        const user = {
            name: responsePayload.name,
            role: 'AGENT',
            id: responsePayload.sub
        };

        // 구글 ID 저장 (클라우드 연동 키)
        localStorage.setItem('kodari_google_id', responsePayload.sub);
        localStorage.setItem('kodari_v2_session', JSON.stringify(user));

        // 클라우드에서 데이터 불러오기
        const cloudData = window.cloudLoad ? await window.cloudLoad() : null;
        if (cloudData) {
            console.log("CLOUD // 기존 데이터 복원:", cloudData);
            inventoryData = cloudData.inventory ?? {};
            equippedItemIds = new Set(cloudData.equippedItems ?? []);
            maxUnlockedLevel = cloudData.maxUnlockedLevel ?? 1;
            // localStorage에도 동기화
            localStorage.setItem('kodari_user_data', JSON.stringify({
                inventory: inventoryData,
                lastLoginDate: window.lastLoginDate || '',
                maxUnlockedLevel: maxUnlockedLevel
            }));
            localStorage.setItem('kodari_equipped_items', JSON.stringify(Array.from(equippedItemIds)));
        } else {
            console.log("CLOUD // 신규 유저, 로컬 데이터 사용");
        }

        showLobby(user);
    } catch (error) {
        console.error("SYSTEM // Auth Error:", error);
    }
}

function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// 3. UI STATE & TRANSITIONS
function showLobby(user) {
    console.log("SYSTEM // Lobby Access Granted: " + user.name);

    if (loginContainer) loginContainer.style.display = 'none';
    if (lobbyContainer) lobbyContainer.style.display = 'flex';

    const profileName = document.getElementById('profile-name');
    const userRole = document.getElementById('lobby-user-role');

    if (profileName) profileName.innerText = user.name;
    if (userRole) userRole.innerText = (user.role || "AGENT").toUpperCase();

    renderLevels();
    renderRanking();
    updateInventoryUI();

    // Calculate and display player rank tier
    updatePlayerRank();

    // Check for daily reward
    setTimeout(checkDailyReward, 500);

    // Start 2-hour recurring gift box timer
    manageRecurringGift();
}

const RANK_TIERS = [
    { name: 'Supernova', threshold: 5, color: '#FF0033', emoji: '💥', class: 'rank-supernova' },
    { name: 'Glint', threshold: 30, color: '#00F3FF', emoji: '✨', class: 'rank-glint' },
    { name: 'Flicker', threshold: 100, color: '#FFFFFF', emoji: '🕯️', class: 'rank-flicker' }
];

function getRankTier(percentile) {
    return RANK_TIERS.find(t => percentile <= t.threshold) || RANK_TIERS[2];
}
window.getRankTier = getRankTier; // Expose for game.js results

async function updatePlayerRank() {
    const userRoleEl = document.getElementById('lobby-user-role');
    const resultTierEl = document.getElementById('result-modal-tier');
    
    const defaultTier = RANK_TIERS[2];

    if (userRoleEl) {
        userRoleEl.innerHTML = `<span class="rank-badge-icon">${defaultTier.emoji}</span> ${defaultTier.name.toUpperCase()}`;
        userRoleEl.className = defaultTier.class;
    }

    if (typeof Parse === 'undefined') return defaultTier;

    try {
        const UserData = Parse.Object.extend('UserData');
        const query = new Parse.Query(UserData);
        query.descending('bestScore');
        query.limit(1000);
        const results = await query.find();

        const totalUsers = results.length || 1;
        const googleId = localStorage.getItem('kodari_google_id');
        
        let userRank = totalUsers;
        if (googleId) {
            const userIdx = results.findIndex(r => r.get('googleId') === googleId);
            if (userIdx !== -1) {
                userRank = userIdx + 1;
                window._bestScore = results[userIdx].get('bestScore');
            }
        }

        const percentile = (userRank / totalUsers) * 100;
        const tier = getRankTier(percentile);

        // Update Lobby Header
        if (userRoleEl) {
            userRoleEl.innerHTML = `<span class="rank-badge-icon">${tier.emoji}</span> ${tier.name.toUpperCase()}`;
            userRoleEl.className = tier.class;
        }

        // Update Result Modal if visible
        if (resultTierEl) {
            resultTierEl.innerHTML = `GLOBAL RANKING: <span class="${tier.class}">${tier.name}</span> (Top ${percentile.toFixed(1)}%)`;
        }
        
        console.log(`RANKING // Rank: ${userRank}/${totalUsers} (${percentile.toFixed(1)}%) -> ${tier.name}`);
        return tier;
    } catch (e) {
        console.error("RANKING // Error calculating rank:", e);
        return defaultTier;
    }
}
window.updatePlayerRank = updatePlayerRank;

function logout() {
    console.log("SYSTEM // Logging out...");
    // Clear session-related data
    localStorage.removeItem('kodari_user_data');
    localStorage.removeItem('kodari_equipped_items');
    // If Parse/Back4App is used for sessions
    if (typeof Parse !== 'undefined' && Parse.User.current()) {
        Parse.User.logOut();
    }
    location.reload();
}

function startGame(level) {
    try {
        const _lobby = document.getElementById('lobby-container');
        const _game = document.getElementById('game-interface');
        
        if (_lobby) _lobby.style.display = 'none';
        if (_game) _game.style.display = 'flex';

        // Stop current BGM if playing in lobby
        if (window.lobbyBgm && !window.lobbyBgm.paused) {
            window.lobbyBgm.pause();
        }

        const active = Array.from(equippedItemIds).filter(id => inventoryData[id]?.count > 0 || inventoryData[id]?.unlimitedUntil > Date.now());

        if (window.initGame) {
            window.initGame(level, active, (consumed) => {
                consumed.forEach(id => {
                    if (inventoryData[id] && (!inventoryData[id].unlimitedUntil || inventoryData[id].unlimitedUntil < Date.now())) {
                        inventoryData[id].count--;
                    }
                });
                saveUserData();
                updateInventoryUI();
            });
        }
    } catch (err) {
        alert("startGame error: " + err.message + "\n" + err.stack);
    }
}

// 4. DATA PERSISTENCE
function LoadGameData() {
    try {
        const saved = localStorage.getItem('kodari_user_data');
        if (saved) {
            const data = JSON.parse(saved);
            inventoryData = data.inventory || {};
            if (data.lastLoginDate) window.lastLoginDate = data.lastLoginDate;
            if (data.maxUnlockedLevel) maxUnlockedLevel = data.maxUnlockedLevel;
        }
        const equipped = localStorage.getItem('kodari_equipped_items');
        equippedItemIds = new Set(JSON.parse(equipped || "[]"));
    } catch (e) {
        console.error("Load Game Data Error:", e);
        inventoryData = {};
        equippedItemIds = new Set();
        maxUnlockedLevel = 1;
    }
    updateInventoryUI();
}

function saveUserData() {
    // 1. localStorage 저장
    const dataToSave = { 
        inventory: inventoryData,
        lastLoginDate: window.lastLoginDate || "",
        maxUnlockedLevel: maxUnlockedLevel
    };
    localStorage.setItem('kodari_user_data', JSON.stringify(dataToSave));
    localStorage.setItem('kodari_equipped_items', JSON.stringify(Array.from(equippedItemIds)));

    // 2. 클라우드 저장 (구글 로그인 시)
    if (window.cloudSave) {
        window.cloudSave({
            inventory: inventoryData,
            equippedItems: Array.from(equippedItemIds),
            bestScore: window._bestScore || 0,
            maxUnlockedLevel: maxUnlockedLevel
        });
    }
}

// 5. RENDERING HELPERS
function updateInventoryUI() {
    if (!inventoryList) return;
    const itemIds = Object.keys(inventoryData).filter(id => inventoryData[id].count > 0 || inventoryData[id].unlimitedUntil > Date.now());
    if (itemIds.length === 0) {
        inventoryList.innerHTML = '<div class="empty-msg">Inventory is empty.</div>';
        return;
    }
    inventoryList.innerHTML = '';
    itemIds.forEach(id => {
        const data = inventoryData[id];
        const name = (document.querySelector(`.shop-item[data-id="${id}"] .item-name`)?.innerText) || id.toUpperCase();
        const icon = (document.querySelector(`.shop-item[data-id="${id}"] .item-icon`)?.innerText) || '📦';
        const count = (data.unlimitedUntil > Date.now()) ? "∞" : data.count;
        const isEquipped = equippedItemIds.has(id);

        const div = document.createElement('div');
        div.className = `inv-item ${isEquipped ? 'equipped' : ''} ${data.unlimitedUntil > Date.now() ? 'unlimited' : ''}`;
        div.innerHTML = `
            <div class="inv-equip-dot"></div>
            <div class="inv-icon-grid">${icon}</div>
            <div class="inv-count-badge">${count}</div>
            <div class="inv-name-mini">${name}</div>
        `;
        div.onclick = () => {
            if (equippedItemIds.has(id)) equippedItemIds.delete(id);
            else equippedItemIds.add(id);
            localStorage.setItem('kodari_equipped_items', JSON.stringify(Array.from(equippedItemIds)));
            updateInventoryUI();
        };
        inventoryList.appendChild(div);
    });
}

function renderLevels() {
    if (!levelList || !window.LEVELS) return;
    levelList.innerHTML = '';

    const phaseColors = {
        'ALPHA': { border: '#00f3ff', glow: 'rgba(0,243,255,0.4)', text: '#00f3ff', bg: 'rgba(0,243,255,0.03)' },
        'BRAVO': { border: '#ffcc00', glow: 'rgba(255,204,0,0.4)',  text: '#ffcc00', bg: 'rgba(255,204,0,0.03)' },
        'OMEGA': { border: '#ff0055', glow: 'rgba(255,0,85,0.4)',   text: '#ff0055', bg: 'rgba(255,0,85,0.03)' }
    };

    let currentPhase = null;

    window.LEVELS.forEach(lvl => {
        const c = phaseColors[lvl.phase] || phaseColors['ALPHA'];

        // Phase 그룹 헤더
        if (lvl.phase !== currentPhase) {
            currentPhase = lvl.phase;
            const header = document.createElement('div');
            header.className = 'phase-header';
            header.style.cssText = `
                display: flex; align-items: baseline; gap: 12px;
                margin: 24px 0 10px 0; padding: 0 5px;
            `;
            header.innerHTML = `
                <div style="
                    font-family: 'Orbitron', sans-serif;
                    font-size: 14px; font-weight: 800;
                    color: ${c.text}; letter-spacing: 2px;
                    text-shadow: 0 0 10px ${c.glow};
                ">${lvl.phaseNum}. ${lvl.phaseTitle}</div>
                <div style="font-size: 9px; color: ${c.text}aa; letter-spacing: 3px; font-family: 'Orbitron'; font-weight: 500;">PHASE: ${lvl.phase}</div>
                <div style="flex:1; height:1px; background: linear-gradient(90deg, ${c.border}44, transparent);"></div>
            `;
            levelList.appendChild(header);
        }

        // 레벨 카드 (LEVEL + TITLE)
        const card = document.createElement('div');
        card.className = 'level-card';
        card.style.cssText = `
            display: flex; align-items: center; gap: 0;
            padding: 0;
            background: ${c.bg};
            border: 1px solid ${c.border}15;
            border-radius: 4px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative; overflow: hidden;
        `;

        card.innerHTML = `
            <!-- Level Number Block -->
            <div style="
                background: ${c.border}15;
                min-width: 60px; height: 50px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                border-right: 1px solid ${c.border}22;
                position: relative;
            ">
                <div style="font-size: 8px; color: ${c.text}cc; font-family: 'Orbitron'; margin-bottom: -2px; font-weight: 600;">LVL</div>
                <div style="
                    font-family: 'Orbitron', sans-serif;
                    font-size: 22px; font-weight: 900;
                    color: ${c.border}; line-height: 1;
                    text-shadow: 0 0 15px ${c.glow};
                ">${String(lvl.id).padStart(2, '0')}</div>
            </div>

            <!-- Mission Title Block -->
            <div style="flex:1; padding: 0 18px; min-width: 0;">
                <div style="
                    font-family: 'Orbitron', sans-serif;
                    font-size: 15px; font-weight: 700;
                    color: #ffffff; letter-spacing: 1.5px;
                    text-transform: uppercase;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                ">${lvl.title} <span style="font-size: 11px; opacity: 0.7; font-weight: 400;">(${lvl.subTitle || ''})</span></div>
                <div style="
                    font-size: 10px; color: #888;
                    margin-top: 2px; font-weight: 400; font-style: italic;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                ">${lvl.metadata}</div>
            </div>

            <!-- Right Info Block -->
            <div style="padding-right: 20px; text-align: right;">
                <div style="font-family: 'Orbitron', sans-serif; font-size: 9px; color: #444; font-weight: 800; letter-spacing: 1px;">
                    ${lvl.bpm} BPM
                </div>
            </div>
            
            <!-- Hover Slide Decor -->
            <div class="card-hover-decor" style="
                position: absolute; left: 0; bottom: 0; width: 0; height: 2px;
                background: ${c.border}; transition: width 0.3s ease;
            "></div>
        `;

        card.addEventListener('mouseenter', () => {
            card.style.background = c.bg.replace('0.03', '0.08');
            card.style.borderColor = `${c.border}44`;
            card.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), inset 0 0 15px ${c.glow}`;
            card.style.transform = 'translateY(-2px)';
            card.querySelector('.card-hover-decor').style.width = '100%';
        });
        card.addEventListener('mouseleave', () => {
            card.style.background = c.bg;
            card.style.borderColor = `${c.border}15`;
            card.style.boxShadow = 'none';
            card.style.transform = 'translateY(0)';
            card.querySelector('.card-hover-decor').style.width = '0';
        });

        const isLocked = lvl.id > maxUnlockedLevel;
        if (isLocked) {
            card.classList.add('locked');
            card.innerHTML += `<div class="card-lock-overlay">🔒</div>`;
        } else {
            card.onclick = () => openMissionBriefing(lvl);
        }

        levelList.appendChild(card);
    });
}

// --- MISSION CONTROL ---
let pendingLevelConfig = null;

function openMissionBriefing(lvl) {
    const lastPrompted = parseInt(localStorage.getItem('kodari_consent_time') || '0', 10);
    const now = Date.now();
    
    // Once per 24 hours (86400000 ms)
    if (now - lastPrompted > 86400000 && !window.recordingStreamActive) {
        const modal = document.getElementById('recording-consent-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (window.updatePlayerRank) window.updatePlayerRank();
            
            document.getElementById('btn-consent-accept').onclick = async (e) => {
                e.preventDefault();
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true });
                    
                    // 권한 승인 후 팝업 닫기
                    modal.style.display = 'none';
                    localStorage.setItem('kodari_consent_time', now.toString());
                    
                    window.recordingStreamActive = stream;
                    
                    // Proceed to mission
                    continueMission(lvl);
                } catch(e) {
                    console.log("User cancelled screen share", e);
                    modal.style.display = 'none';
                    localStorage.setItem('kodari_consent_time', now.toString());
                    continueMission(lvl);
                }
            };
            
            document.getElementById('btn-consent-decline').onclick = () => {
                modal.style.display = 'none';
                localStorage.setItem('kodari_consent_time', now.toString()); // Save prompt time even if declined
                continueMission(lvl);
            };
            return; // Wait for user choice
        }
    }
    
    continueMission(lvl);
}

function continueMission(lvl) {
    pendingLevelConfig = lvl;

    // 팝업 없이 바로 게임 화면으로 전환
    const _lobby = document.getElementById('lobby-container');
    const _game = document.getElementById('game-interface');
    if (_lobby) _lobby.style.display = 'none';
    if (_game) _game.style.display = 'flex';

    // 로비 BGM 정지
    if (window.lobbyBgm && !window.lobbyBgm.paused) {
        window.lobbyBgm.pause();
    }

    // 장착된 아이템 목록을 window에 노출 (game.js의 카운트다운에서 참조)
    const active = Array.from(equippedItemIds).filter(id =>
        inventoryData[id]?.count > 0 || inventoryData[id]?.unlimitedUntil > Date.now()
    );
    window._equippedItems = active;

    // 오디오 잠금 해제 후 인게임 카운트다운 시작
    if (window.prepareMission) {
        window.prepareMission(lvl);
    }
}

async function renderRanking() {
    if (!rankingList) return;

    // Show loading state
    rankingList.innerHTML = '<div class="empty-msg">Fetching global records...</div>';

    if (typeof Parse === 'undefined') {
        rankingList.innerHTML = '<div class="empty-msg">Cloud system offline.</div>';
        return;
    }

    try {
        const UserData = Parse.Object.extend('UserData');
        const googleId = localStorage.getItem('kodari_google_id');
        
        // 1. Fetch Top 50
        const topQuery = new Parse.Query(UserData);
        topQuery.descending('bestScore');
        topQuery.limit(50);
        const topResults = await topQuery.find();
        
        // 2. Total Count
        const countQuery = new Parse.Query(UserData);
        const totalUsers = await countQuery.count();

        if (topResults.length === 0) {
            rankingList.innerHTML = '<div class="empty-msg">No records found.</div>';
            return;
        }

        let userInTop50 = false;
        let rankListHtml = topResults.map((r, index) => {
            const score = r.get('bestScore') || 0;
            const rank = index + 1;
            const percentile = (rank / totalUsers) * 100;
            const tier = getRankTier(percentile);
            const rGoogleId = r.get('googleId');
            const isMe = (googleId && rGoogleId === googleId);
            if (isMe) userInTop50 = true;

            const name = rGoogleId ? `AGENT_${rGoogleId.slice(-5)}` : "ANONYMOUS";

            return `
                <div class="rank-item ${isMe ? 'my-rank-item' : ''}" title="${tier.name} (Top ${percentile.toFixed(1)}%)">
                    <div class="rank-pos ${tier.class}">${rank}</div>
                    <div class="rank-name">
                        <span class="rank-badge-icon">${tier.emoji}</span>
                        ${name} ${isMe ? '<small>(YOU)</small>' : ''}
                    </div>
                    <div class="rank-score">${score.toLocaleString()}</div>
                </div>
            `;
        }).join('');

        // 3. Add personal rank if outside top 50
        if (googleId && !userInTop50) {
            const myQuery = new Parse.Query(UserData);
            myQuery.equalTo('googleId', googleId);
            const me = await myQuery.first();

            if (me) {
                const myScore = me.get('bestScore') || 0;
                // Count users with strictly higher score to get rank
                const betterUsersQuery = new Parse.Query(UserData);
                betterUsersQuery.greaterThan('bestScore', myScore);
                const myRank = (await betterUsersQuery.count()) + 1;
                
                const percentile = (myRank / totalUsers) * 100;
                const tier = getRankTier(percentile);
                const myName = `AGENT_${googleId.slice(-5)}`;

                rankListHtml += `
                    <div class="my-rank-separator"></div>
                    <div class="rank-item my-rank-item" title="${tier.name} (Top ${percentile.toFixed(1)}%)">
                        <div class="rank-pos ${tier.class}">${myRank}</div>
                        <div class="rank-name">
                            <span class="rank-badge-icon">${tier.emoji}</span>
                            ${myName} <small>(YOU)</small>
                        </div>
                        <div class="rank-score">${myScore.toLocaleString()}</div>
                    </div>
                `;
            }
        }

        rankingList.innerHTML = rankListHtml;
    } catch (e) {
        console.error("RANKING // Render Error:", e);
        rankingList.innerHTML = '<div class="empty-msg">Failed to load rankings.</div>';
    }
}

function logout() {
    console.log("SYSTEM // Logging out...");
    localStorage.removeItem('kodari_v2_session');
    localStorage.removeItem('kodari_user_data');
    localStorage.removeItem('kodari_equipped_items');
    if (typeof Parse !== 'undefined' && Parse.User.current()) {
        Parse.User.logOut();
    }
    location.reload();
}

// 6. UTILITIES
function toNumeric(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = val.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

function sysAlert(msg, title = "SYSTEM MESSAGE") {
    if (!modalContent || !modalOverlay) { alert(msg); return Promise.resolve(); }
    modalContent.innerText = msg;
    modalBtnCancel.style.display = 'none';
    modalOverlay.style.display = 'flex';
    return new Promise(resolve => {
        modalBtnOk.onclick = () => { modalOverlay.style.display = 'none'; resolve(); };
    });
}

function sysConfirm(msg, title = "CONFIRMATION") {
    if (!modalContent || !modalOverlay) return Promise.resolve(confirm(msg));
    modalContent.innerText = msg;
    modalBtnCancel.style.display = 'block';
    modalOverlay.style.display = 'flex';
    return new Promise(resolve => {
        modalBtnOk.onclick = () => { modalOverlay.style.display = 'none'; resolve(true); };
        modalBtnCancel.onclick = () => { modalOverlay.style.display = 'none'; resolve(false); };
    });
}

// 7. DAILY REWARD SYSTEM
function checkDailyReward() {
    const today = new Date().toDateString();
    // Use window.lastLoginDate loaded from LoadGameData
    if (window.lastLoginDate !== today) {
        // Show reward modal
        const modal = document.getElementById('daily-reward-modal');
        const giftBox = document.getElementById('gift-box');
        const rewardResult = document.getElementById('reward-result');
        const closeBtn = document.getElementById('btn-reward-close');
        
        if (!modal || !giftBox) return;
        
        // Reset states
        giftBox.style.display = 'block';
        giftBox.classList.remove('shaking');
        rewardResult.style.display = 'none';
        closeBtn.style.display = 'none';
        modal.style.display = 'flex';
        
        // Handle gift box click
        giftBox.onclick = () => {
            giftBox.classList.add('shaking');
            
            // Wait 3 seconds
            setTimeout(() => {
                giftBox.classList.remove('shaking');
                giftBox.style.display = 'none';
                
                // 확률 가중치 기반 아이템 추첨
                const wonItem = drawWeightedItem();
                
                // Update UI
                document.getElementById('reward-icon').innerText = wonItem.icon;
                document.getElementById('reward-name').innerText = wonItem.name;
                
                // 등급 배지 표시
                const gradeEl = document.getElementById('reward-grade');
                if (gradeEl) {
                    gradeEl.innerText = wonItem.gradeName;
                    gradeEl.className = `reward-grade grade-${wonItem.grade.toLowerCase()}`;
                    gradeEl.style.display = 'inline-block';
                }
                
                rewardResult.style.display = 'block';
                closeBtn.style.display = 'inline-block';
                
                // Add to inventory
                if (!inventoryData[wonItem.id]) inventoryData[wonItem.id] = { count: 0, unlimitedUntil: 0 };
                inventoryData[wonItem.id].count++;
                
                // Save today's date so it won't appear again today
                window.lastLoginDate = today;
                saveUserData();
                updateInventoryUI();
                
            }, 3000); // 3-second wait
        };
        
        // Handle close
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
}

// 8. 2-HOUR RECURRING GIFT
function manageRecurringGift() {
    const giftBoxSpan = document.getElementById('recurring-gift-box');
    if (!giftBoxSpan) return;

    function updateTimer() {
        let nextTimeStr = localStorage.getItem('kodari_next_gift_time');
        let nextTime = parseInt(nextTimeStr, 10);

        // If no timer exists, or it's invalid, set it to 2 hours from now
        if (!nextTime || isNaN(nextTime)) {
            nextTime = Date.now() + (2 * 60 * 60 * 1000);
            localStorage.setItem('kodari_next_gift_time', nextTime.toString());
        }

        const now = Date.now();
        const diff = nextTime - now;

        if (diff <= 0) {
            // Time is up, show gift box
            giftBoxSpan.innerHTML = '🎁';
            giftBoxSpan.classList.add('ready');
            giftBoxSpan.title = "Click to receive supply drop!";
            
            giftBoxSpan.onclick = () => {
                // 확률 가중치 기반 아이템 추첨 (LEGENDARY 확률 3%로 낮춤)
                const wonItem = drawWeightedItem(true);
                
                if (!inventoryData[wonItem.id]) inventoryData[wonItem.id] = { count: 0, unlimitedUntil: 0 };
                inventoryData[wonItem.id].count++;
                
                saveUserData();
                updateInventoryUI();
                sysAlert(`[SUPPLY DROP]\n\nObtained: 【${wonItem.gradeName}】 ${wonItem.icon} ${wonItem.name} x1!`, "SUPPLY DROP");

                // Reset timer for another 2 hours
                localStorage.setItem('kodari_next_gift_time', (Date.now() + (2 * 60 * 60 * 1000)).toString());
                
                // Reset UI state
                giftBoxSpan.classList.remove('ready');
                giftBoxSpan.onclick = null;
                giftBoxSpan.title = "";
                updateTimer(); // Immediately show new countdown
            };
        } else {
            // Still counting down
            giftBoxSpan.classList.remove('ready');
            giftBoxSpan.onclick = null;
            giftBoxSpan.title = "Time until next supply drop";
            
            const totalSeconds = Math.floor(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            giftBoxSpan.innerHTML = 
                String(hours).padStart(2, '0') + ':' + 
                String(minutes).padStart(2, '0') + ':' + 
                String(seconds).padStart(2, '0');
        }
    }

    // Run immediately, then every second
    updateTimer();
    setInterval(updateTimer, 1000);
}

// 9. 가중치 기반 아이템 추첨 시스템
// isSupplyDrop=true 이면 LEGENDARY 확률이 3%로 낮아짐 (2시간 보급품용)
function drawWeightedItem(isSupplyDrop = false) {
    const ITEM_POOL = [
        // LEGENDARY (5% / 보급품 3%)
        { id: 'revive',     name: 'REVIVE', icon: '🔄', grade: 'LEGENDARY', gradeName: '★ LEGENDARY', weight: isSupplyDrop ? 3 : 5 },
        // EPIC (합 15%)
        { id: 'screen-flip-off', name: 'SCREEN FLIP OFF',     icon: '🛡️', grade: 'EPIC',      gradeName: '◆ EPIC',      weight: 7.5 },
        { id: 'fog-off',    name: 'FOG OFF',      icon: '🌫️', grade: 'EPIC',      gradeName: '◆ EPIC',      weight: 7.5 },
        // RARE (합 30% / 보급품은 LEGENDARY 빠진 만큼 분배 → 각 10.67%)
        { id: 'auto-space', name: 'AUTO SPACE',  icon: '⌨️', grade: 'RARE',      gradeName: '▲ RARE',      weight: isSupplyDrop ? 10.67 : 10 },
        { id: 'guide',      name: 'NOTE GUIDE',    icon: '📏', grade: 'RARE',      gradeName: '▲ RARE',      weight: isSupplyDrop ? 10.67 : 10 },
        { id: 'wide-lens',  name: 'WIDE LENS',    icon: '🔍', grade: 'RARE',      gradeName: '▲ RARE',      weight: isSupplyDrop ? 10.66 : 10 },
        // COMMON (합 50%)
        { id: 'speedup',    name: 'SPEED UP',    icon: '⚡', grade: 'COMMON',    gradeName: '● COMMON',    weight: 25 },
        { id: 'speeddown',  name: 'SPEED DOWN',    icon: '🐢', grade: 'COMMON',    gradeName: '● COMMON',    weight: 25 }
    ];

    // 총 가중치 합산
    const totalWeight = ITEM_POOL.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const item of ITEM_POOL) {
        rand -= item.weight;
        if (rand <= 0) return item;
    }
    // 부동소수점 오차 방어
    return ITEM_POOL[ITEM_POOL.length - 1];
}

// Export initialization for index.html
window.Initialize = Initialize;
window.handleCredentialResponse = handleCredentialResponse;
window.startGame = startGame;
window.saveUserData = saveUserData;
window.drawWeightedItem = drawWeightedItem;
window.updateInventoryUI = updateInventoryUI;

window.showRecordingGiftModal = function() {
    const modal = document.getElementById('recording-gift-modal');
    const giftBox = document.getElementById('recording-gift-box');
    const resultDiv = document.getElementById('recording-reward-result');
    const closeBtn = document.getElementById('btn-recording-reward-close');

    if (!modal || !giftBox) return;

    // Reset state
    giftBox.style.display = 'block';
    giftBox.classList.remove('shaking');
    resultDiv.style.display = 'none';
    closeBtn.style.display = 'none';
    modal.style.display = 'flex';

    giftBox.onclick = () => {
        giftBox.classList.add('shaking');
        
        setTimeout(() => {
            giftBox.classList.remove('shaking');
            giftBox.style.display = 'none';
            resultDiv.style.display = 'block';
            closeBtn.style.display = 'inline-block';

            // Add Master Guide Pack to inventory
            if(!window.inventoryData) window.inventoryData = {};
            window.inventoryData['revive'] = window.inventoryData['revive'] || { count: 0, unlimitedUntil: 0 };
            window.inventoryData['revive'].count += 3;
            
            ['guide', 'auto-space', 'wide-lens'].forEach(id => {
                window.inventoryData[id] = window.inventoryData[id] || { count: 0, unlimitedUntil: 0 };
                window.inventoryData[id].count += 1;
            });
            
            saveUserData();
            updateInventoryUI();
        }, 2000); // 2-second shake
    };

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
};

// inventoryData를 game.js에서 접근·수정할 수 있도록 getter/setter로 노출
Object.defineProperty(window, 'inventoryData', {
    get: () => inventoryData,
    set: (val) => { inventoryData = val; },
    configurable: true
});

window.showPerfectReward = function() {
    const modal = document.getElementById('perfect-reward-modal');
    const giftBox = document.getElementById('btn-open-perfect-gift');
    const itemsList = document.getElementById('perfect-items-list');
    const itemsContainer = document.getElementById('perfect-items-container');
    const claimBtn = document.getElementById('btn-perfect-claim');

    if (!modal) return;

    // Reset state
    modal.style.display = 'flex';
    giftBox.style.display = 'inline-block';
    giftBox.classList.remove('pop');
    itemsList.style.display = 'none';
    itemsList.classList.remove('show');

    giftBox.onclick = () => {
        // Play pop sound
        playPopSound();
        giftBox.classList.add('pop');

        setTimeout(() => {
            giftBox.style.display = 'none';
            itemsList.style.display = 'block';
            
            // Populate items list
            const rewards = [
                { name: 'Revive Protocol', count: 5, icon: '💊' },
                { name: 'Rhythm Guide', count: 3, icon: '🎯' },
                { name: 'Auto-Space', count: 3, icon: '⌨️' },
                { name: 'Wide Lens', count: 3, icon: '👁️' }
            ];

            itemsContainer.innerHTML = rewards.map(item => `
                <div class="reward-item-row" style="color: white; font-size: 14px;">
                    <span>${item.icon} ${item.name}</span>
                    <span style="color: gold;">+${item.count}</span>
                </div>
            `).join('');

            setTimeout(() => itemsList.classList.add('show'), 100);

            // Add to inventory
            if(!window.inventoryData) window.inventoryData = {};
            
            window.inventoryData['revive'] = window.inventoryData['revive'] || { count: 0, unlimitedUntil: 0 };
            window.inventoryData['revive'].count += 5;

            ['guide', 'auto-space', 'wide-lens'].forEach(id => {
                window.inventoryData[id] = window.inventoryData[id] || { count: 0, unlimitedUntil: 0 };
                window.inventoryData[id].count += 3;
            });

            saveUserData();
            updateInventoryUI();
        }, 600);
    };

    claimBtn.onclick = () => {
        modal.style.display = 'none';
    };
};

function playPopSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
}

function initSnackbarTimer() {
    const snackbar = document.getElementById('neon-snackbar');
    if (!snackbar) return;

    const ONE_HOUR = 60 * 60 * 1000;
    const SHOW_DURATION = 10 * 1000;

    function checkAndShowSnackbar() {
        const lastShown = parseInt(localStorage.getItem('last_neon_snackbar_time') || '0');
        const now = Date.now();

        if (now - lastShown >= ONE_HOUR) {
            // Show it
            snackbar.classList.add('show');
            localStorage.setItem('last_neon_snackbar_time', now.toString());

            // Hide after 10 seconds
            setTimeout(() => {
                snackbar.classList.remove('show');
            }, SHOW_DURATION);
        }
    }

    // Check immediately on load
    checkAndShowSnackbar();

    // Then check every minute
    setInterval(checkAndShowSnackbar, 60 * 1000);
}

window.unlockNextLevel = function(clearedId) {
    if (clearedId === maxUnlockedLevel) {
        maxUnlockedLevel = clearedId + 1;
        saveUserData();
        renderLevels(); // Refresh UI
    }
};

window.onload = () => {
    Initialize();
    initSnackbarTimer();
};
