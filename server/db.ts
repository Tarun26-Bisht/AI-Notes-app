import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SmartNote, TagCount, WorkspaceStats, User, QuizQuestion, QuizAttempt } from '../src/types/note.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'notes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  avatarColor?: string;
  photoURL?: string;
  createdAt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

const DEFAULT_USERS: UserRecord[] = [
  (() => {
    const salt = 'seed_salt_alex_99182';
    return {
      id: 'usr_seed_alex',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      passwordHash: hashPassword('password123', salt),
      salt,
      avatarColor: '#2563EB',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
    };
  })(),
  (() => {
    const salt = 'seed_salt_sarah_11823';
    return {
      id: 'usr_seed_sarah',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      passwordHash: hashPassword('password123', salt),
      salt,
      avatarColor: '#7C3AED',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    };
  })()
];

// Initial seed notes for Alex Morgan (Lead Researcher)
const SEED_NOTES_ALEX: SmartNote[] = [
  {
    id: 'note_seed_audio_1',
    userId: 'usr_seed_alex',
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
    userId: 'usr_seed_alex',
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
    userId: 'usr_seed_alex',
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

// Initial seed notes for Sarah Chen (Student)
const SEED_NOTES_SARAH: SmartNote[] = [
  {
    id: 'note_seed_sarah_1',
    userId: 'usr_seed_sarah',
    title: 'CS 301 Study Guide: Self-Balancing AVL Trees & Rotations',
    sourceType: 'pdf',
    originalFileName: 'AVL_Trees_Lecture_Notes.pdf',
    mediaMimeType: 'application/pdf',
    rawContent: `[CS 301 Advanced Data Structures - Lecture 7 Excerpt]
Topic: AVL Tree Height Balancing
Definition: An AVL tree is a self-balancing Binary Search Tree where the difference between heights of left and right subtrees for any node cannot exceed 1.
Balance Factor = Height(Left Subtree) - Height(Right Subtree) in {-1, 0, 1}.
When an insertion violates balance:
1. Left-Left (LL) Case -> Perform single Right Rotation.
2. Right-Right (RR) Case -> Perform single Left Rotation.
3. Left-Right (LR) Case -> Left rotate child, then Right rotate parent.
4. Right-Left (RL) Case -> Right rotate child, then Left rotate parent.
Time Complexity: O(log N) for Search, Insert, and Delete.`,
    executiveSummary: `# 🎓 Master Student Study Guide: Self-Balancing AVL Trees

### 1. 🎯 Big-Picture Intuition & Core Overview
Unbalanced binary search trees can degrade to O(N) linear linked lists in worst-case scenarios. AVL trees guarantee logarithmic O(log N) worst-case time by enforcing height equilibrium through deterministic rotations.

### 2. 📖 Core Terminology & Key Definitions
• **Balance Factor (BF)**: The difference between the height of the left subtree and right subtree (BF = Height(L) - Height(R)). An AVL node is valid if BF is -1, 0, or +1.
• **Rebalancing Rotations**: O(1) pointer updates that restore height parity without violating binary search ordering.

### 3. 📚 In-Depth Rotation Breakdown
• **LL Case**: Node has BF = +2 and left child has BF >= 0. Fix via single right rotation.
• **RR Case**: Node has BF = -2 and right child has BF <= 0. Fix via single left rotation.
• **LR Case**: Zig-Zag shape. Left rotate left child, then right rotate unbalanced ancestor.
• **RL Case**: Zig-Zag shape. Right rotate right child, then left rotate unbalanced ancestor.

### 4. 💡 Exam Revision Tips & Common Pitfalls
• Remember to recalculate heights from the inserted leaf upward to the root. Stop rotating as soon as the first unbalanced ancestor is corrected.`,
    actionItems: [
      { id: 'act_s1', text: 'Practice drawing LR and RL double rotation steps for exam question 3', completed: false, priority: 'high' },
      { id: 'act_s2', text: 'Implement AVL tree node class in Python with height cache', completed: true, priority: 'medium' },
      { id: 'act_s3', text: 'Compare Red-Black Tree vs AVL Tree insertion overhead', completed: false, priority: 'low' }
    ],
    tags: ['Data-Structures', 'Computer-Science', 'Algorithms', 'Exam-Prep'],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    sentiment: 'positive',
    estimatedReadTime: '3 min read',
    quiz: [
      {
        id: 'q_avl_1',
        question: 'In an AVL tree, what is the defining condition for the Balance Factor (BF) of any node in the tree?',
        options: [
          'BF must be strictly equal to 0 for all internal nodes',
          'BF must be in the set {-1, 0, +1}, defined as Height(Left) - Height(Right)',
          'BF can be any value between -2 and +2 as long as the tree is complete',
          'BF is calculated as Count(Left Subtree) - Count(Right Subtree)'
        ],
        correctIndex: 1,
        explanation: 'An AVL tree is defined as a self-balancing binary search tree where the height difference between left and right subtrees (the balance factor) never exceeds 1 for any node, meaning BF must be -1, 0, or +1.',
        concept: 'AVL Invariant'
      },
      {
        id: 'q_avl_2',
        question: 'When a new node insertion causes a Left-Right (LR) imbalance at an ancestor node, which sequence of rotations restores AVL balance?',
        options: [
          'A single Right Rotation on the unbalanced ancestor',
          'A single Left Rotation on the unbalanced ancestor',
          'Left rotate the left child, followed by a Right rotate on the ancestor',
          'Right rotate the right child, followed by a Left rotate on the ancestor'
        ],
        correctIndex: 2,
        explanation: 'The LR (Left-Right) zig-zag condition is resolved by a double rotation: first a Left rotation on the left child to straighten the path into an LL line, followed by a Right rotation on the unbalanced parent/ancestor.',
        concept: 'Double Rotations'
      },
      {
        id: 'q_avl_3',
        question: 'What is the worst-case time complexity of searching, inserting, and deleting a key in an AVL tree containing N nodes?',
        options: [
          'O(N) because worst-case trees degenerate into a linked list',
          'O(log N) guaranteed due to strict height balancing invariants',
          'O(1) amortized using hashing-like tree pointers',
          'O(N log N) due to recursive subtree rebuilding'
        ],
        correctIndex: 1,
        explanation: 'Because the balance factor invariant guarantees that the height h of an AVL tree is strictly bounded by approximately 1.44 log2(N), operations bounded by tree height (Search, Insert, Delete) are strictly O(log N).',
        concept: 'Asymptotic Complexity'
      },
      {
        id: 'q_avl_4',
        question: 'Suppose node P has a Balance Factor of +2 and its left child L has a Balance Factor of +1. Which single rotation is required to rebalance node P?',
        options: [
          'Right Rotation on node P',
          'Left Rotation on node P',
          'Left Rotation on node L',
          'Double Left-Right Rotation'
        ],
        correctIndex: 0,
        explanation: 'When BF(P) = +2 and BF(L) >= 0, this is the classic Left-Left (LL) case. A single Right rotation rooted at node P restores height balance in O(1) pointer updates.',
        concept: 'Single Rotations'
      },
      {
        id: 'q_avl_5',
        question: 'Why are balance factors recalculated from the newly inserted leaf upward towards the root rather than top-down?',
        options: [
          'Because only ancestor nodes along the search-and-insert path can experience height changes',
          'Top-down traversal would cause stack overflow errors in recursion',
          'Because AVL trees cannot be traversed in a preorder fashion',
          'Leaf nodes always have a balance factor of +2'
        ],
        correctIndex: 0,
        explanation: 'An insertion only changes subtree heights along the direct ancestral path from the inserted leaf back up to the root. Retracing bottom-up allows immediate detection and localized O(1) rotation at the lowest unbalanced node.',
        concept: 'Tree Rebalancing Walk'
      }
    ]
  },
  {
    id: 'note_seed_sarah_2',
    userId: 'usr_seed_sarah',
    title: 'Study Session Voice Memo: Graph Traversal BFS vs DFS',
    sourceType: 'audio',
    originalFileName: 'graph-traversal-memo.webm',
    mediaMimeType: 'audio/webm',
    rawContent: `Speaker 1 (Sarah): Hey everyone, quick recap from Prof Davis's office hours today.
Breadth-First Search uses a FIFO queue. It explores all neighbors layer by layer and is guaranteed to find the shortest path on unweighted graphs.
Depth-First Search uses a LIFO stack (or recursion) and explores deep down a branch before backtracking. It's best for cycle detection, topological sorting, and solving mazes.
Remember for topological sort, in-degrees must be tracked in Kahn's algorithm!`,
    executiveSummary: `# 🎓 Lecture Study Notes: Graph Traversal Algorithms

### 1. 🎯 Overview & Comparison
• **BFS (Breadth-First Search)**: Uses a FIFO queue data structure. Optimal for unweighted shortest path queries.
• **DFS (Depth-First Search)**: Uses a call stack / recursion. Optimal for topological sort and cycle detection.

### 2. 📝 Active Recall Practice Quiz
Q: Which traversal guarantees the shortest path in an unweighted graph?
A: BFS, because it expands frontier uniformly level by level.`,
    actionItems: [
      { id: 'act_s4', text: 'Code Kahn algorithm for topological sort before Friday lab', completed: false, priority: 'high' },
      { id: 'act_s5', text: 'Memorize BFS vs DFS time complexity O(V + E)', completed: true, priority: 'medium' }
    ],
    tags: ['Algorithms', 'Graphs', 'Lecture-Notes', 'Study-Group'],
    createdAt: new Date(Date.now() - 86400000 / 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 / 2).toISOString(),
    sentiment: 'neutral',
    estimatedReadTime: '2 min read'
  }
];

class NotesDatabase {
  private notes: SmartNote[] = [];
  private users: UserRecord[] = [];
  // Token to userId map with expiry timestamp
  private sessions = new Map<string, { userId: string; expiresAt: number }>();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // 1. Initialize Users
      if (fs.existsSync(USERS_FILE)) {
        const rawUsers = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(rawUsers);
      } else {
        this.users = DEFAULT_USERS;
        this.persistUsers();
      }

      // 2. Initialize Notes
      if (fs.existsSync(DB_FILE)) {
        const rawNotes = fs.readFileSync(DB_FILE, 'utf-8');
        const loadedNotes: SmartNote[] = JSON.parse(rawNotes);
        
        // Ensure all loaded notes have a userId; if missing, assign to Alex
        this.notes = loadedNotes.map((n) => {
          if (!n.userId) {
            return { ...n, userId: 'usr_seed_alex' };
          }
          return n;
        });

        // Ensure Sarah has notes seeded if not present
        const sarahNotesCount = this.notes.filter((n) => n.userId === 'usr_seed_sarah').length;
        if (sarahNotesCount === 0) {
          this.notes.push(...SEED_NOTES_SARAH);
        }

        this.persistNotes();
      } else {
        this.notes = [...SEED_NOTES_ALEX, ...SEED_NOTES_SARAH];
        this.persistNotes();
      }
    } catch (err) {
      console.error('Error initializing database, using defaults:', err);
      this.users = DEFAULT_USERS;
      this.notes = [...SEED_NOTES_ALEX, ...SEED_NOTES_SARAH];
    }
  }

  private persistNotes() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.notes, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting notes database:', err);
    }
  }

  private persistUsers() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting users database:', err);
    }
  }

  // --- AUTHENTICATION METHODS ---

  public createUser(name: string, email: string, password: string): { user: User; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: UserRecord = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      avatarColor,
      createdAt: now
    };

    this.users.push(record);
    this.persistUsers();

    // Create a personalized starter note for the newly registered user
    const welcomeNote: SmartNote = {
      id: `note_welcome_${Date.now()}`,
      userId: userId,
      title: `Welcome to Your Private Smart Notes Hub, ${name.split(' ')[0]}!`,
      sourceType: 'text',
      rawContent: `Welcome to your private AI Smart Notes Workspace. Every document, meeting audio recording, and camera OCR scan you upload is strictly scoped to your private dashboard. No other users can see your notes or action items.`,
      executiveSummary: `# 🚀 Welcome to Your Personal Smart Notes Vault

### 1. 🔒 100% Private & Isolated
Your account has an isolated notes repository. Notes you capture via voice memos, camera OCR, PDF upload, or raw text are solely accessible when logged into this account.

### 2. ⚡ Multi-Modal Capabilities
• **Voice Recording (Mic)**: Verbatim lecture & meeting transcription with structured summaries.
• **Camera OCR**: Digitize handwritten whiteboard notes, sketches, and physical notebook pages.
• **PDF Analysis**: Transform academic textbooks, syllabi, and reports into revision guides with flashcards.

### 3. 🎯 What to Do Next
Check the action items below to get started!`,
      actionItems: [
        { id: `act_w1_${Date.now()}`, text: 'Record your first voice memo or upload a PDF document', completed: false, priority: 'high' },
        { id: `act_w2_${Date.now()}`, text: 'Organize notes using auto-generated topic tags', completed: false, priority: 'medium' },
        { id: `act_w3_${Date.now()}`, text: 'Test user isolation by switching between accounts or logging out', completed: true, priority: 'low' }
      ],
      tags: ['Welcome', 'Guide', 'Private-Vault', 'Getting-Started'],
      createdAt: now,
      updatedAt: now,
      sentiment: 'positive',
      estimatedReadTime: '1 min read'
    };

    this.notes.unshift(welcomeNote);
    this.persistNotes();

    const token = this.createSession(userId);
    return {
      user: this.sanitizeUser(record),
      token
    };
  }

  public authenticate(email: string, password: string): { user: User; token: string } | null {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!record || !record.salt || !record.passwordHash) return null;

    const hash = hashPassword(password, record.salt);
    if (hash !== record.passwordHash) return null;

    const token = this.createSession(record.id);
    return {
      user: this.sanitizeUser(record),
      token
    };
  }

  public createSession(userId: string): string {
    const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = Date.now() + 14 * 86400000; // 14 days
    this.sessions.set(token, { userId, expiresAt });
    return token;
  }

  public getUserByToken(token: string): User | null {
    const session = this.sessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    const record = this.users.find((u) => u.id === session.userId);
    if (!record) return null;

    return this.sanitizeUser(record);
  }

  public revokeToken(token: string): boolean {
    return this.sessions.delete(token);
  }

  public getUserById(id: string): User | null {
    const record = this.users.find((u) => u.id === id);
    if (!record) return null;
    return this.sanitizeUser(record);
  }

  public upsertGoogleUser(googleUser: { uid: string; email: string; name: string; photoURL?: string }): { user: User; token: string } {
    const normalizedEmail = googleUser.email.trim().toLowerCase();
    let record = this.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail || u.id === `usr_google_${googleUser.uid}`
    );

    if (record) {
      if (googleUser.name && (!record.name || record.name === 'Google User')) {
        record.name = googleUser.name;
      }
      if (googleUser.photoURL) {
        record.photoURL = googleUser.photoURL;
      }
      this.persistUsers();
    } else {
      const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2'];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];
      const userId = `usr_google_${googleUser.uid}`;
      const now = new Date().toISOString();

      record = {
        id: userId,
        name: googleUser.name || 'Google User',
        email: normalizedEmail,
        avatarColor,
        photoURL: googleUser.photoURL,
        createdAt: now
      };

      this.users.push(record);
      this.persistUsers();

      // Seed personalized starter notes for this Google-authenticated user
      const welcomeNote: SmartNote = {
        id: `note_welcome_${Date.now()}`,
        userId: userId,
        title: `Welcome to SmartNotes, ${googleUser.name.split(' ')[0] || 'Friend'}!`,
        sourceType: 'text',
        rawContent: `Your Google account (${googleUser.email}) is successfully linked. You now have full cloud-synced access to private study guides, audio lecture transcriptions, exam quizzes, and action item tracking.`,
        executiveSummary: `# 🎓 Welcome to Your Cloud-Synced Smart Notes Vault

### 1. 🔒 Verified Google Authentication
Your workspace is authenticated with your Google Account. All uploaded audio recordings, PDF notes, camera scans, and generated exam practice questions are strictly scoped to your profile.

### 2. ⚡ Multi-Modal Superpowers
• **Voice Memos**: Record lectures or meetings with instant Gemini synthesis.
• **Camera OCR**: Digitize physical notes, handwriting, and whiteboard diagrams.
• **Exam Practice Quizzes**: Generate university-grade MCQs directly from your notes.`,
        actionItems: [
          { id: `act_g1_${Date.now()}`, text: 'Upload your first lecture audio recording or PDF textbook chapter', completed: false, priority: 'high' },
          { id: `act_g2_${Date.now()}`, text: 'Generate an active recall practice quiz to test your retention', completed: false, priority: 'medium' },
          { id: `act_g3_${Date.now()}`, text: 'Organize your study cards using automated topic tags', completed: true, priority: 'low' }
        ],
        tags: ['Google-Account', 'Getting-Started', 'Exam-Prep', 'SmartNotes'],
        createdAt: now,
        updatedAt: now,
        sentiment: 'positive',
        estimatedReadTime: '1 min read'
      };

      this.notes.unshift(welcomeNote);
      this.persistNotes();
    }

    const token = this.createSession(record.id);
    return {
      user: this.sanitizeUser(record),
      token
    };
  }

  private sanitizeUser(record: UserRecord): User {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      avatarColor: record.avatarColor,
      photoURL: record.photoURL,
      createdAt: record.createdAt
    };
  }

  // --- USER-ISOLATED NOTE METHODS ---

  public getAll(filter: { userId: string; search?: string; type?: string; tag?: string; archived?: boolean }): SmartNote[] {
    // STRICT user-scoping: Only notes matching filter.userId are accessible!
    let list = this.notes.filter((n) => n.userId === filter.userId);

    const targetArchived = filter.archived === true;
    list = list.filter((n) => Boolean(n.isArchived) === targetArchived);

    if (filter.type && filter.type !== 'all') {
      list = list.filter((n) => n.sourceType === filter.type);
    }

    if (filter.tag) {
      const targetTag = filter.tag.toLowerCase();
      list = list.filter((n) => n.tags.some((t) => t.toLowerCase() === targetTag));
    }

    if (filter.search) {
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

  public getById(id: string, userId: string): SmartNote | undefined {
    return this.notes.find((n) => n.id === id && n.userId === userId);
  }

  public create(note: SmartNote): SmartNote {
    this.notes.unshift(note);
    this.persistNotes();
    return note;
  }

  public update(id: string, userId: string, updates: Partial<SmartNote>): SmartNote | null {
    const idx = this.notes.findIndex((n) => n.id === id && n.userId === userId);
    if (idx === -1) return null;

    this.notes[idx] = {
      ...this.notes[idx],
      ...updates,
      userId, // Immutable ownership
      updatedAt: new Date().toISOString()
    };
    this.persistNotes();
    return this.notes[idx];
  }

  public toggleArchive(id: string, userId: string): SmartNote | null {
    const note = this.getById(id, userId);
    if (!note) return null;

    note.isArchived = !note.isArchived;
    note.updatedAt = new Date().toISOString();
    this.persistNotes();
    return note;
  }

  public delete(id: string, userId: string): boolean {
    const prevLen = this.notes.length;
    this.notes = this.notes.filter((n) => !(n.id === id && n.userId === userId));
    const deleted = this.notes.length < prevLen;
    if (deleted) this.persistNotes();
    return deleted;
  }

  public toggleActionItem(noteId: string, actionItemId: string, userId: string): SmartNote | null {
    const note = this.getById(noteId, userId);
    if (!note) return null;

    const action = note.actionItems.find((a) => a.id === actionItemId);
    if (!action) return null;

    action.completed = !action.completed;
    note.updatedAt = new Date().toISOString();
    this.persistNotes();
    return note;
  }

  public saveQuiz(noteId: string, userId: string, quiz: QuizQuestion[]): SmartNote | null {
    const note = this.getById(noteId, userId);
    if (!note) return null;

    note.quiz = quiz;
    note.updatedAt = new Date().toISOString();
    this.persistNotes();
    return note;
  }

  public recordQuizAttempt(noteId: string, userId: string, attempt: QuizAttempt): SmartNote | null {
    const note = this.getById(noteId, userId);
    if (!note) return null;

    if (!note.quizAttempts) {
      note.quizAttempts = [];
    }
    note.quizAttempts.unshift(attempt);
    note.updatedAt = new Date().toISOString();
    this.persistNotes();
    return note;
  }

  public getTags(userId: string): TagCount[] {
    const map = new Map<string, number>();
    for (const note of this.notes) {
      if (note.userId !== userId || note.isArchived) continue;
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

  public getStats(userId: string): WorkspaceStats {
    let totalActionItems = 0;
    let completedActionItems = 0;
    let audioNotes = 0;
    let handwrittenNotes = 0;
    let pdfNotes = 0;
    let textNotes = 0;
    let archivedNotes = 0;

    for (const note of this.notes) {
      if (note.userId !== userId) continue;

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

    const activeNotes = this.notes.filter((n) => n.userId === userId && !n.isArchived).length;

    return {
      totalNotes: activeNotes,
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
