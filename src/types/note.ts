export type NoteSourceType = 'handwritten' | 'audio' | 'pdf' | 'text';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface SmartNote {
  id: string;
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
