export type NoteSourceType = 'handwritten' | 'audio' | 'pdf' | 'text';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // 4 multiple choice options
  correctIndex: number; // 0, 1, 2, or 3
  explanation: string;
  concept: string;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  userAnswers: Record<number, number>; // questionIndex -> selectedOptionIndex
}

export interface SmartNote {
  id: string;
  userId: string;
  title: string;
  sourceType: NoteSourceType;
  originalFileName?: string;
  mediaData?: string; // base64 data url or preview
  mediaMimeType?: string;
  rawContent: string; // Transcribed audio or OCR text
  executiveSummary: string; // Structured summary bullet points
  actionItems: ActionItem[];
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string;
  sentiment?: 'positive' | 'neutral' | 'urgent';
  estimatedReadTime?: string;
  isArchived?: boolean;
  quiz?: QuizQuestion[];
  quizAttempts?: QuizAttempt[];
}

export interface TagCount {
  name: string;
  count: number;
}

export interface WorkspaceStats {
  totalNotes: number;
  audioNotes: number;
  handwrittenNotes: number;
  pdfNotes: number;
  textNotes: number;
  archivedNotes: number;
  totalActionItems: number;
  completedActionItems: number;
  pendingActionItems: number;
}

