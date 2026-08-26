/**
 * Salary & Expense Hub - Core Application Logic
 * Implements the exact formulas from เงินเดือน.xlsx with dynamic updates,
 * local storage database, interactive charts, and premium animations.
 */

// ==============================================================================================================
// 1. Application State & Configurations
const THAI_MONTHS_SHORT = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];
const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
// ==========================================================================

const DEFAULT_CONFIG = {
    baseSalary: 12500,     // ฐานเงินเดือนปกติ
    baseDays: 30,          // ตัวหารจำนวนวันในเดือน
    shiftRate: 100,        // ค่ากะพิเศษต่อวัน
    breakfastRate: 60,     // ค่าอาหารเช้าต่อวันทำงานจริง
    otFoodRate: 60,        // ค่าอาหารโอทีต่อวันทำโอที
    travelRate: 105,       // ค่าเดินทางต่อวันทำงานจริง
    targetRate: 100,       // ค่าเป้าหมายต่อวันทำงานจริง
    rentRate: 2000,        // ค่าเช่าบ้านต่อเดือน
    diligenceRate: 1200,   // เบี้ยขยันต่อเดือน
    incentiveRate: 1200,   // ค่า Incentive ต่อเดือน
    standardHours: 8,      // ชั่วโมงทำงานปกติ
    otHoursPerDay: 2.5,    // ชั่วโมงโอทีต่อครั้ง
    mulOtNormal: 1.5,      // ตัวคูณโอที จ-ศ
    mulWeekendStd: 1.0,    // ตัวคูณวันทำงานวันหยุดปกติ (ทำงาน 8 ชม.)
    mulWeekendOt: 3.0,     // ตัวคูณโอทีวันหยุด
    socialSecurity: 1300,  // ประกันสังคม
    customRates: []        // รายการเงินได้และเบี้ยเลี้ยงเพิ่มเติม
};

const DEFAULT_INPUTS = {
    daysWorked: 0,         // วันทำงานจริง
    halfDays: 0,           // วันลาครึ่งวัน
    otDays: 0,             // จำนวนวันที่มีโอที (จ-ศ)
    weekendDays: 0,        // วันทำงานวันหยุด (ส-อา)
    shiftDays: 0,          // วันเข้ากะดึก
    bonus: 0               // โบนัสเพิ่มเติม
};

const MAX_OT_DAYS = 22;
const MAX_WEEKEND_DAYS = 8;

const DEFAULT_EXPENSES = [
    { id: 'exp_car', label: 'ค่ารถ', value: 0, icon: 'car' },
    { id: 'exp_fuel', label: 'ค่าน้ำมัน', value: 0, icon: 'fuel' },
    { id: 'exp_electricity', label: 'ค่าไฟ', value: 0, icon: 'zap' },
    { id: 'exp_food', label: 'ค่ากิน', value: 0, icon: 'coffee' },
    { id: 'exp_internet', label: 'ค่าเน็ต', value: 0, icon: 'wifi' },
    { id: 'exp_savings', label: 'เงินเก็บ', value: 0, icon: 'piggy-bank' },
    { id: 'exp_parents', label: 'เงินให้แม่กับพ่อ', value: 0, icon: 'heart' },
    { id: 'exp_personal', label: 'ของใช้ส่วนตัว', value: 0, icon: 'shopping-bag' },
    { id: 'exp_extra', label: 'ค่าใช้จ่ายเพิ่มเติม', value: 0, icon: 'help-circle' }
];

const DEFAULT_PIN_CONFIG = {
    enabled: false,
    pinHash: '',
    pinLength: 4,
    autoLockMinutes: 5,
    lastUnlockedTime: Date.now()
};

let state = {
    config: { ...DEFAULT_CONFIG },
    inputs: { ...DEFAULT_INPUTS },
    expenses: [ ...DEFAULT_EXPENSES ],
    history: [],
    monthlyData: {},
    currentMonth: '',      // e.g. "พฤษภาคม 2569"
    activeTab: 'dashboard',
    activeChartType: 'doughnut', // doughnut or comparison
    chartInstance: null,
    pinConfig: { ...DEFAULT_PIN_CONFIG },
    isLocked: false,
    lastBackgroundTime: 0
};

// ==========================================================================
// 2. Initialization and Data Loading
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeMonthSelector();
    loadDataFromLocalStorage();
    initLucideIcons();
    initTabNavigation();
    initTheme();
    initEventListeners();
    initServiceWorker();
    initPwaInstallPrompt();
    initPinSecurity();
    initSettingsCategories();
    initNewFeatures();
    syncSlidersToState();
    syncSettingsInputs();
        if (typeof syncPinSettingsUI === 'function') syncPinSettingsUI();
    
    // Perform initial calculations and render UI
    calculateAll();
    initChart();
    renderHistoryList();
    renderExpensesInputs();
});

// Initialize Lucide icons
function initLucideIcons() {
    if (typeof lucide === 'undefined' || !lucide.createIcons) return;
    lucide.createIcons();
}

// Generate Month list from Current local time (e.g. May 2026 to 12 months ahead/behind)
function getThaiMonthSortKey(monthLabel) {
    const match = String(monthLabel || '').match(/^(.+?)\s+(\d{4})$/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    const monthIndex = THAI_MONTHS.indexOf(match[1].trim());
    if (monthIndex < 0) return Number.MAX_SAFE_INTEGER;
    const year = Number(match[2]);
    return year * 100 + (monthIndex + 1);
}

// Helper to get active pay period month (16th to 15th rule)
function getCurrentPayPeriodMonth(baseDate = new Date()) {
    const d = baseDate.getDate();
    const m = baseDate.getMonth();
    const gYear = baseDate.getFullYear();

    let targetMIdx = m;
    let targetGY = gYear;

    if (d >= 16) {
        targetMIdx = (m + 1) % 12;
        if (m === 11) {
            targetGY += 1;
        }
    }

    const thaiYear = targetGY + 543;
    return `${THAI_MONTHS[targetMIdx]} ${thaiYear}`;
}

function getAdjacentPayPeriodMonth(monthLabel, direction = 1) {
    const match = String(monthLabel || '').match(/^(.+?)\s+(\d{4})$/);
    let mIdx = match ? THAI_MONTHS.indexOf(match[1].trim()) : -1;
    let thaiYear = match ? Number(match[2]) : (new Date().getFullYear() + 543);
    
    if (mIdx < 0) {
        mIdx = new Date().getMonth();
    }

    let nextMIdx = mIdx + direction;
    let nextThaiYear = thaiYear;

    if (nextMIdx > 11) {
        nextMIdx = 0;
        nextThaiYear += 1;
    } else if (nextMIdx < 0) {
        nextMIdx = 11;
        nextThaiYear -= 1;
    }

    return `${THAI_MONTHS[nextMIdx]} ${nextThaiYear}`;
}

// Generate Month list chronologically (January to December & by year)
function populateMonthSelector(targetMonth) {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const monthSelect = document.getElementById('currentMonthSelect');
    if (!monthSelect) return;

    const baseDate = new Date();
    const currentThaiYear = baseDate.getFullYear() + 543;
    const currentMonthIdx = baseDate.getMonth();
    const defaultCurrentMonth = `${THAI_MONTHS[currentMonthIdx]} ${currentThaiYear}`;

    // Collect all months to show
    const monthsSet = new Set();

    // 1. Add all 12 months for current year
    for (let m = 0; m < 12; m++) {
        monthsSet.add(`${THAI_MONTHS[m]} ${currentThaiYear}`);
    }

    // 2. Add any months from saved history
    if (Array.isArray(state.history)) {
        state.history.forEach(h => {
            if (h && h.month) monthsSet.add(h.month);
        });
    }

    // 3. Add any months from monthlyData
    if (state.monthlyData && typeof state.monthlyData === 'object') {
        Object.keys(state.monthlyData).forEach(m => {
            if (m) monthsSet.add(m);
        });
    }

    // 4. Add targetMonth or state.currentMonth if specified
    if (targetMonth) monthsSet.add(targetMonth);
    if (state.currentMonth) monthsSet.add(state.currentMonth);

    // Sort months chronologically (January -> December, Year ascending)
    const sortedMonths = Array.from(monthsSet).sort((a, b) => getThaiMonthSortKey(a) - getThaiMonthSortKey(b));

    const activeMonth = targetMonth || state.currentMonth || defaultCurrentMonth;
    state.currentMonth = activeMonth;

    monthSelect.innerHTML = sortedMonths.map(m => {
        const isSel = (m === activeMonth) ? 'selected' : '';
        return `<option value="${m}" ${isSel}>${m}</option>`;
    }).join('');

    monthSelect.value = activeMonth;
}

function initializeMonthSelector() {
    populateMonthSelector();
}

// ==========================================================================
// 3. Storage & State Management
// ==========================================================================

const STORAGE_KEYS = {
    config: 'salary_hub_config',
    expenses: 'salary_hub_expenses',
    history: 'salary_hub_history',
    monthlyData: 'salary_hub_monthly_data',
    pin: 'salary_hub_pin_config'
};

function cloneInputs(inputs = DEFAULT_INPUTS) {
    const cloned = { ...DEFAULT_INPUTS, ...inputs };
    cloned.daysWorked = Math.max(0, Number(cloned.daysWorked) || 0);
    cloned.halfDays = Math.max(0, Number(cloned.halfDays) || 0);
    cloned.otDays = Math.min(Math.max(Number(cloned.otDays) || 0, 0), MAX_OT_DAYS);
    cloned.weekendDays = Math.min(Math.max(Number(cloned.weekendDays) || 0, 0), MAX_WEEKEND_DAYS);
    cloned.shiftDays = Math.max(0, Number(cloned.shiftDays) || 0);
    cloned.bonus = Math.max(0, Number(cloned.bonus) || 0);
    return cloned;
}

function parseStoredJson(rawValue, fallbackValue) {
    if (!rawValue) return fallbackValue;
    try {
        return JSON.parse(rawValue);
    } catch (error) {
        console.warn('ข้ามข้อมูล localStorage ที่ไม่ใช่ JSON ที่ถูกต้อง', error);
        return fallbackValue;
    }
}

function cloneExpenses(expenses = DEFAULT_EXPENSES) {
    const source = Array.isArray(expenses) ? expenses : DEFAULT_EXPENSES;
    return source.map(item => ({ ...item, value: Number(item.value) || 0 }));
}

function createBlankMonthData(fallbackExpenses = DEFAULT_EXPENSES) {
    return {
        inputs: cloneInputs(),
        expenses: cloneExpenses(fallbackExpenses),
        calendar: {}
    };
}

function normalizeMonthData(data, fallbackExpenses = DEFAULT_EXPENSES) {
    if (!data) return createBlankMonthData(fallbackExpenses);

    return {
        inputs: cloneInputs(data.inputs),
        expenses: cloneExpenses(data.expenses ?? fallbackExpenses),
        calendar: (data.calendar && typeof data.calendar === 'object') ? JSON.parse(JSON.stringify(data.calendar)) : {}
    };
}

function applyMonthData(month, fallbackExpenses = state.expenses) {
    const monthData = normalizeMonthData(state.monthlyData[month], fallbackExpenses);

    state.inputs = monthData.inputs;
    // Expenses are global recurring data shared by every month.
    state.expenses = cloneExpenses(fallbackExpenses);
    
    const existingCal = (state.monthlyData[month] && state.monthlyData[month].calendar) 
        ? state.monthlyData[month].calendar 
        : monthData.calendar;

    state.monthlyData[month] = {
        inputs: cloneInputs(state.inputs),
        expenses: cloneExpenses(state.expenses),
        calendar: existingCal
    };
}

function saveCurrentMonthData() {
    if (!state.currentMonth) return;

    const existingCal = (state.monthlyData[state.currentMonth] && state.monthlyData[state.currentMonth].calendar) 
        ? state.monthlyData[state.currentMonth].calendar 
        : {};

    state.monthlyData[state.currentMonth] = {
        inputs: cloneInputs(state.inputs),
        expenses: cloneExpenses(state.expenses),
        calendar: existingCal
    };
}

function loadDataFromLocalStorage() {
    try {
        const storedConfig = parseStoredJson(localStorage.getItem(STORAGE_KEYS.config), null);
        if (storedConfig && typeof storedConfig === 'object' && !Array.isArray(storedConfig)) {
            state.config = { ...DEFAULT_CONFIG, ...storedConfig };
        }
        if (!Array.isArray(state.config.customRates)) {
            state.config.customRates = [];
        }

        let legacyExpenses = cloneExpenses();
        const storedExpenses = parseStoredJson(localStorage.getItem(STORAGE_KEYS.expenses), null);
        if (Array.isArray(storedExpenses)) {
            legacyExpenses = cloneExpenses(storedExpenses);
        }

        const storedMonthlyData = parseStoredJson(localStorage.getItem(STORAGE_KEYS.monthlyData), null);
        if (storedMonthlyData && typeof storedMonthlyData === 'object' && !Array.isArray(storedMonthlyData)) {
            state.monthlyData = storedMonthlyData;
        }

        if (Object.keys(state.monthlyData).length === 0 && state.currentMonth) {
            const legacyInputs = localStorage.getItem('salary_hub_inputs');

            if (legacyInputs) {
                const parsedLegacyInputs = parseStoredJson(legacyInputs, null);
                if (parsedLegacyInputs && typeof parsedLegacyInputs === 'object') {
                    state.monthlyData[state.currentMonth] = normalizeMonthData({
                        inputs: parsedLegacyInputs,
                        expenses: legacyExpenses
                    }, legacyExpenses);
                }
            }
        }

        const storedHistory = parseStoredJson(localStorage.getItem(STORAGE_KEYS.history), null);
        if (Array.isArray(storedHistory)) {
            state.history = storedHistory;
        }

        const storedPin = parseStoredJson(localStorage.getItem(STORAGE_KEYS.pin), null);
        if (storedPin && typeof storedPin === 'object') {
            state.pinConfig = { ...DEFAULT_PIN_CONFIG, ...storedPin };
        }

        populateMonthSelector(state.currentMonth);
        applyMonthData(state.currentMonth, legacyExpenses);
    } catch (e) {
        console.error("Error reading localStorage", e);
        showToast("ไม่สามารถโหลดข้อมูลประวัติจากเว็บได้", "error");
        applyMonthData(state.currentMonth);
    }
}

function saveDataToLocalStorage() {
    try {
        saveCurrentMonthData();
        localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(state.config));
        localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(state.expenses));
        localStorage.setItem(STORAGE_KEYS.monthlyData, JSON.stringify(state.monthlyData));
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
        localStorage.setItem(STORAGE_KEYS.pin, JSON.stringify(state.pinConfig));
    } catch (e) {
        console.error("Error writing localStorage", e);
    }
}

// ==========================================================================
function buildBackupPayload() {
    return {
        app: 'SalaryHub',
        version: 1,
        exportedAt: new Date().toISOString(),
        config: JSON.parse(JSON.stringify(state.config)),
        monthlyData: JSON.parse(JSON.stringify(state.monthlyData)),
        history: JSON.parse(JSON.stringify(state.history)),
        expenses: JSON.parse(JSON.stringify(state.expenses)),
        pinConfig: JSON.parse(JSON.stringify(state.pinConfig))
    };
}

function validateBackupPayload(payload) {
    return Boolean(
        payload &&
        payload.app === 'SalaryHub' &&
        payload.version === 1 &&
        payload.config &&
        typeof payload.monthlyData === 'object' &&
        Array.isArray(payload.history) &&
        Array.isArray(payload.expenses)
    );
}

function exportBackupData() {
    const blob = new Blob([JSON.stringify(buildBackupPayload(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'salaryhub-backup.json';
    link.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกข้อมูลสำรองเรียบร้อยแล้ว', 'success');
}

async function importBackupData(file) {
    try {
        const payload = JSON.parse(await file.text());
        if (!validateBackupPayload(payload)) {
            throw new Error('รูปแบบไฟล์สำรองไม่ถูกต้อง');
        }

        state.config = { ...DEFAULT_CONFIG, ...payload.config };
        state.monthlyData = payload.monthlyData || {};
        state.history = payload.history;
        state.expenses = cloneExpenses(payload.expenses);
        if (payload.pinConfig && typeof payload.pinConfig === 'object') {
            state.pinConfig = { ...DEFAULT_PIN_CONFIG, ...payload.pinConfig };
        }
        populateMonthSelector(state.currentMonth);
        applyMonthData(state.currentMonth, state.expenses);
        saveDataToLocalStorage();
        syncSlidersToState();
        syncSettingsInputs();
        calculateAll();
        updateChart();
    if (typeof updateSavingsGoalUI === "function") updateSavingsGoalUI();
    if (typeof updateTaxEstimatorUI === "function") updateTaxEstimatorUI();
        renderExpensesInputs();
        renderSalaryTable();
        renderHistoryList();
        showToast('นำเข้าข้อมูลสำรองเรียบร้อยแล้ว', 'success');
    } catch (error) {
        console.error('Backup import failed', error);
        showToast('นำเข้าไม่สำเร็จ: ไฟล์ไม่ถูกต้องหรือเสียหาย', 'error');
    }
}

function renderAnnualSummary() {
    const container = document.getElementById('annualSummary');
    if (!container) return;

    const groups = {};
    state.history.forEach(record => {
        const yearMatch = String(record.month || '').match(/(\d{4})$/);
        const year = yearMatch ? yearMatch[1] : 'ไม่ระบุปี';
        if (!groups[year]) {
            groups[year] = { months: 0, revenue: 0, expenses: 0, balance: 0 };
        }
        groups[year].months += 1;
        groups[year].revenue += Number(record.totalRevenue || 0);
        groups[year].expenses += Number(record.totalExpenses || 0);
        groups[year].balance += Number(record.netBalance || 0);
    });

    const years = Object.keys(groups).sort().reverse();
    if (years.length === 0) {
        container.innerHTML = '<div class="panel-desc">ยังไม่มีข้อมูลสำหรับสรุปรายปี</div>';
        return;
    }

    container.innerHTML = years.map(year => {
        const item = groups[year];
        return '<div class="annual-summary-card">' +
            '<div><strong>ปี ' + year + '</strong><span>' + item.months + ' เดือน</span></div>' +
            '<div><small>รายรับ</small><strong>฿' + item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) + '</strong></div>' +
            '<div><small>รายจ่าย</small><strong>฿' + item.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 }) + '</strong></div>' +
            '<div><small>คงเหลือ</small><strong>฿' + item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) + '</strong></div>' +
            '</div>';
    }).join('');
}
// 4. Tab and Theme Controllers
// ==========================================================================

function initTabNavigation() {
    const tabTriggers = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    const tabTitles = {
        'dashboard': 'แผงควบคุม',
        'salary': 'รายละเอียดรายรับ',
        'expenses': 'บันทึกรายจ่าย',
        'history': 'ประวัติบันทึก',
        'settings': 'ตั้งค่าสูตร & อัตรา'
    };

    const subtitles = {
        'dashboard': 'ยินดีต้อนรับกลับมา! สรุปภาพรวมรายรับและรายจ่ายของคุณ',
        'salary': 'สรุปการแตกแขนงเงินเดือนและเบี้ยเลี้ยงของคุณตามการทำงานจริง',
        'expenses': 'กรอกรายการใช้จ่ายส่วนบุคคลเพื่อคำนวณและประเมินสัดส่วนของเงินคงเหลือสุทธิ',
        'history': 'บันทึกประวัติเงินรายเดือนที่ได้รับและรายการเก็บออมสะสม',
        'settings': 'ปรับเปลี่ยนฐานเงินเดือน เบี้ยขยัน อัตราค่าอาหารโอที และตัวคูณค่าล่วงเวลาปกติ'
    };

    tabTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            if (!tabId) return;
            state.activeTab = tabId;

            // Sync active state across all matching tab buttons (sidebar + mobile nav)
            tabTriggers.forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
            });
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Set active
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) targetTab.classList.add('active');

            // Update Titles
            if (pageTitle) pageTitle.textContent = tabTitles[tabId] || 'แผงควบคุม';
            if (pageSubtitle) pageSubtitle.textContent = subtitles[tabId] || '';

            // Smooth scroll to top on mobile tab switch
            if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Run tab specific updates
            if (tabId === 'salary') {
                renderSalaryTable();
            } else if (tabId === 'history') {
                renderHistoryList();
            } else if (tabId === 'expenses') {
                renderExpensesInputs();
            }
        });
    });
}

function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeToggleText = document.getElementById('themeToggleText');
    const htmlElement = document.documentElement;

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('salary_hub_theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    if (themeToggleText) {
        themeToggleText.textContent = savedTheme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด';
    }

    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', () => {
            if (themeToggleBtn) themeToggleBtn.click();
        });
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('salary_hub_theme', newTheme);
            
            if (themeToggleText) {
                themeToggleText.textContent = newTheme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด';
            }
            
            // Re-render chart to adapt colors
            updateChart();
            showToast(`เปลี่ยนเป็น${newTheme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'}แล้ว`, "success");
        });
    }
}

// ==========================================================================
// 5. Calculation Engine (Excel Formula Mirroring)
// ==========================================================================

let calculations = {
    dailyRate: 0,
    baseWagePay: 0,
    halfDayDeduction: 0,
    halfDays: 0,
    otRateNormal: 0,
    otHoursNormal: 0,
    otPayNormal: 0,
    
    weekendStdRate: 0,
    weekendStdHours: 0,
    weekendStdPay: 0,
    
    weekendOtRate: 0,
    weekendOtHours: 0,
    weekendOtPay: 0,
    
    shiftPay: 0,
    breakfastPay: 0,
    otFoodPay: 0,
    travelPay: 0,
    targetPay: 0,
    
    rentPay: 0,
    diligencePay: 0,
    incentivePay: 0,
    bonusPay: 0,
    
    totalRevenue: 0,
    totalExpenses: 0,
    socialSecurity: 0,
    netBalance: 0,
    savingsRate: 0
};

function validatePayrollInputs(config, inputs) {
    const errors = [];
    const nonNegativeConfig = [
        'baseSalary', 'baseDays', 'shiftRate', 'breakfastRate', 'otFoodRate',
        'travelRate', 'targetRate', 'rentRate', 'diligenceRate', 'incentiveRate',
        'standardHours', 'otHoursPerDay', 'mulOtNormal', 'mulWeekendStd',
        'mulWeekendOt', 'socialSecurity'
    ];
    const nonNegativeInputs = ['daysWorked', 'otDays', 'weekendDays', 'shiftDays', 'bonus'];

    nonNegativeConfig.forEach(key => {
        if (!Number.isFinite(Number(config[key])) || Number(config[key]) < 0) {
            errors.push('อัตรา ' + key + ' ต้องเป็นตัวเลขไม่ติดลบ');
        }
    });
    nonNegativeInputs.forEach(key => {
        if (!Number.isFinite(Number(inputs[key])) || Number(inputs[key]) < 0) {
            errors.push('ข้อมูล ' + key + ' ต้องเป็นตัวเลขไม่ติดลบ');
        }
    });

    if (Number(config.baseDays) <= 0) errors.push('ตัวหารจำนวนวันต้องมากกว่า 0');
    if (Number(config.standardHours) <= 0) errors.push('ชั่วโมงทำงานมาตรฐานต้องมากกว่า 0');
    if (Number(inputs.otDays) > MAX_OT_DAYS) errors.push('จำนวนวันที่ทำโอที (จ-ศ) ต้องไม่เกิน ' + MAX_OT_DAYS + ' วัน');
    if (Number(inputs.weekendDays) > MAX_WEEKEND_DAYS) errors.push('วันทำงานวันหยุด (ส-อา) ต้องไม่เกิน ' + MAX_WEEKEND_DAYS + ' วัน');
    return errors;
}

function calculatePayroll(c, i, expenses) {
    const hasIncomeInput =
        Number(i.daysWorked || 0) > 0 ||
        Number(i.halfDays || 0) > 0 ||
        Number(i.otDays || 0) > 0 ||
        Number(i.weekendDays || 0) > 0 ||
        Number(i.shiftDays || 0) > 0 ||
        Number(i.bonus || 0) > 0;

    const dailyRate = c.baseSalary / c.baseDays;
    const halfDaysCount = Math.max(0, Number(i.halfDays || 0));
    const halfDayDeduction = halfDaysCount * (dailyRate * 0.5);
    const baseWagePay = hasIncomeInput ? Math.max(0, c.baseSalary - halfDayDeduction) : 0;

    const result = {
        dailyRate: dailyRate,
        baseWagePay: baseWagePay,
        halfDayDeduction: halfDayDeduction,
        halfDays: halfDaysCount,
        otRateNormal: 0,
        otHoursNormal: (Number(i.otDays) || 0) * c.otHoursPerDay,
        otPayNormal: 0,
        weekendStdRate: 0,
        weekendStdHours: (Number(i.weekendDays) || 0) * c.standardHours,
        weekendStdPay: 0,
        weekendOtRate: 0,
        weekendOtHours: (Number(i.weekendDays) || 0) * c.otHoursPerDay,
        weekendOtPay: 0,
        shiftPay: (Number(i.shiftDays) || 0) * c.shiftRate,
        breakfastPay: (Number(i.daysWorked || 0) + halfDaysCount) * c.breakfastRate,
        otFoodPay: ((Number(i.otDays) || 0) + (Number(i.weekendDays) || 0)) * c.otFoodRate,
        travelPay: (Number(i.daysWorked || 0) + halfDaysCount) * c.travelRate,
        targetPay: (Number(i.daysWorked || 0)) * c.targetRate,
        rentPay: hasIncomeInput ? c.rentRate : 0,
        diligencePay: hasIncomeInput ? c.diligenceRate : 0,
        incentivePay: hasIncomeInput ? c.incentiveRate : 0,
        bonusPay: Number(i.bonus) || 0,
        totalRevenue: 0,
        totalExpenses: 0,
        socialSecurity: hasIncomeInput ? c.socialSecurity : 0,
        netBalance: 0,
        savingsRate: 0
    };

    result.otRateNormal = (result.dailyRate / c.standardHours) * c.mulOtNormal;
    result.otPayNormal = result.otHoursNormal * result.otRateNormal;
    result.weekendStdRate = (result.dailyRate / c.standardHours) * c.mulWeekendStd;
    result.weekendStdPay = result.weekendStdHours * result.weekendStdRate;
    result.weekendOtRate = (result.dailyRate / c.standardHours) * c.mulWeekendOt;
    result.weekendOtPay = result.weekendOtHours * result.weekendOtRate;

    result.totalRevenue =
        baseWagePay +
        result.otPayNormal +
        result.weekendStdPay +
        result.weekendOtPay +
        result.shiftPay +
        result.breakfastPay +
        result.otFoodPay +
        result.travelPay +
        result.targetPay +
        result.rentPay +
        result.diligencePay +
        result.incentivePay +
        result.bonusPay;

    const sumUserExpenses = expenses.reduce((sum, item) => sum + Number(item.value || 0), 0);
    result.totalExpenses = sumUserExpenses + result.socialSecurity;
    result.netBalance = result.totalRevenue - result.totalExpenses;
    result.savingsRate = result.totalRevenue > 0
        ? (result.netBalance / result.totalRevenue) * 100
        : 0;

    return result;
}

function calculateAll() {
    calculations = calculatePayroll(state.config, state.inputs, state.expenses);

    // Auto-sync current month into history if revenue exists
    syncCurrentMonthToHistory();

    // Update UI elements
    updateDashboardUI();
    updateDetailPills();
    if (typeof renderSalaryTable === 'function') renderSalaryTable();
    if (typeof updateSavingsGoalUI === 'function') updateSavingsGoalUI();
    if (typeof updateTaxEstimatorUI === 'function') updateTaxEstimatorUI();
}

function syncCurrentMonthToHistory() {
    if (!state.currentMonth || !calculations || calculations.totalRevenue <= 0) return;

    const existingIndex = state.history.findIndex(h => h.month === state.currentMonth);
    const currentRecord = {
        id: existingIndex >= 0 ? state.history[existingIndex].id : 'rec_' + Date.now(),
        month: state.currentMonth,
        config: JSON.parse(JSON.stringify(state.config)),
        inputs: JSON.parse(JSON.stringify(state.inputs)),
        expenses: JSON.parse(JSON.stringify(state.expenses)),
        calendar: (state.monthlyData[state.currentMonth] && state.monthlyData[state.currentMonth].calendar) 
            ? JSON.parse(JSON.stringify(state.monthlyData[state.currentMonth].calendar)) 
            : {},
        totalRevenue: calculations.totalRevenue,
        totalExpenses: calculations.totalExpenses,
        netBalance: calculations.netBalance
    };

    if (existingIndex >= 0) {
        state.history[existingIndex] = currentRecord;
    } else {
        state.history.push(currentRecord);
    }

    if (typeof renderAnnualSummary === 'function') renderAnnualSummary();
}

// Update the Hero KPI counts and details
function updateDashboardUI() {
    const totalRevEl = document.getElementById('kpiTotalRevenue');
    const totalExpEl = document.getElementById('kpiTotalExpenses');
    const netBalEl = document.getElementById('kpiNetBalance');
    
    animateNumber(totalRevEl, calculations.totalRevenue);
    animateNumber(totalExpEl, calculations.totalExpenses);
    animateNumber(netBalEl, calculations.netBalance);

    // Expenses Percentage
    const expPercent = calculations.totalRevenue > 0 ? ((calculations.totalExpenses / calculations.totalRevenue) * 100).toFixed(1) : 0;
    document.getElementById('kpiExpensesPercent').textContent = `${expPercent}%`;
    document.getElementById('kpiExpensesProgress').style.width = `${Math.min(expPercent, 100)}%`;

    // Balance Percentage
    const balPercent = calculations.totalRevenue > 0 ? ((calculations.netBalance / calculations.totalRevenue) * 100).toFixed(1) : 0;
    document.getElementById('kpiBalancePercent').textContent = `${balPercent}%`;
    document.getElementById('kpiBalanceProgress').style.width = `${Math.max(Math.min(balPercent, 100), 0)}%`;

    // Sidebar/Mini Stats update
    document.getElementById('miniSavingsRate').textContent = `${calculations.savingsRate.toFixed(2)}%`;
    
    // Essential expenses: Total expenses - optional savings if configured in expense items
    const savingsExpenseItem = state.expenses.find(e => e.id === 'exp_savings');
    const essentialVal = calculations.totalExpenses - (savingsExpenseItem ? Number(savingsExpenseItem.value || 0) : 0);
    document.getElementById('miniEssentialExpenses').textContent = `฿${essentialVal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

    // Tab Expenses summary bar sync
    const expSumRevenue = document.getElementById('expSumRevenue');
    if (expSumRevenue) expSumRevenue.textContent = calculations.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    const expSumExpenses = document.getElementById('expSumExpenses');
    if (expSumExpenses) expSumExpenses.textContent = calculations.totalExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    const expSumBalance = document.getElementById('expSumBalance');
    if (expSumBalance) expSumBalance.textContent = calculations.netBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    // Slider counters text info sync
    document.getElementById('textTotalOtHours').textContent = calculations.otHoursNormal;
    document.getElementById('textWeekendOtHours').textContent = calculations.weekendOtHours;
}

// Update the formulas help text rates dynamically
function updateDetailPills() {
    document.querySelectorAll('.calc-rate-daily').forEach(el => el.textContent = calculations.dailyRate.toFixed(2));
    document.querySelectorAll('.calc-rate-ot-normal').forEach(el => el.textContent = calculations.otRateNormal.toFixed(2));
    document.querySelectorAll('.calc-rate-weekend-std').forEach(el => el.textContent = calculations.weekendStdRate.toFixed(2));
    document.querySelectorAll('.calc-rate-weekend-ot').forEach(el => el.textContent = calculations.weekendOtRate.toFixed(2));
    
    document.querySelectorAll('.hl-work-days').forEach(el => el.textContent = state.inputs.daysWorked + (state.inputs.halfDays ? ' (+ลา ' + state.inputs.halfDays + ')' : ''));
    document.querySelectorAll('.hl-ot-days').forEach(el => el.textContent = state.inputs.otDays + state.inputs.weekendDays);
}

// Animate numbers smoothly
function animateNumber(element, targetValue) {
    if (!element) return;
    
    const duration = 800; // ms
    const startTime = performance.now();
    const startValue = parseFloat(element.textContent.replace(/,/g, '')) || 0;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        if (elapsed >= duration) {
            element.textContent = targetValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            const progress = elapsed / duration;
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const value = startValue + (targetValue - startValue) * easedProgress;
            element.textContent = value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// ==========================================================================
// 6. Data Rendering Modules (Tables, Inputs, Logs)
// ==========================================================================

function renderSalaryTable() {
    const tbody = document.querySelector('#salaryBreakdownTable tbody');
    const mobileContainer = document.getElementById('salaryMobileCards');
    const totalEl = document.getElementById('tableTotalRevenue');

    const c = state.config;
    const i = state.inputs;

    const items = [
        {
            name: 'ฐานเงินเดือน (ค่าแรงทำงาน)',
            icon: 'banknote',
            badge: (i.halfDays > 0)
                ? `${c.baseDays} วันปกติ (ลาครึ่งวัน ${i.halfDays} วัน หัก ฿${(calculations.halfDayDeduction || 0).toFixed(2)})`
                : `${c.baseDays} วันปกติ`,
            rate: `฿${c.baseSalary.toLocaleString('th-TH')}`,
            val: calculations.baseWagePay || c.baseSalary
        },
        {
            name: 'โอที จ-ศ (1.5 เท่า)',
            icon: 'clock',
            badge: `${i.otDays} วัน (${calculations.otHoursNormal} ชม.)`,
            rate: `฿${calculations.otRateNormal.toFixed(2)}/ชม.`,
            val: calculations.otPayNormal
        },
        {
            name: 'วันหยุด ส-อา (1.0 เท่า)',
            icon: 'calendar-check',
            badge: `${i.weekendDays} วัน (${calculations.weekendStdHours} ชม.)`,
            rate: `฿${calculations.weekendStdRate.toFixed(2)}/ชม.`,
            val: calculations.weekendStdPay
        },
        {
            name: 'โอทีวันหยุด ส-อา (3.0 เท่า)',
            icon: 'sparkles',
            badge: `${i.weekendDays} วัน (${calculations.weekendOtHours} ชม.)`,
            rate: `฿${calculations.weekendOtRate.toFixed(2)}/ชม.`,
            val: calculations.weekendOtPay
        },
        {
            name: 'ค่ากะพิเศษ',
            icon: 'moon',
            badge: `${i.shiftDays} วัน`,
            rate: `฿${c.shiftRate.toLocaleString('th-TH')}/วัน`,
            val: calculations.shiftPay
        },
        {
            name: 'ค่าอาหารเช้า',
            icon: 'coffee',
            badge: (i.halfDays > 0)
                ? `${i.daysWorked} วันทำงาน + ${i.halfDays} วันลาครึ่งวัน`
                : `${i.daysWorked} วันทำงาน`,
            rate: `฿${c.breakfastRate.toLocaleString('th-TH')}/วัน`,
            val: calculations.breakfastPay
        },
        {
            name: 'ค่าอาหารโอที',
            icon: 'utensils',
            badge: `${i.otDays + i.weekendDays} วันมีโอที`,
            rate: `฿${c.otFoodRate.toLocaleString('th-TH')}/วัน`,
            val: calculations.otFoodPay
        },
        {
            name: 'ค่าเดินทาง (ค่าน้ำมัน)',
            icon: 'car',
            badge: (i.halfDays > 0)
                ? `${i.daysWorked} วันทำงาน + ${i.halfDays} วันลาครึ่งวัน`
                : `${i.daysWorked} วันทำงาน`,
            rate: `฿${c.travelRate.toLocaleString('th-TH')}/วัน`,
            val: calculations.travelPay
        },
        {
            name: 'ค่าเป้าหมาย',
            icon: 'target',
            badge: (i.halfDays > 0)
                ? `${i.daysWorked} วันทำงานเต็มวัน (ลาครึ่งวันไม่ได้)`
                : `${i.daysWorked} วันทำงาน`,
            rate: `฿${c.targetRate.toLocaleString('th-TH')}/วัน`,
            val: calculations.targetPay
        },
        {
            name: 'ค่าเช่าบ้าน',
            icon: 'home',
            badge: 'รายเดือนคงที่',
            rate: `฿${c.rentRate.toLocaleString('th-TH')}/เดือน`,
            val: calculations.rentPay
        },
        {
            name: 'เบี้ยขยัน',
            icon: 'award',
            badge: 'รายเดือนคงที่',
            rate: `฿${c.diligenceRate.toLocaleString('th-TH')}/เดือน`,
            val: calculations.diligencePay
        },
        {
            name: 'ค่า Incentive',
            icon: 'trending-up',
            badge: 'รายเดือนคงที่',
            rate: `฿${c.incentiveRate.toLocaleString('th-TH')}/เดือน`,
            val: calculations.incentivePay
        },
        {
            name: 'โบนัสพิเศษ',
            icon: 'gift',
            badge: 'ตามผลงาน',
            rate: 'ระบุเพิ่มเติม',
            val: calculations.bonusPay
        }
    ];

    // 1. Render Desktop Table
    if (tbody) {
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>
                    <div class="table-item-name">
                        <i data-lucide="${item.icon}"></i>
                        <strong>${item.name}</strong>
                    </div>
                </td>
                <td><span class="cell-pill">${item.badge}</span></td>
                <td><span class="cell-rate">${item.rate}</span></td>
                <td class="text-right cell-val">฿${item.val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');
    }

    // 2. Render Mobile Cards
    if (mobileContainer) {
        mobileContainer.innerHTML = items.map(item => `
            <div class="salary-card-item">
                <div class="salary-card-left">
                    <div class="salary-item-icon">
                        <i data-lucide="${item.icon}"></i>
                    </div>
                    <div class="salary-item-meta">
                        <span class="salary-item-title">${item.name}</span>
                        <div class="salary-item-sub">
                            <span class="salary-item-badge">${item.badge}</span>
                            <span class="salary-item-rate">• ${item.rate}</span>
                        </div>
                    </div>
                </div>
                <div class="salary-card-right">
                    <span class="salary-item-amount">฿${item.val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
        `).join('');
    }

    // 3. Update Total Revenue
    if (totalEl) {
        totalEl.textContent = calculations.totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    initLucideIcons();
}

function renderExpensesInputs() {
    const container = document.getElementById('expensesInputContainer');
    if (!container) return;

    let html = '';
    state.expenses.forEach(item => {
        // Icon resolve based on lucide config (we map emoji equivalents for fallback)
        let iconMarkup = `<i data-lucide="${item.icon || 'circle-dollar-sign'}"></i>`;
        
        // Show delete button with Lucide trash icon for all items so users can remove any card
        const deleteBtn = `<button class="delete-expense-btn" onclick="deleteExpenseItem('${item.id}')" title="ลบรายการนี้"><i data-lucide="trash-2"></i></button>`;

        html += `
            <div class="expense-input-card" id="card_${item.id}">
                <div class="card-head">
                    ${iconMarkup}
                    <label for="inp_${item.id}" title="${item.label}">${item.label}</label>
                    ${deleteBtn}
                </div>
                <div class="input-with-icon">
                    <span class="prefix">฿</span>
                    <input type="number" id="inp_${item.id}" min="0" value="${item.value}" onfocus="this.select()" onchange="updateExpenseValue('${item.id}', this.value)">
                </div>
            </div>
        `;
    });
    
    // Include Social Security in the expenses display as a read-only settings mirror
    html += `
        <div class="expense-input-card read-only">
            <div class="card-head">
                <i data-lucide="shield-check"></i>
                <label>ประกันสังคม (หัก)</label>
            </div>
            <div class="input-with-icon">
                <span class="prefix">฿</span>
                <input type="number" value="${state.config.socialSecurity}" disabled style="opacity: 0.8; background: rgba(0,0,0,0.1);">
            </div>
        </div>
    `;

    container.innerHTML = html;
    initLucideIcons();
}

function updateExpenseValue(id, val) {
    const item = state.expenses.find(e => e.id === id);
    if (item) {
        item.value = Number(val) || 0;
        calculateAll();
        updateChart();
        saveDataToLocalStorage();
    }
}

function deleteExpenseItem(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    calculateAll();
    updateChart();
    renderExpensesInputs();
    saveDataToLocalStorage();
    showToast("ลบหมวดหมู่รายจ่ายสำเร็จ", "success");
}

function getThaiMonthSortKey(monthLabel) {
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const match = String(monthLabel || '').match(/^(.+)\s+(\d{4})$/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    const monthIndex = thaiMonths.indexOf(match[1]);
    if (monthIndex < 0) return Number.MAX_SAFE_INTEGER;
    return Number(match[2]) * 100 + monthIndex;
}
function renderHistoryList() {
    renderAnnualSummary();
    if (typeof updateTaxEstimatorUI === 'function') {
        updateTaxEstimatorUI();
    }
    const container = document.getElementById('historyListContainer');
    if (!container) return;

    if (state.history.length === 0) {
        container.innerHTML = `
            <div class="no-history-state">
                <i data-lucide="folder-open"></i>
                <p>ยังไม่มีการบันทึกประวัติรายเดือนในระบบ</p>
                <span>ระบบจะเพิ่มข้อมูลเดือนที่มีรายรับเข้าสู่ประวัติให้อัตโนมัติ</span>
            </div>
        `;
        initLucideIcons();
        return;
    }

    // เรียงจากเดือนมกราคมไปธันวาคม และเรียงปีจากเก่าไปใหม่
    let sortedHistory = [...state.history].sort((a, b) => getThaiMonthSortKey(a.month) - getThaiMonthSortKey(b.month));

    let html = '';
    sortedHistory.forEach((record, index) => {
        // Find total OT hours saved
        const wkdayOtHrs = record.inputs.otDays * record.config.otHoursPerDay;
        const wkndOtHrs = record.inputs.weekendDays * record.config.otHoursPerDay;
        const totalOtHrs = wkdayOtHrs + wkndOtHrs;

        html += `
            <div class="history-card" id="history_${record.id}">
                <div class="month-info">
                    <i data-lucide="calendar"></i>
                    <div class="details">
                        <span class="name">${record.month}</span>
                        <span class="desc">วันทำจริง: ${record.inputs.daysWorked} วัน, โอทีสะสม: ${totalOtHrs} ชม.</span>
                    </div>
                </div>
                <div class="stat-group val-income">
                    <span class="lbl">รายรับรวม</span>
                    <span class="val">฿${record.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div class="stat-group val-expense">
                    <span class="lbl">รายจ่ายรวม</span>
                    <span class="val">฿${record.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div class="stat-group val-balance">
                    <span class="lbl">คงเหลือใช้งาน</span>
                    <span class="val">฿${record.netBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="loadHistoryRecord('${record.id}')" title="โหลดข้อมูลกลับมาจำลอง">
                        <i data-lucide="folder-heart"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteHistoryRecord('${record.id}')" title="ลบบันทึกเดือนนี้" style="color: var(--expense-color); border-color: rgba(255,75,92,0.1)">
                        <i data-lucide="trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    initLucideIcons();
}

function loadHistoryRecord(id) {
    const record = state.history.find(h => h.id === id);
    if (!record) return;

    // Deep copy settings and inputs
    state.config = JSON.parse(JSON.stringify(record.config));
    state.inputs = JSON.parse(JSON.stringify(record.inputs));
    if (record.expenses) {
        state.expenses = cloneExpenses(record.expenses);
    }
    state.currentMonth = record.month;
    saveCurrentMonthData();

    // Sync input sliders and textboxes
    syncSlidersToState();
    syncSettingsInputs();

    // Recalculate and update
    calculateAll();
    updateChart();
    renderExpensesInputs();
    renderSalaryTable();

    // Select month in selector
    const monthSelect = document.getElementById('currentMonthSelect');
    if (monthSelect) monthSelect.value = record.month;

    showToast(`โหลดประวัติการรับเงินของ "${record.month}" สำเร็จ`, "success");
    
    // Jump to dashboard
    document.querySelector('.menu-item[data-tab="dashboard"]').click();
}

function deleteHistoryRecord(id) {
    const recordToDelete = state.history.find(h => h.id === id);
    if (!recordToDelete) return;

    if (confirm(`คุณแน่ใจว่าต้องการลบบันทึกประวัติของ "${recordToDelete.month}" หรือไม่?`)) {
        const deletedMonth = recordToDelete.month;
        state.history = state.history.filter(h => h.id !== id);

        // Delete from monthly data as well
        delete state.monthlyData[deletedMonth];

        // If deleting the currently active month, reset or switch to another month
        if (deletedMonth === state.currentMonth) {
            state.inputs = cloneInputs(DEFAULT_INPUTS);
            const remainingMonths = Object.keys(state.monthlyData);
            const nextMonth = remainingMonths.length > 0
                ? remainingMonths.sort((a, b) => getThaiMonthSortKey(b) - getThaiMonthSortKey(a))[0]
                : getCurrentPayPeriodMonth();

            state.currentMonth = nextMonth;
            if (!state.monthlyData[nextMonth]) {
                state.monthlyData[nextMonth] = createBlankMonthData();
            }
            applyMonthData(nextMonth, state.expenses);
            populateMonthSelector(nextMonth);
            syncSlidersToState();
            calculateAll();
            updateChart();
            renderSalaryTable();
        } else {
            populateMonthSelector(state.currentMonth);
        }

        saveDataToLocalStorage();
        renderHistoryList();
        if (typeof updateTaxEstimatorUI === 'function') {
            updateTaxEstimatorUI();
        }
        showToast(`ลบบันทึกประวัติของ "${deletedMonth}" เสร็จสิ้น`, "success");
    }
}

function deleteCurrentMonth() {
    const month = state.currentMonth;
    if (!month) return;

    if (confirm(`คุณแน่ใจว่าต้องการลบข้อมูลและบันทึกทั้งหมดของ "${month}" ใช่หรือไม่?`)) {
        // 1. Remove from history
        state.history = state.history.filter(h => h.month !== month);

        // 2. Remove from monthlyData
        delete state.monthlyData[month];

        // 3. Reset inputs
        state.inputs = cloneInputs(DEFAULT_INPUTS);

        // 4. Find another available month or fallback
        const remainingMonths = Object.keys(state.monthlyData).filter(m => m !== month);
        const nextMonth = remainingMonths.length > 0
            ? remainingMonths.sort((a, b) => getThaiMonthSortKey(b) - getThaiMonthSortKey(a))[0]
            : getCurrentPayPeriodMonth();

        state.currentMonth = nextMonth;
        if (!state.monthlyData[nextMonth]) {
            state.monthlyData[nextMonth] = createBlankMonthData();
        }
        applyMonthData(nextMonth, state.expenses);

        // 5. Update UI
        populateMonthSelector(nextMonth);
        syncSlidersToState();
        calculateAll();
        updateChart();
        renderSalaryTable();
        renderHistoryList();
        if (typeof updateSavingsGoalUI === 'function') updateSavingsGoalUI();
        if (typeof updateTaxEstimatorUI === 'function') updateTaxEstimatorUI();
        saveDataToLocalStorage();

        showToast(`ลบข้อมูลของ "${month}" เรียบร้อย`, "success");
    }
}

// Sync slider handles on history load
function syncSlidersToState() {
    const i = state.inputs;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('inputDaysWorked', i.daysWorked || 0);
    setVal('inputDaysWorkedNum', i.daysWorked || 0);
    setVal('inputHalfDays', i.halfDays || 0);
    setVal('inputHalfDaysNum', i.halfDays || 0);
    setVal('inputOtdays', i.otDays || 0);
    setVal('inputOtdaysNum', i.otDays || 0);
    setVal('inputWeekendDays', i.weekendDays || 0);
    setVal('inputWeekendDaysNum', i.weekendDays || 0);
    setVal('inputShiftDays', i.shiftDays || 0);
    setVal('inputShiftDaysNum', i.shiftDays || 0);
    setVal('inputBonus', i.bonus || 0);
}

// Sync settings tab input values on load
function syncSettingsInputs() {
    const c = state.config;
    document.getElementById('setBaseSalary').value = c.baseSalary;
    document.getElementById('setBaseDays').value = c.baseDays;
    document.getElementById('setShiftRate').value = c.shiftRate;
    document.getElementById('setBreakfastRate').value = c.breakfastRate;
    document.getElementById('setOtFoodRate').value = c.otFoodRate;
    document.getElementById('setTravelRate').value = c.travelRate;
    document.getElementById('setTargetRate').value = c.targetRate;
    document.getElementById('setRentRate').value = c.rentRate;
    document.getElementById('setDiligenceRate').value = c.diligenceRate;
    document.getElementById('setIncentiveRate').value = c.incentiveRate;
    
    document.getElementById('setStandardHours').value = c.standardHours;
    document.getElementById('setOtHoursPerDay').value = c.otHoursPerDay;
    document.getElementById('setMulOtNormal').value = c.mulOtNormal;
    document.getElementById('setMulWeekendStd').value = c.mulWeekendStd;
    document.getElementById('setMulWeekendOt').value = c.mulWeekendOt;
    document.getElementById('setSocialSecurity').value = c.socialSecurity;
    renderCustomRatesInputs();
}

// ==========================================================================
// Custom Rate Management Functions (Global Scope)
// ==========================================================================

function openNewRateModal() {
    const rateModalEl = document.getElementById('newRateModal');
    if (rateModalEl) {
        rateModalEl.classList.add('active');
        const nameEl = document.getElementById('newRateName');
        const valEl = document.getElementById('newRateValue');
        const typeEl = document.getElementById('newRateType');
        if (nameEl) {
            nameEl.value = '';
            setTimeout(() => nameEl.focus(), 80);
        }
        if (valEl) valEl.value = '';
        if (typeEl) typeEl.value = 'monthly';
    }
}

function closeNewRateModal() {
    const rateModalEl = document.getElementById('newRateModal');
    if (rateModalEl) {
        rateModalEl.classList.remove('active');
    }
}

function saveNewCustomRateItem() {
    try {
        const nameEl = document.getElementById('newRateName');
        const valEl = document.getElementById('newRateValue');
        const typeEl = document.getElementById('newRateType');
        const iconEl = document.getElementById('newRateIcon');

        const name = nameEl ? nameEl.value.trim() : '';
        const type = (typeEl && typeEl.value) ? typeEl.value : 'monthly';
        const rate = valEl ? (Number(valEl.value) || 0) : 0;
        const icon = (iconEl && iconEl.value) ? iconEl.value : 'award';

        if (!name) {
            if (typeof showToast === 'function') {
                showToast('กรุณาระบุชื่อรายการเงินได้', 'error');
            } else {
                alert('กรุณาระบุชื่อรายการเงินได้');
            }
            if (nameEl) nameEl.focus();
            return;
        }

        if (!state.config) state.config = {};
        if (!Array.isArray(state.config.customRates)) {
            state.config.customRates = [];
        }

        const newId = 'rate_custom_' + Date.now();
        state.config.customRates.push({
            id: newId,
            name: name,
            type: type,
            rate: rate,
            icon: icon
        });

        // 1. Recalculate and update UI
        if (typeof calculateAll === 'function') calculateAll();
        if (typeof updateChart === 'function') updateChart();
        if (typeof renderSalaryTable === 'function') renderSalaryTable();
        if (typeof renderCustomRatesInputs === 'function') renderCustomRatesInputs();
        if (typeof saveDataToLocalStorage === 'function') saveDataToLocalStorage();
        
        // 2. Close modal
        closeNewRateModal();

        // 3. Feedback toast
        if (typeof showToast === 'function') {
            showToast(`เพิ่มอัตรา "${name}" สำเร็จเรียบร้อย`, 'success');
        }
    } catch (err) {
        console.error('Error saving custom rate:', err);
        closeNewRateModal();
        if (typeof showToast === 'function') {
            showToast('เกิดข้อผิดพลาดในการบันทึกอัตรา', 'error');
        }
    }
}

function updateCustomRateValue(id, val) {
    if (!state.config || !Array.isArray(state.config.customRates)) return;
    const item = state.config.customRates.find(r => r.id === id);
    if (item) {
        item.rate = Number(val) || 0;
        if (typeof calculateAll === 'function') calculateAll();
        if (typeof updateChart === 'function') updateChart();
        if (typeof renderSalaryTable === 'function') renderSalaryTable();
        if (typeof saveDataToLocalStorage === 'function') saveDataToLocalStorage();
    }
}

function deleteCustomRateItem(id) {
    if (!state.config || !Array.isArray(state.config.customRates)) return;
    const target = state.config.customRates.find(r => r.id === id);
    const name = target ? target.name : 'รายการ';
    state.config.customRates = state.config.customRates.filter(r => r.id !== id);
    if (typeof calculateAll === 'function') calculateAll();
    if (typeof updateChart === 'function') updateChart();
    if (typeof renderSalaryTable === 'function') renderSalaryTable();
    if (typeof renderCustomRatesInputs === 'function') renderCustomRatesInputs();
    if (typeof saveDataToLocalStorage === 'function') saveDataToLocalStorage();
    if (typeof showToast === 'function') {
        showToast(`ลบรายการ "${name}" เรียบร้อยแล้ว`, "success");
    }
}

function renderCustomRatesInputs() {
    const container = document.getElementById('customRatesListContainer');
    if (!container) return;

    if (!state.config || !Array.isArray(state.config.customRates) || state.config.customRates.length === 0) {
        container.innerHTML = `
            <div class="empty-custom-rates-hint">
                <i data-lucide="info" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
                ยังไม่มีรายการเงินได้เพิ่มเติม กดปุ่ม <strong>"+ เพิ่มรายการ"</strong> ด้านบนเพื่อเพิ่มค่าอื่นๆ เช่น ค่าครองชีพ, ค่าโทรศัพท์, ค่าตำแหน่ง
            </div>
        `;
        initLucideIcons();
        return;
    }

    let html = '';
    state.config.customRates.forEach(item => {
        const typeLabel = item.type === 'daily' ? 'ตามวันทำงานจริง' : 'รายเดือนคงที่';
        const typeClass = item.type === 'daily' ? 'daily' : 'monthly';
        html += `
            <div class="custom-rate-item-card" id="rate_card_${item.id}">
                <div class="custom-rate-item-info">
                    <div class="custom-rate-icon">
                        <i data-lucide="${item.icon || 'award'}"></i>
                    </div>
                    <div class="custom-rate-details">
                        <span class="custom-rate-name">${item.name}</span>
                        <span class="custom-rate-type-badge ${typeClass}">${typeLabel}</span>
                    </div>
                </div>
                <div class="custom-rate-input-wrap">
                    <div class="input-with-icon">
                        <span class="prefix">฿</span>
                        <input type="number" min="0" value="${item.rate || 0}" onfocus="this.select()" onchange="updateCustomRateValue('${item.id}', this.value)">
                    </div>
                    <button type="button" class="delete-custom-rate-btn" onclick="deleteCustomRateItem('${item.id}')" title="ลบรายการนี้">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    initLucideIcons();
}

if (typeof window !== 'undefined') {
    window.openNewRateModal = openNewRateModal;
    window.closeNewRateModal = closeNewRateModal;
    window.saveNewCustomRateItem = saveNewCustomRateItem;
    window.deleteCustomRateItem = deleteCustomRateItem;
    window.updateCustomRateValue = updateCustomRateValue;
    window.renderCustomRatesInputs = renderCustomRatesInputs;
}

function refreshCurrentMonthUI() {
    syncSlidersToState();
    calculateAll();
    updateChart();
    renderExpensesInputs();
    renderCustomRatesInputs();
    renderSalaryTable();
    renderHistoryList();
}

// ==========================================================================
// 7. Event Handlers Configuration
// ==========================================================================

function initEventListeners() {
    // 1. Month Selector change
    const monthSelect = document.getElementById('currentMonthSelect');
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            saveCurrentMonthData();
            state.currentMonth = e.target.value;
            applyMonthData(state.currentMonth, state.expenses);
            refreshCurrentMonthUI();
            saveDataToLocalStorage();
            showToast(`โหลดข้อมูลของ "${state.currentMonth}" แล้ว`, "success");
        });
    }

    // 2. Input sliders & corresponding compact numbers syncing
    const sliders = [
        { sId: 'inputDaysWorked', nId: 'inputDaysWorkedNum', key: 'daysWorked' },
        { sId: 'inputHalfDays', nId: 'inputHalfDaysNum', key: 'halfDays' },
        { sId: 'inputOtdays', nId: 'inputOtdaysNum', key: 'otDays' },
        { sId: 'inputWeekendDays', nId: 'inputWeekendDaysNum', key: 'weekendDays' },
        { sId: 'inputShiftDays', nId: 'inputShiftDaysNum', key: 'shiftDays' }
    ];

    sliders.forEach(pair => {
        const sliderEl = document.getElementById(pair.sId);
        const numEl = document.getElementById(pair.nId);

        if (sliderEl && numEl) {
            // Initial sync
            sliderEl.value = state.inputs[pair.key];
            numEl.value = state.inputs[pair.key];

            // Slider change
            sliderEl.addEventListener('input', (e) => {
                const val = Number(e.target.value);
                numEl.value = val;
                state.inputs[pair.key] = val;
                calculateAll();
                updateChart();
                saveDataToLocalStorage();
            });

            // Compact number change
            numEl.addEventListener('change', (e) => {
                let val = Number(e.target.value);
                const min = Number(sliderEl.min);
                const max = Number(sliderEl.max);
                
                // Constraints
                if (val < min) val = min;
                if (val > max) val = max;
                
                e.target.value = val;
                sliderEl.value = val;
                state.inputs[pair.key] = val;
                
                calculateAll();
                updateChart();
                saveDataToLocalStorage();
            });
        }
    });

    // Bonus input change
    const bonusInp = document.getElementById('inputBonus');
    if (bonusInp) {
        bonusInp.addEventListener('change', (e) => {
            state.inputs.bonus = Number(e.target.value) || 0;
            calculateAll();
            updateChart();
            saveDataToLocalStorage();
        });
    }

    // 3. Save Record Button
    const saveBtn = document.getElementById('saveRecordBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // Check if month already exists in history
            const existingIndex = state.history.findIndex(h => h.month === state.currentMonth);
            
            const newRecord = {
                id: existingIndex >= 0 ? state.history[existingIndex].id : 'rec_' + Date.now(),
                month: state.currentMonth,
                config: JSON.parse(JSON.stringify(state.config)),
                inputs: JSON.parse(JSON.stringify(state.inputs)),
                expenses: JSON.parse(JSON.stringify(state.expenses)),
                totalRevenue: calculations.totalRevenue,
                totalExpenses: calculations.totalExpenses,
                netBalance: calculations.netBalance
            };

            if (existingIndex >= 0) {
                if (confirm(`พบข้อมูลของเดือน "${state.currentMonth}" บันทึกไว้อยู่แล้ว คุณต้องการบันทึกทับข้อมูลเดิมหรือไม่?`)) {
                    state.history[existingIndex] = newRecord;
                    showToast(`แก้ไขข้อมูลประจำเดือน "${state.currentMonth}" สำเร็จ`, "success");
                } else {
                    return;
                }
            } else {
                state.history.push(newRecord);
                showToast(`บันทึกรายรับ-รายจ่าย "${state.currentMonth}" เข้าสู่คลังประวัติแล้ว`, "success");
            }

            saveDataToLocalStorage();
            renderHistoryList();
        });
    }

    // 4. Print / PDF exporter
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            // Force jump to Salary breakdown tab for printing layout
            document.querySelector('.menu-item[data-tab="salary"]').click();
            setTimeout(() => {
                window.print();
            }, 300);
        });
    }

    // 5. Settings saving (Functions for both Main & Calculation panels)
    function saveAllSettings() {
        const getNum = (id, fallback) => {
            const el = document.getElementById(id);
            return el ? (Number(el.value) || 0) : fallback;
        };

        state.config.baseSalary = getNum('setBaseSalary', state.config.baseSalary);
        state.config.baseDays = getNum('setBaseDays', state.config.baseDays) || 30;
        state.config.shiftRate = getNum('setShiftRate', state.config.shiftRate);
        state.config.breakfastRate = getNum('setBreakfastRate', state.config.breakfastRate);
        state.config.otFoodRate = getNum('setOtFoodRate', state.config.otFoodRate);
        state.config.travelRate = getNum('setTravelRate', state.config.travelRate);
        state.config.targetRate = getNum('setTargetRate', state.config.targetRate);
        state.config.rentRate = getNum('setRentRate', state.config.rentRate);
        state.config.diligenceRate = getNum('setDiligenceRate', state.config.diligenceRate);
        state.config.incentiveRate = getNum('setIncentiveRate', state.config.incentiveRate);
        
        state.config.standardHours = getNum('setStandardHours', state.config.standardHours) || 8;
        state.config.otHoursPerDay = getNum('setOtHoursPerDay', state.config.otHoursPerDay) || 2.5;
        state.config.mulOtNormal = getNum('setMulOtNormal', state.config.mulOtNormal) || 1.5;
        state.config.mulWeekendStd = getNum('setMulWeekendStd', state.config.mulWeekendStd) || 1.0;
        state.config.mulWeekendOt = getNum('setMulWeekendOt', state.config.mulWeekendOt) || 3.0;
        state.config.socialSecurity = getNum('setSocialSecurity', state.config.socialSecurity);

        const validationErrors = validatePayrollInputs(state.config, state.inputs);
        if (validationErrors.length > 0) {
            syncSettingsInputs();
            showToast('บันทึกไม่ได้: ' + validationErrors[0], 'error');
            return;
        }

        calculateAll();
        updateChart();
        renderExpensesInputs();
        renderSalaryTable();
        if (typeof updateSavingsGoalUI === 'function') updateSavingsGoalUI();
        if (typeof updateTaxEstimatorUI === 'function') updateTaxEstimatorUI();
        saveDataToLocalStorage();
        showToast("บันทึกการตั้งค่าเสร็จสมบูรณ์", "success");
    }

    function resetAllSettings() {
        if (confirm("ต้องการกู้คืนอัตราแนะนำเริ่มต้นจากไฟล์ Excel ต้นฉบับหรือไม่?")) {
            state.config = { ...DEFAULT_CONFIG };
            syncSettingsInputs();
            calculateAll();
            updateChart();
            renderExpensesInputs();
            renderSalaryTable();
            if (typeof updateSavingsGoalUI === 'function') updateSavingsGoalUI();
            if (typeof updateTaxEstimatorUI === 'function') updateTaxEstimatorUI();
            saveDataToLocalStorage();
            showToast("กู้คืนข้อมูลหลักเบื้องต้นแล้ว", "success");
        }
    }

    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const saveGeneralSettingsBtn = document.getElementById('saveGeneralSettingsBtn');
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveAllSettings);
    if (saveGeneralSettingsBtn) saveGeneralSettingsBtn.addEventListener('click', saveAllSettings);

    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const resetGeneralSettingsBtn = document.getElementById('resetGeneralSettingsBtn');
    if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', resetAllSettings);
    if (resetGeneralSettingsBtn) resetGeneralSettingsBtn.addEventListener('click', resetAllSettings);

    // 6. Backup import/export
    const exportBackupBtn = document.getElementById('exportBackupBtn');
    const importBackupBtn = document.getElementById('importBackupBtn');
    const importBackupInput = document.getElementById('importBackupInput');

    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', exportBackupData);
    }
    if (importBackupBtn && importBackupInput) {
        importBackupBtn.addEventListener('click', () => importBackupInput.click());
        importBackupInput.addEventListener('change', async event => {
            const file = event.target.files && event.target.files[0];
            if (file) await importBackupData(file);
            event.target.value = '';
        });
    }
    
    // 7.1 Custom Rate modal event listeners
    const addRateBtn = document.getElementById('addNewRateBtn');
    const rateModalEl = document.getElementById('newRateModal');
    const closeRateModalBtn = document.getElementById('closeRateModalBtn');
    const cancelRateModalBtn = document.getElementById('cancelRateModalBtn');
    const saveNewRateBtn = document.getElementById('saveNewRateBtn');

    if (addRateBtn) addRateBtn.addEventListener('click', openNewRateModal);
    if (closeRateModalBtn) closeRateModalBtn.addEventListener('click', closeNewRateModal);
    if (cancelRateModalBtn) cancelRateModalBtn.addEventListener('click', closeNewRateModal);
    if (saveNewRateBtn) saveNewRateBtn.addEventListener('click', saveNewCustomRateItem);

    if (rateModalEl) {
        rateModalEl.addEventListener('click', (e) => {
            if (e.target === rateModalEl) closeNewRateModal();
        });
    }

    // 7. Custom Expense modal trigger
    const addExpenseBtn = document.getElementById('addNewExpenseBtn');
    const modalEl = document.getElementById('newExpenseModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const saveNewExpenseBtn = document.getElementById('saveNewExpenseBtn');

    if (addExpenseBtn && modalEl) {
        addExpenseBtn.addEventListener('click', () => {
            modalEl.classList.add('active');
            document.getElementById('newExpenseLabel').value = '';
            document.getElementById('newExpenseValue').value = '';
        });
    }

    const hideModal = () => modalEl.classList.remove('active');
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', hideModal);

    if (saveNewExpenseBtn) {
        saveNewExpenseBtn.addEventListener('click', () => {
            const label = document.getElementById('newExpenseLabel').value.trim();
            const val = Number(document.getElementById('newExpenseValue').value) || 0;
            const icon = document.getElementById('newExpenseIcon').value;

            if (!label) {
                alert("กรุณากรอกชื่อหมวดหมู่รายจ่าย");
                return;
            }

            const newId = 'exp_custom_' + Date.now();
            state.expenses.push({ id: newId, label, value: val, icon });
            
            calculateAll();
            updateChart();
            renderExpensesInputs();
            saveDataToLocalStorage();
            hideModal();
            showToast(`เพิ่มหมวดหมู่ "${label}" ในรายจ่ายเรียบร้อย`, "success");
        });
    }

    // Close Modal on clicking outside the card
    if (modalEl) {
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) hideModal();
        });
    }

    // 7. Clear All History
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm("คำเตือน: คุณต้องการลบประวัติการคำนวณรายเดือนที่บันทึกไว้ทั้งหมดใช่หรือไม่? ไม่สามารถกู้คืนกลับมาได้!")) {
                state.history = [];
                saveDataToLocalStorage();
                renderHistoryList();
                showToast("ล้างประวัติบันทึกทั้งหมดเรียบร้อยแล้ว", "success");
            }
        });
    }

    // 8. Sub charts tab selector
    const chartTabBtns = document.querySelectorAll('.sub-tab-btn');
    chartTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chartTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeChartType = btn.getAttribute('data-chart');
            updateChart();
        });
    });
}

// Toast display helper
let toastTimer = null;

// Toast display helper
function showToast(message, type = "success") {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const toast = document.getElementById('appToast');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');

    if (!toast || !msgEl) return;

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }

    msgEl.textContent = message;
    
    // Style configurations based on theme colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (type === "success") {
        toast.style.borderColor = "var(--income-color)";
        if (iconEl) iconEl.setAttribute('data-lucide', 'check-circle');
    } else {
        toast.style.borderColor = "var(--expense-color)";
        if (iconEl) iconEl.setAttribute('data-lucide', 'alert-circle');
    }
    
    initLucideIcons();
    toast.classList.add('active');

    toastTimer = setTimeout(() => {
        toast.classList.remove('active');
        toastTimer = null;
    }, 3000);
}

// ==========================================================================
// 8. Interactive Charts (Chart.js Controller)
// ==========================================================================

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Grid line and text colors matching theme specs
    return {
        textColor: isDark ? 'hsl(220, 14%, 72%)' : 'hsl(220, 15%, 40%)',
        gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        expenseColors: [
            'hsl(355, 100%, 65%)', // Red/Pink
            'hsl(25, 100%, 60%)',  // Orange
            'hsl(45, 100%, 55%)',  // Amber
            'hsl(160, 85%, 45%)',  // Forest Green
            'hsl(200, 95%, 55%)',  // Sky Blue
            'hsl(235, 90%, 62%)',  // Indigo
            'hsl(268, 100%, 68%)', // Purple
            'hsl(300, 80%, 60%)',  // Fuchsia
            'hsl(330, 85%, 58%)'   // Pink Rose
        ],
        incomeColor: 'hsl(174, 100%, 41%)',
        balanceColor: 'hsl(268, 100%, 68%)',
        expenseSingle: 'hsl(355, 100%, 65%)'
    };
}

function initChart() {
    if (typeof Chart === 'undefined') {
        showToast('ไม่สามารถโหลดกราฟได้ กรุณาเปิดอินเทอร์เน็ตแล้วรีโหลดหน้า', 'error');
        return;
    }
    const canvas = document.getElementById('dashboardChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const colors = getChartColors();

    // Build data based on current state
    const chartConfig = getChartConfig(colors);
    
    // Create Chart
    state.chartInstance = new Chart(ctx, chartConfig);
}

function updateChart() {
    if (!state.chartInstance) return;

    const colors = getChartColors();
    const newConfig = getChartConfig(colors);

    state.chartInstance.type = newConfig.type;
    state.chartInstance.data = newConfig.data;
    state.chartInstance.options = newConfig.options;
    state.chartInstance.update();
}

function getChartConfig(colors) {
    // 1. Doughnut Chart: Expenses breakdown
    if (state.activeChartType === 'doughnut') {
        const dataItems = [];
        
        // Filter user non-zero expenses
        state.expenses.forEach(e => {
            if (e.value > 0) {
                dataItems.push({ label: e.label, val: e.value });
            }
        });

        // Add Social Security if non-zero
        if (state.config.socialSecurity > 0) {
            dataItems.push({ label: 'ประกันสังคม', val: state.config.socialSecurity });
        }

        // Default item if no expenses exist
        if (dataItems.length === 0) {
            dataItems.push({ label: 'ไม่มีค่าใช้จ่าย', val: 0.1 });
        }

        const labels = dataItems.map(d => d.label);
        const values = dataItems.map(d => d.val);

        return {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.expenseColors.slice(0, dataItems.length),
                    borderWidth: 1,
                    borderColor: 'rgba(22, 28, 45, 0.45)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: colors.textColor,
                            font: { family: 'Prompt', size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let val = context.raw;
                                if (val === 0.1) val = 0;
                                return ` ${context.label}: ฿${val.toLocaleString()}`;
                            }
                        }
                    }
                },
                cutout: '68%'
            }
        };
    } 
    // 2. Bar Chart: Revenue vs Expenses vs Net Remaining
    else {
        return {
            type: 'bar',
            data: {
                labels: ['รายรับรวม', 'รายจ่ายรวม', 'คงเหลือสุทธิ'],
                datasets: [{
                    label: 'บาท',
                    data: [calculations.totalRevenue, calculations.totalExpenses, calculations.netBalance],
                    backgroundColor: [colors.incomeColor, colors.expenseSingle, colors.balanceColor],
                    borderRadius: 8,
                    borderWidth: 0,
                    barThickness: 32
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: colors.textColor,
                            font: { family: 'Prompt', size: 12 }
                        }
                    },
                    y: {
                        grid: { color: colors.gridColor },
                        ticks: {
                            color: colors.textColor,
                            font: { family: 'Outfit', size: 10 }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ฿${context.raw.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                }
            }
        };
    }
}

// ==========================================================================
// 9. Progressive Web App (PWA) & Service Worker
// ==========================================================================

let deferredPwaPrompt = null;

function initServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => {
                    console.log('[PWA] Service Worker registered:', reg.scope);
                })
                .catch((err) => {
                    console.warn('[PWA] Service Worker registration failed:', err);
                });
        });
    }
}

function initPwaInstallPrompt() {
    const installBtns = document.querySelectorAll('.pwa-install-btn');
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        installBtns.forEach(btn => {
            btn.style.display = 'flex';
        });
    });

    installBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!deferredPwaPrompt) return;
            deferredPwaPrompt.prompt();
            const { outcome } = await deferredPwaPrompt.userChoice;
            console.log('[PWA] Install prompt outcome:', outcome);
            deferredPwaPrompt = null;
            installBtns.forEach(b => { b.style.display = 'none'; });
        });
    });

    window.addEventListener('appinstalled', () => {
        installBtns.forEach(btn => { btn.style.display = 'none'; });
        showToast('ติดตั้ง SalaryHub ลงบนอุปกรณ์เรียบร้อยแล้ว!', 'success');
    });
}

// ==========================================================================
// 10. PIN Lock & Security Engine
// ==========================================================================

let enteredLockPin = '';
let pinSetupState = {
    step: 1,           // 1 = Enter new PIN, 2 = Confirm PIN
    length: 4,         // 4 or 6
    pin1: '',
    pin2: '',
    currentPin: '',
    isChangeMode: false
};

async function hashPin(pinString) {
    const salt = 'salary_hub_salt_';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(`${salt}${pinString}`);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('[Security] Subtle crypto failed, using fallback', e);
        }
    }
    // Fallback hash for node / test environments
    let hash = 0;
    const str = `${salt}${pinString}`;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
}

function initPinSecurity() {
    syncPinSettingsUI();

    // 1. Quick lock buttons in header & sidebar
    const quickLockBtn = document.getElementById('quickLockBtn');
    const sidebarLockBtn = document.getElementById('sidebarLockBtn');

    const triggerQuickLock = () => {
        if (!state.pinConfig.enabled) {
            showToast('คุณยังไม่ได้ตั้งค่ารหัส PIN กรุณาตั้งรหัสผ่านที่แท็บตั้งค่า', 'info');
            const settingsTabBtn = document.querySelector('[data-tab="settings"]');
            if (settingsTabBtn) settingsTabBtn.click();
            return;
        }
        showPinLockOverlay();
    };

    if (quickLockBtn) quickLockBtn.addEventListener('click', triggerQuickLock);
    if (sidebarLockBtn) sidebarLockBtn.addEventListener('click', triggerQuickLock);
    const mobileQuickLockBtn = document.getElementById('mobileQuickLockBtn');
    if (mobileQuickLockBtn) mobileQuickLockBtn.addEventListener('click', triggerQuickLock);

    // 2. Settings tab buttons
    const setupPinBtn = document.getElementById('setupPinBtn');
    const changePinBtn = document.getElementById('changePinBtn');
    const disablePinBtn = document.getElementById('disablePinBtn');
    const autoLockSelect = document.getElementById('setPinAutoLock');

    if (setupPinBtn) setupPinBtn.addEventListener('click', () => openPinSetupModal(false));
    if (changePinBtn) changePinBtn.addEventListener('click', () => openPinSetupModal(true));
    if (disablePinBtn) {
        disablePinBtn.addEventListener('click', () => {
            if (confirm('คุณต้องการปิดการใช้งานระบบล็อกรหัส PIN ใช่หรือไม่?')) {
                state.pinConfig.enabled = false;
                state.pinConfig.pinHash = '';
                saveDataToLocalStorage();
                syncPinSettingsUI();
                showToast('ปิดการใช้งานรหัส PIN แล้ว', 'success');
            }
        });
    }

    if (autoLockSelect) {
        autoLockSelect.value = state.pinConfig.autoLockMinutes ?? 5;
        autoLockSelect.addEventListener('change', (e) => {
            state.pinConfig.autoLockMinutes = Number(e.target.value);
            saveDataToLocalStorage();
            showToast('บันทึกการตั้งค่าล็อกอัตโนมัติแล้ว', 'success');
        });
    }

    // 3. Lock screen numpad & action listeners
    const lockNumpad = document.getElementById('pinLockNumpad');
    if (lockNumpad) {
        lockNumpad.addEventListener('click', (e) => {
            const btn = e.target.closest('.pin-key');
            if (!btn) return;
            const digit = btn.getAttribute('data-key');
            const action = btn.getAttribute('data-action');

            if (digit !== null) {
                handleLockDigit(digit);
            } else if (action === 'delete') {
                handleLockDelete();
            } else if (action === 'clear') {
                handleLockClear();
            }
        });
    }

    // Forgot PIN button
    const forgotPinBtn = document.getElementById('forgotPinBtn');
    if (forgotPinBtn) {
        forgotPinBtn.addEventListener('click', () => {
            if (confirm('คำเตือน: ต้องการรีเซ็ตรหัส PIN เพื่อเข้าใช้งานหรือไม่?\n(ข้อมูลเงินเดือนและประวัติจะยังคงอยู่ครบถ้วน)')) {
                state.pinConfig.enabled = false;
                state.pinConfig.pinHash = '';
                saveDataToLocalStorage();
                hidePinLockOverlay();
                syncPinSettingsUI();
                showToast('รีเซ็ตรหัส PIN เรียบร้อยแล้ว สามารถตั้งรหัสใหม่ได้ที่แท็บตั้งค่า', 'info');
            }
        });
    }

    // 4. PIN Setup Modal listeners
    initPinSetupModalListeners();

    // 5. Auto-lock on visibilitychange
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                state.lastBackgroundTime = Date.now();
            } else {
                checkAutoLock();
            }
        });
    }

    // 6. Global Physical Keyboard Listener
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', (e) => {
            // If lock screen is visible
            const lockOverlay = document.getElementById('pinLockOverlay');
            if (lockOverlay && lockOverlay.style.display !== 'none') {
                if (e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                    handleLockDigit(e.key);
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    handleLockDelete();
                } else if (e.key === 'Escape' || e.key === 'Delete') {
                    e.preventDefault();
                    handleLockClear();
                }
                return;
            }

            // If setup modal is open
            const setupModal = document.getElementById('pinSetupModal');
            if (setupModal && setupModal.classList.contains('active')) {
                if (e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                    handleSetupDigit(e.key);
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    handleSetupDelete();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closePinSetupModal();
                }
            }
        });
    }

    // 7. Initial Lock Check on Startup
    if (state.pinConfig.enabled) {
        showPinLockOverlay();
    }
}

function syncPinSettingsUI() {
    const statusPill = document.getElementById('pinStatusPill');
    const statusLabel = document.getElementById('pinStatusLabel');
    const setupPinBtn = document.getElementById('setupPinBtn');
    const changePinBtn = document.getElementById('changePinBtn');
    const disablePinBtn = document.getElementById('disablePinBtn');
    const autoLockSelect = document.getElementById('setPinAutoLock');

    if (!statusPill) return;

    if (state.pinConfig.enabled) {
        statusPill.classList.add('active');
        if (statusLabel) statusLabel.textContent = `เปิดใช้งาน (${state.pinConfig.pinLength || 4} หลัก)`;
        if (setupPinBtn) setupPinBtn.style.display = 'none';
        if (changePinBtn) changePinBtn.style.display = 'flex';
        if (disablePinBtn) disablePinBtn.style.display = 'flex';
    } else {
        statusPill.classList.remove('active');
        if (statusLabel) statusLabel.textContent = 'ปิดใช้งาน';
        if (setupPinBtn) {
            setupPinBtn.style.display = 'flex';
            const btnText = document.getElementById('setupPinBtnText');
            if (btnText) btnText.textContent = 'ตั้งรหัส PIN ใหม่';
        }
        if (changePinBtn) changePinBtn.style.display = 'none';
        if (disablePinBtn) disablePinBtn.style.display = 'none';
    }

    if (autoLockSelect && state.pinConfig.autoLockMinutes !== undefined) {
        autoLockSelect.value = state.pinConfig.autoLockMinutes;
    }
}

// --------------------------------------------------------------------------
// Lock Screen Overlay Functions
// --------------------------------------------------------------------------

function showPinLockOverlay() {
    const overlay = document.getElementById('pinLockOverlay');
    if (!overlay) return;

    state.isLocked = true;
    enteredLockPin = '';
    overlay.style.display = 'flex';

    const errEl = document.getElementById('pinLockError');
    if (errEl) {
        errEl.textContent = '';
        errEl.className = 'pin-status-msg';
    }

    renderLockDots();
    initLucideIcons();
}

function hidePinLockOverlay() {
    const overlay = document.getElementById('pinLockOverlay');
    if (!overlay) return;

    state.isLocked = false;
    state.pinConfig.lastUnlockedTime = Date.now();
    saveDataToLocalStorage();
    overlay.style.display = 'none';
    enteredLockPin = '';
}

function renderLockDots() {
    const container = document.getElementById('pinDotsContainer');
    if (!container) return;

    const len = state.pinConfig.pinLength || 4;
    let html = '';
    for (let i = 0; i < len; i++) {
        const isFilled = i < enteredLockPin.length ? 'filled' : '';
        html += `<span class="pin-dot ${isFilled}"></span>`;
    }
    container.innerHTML = html;
}

function handleLockDigit(digit) {
    const len = state.pinConfig.pinLength || 4;
    if (enteredLockPin.length >= len) return;

    enteredLockPin += digit;
    renderLockDots();

    if (enteredLockPin.length === len) {
        checkLockPin();
    }
}

function handleLockDelete() {
    if (enteredLockPin.length > 0) {
        enteredLockPin = enteredLockPin.slice(0, -1);
        renderLockDots();
    }
}

function handleLockClear() {
    enteredLockPin = '';
    renderLockDots();
    const errEl = document.getElementById('pinLockError');
    if (errEl) errEl.textContent = '';
}

async function checkLockPin() {
    const hash = await hashPin(enteredLockPin);
    const errEl = document.getElementById('pinLockError');
    const dotsEl = document.getElementById('pinDotsContainer');

    if (hash === state.pinConfig.pinHash) {
        if (errEl) {
            errEl.className = 'pin-status-msg success';
            errEl.textContent = 'ปลดล็อกสำเร็จ';
        }
        setTimeout(() => {
            hidePinLockOverlay();
            showToast('ปลดล็อกหน้าจอแล้ว', 'success');
        }, 150);
    } else {
        if (dotsEl) dotsEl.classList.add('shake');
        if (errEl) {
            errEl.className = 'pin-status-msg error';
            errEl.textContent = 'รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่';
        }
        setTimeout(() => {
            if (dotsEl) dotsEl.classList.remove('shake');
            enteredLockPin = '';
            renderLockDots();
        }, 600);
    }
}

function checkAutoLock() {
    if (!state.pinConfig.enabled || state.isLocked) return;

    const autoMin = Number(state.pinConfig.autoLockMinutes);
    if (autoMin === -1) return; // Never auto lock

    if (autoMin === 0) {
        // Lock immediately on tab switch/hidden
        showPinLockOverlay();
        return;
    }

    const elapsedMs = Date.now() - (state.lastBackgroundTime || 0);
    if (elapsedMs >= autoMin * 60 * 1000) {
        showPinLockOverlay();
    }
}

// --------------------------------------------------------------------------
// PIN Setup Modal Functions
// --------------------------------------------------------------------------

function initPinSetupModalListeners() {
    const closeBtn = document.getElementById('closePinModalBtn');
    const cancelBtn = document.getElementById('cancelPinModalBtn');
    const numpad = document.getElementById('pinSetupNumpad');
    const lengthRadios = document.querySelectorAll('input[name="pinLengthChoice"]');

    if (closeBtn) closeBtn.addEventListener('click', closePinSetupModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closePinSetupModal);

    lengthRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            pinSetupState.length = Number(e.target.value);
            document.querySelectorAll('.radio-pill').forEach(pill => {
                pill.classList.toggle('active', pill.getAttribute('data-len') === e.target.value);
            });
            pinSetupState.currentPin = '';
            renderSetupDots();
        });
    });

    if (numpad) {
        numpad.addEventListener('click', (e) => {
            const btn = e.target.closest('.setup-key');
            if (!btn) return;
            const digit = btn.getAttribute('data-key');
            const action = btn.getAttribute('data-action');

            if (digit !== null) {
                handleSetupDigit(digit);
            } else if (action === 'delete') {
                handleSetupDelete();
            } else if (action === 'clear') {
                handleSetupClear();
            }
        });
    }
}

function openPinSetupModal(isChange = false) {
    const modal = document.getElementById('pinSetupModal');
    if (!modal) return;

    pinSetupState = {
        step: 1,
        length: isChange ? (state.pinConfig.pinLength || 4) : 4,
        pin1: '',
        pin2: '',
        currentPin: '',
        isChangeMode: isChange
    };

    const titleEl = document.getElementById('pinSetupModalTitle');
    const descEl = document.getElementById('pinSetupStepDesc');
    const lenSelector = document.getElementById('pinLengthSelector');
    const errEl = document.getElementById('pinSetupError');

    if (titleEl) titleEl.textContent = isChange ? 'เปลี่ยนรหัสผ่าน PIN' : 'ตั้งรหัสผ่าน PIN';
    if (descEl) descEl.textContent = `ขั้นตอนที่ 1/2: ป้อนรหัส PIN ${pinSetupState.length} หลักที่ต้องการ`;
    if (lenSelector) lenSelector.style.display = isChange ? 'none' : 'flex';
    if (errEl) { errEl.textContent = ''; errEl.className = 'pin-status-msg'; }

    // Reset length radio buttons to 4
    const radio4 = document.querySelector('input[name="pinLengthChoice"][value="4"]');
    if (radio4 && !isChange) {
        radio4.checked = true;
        document.querySelectorAll('.radio-pill').forEach(p => p.classList.toggle('active', p.getAttribute('data-len') === '4'));
    }

    renderSetupDots();
    initLucideIcons();
    modal.classList.add('active');
}

function closePinSetupModal() {
    const modal = document.getElementById('pinSetupModal');
    if (modal) modal.classList.remove('active');
    pinSetupState.currentPin = '';
}

function renderSetupDots() {
    const container = document.getElementById('pinSetupDotsContainer');
    if (!container) return;

    const len = pinSetupState.length;
    let html = '';
    for (let i = 0; i < len; i++) {
        const isFilled = i < pinSetupState.currentPin.length ? 'filled' : '';
        html += `<span class="pin-dot ${isFilled}"></span>`;
    }
    container.innerHTML = html;
}

function handleSetupDigit(digit) {
    if (pinSetupState.currentPin.length >= pinSetupState.length) return;

    pinSetupState.currentPin += digit;
    renderSetupDots();

    if (pinSetupState.currentPin.length === pinSetupState.length) {
        setTimeout(() => {
            advanceSetupStep();
        }, 150);
    }
}

function handleSetupDelete() {
    if (pinSetupState.currentPin.length > 0) {
        pinSetupState.currentPin = pinSetupState.currentPin.slice(0, -1);
        renderSetupDots();
    }
}

function handleSetupClear() {
    pinSetupState.currentPin = '';
    renderSetupDots();
    const errEl = document.getElementById('pinSetupError');
    if (errEl) errEl.textContent = '';
}

async function advanceSetupStep() {
    const descEl = document.getElementById('pinSetupStepDesc');
    const errEl = document.getElementById('pinSetupError');
    const dotsEl = document.getElementById('pinSetupDotsContainer');

    if (pinSetupState.step === 1) {
        pinSetupState.pin1 = pinSetupState.currentPin;
        pinSetupState.step = 2;
        pinSetupState.currentPin = '';
        if (descEl) descEl.textContent = 'ขั้นตอนที่ 2/2: ยืนยันรหัส PIN อีกครั้ง';
        if (errEl) { errEl.textContent = ''; errEl.className = 'pin-status-msg'; }
        renderSetupDots();
    } else if (pinSetupState.step === 2) {
        pinSetupState.pin2 = pinSetupState.currentPin;

        if (pinSetupState.pin1 === pinSetupState.pin2) {
            const hash = await hashPin(pinSetupState.pin1);
            state.pinConfig.enabled = true;
            state.pinConfig.pinHash = hash;
            state.pinConfig.pinLength = pinSetupState.length;
            state.pinConfig.lastUnlockedTime = Date.now();

            const autoSelect = document.getElementById('setPinAutoLock');
            if (autoSelect) state.pinConfig.autoLockMinutes = Number(autoSelect.value) || 5;

            saveDataToLocalStorage();
            syncPinSettingsUI();
            closePinSetupModal();
            showToast('ตั้งรหัสผ่าน PIN สำเร็จเรียบร้อยแล้ว!', 'success');
        } else {
            if (dotsEl) dotsEl.classList.add('shake');
            if (errEl) {
                errEl.className = 'pin-status-msg error';
                errEl.textContent = 'รหัส PIN ไม่ตรงกัน กรุณาเริ่มต้นใหม่';
            }
            setTimeout(() => {
                if (dotsEl) dotsEl.classList.remove('shake');
                pinSetupState.step = 1;
                pinSetupState.currentPin = '';
                pinSetupState.pin1 = '';
                pinSetupState.pin2 = '';
                if (descEl) descEl.textContent = `ขั้นตอนที่ 1/2: ป้อนรหัส PIN ${pinSetupState.length} หลักที่ต้องการ`;
                renderSetupDots();
            }, 700);
        }
    }
}


// ==========================================================================
// Settings Category Switcher (Mobile & Desktop Focused)
// ==========================================================================

function initSettingsCategories() {
    const catButtons = document.querySelectorAll('.settings-cat-btn');
    const sections = {
        'general': document.getElementById('settingsPanelGeneral'),
        'calculation': document.getElementById('settingsPanelCalculation'),
        'security': document.getElementById('securitySettingsPanel')
    };

    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetCat = btn.getAttribute('data-settings-cat');
            if (!targetCat) return;

            catButtons.forEach(b => b.classList.toggle('active', b === btn));

            Object.entries(sections).forEach(([key, el]) => {
                if (el) {
                    const isTarget = key === targetCat;
                    el.classList.toggle('active', isTarget);
                    el.style.display = isTarget ? 'block' : 'none';
                }
            });

            initLucideIcons();
        });
    });
}


// ==========================================================================
// 7. Savings Goal & Financial Health Engine
// ==========================================================================

const DEFAULT_SAVINGS_CONFIG = {
    mode: 'percent', // 'percent' | 'fixed'
    targetValue: 20
};

const DEFAULT_TAX_CONFIG = {
    customPvd: 0,
    lifeInsurance: 0,
    homeLoanInterest: 0
};

function getSavingsTargetAmount(totalRevenue) {
    const savings = state.config.savings || DEFAULT_SAVINGS_CONFIG;
    if (savings.mode === 'fixed') {
        return Number(savings.targetValue) || 0;
    }
    return (Number(totalRevenue || 0) * (Number(savings.targetValue || 20) / 100));
}

function updateSavingsGoalUI() {
    const currentBalance = calculations.netBalance || 0;
    const totalRev = calculations.totalRevenue || 0;
    const targetAmount = getSavingsTargetAmount(totalRev);
    const savings = state.config.savings || DEFAULT_SAVINGS_CONFIG;

    const subTextEl = document.getElementById('savingsGoalSubText');
    const currentEl = document.getElementById('savingsCurrentAmount');
    const targetEl = document.getElementById('savingsTargetAmount');
    const fillEl = document.getElementById('savingsProgressFill');
    const percentEl = document.getElementById('savingsProgressPercent');
    const remainingEl = document.getElementById('savingsRemainingText');
    const badgeEl = document.getElementById('financialHealthBadge');
    const badgeTextEl = document.getElementById('financialHealthText');

    if (!currentEl || !targetEl || !fillEl) return;

    if (subTextEl) {
        subTextEl.textContent = savings.mode === 'fixed'
            ? `เป้าหมายคงที่: ฿${Number(savings.targetValue).toLocaleString()} ต่อเดือน`
            : `เป้าหมาย: ${savings.targetValue}% ของรายรับ (฿${targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }

    currentEl.textContent = `฿${currentBalance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    targetEl.textContent = `฿${targetAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const progressRatio = targetAmount > 0 ? (currentBalance / targetAmount) : 0;
    const progressPercent = Math.max(0, Math.round(progressRatio * 100));

    fillEl.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;

    if (percentEl) {
        percentEl.textContent = `${progressPercent}% บรรลุเป้าหมาย`;
    }

    if (remainingEl) {
        if (currentBalance >= targetAmount) {
            remainingEl.textContent = `🎉 ออมเกินเป้าหมาย ฿${(currentBalance - targetAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        } else {
            remainingEl.textContent = `ต้องการอีก ฿${Math.max(0, targetAmount - currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }
    }

    // Financial Health Badge Logic
    if (badgeEl && badgeTextEl) {
        badgeEl.className = 'financial-health-badge';
        if (fillEl) fillEl.className = 'savings-progress-fill';

        if (currentBalance < 0) {
            if (badgeEl.classList) badgeEl.classList.add('danger');
            if (fillEl && fillEl.classList) fillEl.classList.add('danger');
            badgeTextEl.textContent = 'รายจ่ายเกินตัว (ติดลบ)';
        } else if (currentBalance < targetAmount || (totalRev > 0 && (calculations.totalExpenses / totalRev) > 0.7)) {
            if (badgeEl.classList) badgeEl.classList.add('warning');
            if (fillEl && fillEl.classList) fillEl.classList.add('warning');
            badgeTextEl.textContent = 'ระวังงบประมาณ';
        } else {
            badgeTextEl.textContent = 'ยอดเยี่ยม (บรรลุเป้า)';
        }
    }
}

// ==========================================================================
// 8. Annual Tax Estimator Engine (ภ.ง.ด.91)
// ==========================================================================

function calculateAnnualTax() {
    const monthlyRev = calculations.totalRevenue || 0;
    const history = state.history || [];
    const taxConfig = state.config.tax || DEFAULT_TAX_CONFIG;

    // 1. Calculate or Project Annual Gross
    let annualGross = 0;
    if (history.length >= 1) {
        const historySum = history.reduce((sum, r) => sum + (Number(r.totalRevenue) || 0), 0);
        const recordedCount = history.length;
        annualGross = historySum + (monthlyRev * Math.max(0, 12 - recordedCount));
    } else {
        annualGross = monthlyRev * 12;
    }

    // 2. Standard 50% deduction (max 100,000)
    const expenseDeduction = Math.min(annualGross * 0.5, 100000);

    // 3. Personal deduction (60,000)
    const personalDeduction = 60000;

    // 4. Social Security deduction (actual or 9,000 max)
    const ssoMonthly = state.config.socialSecurity || 0;
    const ssoAnnual = Math.min(ssoMonthly * 12, 9000);

    // 5. Additional custom deductions
    const pvd = Number(taxConfig.customPvd) || 0;
    const lifeInsurance = Number(taxConfig.lifeInsurance) || 0;
    const homeLoan = Number(taxConfig.homeLoanInterest) || 0;
    const additionalTotal = pvd + lifeInsurance + homeLoan;

    const totalDeductions = expenseDeduction + personalDeduction + ssoAnnual + additionalTotal;
    const taxableIncome = Math.max(0, annualGross - totalDeductions);

    // 6. Progressive Tax Brackets
    let tax = 0;
    let bracketName = '0% (ได้รับการยกเว้น)';

    if (taxableIncome > 150000) {
        const tier1 = Math.min(taxableIncome - 150000, 150000); // 150k - 300k @ 5%
        tax += tier1 * 0.05;
        bracketName = 'ฐาน 5%';
    }
    if (taxableIncome > 300000) {
        const tier2 = Math.min(taxableIncome - 300000, 200000); // 300k - 500k @ 10%
        tax += tier2 * 0.10;
        bracketName = 'ฐาน 10%';
    }
    if (taxableIncome > 500000) {
        const tier3 = Math.min(taxableIncome - 500000, 250000); // 500k - 750k @ 15%
        tax += tier3 * 0.15;
        bracketName = 'ฐาน 15%';
    }
    if (taxableIncome > 750000) {
        const tier4 = Math.min(taxableIncome - 750000, 250000); // 750k - 1,000k @ 20%
        tax += tier4 * 0.20;
        bracketName = 'ฐาน 20%';
    }
    if (taxableIncome > 1000000) {
        const tier5 = taxableIncome - 1000000;
        tax += tier5 * 0.25;
        bracketName = 'ฐาน 25%+';
    }

    return {
        annualGross,
        totalDeductions,
        taxableIncome,
        annualTax: tax,
        monthlyWithholding: tax / 12,
        bracketName
    };
}

function updateTaxEstimatorUI() {
    const taxData = calculateAnnualTax();

    const grossEl = document.getElementById('taxAnnualGross');
    const dedEl = document.getElementById('taxTotalDeductions');
    const netEl = document.getElementById('taxNetTaxable');
    const taxEl = document.getElementById('taxEstimatedAnnual');
    const monthTaxEl = document.getElementById('taxMonthlyWithholdingDesc');
    const badgeEl = document.getElementById('taxBracketBadge');

    if (grossEl) grossEl.textContent = `฿${taxData.annualGross.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (dedEl) dedEl.textContent = `฿${taxData.totalDeductions.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (netEl) netEl.textContent = `฿${taxData.taxableIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (taxEl) taxEl.textContent = `฿${taxData.annualTax.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (monthTaxEl) monthTaxEl.textContent = `เฉลี่ยเดือนละ ฿${taxData.monthlyWithholding.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (badgeEl) badgeEl.textContent = taxData.bracketName;
}

// ==========================================================================
// 9. Pay Period Calendar Manager (16th Previous Month - 15th Current Month)
// ==========================================================================

let activeSelectedDateKey = null;
let modalActiveMonth = null;

function getPayPeriodInfo(monthLabel) {
    const match = String(monthLabel || '').match(/^(.+?)\s+(\d{4})$/);
    let monthName = match ? match[1].trim() : '';
    let thaiYear = match ? Number(match[2]) : (new Date().getFullYear() + 543);
    let mIdx = THAI_MONTHS.indexOf(monthName);
    
    if (mIdx < 0) {
        const now = new Date();
        mIdx = now.getMonth();
        thaiYear = now.getFullYear() + 543;
        monthName = THAI_MONTHS[mIdx];
    }

    const gYear = thaiYear - 543;

    // Previous month (Cycle start: 16th of previous month)
    const prevDate = new Date(gYear, mIdx - 1, 16);
    const prevGY = prevDate.getFullYear();
    const prevMIdx = prevDate.getMonth();
    const prevThaiYear = prevGY + 543;
    const prevDaysInMonth = new Date(prevGY, prevMIdx + 1, 0).getDate();

    // Current month (Cycle end: 15th of current month)
    const currDate = new Date(gYear, mIdx, 15);
    const currGY = currDate.getFullYear();
    const currMIdx = currDate.getMonth();
    const currThaiYear = currGY + 543;

    const periodLabel = `รอบ 16 ${THAI_MONTHS_SHORT[prevMIdx]} - 15 ${THAI_MONTHS_SHORT[currMIdx]} (${monthName} ${thaiYear})`;
    const periodSubLabel = `รอบคิดเงิน: 16 ${THAI_MONTHS[prevMIdx]} ${prevThaiYear} ถึง 15 ${THAI_MONTHS[currMIdx]} ${currThaiYear}`;

    const days = [];

    // 1. 16th to end of previous month
    for (let d = 16; d <= prevDaysInMonth; d++) {
        const dateObj = new Date(prevGY, prevMIdx, d);
        const dayOfWeek = dateObj.getDay(); // 0 = Sun ... 6 = Sat
        const key = `${prevGY}-${String(prevMIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
            key,
            dayNum: d,
            monthShort: THAI_MONTHS_SHORT[prevMIdx],
            monthFull: THAI_MONTHS[prevMIdx],
            yearThai: prevThaiYear,
            dayOfWeek,
            isWeekend: (dayOfWeek === 0 || dayOfWeek === 6),
            isPrevMonth: true,
            label: `${d} ${THAI_MONTHS_SHORT[prevMIdx]}`
        });
    }

    // 2. 1st to 15th of current month
    for (let d = 1; d <= 15; d++) {
        const dateObj = new Date(currGY, currMIdx, d);
        const dayOfWeek = dateObj.getDay();
        const key = `${currGY}-${String(currMIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
            key,
            dayNum: d,
            monthShort: THAI_MONTHS_SHORT[currMIdx],
            monthFull: THAI_MONTHS[currMIdx],
            yearThai: currThaiYear,
            dayOfWeek,
            isWeekend: (dayOfWeek === 0 || dayOfWeek === 6),
            isPrevMonth: false,
            label: `${d} ${THAI_MONTHS_SHORT[currMIdx]}`
        });
    }

    return {
        periodLabel,
        periodSubLabel,
        days,
        startOffset: days.length > 0 ? days[0].dayOfWeek : 0
    };
}

function getMonthDaysCount(monthLabel) {
    const info = getPayPeriodInfo(monthLabel);
    return info.days.length;
}

function getCalendarDataForMonth(month) {
    const targetMonth = month || modalActiveMonth || state.currentMonth;
    if (!state.monthlyData[targetMonth]) {
        state.monthlyData[targetMonth] = createBlankMonthData();
    }
    if (!state.monthlyData[targetMonth].calendar) {
        state.monthlyData[targetMonth].calendar = {};
    }
    return state.monthlyData[targetMonth].calendar;
}

function renderCalendarModal(targetMonth) {
    const month = targetMonth || modalActiveMonth || state.currentMonth;
    modalActiveMonth = month;

    const gridEl = document.getElementById('calendarDaysGrid');
    const labelEl = document.getElementById('calCurrentMonthLabel');
    if (!gridEl || !month) return;

    const periodInfo = getPayPeriodInfo(month);
    if (labelEl) labelEl.textContent = periodInfo.periodLabel;

    const calData = getCalendarDataForMonth(month);

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let html = '';
    for (let o = 0; o < periodInfo.startOffset; o++) {
        html += '<div class="cal-day-cell empty"></div>';
    }

    periodInfo.days.forEach(dayObj => {
        const isWeekend = dayObj.isWeekend;
        const isToday = (dayObj.key === todayKey);
        const record = calData[dayObj.key] || { worked: false, halfDay: false, ot: false, shift: false, weekend: false };
        const isSelected = activeSelectedDateKey === dayObj.key;

        let badges = '';
        if (record.worked) badges += '<span class="cal-mini-badge b-work" title="ทำงานเต็มวัน"></span>';
        if (record.halfDay) badges += '<span class="cal-mini-badge b-halfday" title="ลาครึ่งวัน"></span>';
        if (record.ot) badges += '<span class="cal-mini-badge b-ot" title="โอที"></span>';
        if (record.shift) badges += '<span class="cal-mini-badge b-shift" title="เข้ากะ"></span>';
        if (record.weekend) badges += '<span class="cal-mini-badge b-weekend" title="วันหยุด"></span>';

        html += `
            <div class="cal-day-cell ${dayObj.isPrevMonth ? 'is-prev-month' : ''} ${isWeekend ? 'is-weekend' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectCalendarDateKey('${dayObj.key}')">
                ${isToday ? '<span class="cal-today-tag">วันนี้</span>' : ''}
                <span class="cal-month-tag">${dayObj.monthShort}</span>
                <span class="cal-day-num">${dayObj.dayNum}</span>
                <div class="cal-day-badges">${badges}</div>
            </div>
        `;
    });

    gridEl.innerHTML = html;
    updateCalendarSummaryCounts();
}

function selectCalendarDateKey(key) {
    activeSelectedDateKey = key;
    const month = modalActiveMonth || state.currentMonth;
    const periodInfo = getPayPeriodInfo(month);
    const dayObj = periodInfo.days.find(d => d.key === key);
    if (!dayObj) return;

    const calData = getCalendarDataForMonth(month);
    const record = calData[key] || { worked: false, halfDay: false, ot: false, shift: false, weekend: false };

    const editorEl = document.getElementById('calDayEditor');
    const titleEl = document.getElementById('calSelectedDateText');
    if (!editorEl) return;

    editorEl.style.display = 'block';
    if (titleEl) titleEl.textContent = `บันทึกข้อมูล: วันที่ ${dayObj.dayNum} ${dayObj.monthFull} ${dayObj.yearThai}`;

    const btnWork = document.getElementById('toggleDayWork');
    const btnHalfDay = document.getElementById('toggleDayHalfDay');
    const btnOt = document.getElementById('toggleDayOt');
    const btnShift = document.getElementById('toggleDayShift');
    const btnWeekend = document.getElementById('toggleDayWeekend');

    if (btnWork) btnWork.classList.toggle('active', Boolean(record.worked));
    if (btnHalfDay) btnHalfDay.classList.toggle('active', Boolean(record.halfDay));
    if (btnOt) btnOt.classList.toggle('active', Boolean(record.ot));
    if (btnShift) btnShift.classList.toggle('active', Boolean(record.shift));
    if (btnWeekend) btnWeekend.classList.toggle('active', Boolean(record.weekend));

    renderCalendarModal(month);
}

function selectCalendarDay(day) {
    const month = modalActiveMonth || state.currentMonth;
    const periodInfo = getPayPeriodInfo(month);
    const found = periodInfo.days.find(d => d.dayNum === day);
    if (found) selectCalendarDateKey(found.key);
}

function toggleCalendarType(type) {
    if (!activeSelectedDateKey) return;
    const month = modalActiveMonth || state.currentMonth;
    const calData = getCalendarDataForMonth(month);
    if (!calData[activeSelectedDateKey]) {
        calData[activeSelectedDateKey] = { worked: false, halfDay: false, ot: false, shift: false, weekend: false };
    }

    if (type === 'halfDay') {
        const nextVal = !calData[activeSelectedDateKey].halfDay;
        calData[activeSelectedDateKey].halfDay = nextVal;
        if (nextVal) {
            // ลาครึ่งวัน: เคลียร์ทำงานเต็มวัน, โอที, วันหยุด (แต่สามารถเข้ากะดึก 'shift' ได้)
            calData[activeSelectedDateKey].worked = false;
            calData[activeSelectedDateKey].ot = false;
            calData[activeSelectedDateKey].weekend = false;
        }
    } else if (type === 'ot') {
        const nextVal = !calData[activeSelectedDateKey].ot;
        calData[activeSelectedDateKey].ot = nextVal;
        if (nextVal) {
            // กดติ๊กโอที: ให้ติ๊กช่องทำงานเต็มวันให้อัตโนมัติ และเคลียร์ลาครึ่งวัน
            calData[activeSelectedDateKey].worked = true;
            calData[activeSelectedDateKey].halfDay = false;
        }
    } else if (type === 'worked') {
        const nextVal = !calData[activeSelectedDateKey].worked;
        calData[activeSelectedDateKey].worked = nextVal;
        if (nextVal) {
            // ติ๊กทำงานเต็มวัน: เคลียร์ลาครึ่งวัน
            calData[activeSelectedDateKey].halfDay = false;
        } else {
            // ปลดทำงานเต็มวัน: ปลดโอทีด้วย
            calData[activeSelectedDateKey].ot = false;
        }
    } else if (type === 'shift') {
        // เข้ากะดึก: สามารถติ๊กได้ทั้งวันทำงานปกติ และวันลาครึ่งวัน
        calData[activeSelectedDateKey].shift = !calData[activeSelectedDateKey].shift;
    } else if (type === 'weekend') {
        const nextVal = !calData[activeSelectedDateKey].weekend;
        calData[activeSelectedDateKey].weekend = nextVal;
        if (nextVal) {
            calData[activeSelectedDateKey].halfDay = false;
        }
    }

    saveDataToLocalStorage();
    selectCalendarDateKey(activeSelectedDateKey);
}

if (typeof window !== 'undefined') {
    window.selectCalendarDateKey = selectCalendarDateKey;
    window.selectCalendarDay = selectCalendarDay;
    window.toggleCalendarType = toggleCalendarType;
    window.deleteHistoryRecord = deleteHistoryRecord;
    window.loadHistoryRecord = loadHistoryRecord;
    window.deleteCurrentMonth = deleteCurrentMonth;
}

function updateCalendarSummaryCounts() {
    const month = modalActiveMonth || state.currentMonth;
    const calData = getCalendarDataForMonth(month);
    const periodInfo = getPayPeriodInfo(month);

    let worked = 0, halfDays = 0, ot = 0, shift = 0, weekend = 0;
    periodInfo.days.forEach(dayObj => {
        const item = calData[dayObj.key];
        if (item) {
            if (item.worked) worked++;
            if (item.halfDay) halfDays++;
            if (item.ot) ot++;
            if (item.shift) shift++;
            if (item.weekend) weekend++;
        }
    });

    const sumW = document.getElementById('calSumWorked');
    const sumH = document.getElementById('calSumHalfDays');
    const sumOt = document.getElementById('calSumOt');
    const sumOtH = document.getElementById('calSumOtHours');
    const sumS = document.getElementById('calSumShift');
    const sumWe = document.getElementById('calSumWeekend');

    if (sumW) sumW.textContent = worked;
    if (sumH) sumH.textContent = halfDays;
    if (sumOt) sumOt.textContent = ot;
    if (sumOtH) sumOtH.textContent = `${(ot * 2.5).toFixed(1)} ชม.`;
    if (sumS) sumS.textContent = shift;
    if (sumWe) sumWe.textContent = weekend;
}

function syncCalendarToSliders() {
    const month = modalActiveMonth || state.currentMonth;
    const calData = getCalendarDataForMonth(month);
    const periodInfo = getPayPeriodInfo(month);

    let worked = 0, halfDays = 0, ot = 0, shift = 0, weekend = 0;
    periodInfo.days.forEach(dayObj => {
        const item = calData[dayObj.key];
        if (item) {
            if (item.worked) worked++;
            if (item.halfDay) halfDays++;
            if (item.ot) ot++;
            if (item.shift) shift++;
            if (item.weekend) weekend++;
        }
    });

    state.inputs.daysWorked = worked;
    state.inputs.halfDays = halfDays;
    state.inputs.otDays = ot;
    state.inputs.shiftDays = shift;
    state.inputs.weekendDays = weekend;
    state.currentMonth = month;

    if (!state.monthlyData[month]) {
        state.monthlyData[month] = createBlankMonthData();
    }
    state.monthlyData[month].inputs = cloneInputs(state.inputs);
    state.monthlyData[month].calendar = calData;

    populateMonthSelector(month);

    syncSlidersToState();
    calculateAll();
    updateChart();
    renderSalaryTable();
    updateSavingsGoalUI();
    updateTaxEstimatorUI();
    saveDataToLocalStorage();
    showToast(`ซิงก์ข้อมูลจากปฏิทินรอบ 16-15 (${month}) ลงการคำนวณเงินเดือนเรียบร้อย`, 'success');
}

function fillCalendarWeekdays() {
    const month = modalActiveMonth || state.currentMonth;
    const periodInfo = getPayPeriodInfo(month);
    const calData = getCalendarDataForMonth(month);

    periodInfo.days.forEach(dayObj => {
        const isWeekday = (dayObj.dayOfWeek >= 1 && dayObj.dayOfWeek <= 5);
        if (!calData[dayObj.key]) {
            calData[dayObj.key] = { worked: false, halfDay: false, ot: false, shift: false, weekend: false };
        }
        if (isWeekday) {
            calData[dayObj.key].worked = true;
            calData[dayObj.key].halfDay = false;
        }
    });

    saveDataToLocalStorage();
    renderCalendarModal(month);
    showToast('เติมวันทำงาน จ-ศ ของรอบตัดวิก 16-15 เรียบร้อย', 'success');
}

function clearCalendarMonth() {
    const month = modalActiveMonth || state.currentMonth;
    const periodInfo = getPayPeriodInfo(month);
    const calData = getCalendarDataForMonth(month);

    periodInfo.days.forEach(dayObj => {
        delete calData[dayObj.key];
    });

    activeSelectedDateKey = null;
    const editorEl = document.getElementById('calDayEditor');
    if (editorEl) editorEl.style.display = 'none';

    saveDataToLocalStorage();
    renderCalendarModal(month);
    showToast('ล้างข้อมูลปฏิทินของรอบนี้เรียบร้อย', 'success');
}

function initNewFeatures() {
    // 1. Calendar Modal Open & Close
    const openCalBtn = document.getElementById('openCalendarBtn');
    const mobileCalBtn = document.getElementById('mobileCalendarBtn');
    const calModal = document.getElementById('calendarModal');
    const closeCalBtn = document.getElementById('closeCalendarModalBtn');
    const cancelCalBtn = document.getElementById('cancelCalModalBtn');
    const saveCalSyncBtn = document.getElementById('saveCalendarSyncBtn');
    const fillWeekdaysBtn = document.getElementById('calFillWeekdaysBtn');
    const clearMonthBtn = document.getElementById('calClearMonthBtn');
    const closeDayEditorBtn = document.getElementById('closeDayEditorBtn');
    const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
    const calNextMonthBtn = document.getElementById('calNextMonthBtn');
    const calTodayBtn = document.getElementById('calTodayBtn');

    if (calPrevMonthBtn) {
        calPrevMonthBtn.addEventListener('click', () => {
            const currentM = modalActiveMonth || state.currentMonth;
            modalActiveMonth = getAdjacentPayPeriodMonth(currentM, -1);
            renderCalendarModal(modalActiveMonth);
            initLucideIcons();
        });
    }

    if (calNextMonthBtn) {
        calNextMonthBtn.addEventListener('click', () => {
            const currentM = modalActiveMonth || state.currentMonth;
            modalActiveMonth = getAdjacentPayPeriodMonth(currentM, 1);
            renderCalendarModal(modalActiveMonth);
            initLucideIcons();
        });
    }

    if (calTodayBtn) {
        calTodayBtn.addEventListener('click', () => {
            modalActiveMonth = getCurrentPayPeriodMonth();
            renderCalendarModal(modalActiveMonth);
            initLucideIcons();
        });
    }

    const showCalModal = () => {
        if (calModal) {
            modalActiveMonth = getCurrentPayPeriodMonth();
            calModal.classList.add('active');
            document.body.classList.add('modal-open');
            renderCalendarModal(modalActiveMonth);
            initLucideIcons();
        }
    };
    const hideCalModal = () => {
        if (calModal) {
            calModal.classList.remove('active');
            if (!document.querySelector('.modal.active')) {
                document.body.classList.remove('modal-open');
            }
        }
    };

    if (openCalBtn) openCalBtn.addEventListener('click', showCalModal);
    if (mobileCalBtn) mobileCalBtn.addEventListener('click', showCalModal);
    if (closeCalBtn) closeCalBtn.addEventListener('click', hideCalModal);
    if (cancelCalBtn) cancelCalBtn.addEventListener('click', hideCalModal);
    if (fillWeekdaysBtn) fillWeekdaysBtn.addEventListener('click', fillCalendarWeekdays);
    if (clearMonthBtn) clearMonthBtn.addEventListener('click', clearCalendarMonth);

    if (closeDayEditorBtn) {
        closeDayEditorBtn.addEventListener('click', () => {
            const editorEl = document.getElementById('calDayEditor');
            if (editorEl) editorEl.style.display = 'none';
            activeSelectedDateKey = null;
            renderCalendarModal();
        });
    }

    if (saveCalSyncBtn) {
        saveCalSyncBtn.addEventListener('click', () => {
            syncCalendarToSliders();
            hideCalModal();
        });
    }

    // Toggle button listeners in Day Editor
    const dayToggles = [
        { id: 'toggleDayWork', type: 'worked' },
        { id: 'toggleDayHalfDay', type: 'halfDay' },
        { id: 'toggleDayOt', type: 'ot' },
        { id: 'toggleDayShift', type: 'shift' },
        { id: 'toggleDayWeekend', type: 'weekend' }
    ];

    dayToggles.forEach(({ id, type }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleCalendarType(type);
            });
        }
    });

    // 2. Savings Config in Settings
    const savingsInput = document.getElementById('setSavingsTargetValue');
    const pillPercent = document.getElementById('pillSavingsPercent');
    const pillFixed = document.getElementById('pillSavingsFixed');
    const inputPrefix = document.getElementById('savingsInputPrefix');

    if (!state.config.savings) {
        state.config.savings = { ...DEFAULT_SAVINGS_CONFIG };
    }

    if (savingsInput) {
        savingsInput.value = state.config.savings.targetValue;
        savingsInput.addEventListener('input', (e) => {
            state.config.savings.targetValue = Number(e.target.value) || 0;
            saveDataToLocalStorage();
            updateSavingsGoalUI();
        });
    }

    if (pillPercent && pillFixed) {
        pillPercent.addEventListener('click', () => {
            pillPercent.classList.add('active');
            pillFixed.classList.remove('active');
            state.config.savings.mode = 'percent';
            if (inputPrefix) inputPrefix.textContent = '%';
            saveDataToLocalStorage();
            updateSavingsGoalUI();
        });

        pillFixed.addEventListener('click', () => {
            pillFixed.classList.add('active');
            pillPercent.classList.remove('active');
            state.config.savings.mode = 'fixed';
            if (inputPrefix) inputPrefix.textContent = '฿';
            saveDataToLocalStorage();
            updateSavingsGoalUI();
        });
    }

    // 3. Tax Deductions Inputs
    if (!state.config.tax) {
        state.config.tax = { ...DEFAULT_TAX_CONFIG };
    }

    const pvdInp = document.getElementById('taxPvdInput');
    const insInp = document.getElementById('taxInsuranceInput');
    const homeInp = document.getElementById('taxHomeLoanInput');

    if (pvdInp) {
        pvdInp.value = state.config.tax.customPvd || 0;
        pvdInp.addEventListener('input', (e) => {
            state.config.tax.customPvd = Number(e.target.value) || 0;
            saveDataToLocalStorage();
            updateTaxEstimatorUI();
        });
    }
    if (insInp) {
        insInp.value = state.config.tax.lifeInsurance || 0;
        insInp.addEventListener('input', (e) => {
            state.config.tax.lifeInsurance = Number(e.target.value) || 0;
            saveDataToLocalStorage();
            updateTaxEstimatorUI();
        });
    }
    if (homeInp) {
        homeInp.value = state.config.tax.homeLoanInterest || 0;
        homeInp.addEventListener('input', (e) => {
            state.config.tax.homeLoanInterest = Number(e.target.value) || 0;
            saveDataToLocalStorage();
            updateTaxEstimatorUI();
        });
    }

    updateSavingsGoalUI();
    updateTaxEstimatorUI();
}
