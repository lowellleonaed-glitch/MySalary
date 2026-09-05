const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Starting PWA, PIN Lock, Mobile Layout, Category Tabs & Salary UI Test Suite ---');

// 1. Check PWA Manifest
const manifestPath = path.join(__dirname, 'manifest.json');
assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.short_name, 'SalaryHub', 'manifest short_name must be SalaryHub');
assert.equal(manifest.display, 'standalone', 'manifest display must be standalone');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest must have at least 2 icons');
assert.ok(manifest.theme_color, 'manifest must specify theme_color');
assert.ok(manifest.background_color, 'manifest must specify background_color');
console.log('✓ manifest.json validation passed');

// 2. Check Service Worker
const swPath = path.join(__dirname, 'sw.js');
assert.ok(fs.existsSync(swPath), 'sw.js must exist');
const swCode = fs.readFileSync(swPath, 'utf8');
assert.match(swCode, /addEventListener\(['"]install['"]/, 'sw.js must have install event listener');
assert.match(swCode, /addEventListener\(['"]activate['"]/, 'sw.js must have activate event listener');
assert.match(swCode, /addEventListener\(['"]fetch['"]/, 'sw.js must have fetch event listener');
assert.match(swCode, /caches\.open/, 'sw.js must open cache');
console.log('✓ sw.js validation passed');

// 3. Check App Icons & iOS Apple Touch Icons
const iconFiles = [
    'icon.svg', 'icon-192.png', 'icon-512.png',
    'apple-touch-icon.png', 'apple-touch-icon-180x180.png',
    'apple-touch-icon-120x120.png', 'apple-touch-icon-167x167.png', 'apple-touch-icon-152x152.png'
];
iconFiles.forEach(iconName => {
    const iconP = path.join(__dirname, 'icons', iconName);
    assert.ok(fs.existsSync(iconP), `Icon ${iconName} must exist`);
    const stat = fs.statSync(iconP);
    assert.ok(stat.size > 0, `Icon ${iconName} must not be empty`);
});
assert.ok(fs.existsSync(path.join(__dirname, 'apple-touch-icon.png')), 'Root apple-touch-icon.png must exist');
console.log('✓ App icons and iOS Apple Touch Icons exist and verified');

// 4. Check HTML Markup Elements & Mobile Viewport
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert.match(html, /rel="manifest"\s+href="manifest\.json"/, 'index.html must link to manifest.json');
assert.match(html, /viewport-fit=cover/, 'index.html must support iOS viewport-fit=cover');
assert.match(html, /id="pinLockOverlay"/, 'index.html must contain #pinLockOverlay');
assert.match(html, /id="pinSetupModal"/, 'index.html must contain #pinSetupModal');
assert.match(html, /id="securitySettingsPanel"/, 'index.html must contain #securitySettingsPanel');
assert.match(html, /id="quickLockBtn"/, 'index.html must contain #quickLockBtn');
assert.match(html, /id="installAppBtn"/, 'index.html must contain #installAppBtn');
assert.match(html, /id="pinLockNumpad"/, 'index.html must contain #pinLockNumpad');
assert.match(html, /id="pinSetupNumpad"/, 'index.html must contain #pinSetupNumpad');
assert.match(html, /id="forgotPinBtn"/, 'index.html must contain #forgotPinBtn');
assert.match(html, /id="mobileBottomNav"/, 'index.html must contain #mobileBottomNav for iPhone & mobile');
assert.match(html, /class="mobile-top-bar"/, 'index.html must contain mobile-top-bar');
assert.match(html, /id="settingsCatNav"/, 'index.html must contain #settingsCatNav');
assert.match(html, /data-settings-cat="general"/, 'index.html must have general category tab');
assert.match(html, /data-settings-cat="calculation"/, 'index.html must have calculation category tab');
assert.match(html, /data-settings-cat="security"/, 'index.html must have security category tab');
assert.match(html, /id="salaryMobileCards"/, 'index.html must contain #salaryMobileCards');
assert.match(html, /class="salary-total-card"/, 'index.html must contain .salary-total-card');
console.log('✓ index.html structure, mobile elements, settings category tabs, and salary breakdown verified');

// 5. Check CSS Classes & iOS Safe Area Styles
const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
assert.match(css, /\.pin-lock-overlay/, 'style.css must contain .pin-lock-overlay');
assert.match(css, /\.pin-key/, 'style.css must contain .pin-key');
assert.match(css, /\.pin-dot/, 'style.css must contain .pin-dot');
assert.match(css, /\.pin-dots-container\.shake/, 'style.css must have shake animation for error state');
assert.match(css, /\.pwa-install-btn/, 'style.css must style .pwa-install-btn');
assert.match(css, /\.pin-status-pill/, 'style.css must style .pin-status-pill');
assert.match(css, /\.mobile-bottom-nav/, 'style.css must contain .mobile-bottom-nav');
assert.match(css, /\.mobile-top-bar/, 'style.css must contain .mobile-top-bar');
assert.match(css, /env\(safe-area-inset-bottom/, 'style.css must support iOS safe-area-inset-bottom');
assert.match(css, /\.settings-categories-nav/, 'style.css must contain .settings-categories-nav');
assert.match(css, /\.settings-cat-btn/, 'style.css must contain .settings-cat-btn');
assert.match(css, /\.salary-mobile-cards/, 'style.css must contain .salary-mobile-cards');
assert.match(css, /\.salary-card-item/, 'style.css must contain .salary-card-item');
assert.match(css, /\.salary-total-card/, 'style.css must contain .salary-total-card');
console.log('✓ style.css classes, safe-area insets, and salary card styles verified');

// 6. Test App Logic & Security Functions in VM
const appSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8') + `
globalThis.__pwaPinTest = {
    state,
    hashPin,
    DEFAULT_PIN_CONFIG,
    buildBackupPayload,
    validateBackupPayload,
    showPinLockOverlay,
    hidePinLockOverlay,
    handleLockDigit,
    handleLockDelete,
    handleLockClear,
    checkAutoLock,
    showToast
};
`;

const mockStorage = {};
const mockElements = {
    appToast: { classList: { add: () => {}, remove: () => {} }, style: {} },
    toastMessage: { textContent: '' },
    toastIcon: { setAttribute: () => {} },
    pinDotsContainer: { innerHTML: '', classList: { add: () => {}, remove: () => {} } },
    pinLockError: { textContent: '', className: '' },
    pinLockOverlay: { style: { display: 'none' } },
    pinStatusPill: { classList: { add: () => {}, remove: () => {} } },
    pinStatusLabel: { textContent: '' },
    setupPinBtn: { style: { display: 'flex' } },
    changePinBtn: { style: { display: 'none' } },
    disablePinBtn: { style: { display: 'none' } },
    setPinAutoLock: { value: '5', addEventListener: () => {} }
};

const context = {
    console,
    document: {
        addEventListener: () => {},
        getElementById: (id) => mockElements[id] || null,
        querySelectorAll: () => [],
        querySelector: () => null,
        documentElement: { getAttribute: () => 'dark' }
    },
    window: {
        addEventListener: () => {}
    },
    localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); }
    },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    Date,
    Math,
    JSON
};

vm.createContext(context);
vm.runInContext(appSource, context);

const testApi = context.__pwaPinTest;

async function runLogicTests() {
    // A. PIN Hash Verification
    const hash1 = await testApi.hashPin('1234');
    const hash2 = await testApi.hashPin('1234');
    const hash3 = await testApi.hashPin('9999');

    assert.equal(typeof hash1, 'string', 'Hash must be a string');
    assert.equal(hash1, hash2, 'Identical PINs must produce identical hashes');
    assert.notEqual(hash1, hash3, 'Different PINs must produce different hashes');
    console.log('✓ hashPin hashing consistency verified');

    // B. Backup Payload with PIN
    testApi.state.pinConfig = {
        enabled: true,
        pinHash: hash1,
        pinLength: 4,
        autoLockMinutes: 5,
        lastUnlockedTime: 100000
    };
    const backup = testApi.buildBackupPayload();
    assert.equal(backup.app, 'SalaryHub');
    assert.ok(backup.pinConfig, 'Backup must include pinConfig');
    assert.equal(backup.pinConfig.pinHash, hash1);
    assert.equal(testApi.validateBackupPayload(backup), true, 'Backup payload with PIN must be valid');
    console.log('✓ Backup payload PIN preservation verified');

    // C. Lock Overlay State
    testApi.showPinLockOverlay();
    assert.equal(testApi.state.isLocked, true, 'showPinLockOverlay must set isLocked to true');
    assert.equal(mockElements.pinLockOverlay.style.display, 'flex');

    testApi.hidePinLockOverlay();
    assert.equal(testApi.state.isLocked, false, 'hidePinLockOverlay must set isLocked to false');
    assert.equal(mockElements.pinLockOverlay.style.display, 'none');
    console.log('✓ Lock overlay display state management verified');

    // D. Auto-lock timeout logic
    testApi.state.pinConfig.enabled = true;
    testApi.state.pinConfig.autoLockMinutes = 5;
    testApi.state.isLocked = false;
    testApi.state.lastBackgroundTime = Date.now() - (6 * 60 * 1000); // 6 mins ago
    testApi.checkAutoLock();
    assert.equal(testApi.state.isLocked, true, 'checkAutoLock must trigger lock when background time exceeds autoLockMinutes');
    console.log('✓ Auto-lock timeout calculation verified');

    // E. Toast notification trigger
    testApi.showToast('ทดสอบข้อความ', 'success');
    assert.equal(mockElements.toastMessage.textContent, 'ทดสอบข้อความ');
    console.log('✓ showToast execution verified');

    console.log('\nAll PWA, PIN Lock, Mobile Layout, Category Tabs & Salary UI assertions PASSED successfully!');
}

runLogicTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
