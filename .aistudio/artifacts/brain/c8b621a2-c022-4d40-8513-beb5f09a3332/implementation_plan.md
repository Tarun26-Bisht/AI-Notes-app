# AI-Powered Smart Notes Organizer

An intelligent document and audio knowledge workspace that ingests handwritten notes, PDFs, and voice recordings, transforming them into auto-tagged, summarized, and searchable knowledge assets with actionable insights.

### User Review & Critical Decisions

> [!IMPORTANT]
> Key architectural and functional decisions confirmed through interactive clarification:
> - **Full-stack Express & Document Database**: Built on a Node.js/Express server with persistent document storage on disk (`data/notes.json` with atomicity, indexing, and REST API endpoints), aligning directly with the MERN stack architecture while providing zero-friction instant local persistence.
> - **Tri-Modal Capture Hub**: Supports direct in-app microphone voice recording (with real-time audio visualization, waveform, and pause/resume), live device camera capture for handwritten physical notes/whiteboards, and drag-and-drop file upload for PDFs, images, and audio files.
> - **Core AI Intelligence Pipeline**: Powered by `@google/genai` with `gemini-3.8-flash` for multimodal handwritten OCR, document structure extraction, auto-tagging, executive summaries, and extracted action items with checkable state, along with instant semantic and keyword search.

- **Confirmed Decision 1**: Express backend with a persistent JSON document database and REST API for notes CRUD, tagging, and search operations.
- **Confirmed Decision 2**: Direct in-app microphone recording, webcam/phone camera capture, and file upload for images, audio, and PDFs.
- **Confirmed Decision 3**: Auto-tagging taxonomy, executive summaries, checkable action items, and multi-faceted search.

---

### 1. Overview & Core Concept

- **What It Does**: AI-Powered Smart Notes Organizer is a cohesive workspace where messy input materials—scrawled meeting notes on paper, lecture audio recordings, interview memos, and dense PDF reports—are converted into structured, high-value digital knowledge cards. The system transcribes audio, performs OCR on handwriting, summarizes key takeaways, suggests taxonomy tags, and isolates discrete action items.
- **Target Audience / Persona**: Knowledge workers, researchers, university students, product managers, and executives who juggle unstructured information from multiple daily sources and need a single, searchable repository.
- **Key Value**: Eliminates manual note organization and transcription. Users can snap a photo of a whiteboard or record a 5-minute meeting memo and instantly receive clean text, key bullet points, next actions, and auto-applied category tags.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Quick Capture & Ingestion**:
   - The user clicks "New Note" and chooses an input method:
     - **Voice Memo**: Click record to start an in-app microphone capture with a live waveform visualizer, elapsed timer, and play-back preview before submission.
     - **Handwritten / Photo**: Take a photo using the live camera interface with instant framing or drag-and-drop a photo/scan of handwritten notes or whiteboards.
     - **PDF Document**: Upload a PDF or document file for automated parsing and summarization.
     - **Text / Markdown**: Type or paste raw notes directly.
2. **AI Processing & Extraction**:
   - Upon upload or capture, the note enters a processing state with smooth visual progress indicators. The Express backend sends the multimodal content to Gemini 3.8 Flash, which outputs:
     - Extracted raw transcript / OCR text
     - Executive summary (key takeaways in concise bullet points)
     - Smart auto-tags (hierarchical categorization, subject labels)
     - Action items list (assignable and checkable tasks)
     - Sentiment / Priority indicator
3. **Workspace Exploration & Search**:
   - The primary dashboard presents a master-detail split or responsive grid:
     - Search bar with live query filtering by keyword, tag, note type, or date.
     - Interactive filter controls for quick switching between "All", "Voice", "Handwritten", "PDF", and "Action Items".
     - Tag drawer listing auto-generated tags with occurrence counts.
4. **Note Detail & Action Hub**:
   - Clicking a note opens a reading view displaying the original media (playable audio player, zoomable handwritten image preview, or PDF reference), the AI executive summary, extracted transcript, interactive action item checkboxes, and tag editor.
   - Users can edit content, add custom tags, check off action items, or export to Markdown/Clipboard.

#### Visual Identity & Theme
- **Aesthetic Direction**: Sophisticated, editorial productivity workspace inspired by modern knowledge tools (Linear, Notion, Craft). Clean lines, high typographic clarity, and purposeful spatial breathing room.
- **Color Palette & Mood**:
  - Canvas Neutral (60%): Crisp clean white (`#FFFFFF`) with cool neutral slate background (`#F8FAFC`) in light mode; deep slate (`#0B0F19`) in dark mode.
  - Structural Surfaces (30%): Pure white card surfaces (`#FFFFFF`) with subtle 1px slate borders (`border-slate-200 / border-slate-800`) and quiet typography (`#475569`).
  - Accent Budget (10%): Deep indigo / cobalt accent (`#3B82F6` and `#2563EB`) reserved for interactive action triggers, recording indicators, active filter buttons, and primary CTAs.
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` for crisp brand wordmark and section headers.
  - Body Prose: `DM Sans` or `Plus Jakarta Sans` for dense, comfortable reading of transcripts and summaries.
  - Metadata & Timers: Monospace figures (`font-mono tabular-nums`) for recording timestamps, word counts, and date badges.
- **Component Styling & Layout**:
  - Top Bar Contract: Clean 3-zone header with 1-line brand mark ("SmartNotes AI"), view switcher links ("All Notes", "Action Items", "Taxonomy", "Archive"), and a prominent "+ New Note" action button.
  - Zero-Pill Discipline: Metadata items (date, file type, duration) rendered with quiet inline text separated by subtle middots (`·`). Interactive filter controls styled as clean segmented buttons.
  - Single-Elevation Depth: Flat cards with hairline borders, eliminating card-in-card visual noise.

#### Interactive Feedback & Motion
- Smooth micro-interactions on button clicks and audio waveform canvas.
- Real-time audio recording timer and responsive frequency bar animations using Web Audio API.
- Non-blocking skeleton loaders during AI summarization with descriptive step indicators ("Transcribing audio...", "Extracting action items...").
- Toast notifications for saved notes, copied summaries, and completed tasks.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express Server with File-Backed Document Store**
  - *Chosen Approach*: An Express 4.x backend integrated with Vite in development and production (`server.ts`), utilizing an atomic JSON document store (`data/notes.json`) with in-memory cache and write queue.
  - *Why*: Provides complete MERN-style architecture (Node/Express backend, REST API, React frontend) with reliable, instant data persistence across page reloads without requiring external database provisioning or credentials.
  - *Alternatives Considered*: Firebase or Cloud SQL were evaluated; however, local document database ensures zero external credential blockers, instant evaluation in sandboxed environments, and rapid offline/local execution.
- **Decision 2: Server-Side Gemini 3.8 Flash Multimodal API**
  - *Chosen Approach*: All multimodal processing (audio base64, image base64, PDF data) is processed securely on the Express server using `@google/genai` with `gemini-3.8-flash` and structured JSON schemas (`responseSchema` with `Type.OBJECT`).
  - *Why*: Keeps the `GEMINI_API_KEY` completely protected on the server side, leverages Gemini 3.8 Flash's native audio transcription, visual OCR, and fast JSON extraction in a single unified API pipeline.
  - *Alternatives Considered*: Client-side Gemini calls would expose secrets and violate security architecture. Separate OCR libraries (like Tesseract.js) are slow, inaccurate for handwriting, and lack semantic understanding.
- **Decision 3: Integrated In-App Recording & Camera Capture**
  - *Chosen Approach*: HTML5 `MediaRecorder` API for high-quality audio capture (`audio/webm` / `audio/mp4`) with live `AudioContext` frequency analysis, plus `navigator.mediaDevices.getUserMedia` for instant camera snapshot capture with frame preview.
  - *Why*: Users can record quick meetings or capture physical notes directly from their laptop or mobile browser without needing third-party recorder apps.
  - *Alternatives Considered*: Upload-only requires cumbersome external recording tools and manual export/import steps.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Frontend (Client)                         │
│                                                                        │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │
│  │ TopNavBar        │  │ NoteFilterBar     │  │ SearchInput          │ │
│  │ (Brand, Links,   │  │ (All, Voice,      │  │ (Live semantic &     │ │
│  │  New Note CTA)   │  │  Handwritten, PDF)│  │  keyword filter)     │ │
│  └──────────────────┘  └───────────────────┘  └──────────────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────┐ │
│  │ Ingestion Modal & Hub               │  │ Notes Dashboard Grid     │ │
│  │ ├─ AudioRecorder (Waveform, Timer)  │  │ ├─ NoteCard (Unboxed     │ │
│  │ ├─ CameraCapture (Snapshot preview) │  │ │   metadata, tags,      │ │
│  │ ├─ FileDropzone (PDF, Image, Audio) │  │ │   action items count)  │ │
│  │ └─ ManualTextEditor                 │  │ └─ Empty / Skeleton View │ │
│  └─────────────────────────────────────┘  └──────────────────────────┘ │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ NoteDetailModal / Drawer                                          │ │
│  │ ├─ MediaViewer (Audio player, Image zoom, PDF link)               │ │
│  │ ├─ ExecutiveSummary (Markdown bullets, key insights)              │ │
│  │ ├─ ExtractedTranscript / OCR text view                            │ │
│  │ ├─ ActionItemsList (Checkable task items, completion persistence) │ │
│  │ └─ TagsEditor & Export (Copy, Download Markdown, Delete)          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP REST API (`/api/*`)
┌────────────────────────────────────▼───────────────────────────────────┐
│                       Express Backend (`server.ts`)                    │
│                                                                        │
│  ┌────────────────────────┐  ┌───────────────────────────────────────┐ │
│  │ Note Routes & CRUD     │  │ AI Service (`/api/ai/process-note`)   │ │
│  │ ├─ GET  /api/notes     │  │ ├─ Gemini 3.8 Flash Multimodal Engine │ │
│  │ ├─ POST /api/notes     │  │ ├─ Transcription + OCR Extraction     │ │
│  │ ├─ PUT  /api/notes/:id │  │ ├─ Executive Summary & Action Items   │ │
│  │ └─ DEL  /api/notes/:id │  │ └─ Smart Tagging Taxonomy Generator   │ │
│  └───────────┬────────────┘  └───────────────────┬───────────────────┘ │
│              │                                   │                     │
│  ┌───────────▼───────────────────────────────────▼───────────────────┐ │
│  │ Persistent Document Storage Engine (`server/db.ts`)               │ │
│  │ ├─ Atomic disk persistence (`data/notes.json`)                    │ │
│  │ ├─ Search indexing and filtering                                  │ │
│  │ └─ File assets storage (`uploads/`)                               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Google GenAI SDK
┌────────────────────────────────────▼───────────────────────────────────┐
│                       Google Gemini 3.8 Flash                          │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & Entities

```typescript
export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface SmartNote {
  id: string;
  title: string;
  sourceType: 'handwritten' | 'audio' | 'pdf' | 'text';
  originalFileName?: string;
  mediaUrl?: string; // base64 or stored asset url
  mediaMimeType?: string;
  rawContent: string; // Transcribed audio or OCR text
  executiveSummary: string; // Concise markdown summary
  actionItems: ActionItem[];
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string;
  sentiment?: 'positive' | 'neutral' | 'urgent';
  readingTimeMinutes?: number;
}
```

#### Interactive Component & State Mapping
- `IngestionModal`: Handles user selection among Mic, Camera, and File Upload.
  - Mic: Accesses `navigator.mediaDevices.getUserMedia({ audio: true })`, collects audio chunks, displays visual sound wave canvas, generates preview playback blob.
  - Camera: Accesses webcam stream, renders `<video>`, captures high-resolution canvas snapshot, displays retake/confirm view.
  - File Dropzone: Validates MIME types (`application/pdf`, `image/*`, `audio/*`), reads file contents as base64, displays file size and thumbnail.
  - Submit: Sends payload to `/api/ai/process-note` with loading state, receives structured note data, appends to database, closes modal, and highlights new note.
- `Dashboard`: Manages active filters (Source Type, Tag, Search Query). Real-time debounced search checks title, summary, transcript, and tags.
- `ActionItemTracker`: Dedicated view aggregating all action items across notes with filter by status (Pending, Done), enabling rapid triage without navigating into individual notes.
- `NoteDetailModal`: Allows inline editing of note title, toggling action item checkboxes with immediate persistence via `PUT /api/notes/:id`, adding/removing tags, and exporting to clipboard or markdown.
