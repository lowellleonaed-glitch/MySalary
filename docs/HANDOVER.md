# 📋 เอกสารส่งมอบงานและคู่มือพัฒนาต่อ (Developer Handover Guide)
**โครงการ:** SalaryHub (ระบบบันทึกและคำนวณรายรับ-รายจ่ายเงินเดือน & กะ/OT/ภาษี/PWA)  
**วันที่จัดทำ:** สิงหาคม 2569 (August 2026)  
**เวอร์ชัน:** 1.0.0  
**สถานะโปรเจกต์:** พร้อมใช้งาน (Production Ready) & มีชุดทดสอบ Regression ครอบคลุม  

---

## 🎯 1. ภาพรวมของโปรเจกต์ (Project Overview)

**SalaryHub** คือเว็บแอปพลิเคชัน Single Page Application (SPA) ที่ทำงานแบบ **Client-Side 100% (No Backend Required)** พร้อมรองรับ **PWA (Progressive Web App)** สามารถติดตั้งลงบนมือถือ/แท็บเล็ตและใช้งานแบบออฟไลน์ได้

### วัตถุประสงค์หลักของระบบ:
1. **คำนวณรายรับเงินเดือนแบบละเอียด:** รองรับฐานเงินเดือน, อัตราจ้างรายวัน, ค่ากะดึก, ค่าล่วงเวลา (OT 1.5 เท่า / ชม.), ค่าอาหารเช้า, ค่าเดินทาง/น้ำมัน, เบี้ยขยัน, ค่าเป้าหมาย และค่าอาหารโอที
2. **รองรับรอบเงินเดือนแบบ 16 ถึง 15 (Pay Period Auto-Sync):** มีระบบปฏิทินบันทึกกะ/OT รายวัน ที่ผูกกับรอบตัดวิก 16 ของเดือนก่อน - 15 ของเดือนปัจจุบัน พร้อมปุ่มซิงก์ข้อมูลเข้าสูตรคำนวณอัตโนมัติ
3. **คำนวณการลาครึ่งวัน (Half-Day Leave):** หักฐานเงินเดือนครึ่งวัน แต่ยังได้รับค่าอาหารเช้าและค่าเดินทางเต็มวันตามระเบียบบริษัท (ไม่ได้รับค่าเป้าหมายและค่าอาหารโอที)
4. **คำนวณหักประกันสังคม & ภาษี ภ.ง.ด.91:** คำนวณประกันสังคมตามเพดาน และประมาณการภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (Progressive Tax Brackets)
5. **บันทึกรายจ่าย & วางแผนเป้าหมายการเงิน (Savings Goal Tracker):** บันทึกค่าใช้จ่ายแยกหมวดหมู่ ติดตามสัดส่วนเงินคงเหลือ และคำนวณระยะเวลาในการเก็บเงินตามเป้าหมาย
6. **ความปลอดภัย & ความเป็นส่วนตัว (Privacy & PIN Lock):** ล็อกหน้าจอด้วยรหัส PIN (SHA-256 Hashing) พร้อมระบบ Auto-Lock และเก็บข้อมูลทั้งหมดใน `localStorage` ฝั่งผู้ใช้ ไม่มีการส่งข้อมูลขึ้นเซิร์ฟเวอร์ภายนอก

---

## 🏗️ 2. โครงสร้างไฟล์และสถาปัตยกรรมระบบ (File Structure & Architecture)

```
deploy-6a834133dfb83bf6e3845e86/
├── index.html                   # ไฟล์หน้าจอหลัก (SPA Tabs, Modals, PIN Overlay, Responsive Layout)
├── app.js                       # Logic หลักของระบบ (State Management, Payroll Engine, UI Binding, Storage)
├── style.css                    # CSS Design System (Dark/Light Theme, Responsive, Animations, Glassmorphism)
├── sw.js                        # Service Worker สำหรับ Caching ไฟล์ และรองรับ Offline PWA
├── manifest.json                # PWA Manifest (Icons, Theme Colors, Standalone display)
├── package.json                 # Scripts สำหรับ Dev Server (npm run dev) และการรัน Test (npm test)
│
├── icons/                       # ไอคอน PWA ทุกขนาด (192x192, 512x512, apple-touch-icon, svg)
│   ├── icon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── scripts/                     # Scripts สำหรับ Generate PWA Icons
│   ├── generate-icons.js
│   └── generate-icons.py
│
├── docs/                        # เอกสาร Design Spec, Plans และ HANDOVER.md
│   ├── HANDOVER.md
│   └── superpowers/
│       ├── specs/               # ข้อกำหนดการออกแบบระบบ
│       └── plans/               # แผนการพัฒนาแบบละเอียด
│
├── data/                        # ข้อมูลและไฟล์ Excel สำหรับอ้างอิง
│   ├── excel_data.txt           # ข้อมูลตัวอย่างสำหรับอ้างอิงสูตรคำนวณ
│   └── เงินเดือน.xlsx          # ไฟล์ Excel ต้นฉบับที่ใช้ถอดสูตรคำนวณเงินเดือน
│
└── tests/                       # ชุดทดสอบ Automated Tests
    ├── phase1-regression.test.js
    ├── phase2-regression.test.js
    ├── phase2-dataflow.test.js
    ├── phase3-regression.test.js
    ├── phase3-dataflow.test.js
    ├── delete-expense-regression.test.js
    ├── expense-input-focus-regression.test.js
    ├── pwa-pin-regression.test.js
    └── new-features.test.js
```

---

## ⚙️ 3. เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ | รายละเอียด |
| :--- | :--- | :--- |
| **Core Frontend** | HTML5, Vanilla JavaScript (ES6+), CSS3 | ทำงานเร็ว โหลดไว ไม่มี overhead จาก framework |
| **Icons** | Lucide Icons (CDN) | ไอคอนมินิมอล โมเดิร์น คมชัด |
| **Chart Library** | Chart.js (CDN) | ดังกราฟแท่งและกราฟโดนัทแสดงสัดส่วนรายรับ-รายจ่าย |
| **Offline / PWA** | Service Worker + Cache API | รองรับการทำงานแบบออฟไลน์ และติดตั้งลงหน้าโฮม |
| **Security** | Web Crypto API (SHA-256 Hashing) | ใช้ Hash รหัสผ่าน PIN ก่อนเก็บลง LocalStorage |
| **Testing** | Node.js Built-in Test Assertions | ไม่ต้องลง test runner ภายนอก รันผ่าน `node <test-file>` ได้ทันที |

---

## 🚀 4. วิธีการเริ่มโปรเจกต์และรันในเครื่อง (Getting Started)

### ความต้องการพื้นฐาน:
- ติดตั้ง **Node.js** (เวอร์ชัน 16 ขึ้นไป)

### ขั้นตอนการรัน Development Server:
```bash
# 1. ติดตั้ง dependencies (หรือใช้ npx ได้โดยตรง)
npm install

# 2. รัน Local Development Server
npm run dev
# หรือ
npm start
```
เปิดบราวเซอร์ที่: `http://localhost:3000`

### ขั้นตอนการรันชุดทดสอบ (Automated Regression Tests):
```bash
npm test
```
*ระบบจะรันการตรวจสอบสูตรคำนวณเงินเดือน, ปฏิทินรอบ 16-15, การลาครึ่งวัน, ระบบล็อก PIN, PWA Manifest, และการลบข้อมูลประวัติ*

---

## 🧮 5. กฎทางธุรกิจและสูตรคำนวณหลัก (Business Logic & Payroll Formulas)

ผู้ที่รับช่วงต่อควรเข้าใจสูตรคำนวณหลักใน `app.js` ดังนี้:

### 5.1 ฐานเงินเดือนและอัตราจ้างรายวัน
- **อัตราจ้างต่อวัน (`dailyRate`):** `baseSalary / baseDays` (เช่น `12,500 / 30 = 416.6667 บาท`)
- **กรณีลาครึ่งวัน (`halfDays`):** หักค่าจ้าง `halfDays * (dailyRate * 0.5)`  
  `baseWagePay = baseSalary - (halfDays * dailyRate * 0.5)`

### 5.2 เงินเพิ่มและเบี้ยเลี้ยง (Allowances)
- **ค่าอาหารเช้า (`breakfastPay`):** `(daysWorked + halfDays) * breakfastRate` *(ลาครึ่งวันได้รับ)*
- **ค่าเดินทาง/ค่าน้ำมัน (`travelPay`):** `(daysWorked + halfDays) * travelRate` *(ลาครึ่งวันได้รับ)*
- **ค่าเป้าหมาย (`targetPay`):** `daysWorked * targetRate` *(ลาครึ่งวัน **ไม่ได้** รับ)*
- **ค่าล่วงเวลา (`otPay`):** `otHours * (dailyRate / 8) * otMultiplier`
- **ค่าอาหารโอที (`otFoodPay`):** `(otDays + weekendDays) * otFoodRate`
- **ค่ากะดึก (`shiftPay`):** `shiftDays * shiftRate`

### 5.3 รายการหัก (Deductions)
- **ประกันสังคม (`socialSecurity`):** `MIN(baseSalary, 15000) * 5%` (สูงสุด 750 บาท หรือตามการตั้งค่า)
- **ภาษีหัก ณ ที่จ่าย / ประมาณการภาษี (Thai Tax Progressive ภ.ง.ด.91):**
  - รายได้สุทธิพึงประเมินต่อปี หักค่าใช้จ่ายส่วนตัว 50% (ไม่เกิน 100,000) และค่าลดหย่อนส่วนตัว 60,000
  - คิดภาษีขั้นบันได 0% - 35% แล้วหารเฉลี่ยเป็นรายเดือน

### 5.4 รอบปฏิทินเงินเดือน (16th-to-15th Pay Period Cycle)
- ปฏิทินทำงานของบริษัทตัดรอบทุกวันที่ **16 ของเดือนก่อนหน้า ถึงวันที่ 15 ของเดือนปัจจุบัน**
- ฟังก์ชัน `getCurrentPayPeriodMonth(date)` จะตรวจสอบ:
  - หากวันที่ปัจจุบัน **>= 16**: ปฏิทินจะเลือกให้เป็นรอบเดือนถัดไปอัตโนมัติ (เช่น วันที่ 17 ส.ค. จะเปิดรอบเดือน กันยายน 2569: 16 ส.ค. - 15 ก.ย.)
  - หากวันที่ปัจจุบัน **<= 15**: ปฏิทินจะเลือกเป็นรอบเดือนปัจจุบัน (เช่น วันที่ 5 ส.ค. จะเปิดรอบเดือน สิงหาคม 2569: 16 ก.ค. - 15 ส.ค.)

---

## 💾 6. โครงสร้างข้อมูลใน LocalStorage (Data Schema)

ข้อมูลทั้งหมดถูกจัดเก็บไว้ใน LocalStorage ภายใต้คีย์ `salary_hub_data` ในรูปแบบ JSON:

```json
{
  "currentMonth": "สิงหาคม 2569",
  "config": {
    "baseSalary": 12500,
    "baseDays": 30,
    "otMultiplier": 1.5,
    "shiftRate": 120,
    "breakfastRate": 30,
    "travelRate": 50,
    "targetRate": 100,
    "otFoodRate": 40,
    "socialSecurityRate": 0.05,
    "socialSecurityMax": 750,
    "providentFundRate": 0.00,
    "savingsTarget": 100000,
    "pinHash": "...",
    "pinEnabled": false,
    "autoLockMinutes": 5
  },
  "monthlyData": {
    "สิงหาคม 2569": {
      "inputs": {
        "daysWorked": 22,
        "halfDays": 1,
        "otDays": 10,
        "otHours": 25,
        "shiftDays": 8,
        "weekendDays": 2,
        "diligence": 500,
        "otherIncome": 0
      },
      "expenses": [
        {
          "id": "exp_1692500000",
          "title": "ค่าเช่าห้อง",
          "amount": 4000,
          "category": "fixed",
          "date": "2026-08-01"
        }
      ],
      "calendar": {
        "2026-07-16": { "worked": true, "halfDay": false, "ot": true, "otHours": 2.5, "shift": false }
      }
    }
  }
}
```

---

## 🛠️ 7. สิ่งที่ควรทำต่อ / Roadmap ที่แนะนำสำหรับผู้พัฒนารายต่อไป

หากมีเวลาหรือต้องการอัปเกรดความสามารถของระบบ แนะนำให้พิจารณาหัวข้อต่อไปนี้:

### 1. การส่งออกเอกสาร (Export Features)
- [ ] เพิ่มการ Export ข้อมูลสลิปเงินเดือนเป็น **PDF (Payslip PDF Generation)** โดยใช้ไลบรารีอย่าง `html2pdf.js` หรือ `jspdf`
- [ ] เพิ่มการ Export/Import เป็นไฟล์ **Excel (.xlsx / .csv)** สำหรับนำไปใช้งานต่อกับโปรแกรมบัญชี

### 2. การซิงก์ข้อมูลข้ามอุปกรณ์ (Cloud Sync / Backup)
- [ ] เพิ่มตัวเลือกให้ผู้ใช้สามารถซิงก์ข้อมูลผ่าน **Google Drive API** หรือ **iCloud / WebDAV** โดยไม่ต้องสร้าง Backend ของตัวเอง เพื่อรักษาความเป็นส่วนตัวของผู้ใช้ (Privacy-First)
- [ ] เพิ่มการสแกน QR Code สำหรับส่งต่อข้อมูล (Transfer Data) ระหว่างโทรศัพท์เครื่องเก่าและเครื่องใหม่

### 3. ยกระดับระบบจัดการกะและการทำงาน (Shift Management)
- [ ] รองรับการตั้งเวลากะแบบกำหนดเองหลายกะ (เช่น กะเช้า, กะบ่าย, กะดึก, กะพิเศษ) พร้อมเรทค่ากะที่ต่างกัน
- [ ] ระบบแจ้งเตือนบันทึกเวลาทำงานรายวันผ่าน Web Push Notifications (PWA Notifications)

### 4. การจัดการภาษีขั้นสูง (Advanced Tax Planning)
- [ ] เพิ่มแบบฟอร์มกรอกรายการลดหย่อนภาษีเพิ่มเติม เช่น ดอกเบี้ยกู้บ้าน, ประกันชีวิต, ประกันสุขภาพ, กองทุน SSF / RMF / Thai ESG

---

## 🔒 8. การรักษาความปลอดภัย & ข้อควรระวัง (Security & Maintenance Notes)

1. **ห้ามเก็บ PIN แบบ Plain Text:** รหัส PIN ต้องผ่านการ Hash ด้วย `SHA-256` ก่อนบันทึกลง `config.pinHash` เสมอ
2. **การอัปเดต Service Worker (`sw.js`):** เมื่อมีการแก้ไขโค้ด `style.css` หรือ `app.js` ให้เปลี่ยนเลข `CACHE_NAME` ใน `sw.js` (เช่น `salaryhub-v1.1.0`) เพื่อให้ผู้ใช้ได้รับไฟล์เวอร์ชันล่าสุดทันที
3. **การทดสอบก่อน Deploy:** ทุกครั้งที่มีการแก้ไขสูตรคำนวณ ต้องรันคำสั่ง `npm test` เพื่อให้มั่นใจว่าไม่มี Regression ต่อสูตรคำนวณเดิม

---

## 📞 9. ผู้ดูแลและช่องทางติดต่อ
หากมีข้อสงสัยเกี่ยวกับ Business Logic หรือสูตรคำนวณ สามารถตรวจสอบเพิ่มเติมได้ที่:
- ไฟล์สเปก: `docs/superpowers/specs/2026-08-17-pay-period-sync-half-day-leave-design.md`
- ไฟล์ตัวอย่าง: `excel_data.txt` และ `เงินเดือน.xlsx`
