# System Architecture, Technical Specification & Implementation Roadmap
## Project: LawFirm ERP Cockpit & World Monitor Intelligence

This document outlines the master architecture, file directory hierarchy, 16-column database specs, and concrete, step-by-step **Implementation Roadmaps** for migrating and rebuilding the core modules: **World Monitor**, **Speech-to-Speech**, and the **Gmail-Style Trash Management System**.

---

## I. System Overview & Technical Stack

The LawFirm ERP Cockpit is built as a highly optimized, modular React application designed for high contrast dark-mode compliance and responsive operational handling.

* **Frontend:** React 18 / TypeScript
* **State & Sync Engine:** React local state paired with `LocalStorage` automated database sync.
* **UI & Styling:** Tailwind CSS (Theme base color: `#070d19` deep blue, Golden Amber `#e2b13c` for headers, and Rose Crimson `#e11d48` for warning indicators).
* **Charts & Geospatial Maps:** SVG Native Vectors combined with Recharts/D3.js.

---

## II. File Directory Structure

```text
workspace/
├── app/
│   ├── routes/
│   │   └── erp.tsx              # Core Unified Controller (6 Sub-systems)
│   ├── root.tsx                 # Base Layout, Stylesheets, Global Config
│   └── entry.client.tsx         # Client Hydration Entry Point
├── .speckit.constitution        # UI & Performance constraints for Spec-Kit
├── .speckit.specify             # Folder mapping definitions and schemas
├── package.json                 # Dependency manifests
└── system-architecture.md       # [This File] Complete Architectural Roadmap
```

---

## III. 16-Column Legal Dossier Data Schema

Every client case record inside the ERP table is structured around a strict 16-column database model:

```typescript
export interface CustomerDossier {
  index: number;                  // 1. Sequence number (STT)
  contractNumber: string;         // 2. Contract ID (Số HĐ) - Primary Key
  clientName: string;             // 3. Client Name (Tên KH)
  clientPhone: string;            // 4. Phone Number (Điện thoại KH)
  code: string;                   // 5. Case Identifier Code (Mã Code)
  dob: string;                    // 6. Date of Birth (Ngày sinh)
  remainingPrincipal: number;     // 7. Remaining Principal (Nợ gốc còn lại)
  overdueAmount: number;          // 8. Overdue Balance (Số tiền quá hạn)
  overdueDays: number;            // 9. Overdue Days (Số ngày quá hạn)
  overduePeriods: number;         // 10. Overdue Billing Cycles (Số kỳ quá hạn)
  monthlyPayment: number;         // 11. Monthly Repayment Installment (Khoản trả/tháng)
  lastRepaymentDate: string;      // 12. Last Repayment Date (Ngày trả gần nhất)
  documentType:                   // 13. Legal Department (Phân loại vụ việc)
    | "Tranh tụng" 
    | "Tư vấn Pháp luật" 
    | "Đại diện Ngoài tố tụng" 
    | "Pháp chế & Nội bộ" 
    | "Trọng tài & Hòa giải" 
    | "Ban Giám đốc";
  province: string;               // 14. Juridical Province (Tỉnh/Thành)
  region:                         // 15. Geographical Region (Vùng)
    | "Miền Bắc" 
    | "Miền Trung" 
    | "Miền Nam";
  loanStatus: string;             // 16. Loan Classification Status (Tình trạng nợ)
  status: "Đã làm" | "Chưa làm";  // Action status (Trạng thái tác nghiệp)
  tagType: "HS mới" | "HS giữ";   // Internal sorting tag
  priority: "BÌNH THƯỜNG" | "KHẨN CẤP" | "TRUNG BÌNH";
}
```

---

## IV. Core Integration Roadmaps

### ROADMAP 1: World Monitor Intelligence Radar
Objective: Implement a digital geopolitical risk monitor to evaluate maritime choke points and generate risk-prevention legal drafts.

```text
+---------------------------------------------------------------------------------+
| [PHASE 1: SVG Geospatial] ➔ [PHASE 2: CII Threat Parser] ➔ [PHASE 3: Ollama AI] |
+---------------------------------------------------------------------------------+
```

#### Phase 1: High-Contrast SVG Geospatial Rendering (Month 1)
* **Goal:** Render a lightweight, responsive vector world map highlighting core maritime shipping channels without heavy external mapping libraries.
* **Tasks:**
  1. Embed SVG map elements inside the container.
  2. Define high-risk coordinate pins (Strait of Hormuz, Suez Canal, South China Sea, Taiwan Strait).
  3. Apply Tailwind's `animate-ping` on coordinate nodes to simulate live satellite radar scans.
  4. Bind standard `onClick` events on map nodes to update state variable `selectedHotspotId`.

#### Phase 2: Live Threat Intelligence & CII Score Parser (Month 2)
* **Goal:** Create an analytical panel calculating Cumulative Instability Index (CII) and mapping affected client industries.
* **Tasks:**
  1. Design a database table schema for tracking live geopolitical news (Alerts Feed).
  2. Build a mathematical CII calculator based on threat multipliers.
  3. Create a lookup table associating hotspots with vulnerable industries (e.g., Straits of Hormuz ➔ Energy/Logistics/Maritime Insurance).

#### Phase 3: Ollama Local Offline AI Drafting Engine (Month 3)
* **Goal:** Allow legal counsel to generate ultra-confidential risk advisory briefs offline, keeping data strictly private on local servers.
* **Tasks:**
  1. Establish a local proxy endpoint `/api/ollama/draft` connecting to Ollama core server on Port `11434`.
  2. Create a select UI tab allowing users to choose active offline models (Llama3:8b, Qwen2.5:7b, Mistral).
  3. Program a legal drafting prompt template that injects selected hotspot threat factors and CII Scores to generate a standardized legal warning document.

---

### ROADMAP 2: Speech-to-Speech (S2S) Modular Voice Service
Objective: Build a real-time, low-latency legal communication pipeline translating, transcribing, and playing back verbal mediation sessions.

```text
+---------------------------------------------------------------------------------+
| [PHASE 1: Capture Stream] ➔ [PHASE 2: HF Pipeline S2S] ➔ [PHASE 3: Wave EQ Sync]|
+---------------------------------------------------------------------------------+
```

#### Phase 1: Web Audio Input & WebSocket Handler (Month 1)
* **Goal:** Capture high-fidelity raw audio signals directly from the user's microphone.
* **Tasks:**
  1. Request permission via `navigator.mediaDevices.getUserMedia` (declared in `metadata.json`).
  2. Initialize an `AudioContext` with a standardized 16000Hz sampling rate required by speech recognition engines.
  3. Instantiate a bi-directional WebSocket connecting client actions to the central translation gateway.
  4. Pack float-32 PCM chunks into binary payloads and stream them through the WebSocket connection.

#### Phase 2: Hugging Face Modular S2S Pipeline (Month 2)
* **Goal:** Implement the core voice agent pipeline (Voice Activity Detection ➔ Speech-to-Text ➔ LLM Translate ➔ Text-to-Speech) utilizing Hugging Face open-source models.
* **Tasks:**
  1. Integrate VAD (Voice Activity Detection) to detect pause/start signals, reducing empty packet transmissions.
  2. Route voice data to Whisper Large v3 for instant bóc băng transcription.
  3. Connect the output text to a translator LLM (e.g., Llama-3-Instruct) to translate language pairs (Vietnamese ➔ English).
  4. Send the final text response to TTS models (e.g., XTTS/MeloTTS) to synthesize a natural spoken response in the target language.

#### Phase 3: Audio Playback Sync & Active Equalizer Binding (Month 3)
* **Goal:** Stream raw audio bytes back to the browser and animate active visual Equalizers according to the spoken speech.
* **Tasks:**
  1. Handle incoming base64 audio byte chunks, converting them to AudioBlobs for immediate browser queue playback.
  2. Map an `analyserNode` to track voice decibel levels.
  3. Animate SVG vertical lines dynamically based on decibel readings to render a realistic, fluctuating wave equalizer representing the currently speaking legal agent (Mediator, Client, Judge).

---

### ROADMAP 3: Modular Trash & 16-Column Legal Dossier System
Objective: Deliver a secure, highly organized client database with robust recovery options mirroring Gmail’s visual trash lifecycle.

```text
+---------------------------------------------------------------------------------+
| [PHASE 1: 16-Col Store] ➔ [PHASE 2: Gmail Bulk Action] ➔ [PHASE 3: Auto Purge] |
+---------------------------------------------------------------------------------+
```

#### Phase 1: 16-Column Layout & State Sync Engine (Month 1)
* **Goal:** Implement the highly structured tabular screen featuring fixed (sticky) left columns and state synchronization.
* **Tasks:**
  1. Build the HTML table using CSS rules (`min-w-[2100px]`) and Tailwind classes to establish horizontal scrolling.
  2. Style columns 1 (Checkbox), 2 (STT), 3 (Số HĐ), and 4 (Tên KH) with sticky properties (`sticky left-0 bg-[#070e1b] z-10`) to lock them during horizontal scrolling.
  3. Map React state modifications to an auto-saving wrapper that writes states directly into the browser's `LocalStorage` to avoid server disk lock issues.

#### Phase 2: Gmail-Style Bulk Action Interface (Month 2)
* **Goal:** Replicate Gmail's multi-select check-box system and operational bulk action header.
* **Tasks:**
  1. Put a master checkbox on the table header to select/deselect all currently filtered records.
  2. Render a persistent Gmail-Style Bulk Action Banner when one or more checkboxes are checked.
  3. Display action buttons within the banner:
     * In Active view: *"Move to Trash"* (deletes records and pushes them into the trash bin).
     * In Trash view: *"Restore selected files"* (moves records back to the main DB) and *"Delete permanently"*.

#### Phase 3: Gmail Warnings, Empty State & Auto-Purge Lifecycle (Month 3)
* **Goal:** Inform users of data retention lifecycles and safely remove hard-deleted records.
* **Tasks:**
  1. Design a high-contrast warn banner at the top of the Trash view: *"Hồ sơ nằm trong Thùng rác quá 30 ngày sẽ tự động bị xóa vĩnh viễn"*.
  2. Add an *"Empty Trash Now"* button that clears the entire deleted array after a safety modal confirmation pops up.
  3. Program a date check script: if `deletedTimestamp - currentTimestamp > 30 days`, automatically filter out and remove those dossiers permanently.
