import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import { processNoteWithGemini, ProcessNoteInput, generateQuizWithGemini } from './server/ai.js';
import { SmartNote, User } from './src/types/note.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High body limit to accept audio/image base64 payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Custom Authenticated Request interface
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication enforcement middleware
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.user = user;
  next();
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/signup
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const authResult = db.createUser(name, email, password);
    res.status(201).json(authResult);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create account.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const authResult = db.authenticate(email, password);
    if (!authResult) {
      return res.status(401).json({ error: 'Invalid email address or password. Please try again.' });
    }

    res.json(authResult);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Login failed.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    db.revokeToken(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/demo-accounts
app.get('/api/auth/demo-accounts', (_req: Request, res: Response) => {
  res.json([
    {
      name: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123',
      role: 'Lead Researcher',
      description: 'Distributed systems & privacy whitepapers',
      avatarColor: '#2563EB'
    },
    {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      password: 'password123',
      role: 'CS Student',
      description: 'Data structures & graph algorithm lecture notes',
      avatarColor: '#7C3AED'
    }
  ]);
});

// ==========================================
// USER-ISOLATED SMART NOTES ROUTES
// ==========================================

// GET /api/notes
app.get('/api/notes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, type, tag, archived } = req.query;
    const userId = req.user!.id;

    const notes = db.getAll({
      userId,
      search: typeof search === 'string' ? search : undefined,
      type: typeof type === 'string' ? type : undefined,
      tag: typeof tag === 'string' ? tag : undefined,
      archived: archived === 'true'
    });
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id
app.get('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const note = db.getById(req.params.id, req.user!.id);
  if (!note) {
    return res.status(404).json({ error: 'Note not found in your private dashboard' });
  }
  res.json(note);
});

// POST /api/notes (Direct manual creation)
app.post('/api/notes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const userId = req.user!.id;

    const newNote: SmartNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: data.title || 'Untitled Note',
      sourceType: data.sourceType || 'text',
      originalFileName: data.originalFileName,
      mediaData: data.mediaData,
      mediaMimeType: data.mediaMimeType,
      rawContent: data.rawContent || '',
      executiveSummary: data.executiveSummary || '',
      actionItems: data.actionItems || [],
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      sentiment: data.sentiment || 'neutral',
      estimatedReadTime: data.estimatedReadTime || '1 min read'
    };

    const saved = db.create(newNote);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create note' });
  }
});

// PUT /api/notes/:id
app.put('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.update(req.params.id, req.user!.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Note not found in your private dashboard' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update note' });
  }
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = db.delete(req.params.id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Note not found in your private dashboard' });
    }
    res.json({ success: true, message: 'Note deleted from your dashboard' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete note' });
  }
});

// POST /api/notes/:id/archive (Toggle archive state)
app.post('/api/notes/:id/archive', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = db.toggleArchive(req.params.id, req.user!.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found in your private dashboard' });
    }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to toggle archive status' });
  }
});

// POST /api/notes/:id/regenerate (Re-process note with enhanced pedagogical student notes)
app.post('/api/notes/:id/regenerate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const note = db.getById(req.params.id, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found in your private dashboard' });
    }

    const aiResult = await processNoteWithGemini({
      sourceType: note.sourceType,
      fileBase64: note.mediaData,
      mimeType: note.mediaMimeType,
      fileName: note.originalFileName,
      textContent: note.rawContent
    });

    const updated = db.update(note.id, userId, {
      title: aiResult.title || note.title,
      executiveSummary: aiResult.executiveSummary,
      actionItems: aiResult.actionItems,
      tags: aiResult.tags,
      rawContent: aiResult.rawContent || note.rawContent,
      sentiment: aiResult.sentiment || note.sentiment,
      estimatedReadTime: aiResult.estimatedReadTime || note.estimatedReadTime
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Error regenerating note:', err);
    res.status(500).json({ error: err?.message || 'Failed to regenerate study notes' });
  }
});

// POST /api/notes/:id/action-items/:itemId/toggle
app.post('/api/notes/:id/action-items/:itemId/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const note = db.toggleActionItem(id, itemId, req.user!.id);
    if (!note) {
      return res.status(404).json({ error: 'Note or action item not found in your private dashboard' });
    }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to toggle action item' });
  }
});

// GET /api/tags
app.get('/api/tags', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const tags = db.getTags(req.user!.id);
    res.json(tags);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch tags' });
  }
});

// GET /api/stats
app.get('/api/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = db.getStats(req.user!.id);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch stats' });
  }
});

// POST /api/ai/process-note
app.post('/api/ai/process-note', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input: ProcessNoteInput = req.body;
    if (!input.sourceType) {
      return res.status(400).json({ error: 'sourceType is required (audio, handwritten, pdf, text)' });
    }

    const userId = req.user!.id;

    // Call Gemini 3.8 Flash multimodal API
    const aiResult = await processNoteWithGemini(input);

    // Save directly to the database with authenticated user ID
    const now = new Date().toISOString();
    const newNote: SmartNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      ...aiResult,
      createdAt: now,
      updatedAt: now
    };

    const saved = db.create(newNote);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Error in /api/ai/process-note:', err);
    res.status(500).json({
      error: err?.message || 'Failed to analyze note with Gemini AI'
    });
  }
});

// POST /api/notes/:id/quiz/generate (Generate exam practice MCQs for a specific note)
app.post('/api/notes/:id/quiz/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { questionCount = 5, difficulty = 'medium' } = req.body;

    const note = db.getById(id, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found in your private dashboard' });
    }

    const quiz = await generateQuizWithGemini({
      title: note.title,
      content: `${note.title}\n\n${note.executiveSummary}\n\n${note.rawContent}`,
      questionCount: Math.min(Math.max(questionCount, 3), 15),
      difficulty
    });

    const updated = db.saveQuiz(note.id, userId, quiz);
    res.json({ quiz, note: updated });
  } catch (err: any) {
    console.error('Error generating quiz for note:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate practice quiz' });
  }
});

// POST /api/notes/:id/quiz/submit (Record quiz practice score & attempt)
app.post('/api/notes/:id/quiz/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { score, totalQuestions, percentage, userAnswers } = req.body;

    const attempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      score: Number(score) || 0,
      totalQuestions: Number(totalQuestions) || 1,
      percentage: Number(percentage) || 0,
      userAnswers: userAnswers || {}
    };

    const updated = db.recordQuizAttempt(id, userId, attempt);
    if (!updated) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true, note: updated, attempt });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save quiz attempt' });
  }
});

// POST /api/quiz/generate-from-file (Direct PDF / document upload -> Smart Note + Exam Quiz)
app.post('/api/quiz/generate-from-file', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const input: ProcessNoteInput = req.body;
    const questionCount = Math.min(Math.max(Number(req.body.questionCount) || 5, 3), 15);
    const difficulty = req.body.difficulty || 'medium';

    if (!input.fileBase64 && !input.textContent) {
      return res.status(400).json({ error: 'Please provide a PDF or document file to generate quiz questions.' });
    }

    // 1. Process document with Gemini 3.8 Flash
    const aiResult = await processNoteWithGemini(input);

    // 2. Generate exam practice quiz with Gemini 3.8 Flash from synthesized note
    const quiz = await generateQuizWithGemini({
      title: aiResult.title,
      content: `${aiResult.title}\n\n${aiResult.executiveSummary}\n\n${aiResult.rawContent}`,
      questionCount,
      difficulty
    });

    // 3. Save as a new note with quiz attached
    const now = new Date().toISOString();
    const newNote: SmartNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      ...aiResult,
      quiz,
      quizAttempts: [],
      createdAt: now,
      updatedAt: now
    };

    const saved = db.create(newNote);
    res.status(201).json({ note: saved, quiz });
  } catch (err: any) {
    console.error('Error generating quiz from file:', err);
    res.status(500).json({ error: err?.message || 'Failed to process PDF and generate quiz' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Notes Organizer Server running at http://localhost:${PORT}`);
  });
}

startServer();
