// ============================================================
// KODARI : OVER-BEAT — PayPal 결제 모듈
// ============================================================
// 전환 방법: Sandbox → Live
//   index.html의 PayPal SDK URL에서 client-id만 Live용으로 교체
// ============================================================

// ── 패키지 아이템 지급 정의 ──────────────────────────────────
const PACKAGE_GRANTS = {
    'pkg-perfect': [
        // 30일 무제한 (unlimitedUntil = 지금 + 30일)
        { id: 'auto-space', unlimitedDays: 30 },
        { id: 'guide',      unlimitedDays: 30 },
        { id: 'wide-lens',  unlimitedDays: 30 }
    ],
    'pkg-beginner': [
        { id: 'auto-space', count: 1 },
        { id: 'wide-lens',  count: 1 },
        { id: 'revive',     count: 3 }
    ],
    'pkg-master': [
        { id: 'revive',     count: 3 },
        { id: 'guide',      count: 1 },
        { id: 'speedup',    count: 1 },
        { id: 'speeddown',  count: 1 }
    ]
};

// ── 아이템 정보 (아이콘/이름 보조) ───────────────────────────
const ITEM_META = {
    'revive':     { name: 'REVIVE',   icon: '🔄' },
    'auto-space': { name: 'AUTO SPACE',    icon: '⌨️' },
    'screen-flip-off': { name: 'SCREEN FLIP OFF',        icon: '🛡️' },
    'fog-off':    { name: 'FOG OFF',        icon: '🌫️' },
    'guide':      { name: 'NOTE GUIDE',      icon: '📏' },
    'wide-lens':  { name: 'WIDE LENS',      icon: '🔍' },
    'speedup':    { name: 'SPEED UP',      icon: '⚡' },
    'speeddown':  { name: 'SPEED DOWN',      icon: '🐢' }
};

// ── 현재 결제 대상 (전역) ────────────────────────────────────
let _pendingPayment = null;
let _paypalButtonsInstance = null;

// ── 결제 모달 열기 ───────────────────────────────────────────
window.openPayPalCheckout = function (itemId, itemName, itemIcon, price) {
    _pendingPayment = { itemId, itemName, itemIcon, price };

    const overlay = document.getElementById('paypal-modal-overlay');
    const nameEl  = document.getElementById('pp-item-name');
    const iconEl  = document.getElementById('pp-item-icon');
    const priceEl = document.getElementById('pp-item-price');
    const btnCon  = document.getElementById('paypal-button-container');
    const statusEl= document.getElementById('pp-status');

    if (!overlay) return;

    if (nameEl)  nameEl.innerText  = itemName;
    if (iconEl)  iconEl.innerText  = itemIcon;
    if (priceEl) priceEl.innerText = `$${Number(price).toFixed(2)}`;
    if (statusEl) { statusEl.innerText = ''; statusEl.className = ''; }
    if (btnCon)  btnCon.innerHTML  = ''; // 이전 버튼 제거

    overlay.style.display = 'flex';

    // PayPal SDK 로드 확인
    if (typeof paypal === 'undefined') {
        if (statusEl) {
            statusEl.innerText = 'Failed to load PayPal SDK. Please refresh.';
            statusEl.className = 'pp-error';
        }
        return;
    }

    // 이전 버튼 인스턴스 정리
    if (_paypalButtonsInstance) {
        try { _paypalButtonsInstance.close(); } catch(e) {}
        _paypalButtonsInstance = null;
    }

    // PayPal 버튼 렌더링
    _paypalButtonsInstance = paypal.Buttons({
        style: {
            layout: 'vertical',
            color:  'black',
            shape:  'rect',
            label:  'pay',
            height: 45
        },

        createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: Number(price).toFixed(2),
                        currency_code: 'USD'
                    },
                    description: `[KODARI] ${itemName}`
                }]
            });
        },

        onApprove: async (data, actions) => {
            if (statusEl) {
                statusEl.innerText = 'Approving payment...';
                statusEl.className = 'pp-pending';
            }
            try {
                const order = await actions.order.capture();
                console.log('PAYPAL // 결제 완료:', order);
                grantPurchasedItem(itemId);
                showPayPalSuccess(itemName, itemIcon);
            } catch (err) {
                console.error('PAYPAL // 캡처 오류:', err);
                if (statusEl) {
                    statusEl.innerText = 'An error occurred during payment processing.';
                    statusEl.className = 'pp-error';
                }
            }
        },

        onCancel: () => {
            if (statusEl) {
                statusEl.innerText = 'Payment was cancelled.';
                statusEl.className = 'pp-cancel';
            }
        },

        onError: (err) => {
            console.error('PAYPAL // 오류:', err);
            if (statusEl) {
                statusEl.innerText = 'Payment error occurred. Please try again.';
                statusEl.className = 'pp-error';
            }
        }
    });

    _paypalButtonsInstance.render('#paypal-button-container');
};

// ── 아이템 지급 ──────────────────────────────────────────────
function grantPurchasedItem(itemId) {
    const inv = window.inventoryData;
    if (!inv) return;

    const isPackage = PACKAGE_GRANTS[itemId];

    if (isPackage) {
        // 패키지: 여러 아이템 지급
        isPackage.forEach(grant => {
            if (!inv[grant.id]) inv[grant.id] = { count: 0, unlimitedUntil: 0 };
            if (grant.unlimitedDays) {
                const ms = grant.unlimitedDays * 24 * 60 * 60 * 1000;
                inv[grant.id].unlimitedUntil = Math.max(inv[grant.id].unlimitedUntil || 0, Date.now() + ms);
            } else {
                inv[grant.id].count += (grant.count || 1);
            }
        });
    } else {
        // 개별 아이템: 1개 지급
        if (!inv[itemId]) inv[itemId] = { count: 0, unlimitedUntil: 0 };
        inv[itemId].count++;
    }

    if (window.saveUserData)      window.saveUserData();
    if (window.updateInventoryUI) window.updateInventoryUI();
}

// ── 결제 성공 UI ─────────────────────────────────────────────
function showPayPalSuccess(itemName, itemIcon) {
    const overlay = document.getElementById('paypal-modal-overlay');
    const inner   = document.getElementById('paypal-modal-inner');
    if (!inner) return;

    inner.innerHTML = `
        <div class="pp-success-icon">${itemIcon}</div>
        <div class="pp-success-title">Payment Complete!</div>
        <div class="pp-success-msg"><strong>${itemName}</strong> has been added to your inventory.</div>
        <button id="pp-close-success" class="pp-close-btn">CONFIRM</button>
    `;

    document.getElementById('pp-close-success').onclick = () => {
        overlay.style.display = 'none';
        // 모달 원래 구조 복원 (다음 결제를 위해)
        _restoreModalStructure();
    };
}

// ── 모달 구조 복원 ───────────────────────────────────────────
function _restoreModalStructure() {
    const inner = document.getElementById('paypal-modal-inner');
    if (!inner) return;
    inner.innerHTML = `
        <div class="pp-header">
            <div class="pp-header-label">KODARI PAY</div>
            <button id="pp-close-btn" class="pp-x-btn">✕</button>
        </div>
        <div class="pp-item-preview">
            <div id="pp-item-icon" class="pp-preview-icon"></div>
            <div class="pp-preview-info">
                <div id="pp-item-name" class="pp-preview-name"></div>
                <div id="pp-item-price" class="pp-preview-price"></div>
            </div>
        </div>
        <div id="pp-status" class="pp-status"></div>
        <div id="paypal-button-container"></div>
    `;
    document.getElementById('pp-close-btn').onclick = () => {
        document.getElementById('paypal-modal-overlay').style.display = 'none';
    };
}

// ── 모달 닫기 버튼 초기 바인딩 ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('pp-close-btn');
    const overlay  = document.getElementById('paypal-modal-overlay');
    if (closeBtn && overlay) {
        closeBtn.onclick = () => { overlay.style.display = 'none'; };
    }
    // 오버레이 외부 클릭 시 닫기
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.style.display = 'none';
        });
    }
});
