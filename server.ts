import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import { processNoteWithGemini, ProcessNoteInput } from './server/ai.js';
import { SmartNote } from './src/types/note.js';

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

// GET /api/notes
app.get('/api/notes', (req: Request, res: Response) => {
  try {
    const { search, type, tag, archived } = req.query;
    const notes = db.getAll({
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
app.get('/api/notes/:id', (req: Request, res: Response) => {
  const note = db.getById(req.params.id);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  res.json(note);
});

// POST /api/notes (Direct manual creation)
app.post('/api/notes', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    const newNote: SmartNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
app.put('/api/notes/:id', (req: Request, res: Response) => {
  try {
    const updated = db.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update note' });
  }
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete note' });
  }
});

// POST /api/notes/:id/archive (Toggle archive state)
app.post('/api/notes/:id/archive', (req: Request, res: Response) => {
  try {
    const note = db.toggleArchive(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to toggle archive status' });
  }
});

// POST /api/notes/:id/regenerate (Re-process note with enhanced pedagogical student notes)
app.post('/api/notes/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const note = db.getById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const aiResult = await processNoteWithGemini({
      sourceType: note.sourceType,
      fileBase64: note.mediaData,
      mimeType: note.mediaMimeType,
      fileName: note.originalFileName,
      textContent: note.rawContent
    });

    const updated = db.update(note.id, {
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
app.post('/api/notes/:id/action-items/:itemId/toggle', (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const note = db.toggleActionItem(id, itemId);
    if (!note) {
      return res.status(404).json({ error: 'Note or action item not found' });
    }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to toggle action item' });
  }
});

// GET /api/tags
app.get('/api/tags', (_req: Request, res: Response) => {
  try {
    const tags = db.getTags();
    res.json(tags);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch tags' });
  }
});

// GET /api/stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch stats' });
  }
});

// POST /api/ai/process-note
app.post('/api/ai/process-note', async (req: Request, res: Response) => {
  try {
    const input: ProcessNoteInput = req.body;
    if (!input.sourceType) {
      return res.status(400).json({ error: 'sourceType is required (audio, handwritten, pdf, text)' });
    }

    // Call Gemini 3.8 Flash multimodal API
    const aiResult = await processNoteWithGemini(input);

    // Save directly to the database
    const now = new Date().toISOString();
    const newNote: SmartNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
