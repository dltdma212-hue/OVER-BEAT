 // --- SYSTEM AUTHENTICATION MODULE --- //

const DB_KEY = 'kodari_v2_users';
const SESSION_KEY = 'kodari_v2_session';

// Initialize System with Admin Accounts
(function initSystem() {
    let users = [];
    try {
        const data = localStorage.getItem(DB_KEY);
        users = data ? JSON.parse(data) : [];
        if (!Array.isArray(users)) users = [];
    } catch (e) {
        users = [];
    }

    // CEO Account
    if (!users.find(u => u.id === 'ceo')) {
        users.push({ id: 'ceo', pw: 'admin', name: 'CEO Jung', role: 'ADMIN' });
    }
    // Bujang Account
    if (!users.find(u => u.id === 'bujang')) {
        users.push({ id: 'bujang', pw: 'kodari', name: 'Kodari Bujang', role: 'DEV' });
    }

    localStorage.setItem(DB_KEY, JSON.stringify(users));
    console.log("SYSTEM // Admin Accounts Initialized");
})();

// ── ID/PW 로그인 ──────────────────────────────────────
window.login = function (id, pw) {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        if (!Array.isArray(users)) users = [];
    } catch (e) { users = []; }

    const user = users.find(u => u.id === id && u.pw === pw);

    if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return { success: true, user, msg: `환영합니다, ${user.name}님` };
    } else {
        return { success: false, msg: "접속 거부 // 잘못된 아이디 또는 비밀번호" };
    }
}

window.register = function (id, pw) {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        if (!Array.isArray(users)) users = [];
    } catch (e) { users = []; }

    if (users.find(u => u.id === id)) {
        return { success: false, msg: "오류 // 이미 존재하는 아이디입니다" };
    }

    const newUser = { id, pw, name: `User_${id}`, role: 'USER' };
    users.push(newUser);
    localStorage.setItem(DB_KEY, JSON.stringify(users));
    return { success: true, msg: "가입 완료 // 로그인해 주세요" };
}

window.getSession = function () {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
}

window.logout = function () {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('kodari_google_id');
    location.reload();
}

// ── Parse 클라우드 데이터 저장 ────────────────────────
window.cloudSave = async function (dataObj) {
    if (typeof Parse === 'undefined') return;
    const googleId = localStorage.getItem('kodari_google_id');
    if (!googleId) return; // 구글 로그인 아닐 경우 스킵

    try {
        const UserData = Parse.Object.extend('UserData');
        const query = new Parse.Query(UserData);
        query.equalTo('googleId', googleId);

        let record = await query.first();
        if (!record) {
            record = new UserData();
            record.set('googleId', googleId);
        }

        record.set('credits', dataObj.credits);
        record.set('inventory', dataObj.inventory);
        record.set('equippedItems', dataObj.equippedItems || []);
        record.set('bestScore', dataObj.bestScore || 0);

        await record.save();
        console.log("CLOUD // 데이터 저장 완료");
    } catch (err) {
        console.error("CLOUD // 저장 오류:", err.message);
    }
};

// ── Parse 클라우드 데이터 불러오기 ────────────────────
window.cloudLoad = async function () {
    if (typeof Parse === 'undefined') return null;
    const googleId = localStorage.getItem('kodari_google_id');
    if (!googleId) return null;

    try {
        const UserData = Parse.Object.extend('UserData');
        const query = new Parse.Query(UserData);
        query.equalTo('googleId', googleId);

        const record = await query.first();
        if (!record) return null;

        return {
            credits: record.get('credits') ?? 100,
            inventory: record.get('inventory') ?? {},
            equippedItems: record.get('equippedItems') ?? [],
            bestScore: record.get('bestScore') ?? 0
        };
    } catch (err) {
        console.error("CLOUD // 불러오기 오류:", err.message);
        return null;
    }
};
