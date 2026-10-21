import fs from 'fs';
import path from 'path';
import { SmartNote, TagCount, WorkspaceStats } from '../src/types/note.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'notes.json');

// Initial seed notes to provide rich instant domain state
const SEED_NOTES: SmartNote[] = [
  {
    id: 'note_seed_audio_1',
    title: 'Executive Sync: Q4 Distributed Architecture & Scalability',
    sourceType: 'audio',
    originalFileName: 'meeting-recording-sync.webm',
    mediaMimeType: 'audio/webm',
    rawContent: `Speaker 1 (Dev Lead): Alright, looking at our Q4 metrics, our database connection pooling is bottlenecking around 12,000 concurrent requests during market open. We need to implement read-replicas and tune the worker thread timeouts before Black Friday.
Speaker 2 (VP Product): What is the estimated engineering timeline for the replication cluster?
Speaker 1: About three weeks if we prioritize it over the analytics export refactor. We also need DevSecOps to audit the egress rules for our staging VPC.
Speaker 3 (QA): I will set up automated stress tests using k6 next Tuesday to benchmark the current vs proposed replica configurations.
Speaker 2: Let us freeze non-critical features on November 10th and schedule a post-deployment health review on November 15th.`,
    executiveSummary: `• **Bottleneck Identified**: Database connection pool saturates at ~12k concurrent connections during peak market opening.
• **Primary Mitigation**: Provision read-replica clusters and optimize worker thread timeout parameters before Black Friday.
• **Timeline & Trade-off**: 3-week implementation cycle; analytics export refactor deferred to Q1.
• **Testing Protocol**: Automated k6 load tests scheduled for Tuesday to validate cluster throughput.
• **Critical Dates**: Non-critical feature freeze on November 10; post-deployment health audit on November 15.`,
    actionItems: [
      { id: 'act_101', text: 'Provision read-replica cluster and tune worker thread timeouts', completed: false, priority: 'high' },
      { id: 'act_102', text: 'Request DevSecOps staging VPC egress audit', completed: true, priority: 'medium' },
      { id: 'act_103', text: 'Configure k6 automated load stress test scenarios', completed: false, priority: 'high' },
      { id: 'act_104', text: 'Establish production feature freeze checklist for Nov 10', completed: false, priority: 'low' }
    ],
    tags: ['Architecture', 'Database', 'Infrastructure', 'Performance', 'Q4-Planning'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    sentiment: 'urgent',
    estimatedReadTime: '2 min read'
  },
  {
    id: 'note_seed_hw_2',
    title: 'Whiteboard Strategy: Knowledge Graph & Hybrid Vector Index',
    sourceType: 'handwritten',
    originalFileName: 'whiteboard_session_graph_rag.jpg',
    mediaMimeType: 'image/jpeg',
    rawContent: `[OCR Transcription of Whiteboard Diagrams & Hand-drawn Flowcharts]
Node 1: User Ingestion (PDF / Audio / OCR)
   ↓
Node 2: Document Chunking (Recursive Splitter: 512 tokens, 64 token overlap)
   ↓
Node 3: Dual Pipeline:
   ├─ Semantic Embeddings → HNSW Vector Store (Cosine Distance metric)
   └─ Entity Extraction (NER) → Knowledge Graph Triples (Subject - Predicate - Object)
   ↓
Node 4: Hybrid Re-ranking Engine (BM25 lexical score * 0.4 + Dense Vector score * 0.6)
   ↓
Node 5: Context Assembly Window → LLM Inference Context
Key annotations in margin:
- "Keep latency under 180ms for hybrid search"
- "Audit token usage per query"
- "Benchmark Reciprocal Rank Fusion (RRF) against weighted average"`,
    executiveSummary: `• **Ingestion Architecture**: Outlines a dual-track indexing system combining recursive text chunking with simultaneous dense vector and knowledge graph extraction.
• **Hybrid Retrieval Pipeline**: Melds BM25 lexical keyword scoring with HNSW dense vector cosine similarity for resilient recall.
• **Performance Target**: Hard constraint to maintain total re-ranking and retrieval latency below 180ms.
• **Optimization Vector**: Team to benchmark Reciprocal Rank Fusion (RRF) against linear weighted summation.`,
    actionItems: [
      { id: 'act_201', text: 'Benchmark Reciprocal Rank Fusion against 0.4/0.6 weighted re-ranking', completed: false, priority: 'high' },
      { id: 'act_202', text: 'Implement 512-token recursive text chunker with 64-token overlap', completed: true, priority: 'medium' },
      { id: 'act_203', text: 'Add Prometheus metrics for end-to-end query latency breakdown', completed: false, priority: 'medium' }
    ],
    tags: ['Machine-Learning', 'Vector-Search', 'Architecture', 'Whiteboard'],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    sentiment: 'positive',
    estimatedReadTime: '3 min read'
  },
  {
    id: 'note_seed_pdf_3',
    title: 'Research Analysis: Multi-Modal Document Synthesis & Privacy Safeguards',
    sourceType: 'pdf',
    originalFileName: 'multimodal-notes-privacy-whitepaper.pdf',
    mediaMimeType: 'application/pdf',
    rawContent: `[Parsed PDF Content - Executive Research Abstract]
Section 1: Enterprise Multi-Modal Compliance
Modern knowledge management platforms must satisfy stringent data governance constraints, notably GDPR Article 17 (Right to Erasure) and HIPAA standards when processing unstructured patient or client voice recordings.
Section 2: On-Device & Zero-Retention Processing
We demonstrate that passing transient base64 payloads through secure server-side isolation proxies with zero-log guarantees reduces attack surface by 87% compared to third-party public cloud storage buckets.
Section 3: Structured Taxonomy Auto-tagging
Applying schema-constrained JSON extraction reduces tag hallucination and taxonomy fragmentation from 34.2% down to 2.1% across corporate knowledge bases.`,
    executiveSummary: `• **Governance Requirements**: Highlighting compliance imperatives (GDPR Art. 17 & HIPAA) across voice and handwritten document ingestion pipelines.
• **Security Architecture**: Transient server-side processing proxies eliminate third-party cloud data persistence vulnerabilities, curbing security surface by 87%.
• **Taxonomy Consistency**: Schema-constrained structured extraction drastically mitigates tag fragmentation (reduced to 2.1%).`,
    actionItems: [
      { id: 'act_301', text: 'Verify automated data retention policy for uploaded transient media', completed: false, priority: 'high' },
      { id: 'act_302', text: 'Ensure all AI API requests enforce structured JSON schemas', completed: true, priority: 'high' },
      { id: 'act_303', text: 'Draft enterprise data governance summary for security compliance review', completed: false, priority: 'low' }
    ],
    tags: ['Security', 'Privacy', 'Compliance', 'PDF-Report', 'Governance'],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    sentiment: 'neutral',
    estimatedReadTime: '4 min read'
  }
];

class NotesDatabase {
  private notes: SmartNote[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.notes = JSON.parse(raw);
      } else {
        this.notes = SEED_NOTES;
        this.persist();
      }
    } catch (err) {
      console.error('Error initializing database, using seed notes:', err);
      this.notes = SEED_NOTES;
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.notes, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting notes database:', err);
    }
  }

  public getAll(filter?: { search?: string; type?: string; tag?: string; archived?: boolean }): SmartNote[] {
    let list = [...this.notes];

    const targetArchived = filter?.archived === true;
    list = list.filter((n) => Boolean(n.isArchived) === targetArchived);

    if (filter?.type && filter.type !== 'all') {
      list = list.filter((n) => n.sourceType === filter.type);
    }

    if (filter?.tag) {
      const targetTag = filter.tag.toLowerCase();
      list = list.filter((n) => n.tags.some((t) => t.toLowerCase() === targetTag));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.executiveSummary.toLowerCase().includes(q) ||
          n.rawContent.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.actionItems.some((a) => a.text.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getById(id: string): SmartNote | undefined {
    return this.notes.find((n) => n.id === id);
  }

  public create(note: SmartNote): SmartNote {
    this.notes.unshift(note);
    this.persist();
    return note;
  }

  public update(id: string, updates: Partial<SmartNote>): SmartNote | null {
    const idx = this.notes.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    this.notes[idx] = {
      ...this.notes[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.notes[idx];
  }

  public toggleArchive(id: string): SmartNote | null {
    const note = this.getById(id);
    if (!note) return null;

    note.isArchived = !note.isArchived;
    note.updatedAt = new Date().toISOString();
    this.persist();
    return note;
  }

  public delete(id: string): boolean {
    const prevLen = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    const deleted = this.notes.length < prevLen;
    if (deleted) this.persist();
    return deleted;
  }

  public toggleActionItem(noteId: string, actionItemId: string): SmartNote | null {
    const note = this.getById(noteId);
    if (!note) return null;

    const action = note.actionItems.find((a) => a.id === actionItemId);
    if (!action) return null;

    action.completed = !action.completed;
    note.updatedAt = new Date().toISOString();
    this.persist();
    return note;
  }

  public getTags(): TagCount[] {
    const map = new Map<string, number>();
    for (const note of this.notes) {
      if (note.isArchived) continue;
      for (const tag of note.tags) {
        const normalized = tag.trim();
        if (normalized) {
          map.set(normalized, (map.get(normalized) || 0) + 1);
        }
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  public getStats(): WorkspaceStats {
    let totalActionItems = 0;
    let completedActionItems = 0;
    let audioNotes = 0;
    let handwrittenNotes = 0;
    let pdfNotes = 0;
    let textNotes = 0;
    let archivedNotes = 0;

    for (const note of this.notes) {
      if (note.isArchived) {
        archivedNotes++;
        continue;
      }

      if (note.sourceType === 'audio') audioNotes++;
      else if (note.sourceType === 'handwritten') handwrittenNotes++;
      else if (note.sourceType === 'pdf') pdfNotes++;
      else textNotes++;

      for (const item of note.actionItems) {
        totalActionItems++;
        if (item.completed) completedActionItems++;
      }
    }

    return {
      totalNotes: this.notes.length - archivedNotes,
      audioNotes,
      handwrittenNotes,
      pdfNotes,
      textNotes,
      archivedNotes,
      totalActionItems,
      completedActionItems,
      pendingActionItems: totalActionItems - completedActionItems
    };
  }
}

export const db = new NotesDatabase();
