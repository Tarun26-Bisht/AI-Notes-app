import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Trophy,
  BookOpen,
  Sliders,
  Clock,
  Layers,
  AlertCircle,
  Check,
  ChevronRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { SmartNote, QuizQuestion, QuizAttempt } from '../types/note';

interface QuizPracticeViewProps {
  notes: SmartNote[];
  authToken: string | null;
  onNoteUpdated: (updatedNote: SmartNote) => void;
  onOpenNoteDetail: (note: SmartNote) => void;
}

export const QuizPracticeView: React.FC<QuizPracticeViewProps> = ({
  notes,
  authToken,
  onNoteUpdated,
  onOpenNoteDetail
}) => {
  // Tabs: 'hub' (browse & launch), 'upload' (upload PDF and generate), 'quiz' (taking quiz)
  const [activeTab, setActiveTab] = useState<'hub' | 'upload'>('hub');

  // Currently active quiz session
  const [activeNote, setActiveNote] = useState<SmartNote | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  // Quiz Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [questionCountChoice, setQuestionCountChoice] = useState<number>(5);
  const [difficultyChoice, setDifficultyChoice] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PDF Upload State for direct quiz generation
  const [uploadFile, setUploadFile] = useState<{ base64: string; name: string; mimeType: string } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Notes that have a quiz generated already
  const notesWithQuiz = notes.filter((n) => n.quiz && n.quiz.length > 0);
  const pdfNotes = notes.filter((n) => n.sourceType === 'pdf');

  // Helper to start practicing a note's quiz
  const handleStartPractice = (note: SmartNote, quizToRun?: QuizQuestion[]) => {
    const questions = quizToRun || note.quiz;
    if (!questions || questions.length === 0) return;

    setActiveNote(note);
    setActiveQuiz(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsQuizFinished(false);
    setLatestAttempt(null);
    setErrorMessage(null);
  };

  // Helper to generate quiz for an existing note
  const handleGenerateForNote = async (note: SmartNote) => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep(`Analyzing "${note.title}" with Gemini 3.8 Flash...`);

    try {
      const res = await fetch(`/api/notes/${note.id}/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          questionCount: questionCountChoice,
          difficulty: difficultyChoice
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate quiz.');
      }

      const { quiz, note: updated } = await res.json();
      onNoteUpdated(updated);
      handleStartPractice(updated, quiz);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setErrorMessage(err?.message || 'Failed to generate quiz questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to upload PDF directly and generate Smart Note + Quiz
  const handleUploadAndGenerate = async () => {
    if (!uploadFile) {
      setErrorMessage('Please select or drop a PDF file first.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep('Reading PDF pages & extracting core academic syllabus...');

    try {
      setGenerationStep('Gemini 3.8 Flash is drafting study guide & generating high-yield MCQs...');

      const res = await fetch('/api/quiz/generate-from-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          sourceType: 'pdf',
          fileBase64: uploadFile.base64,
          mimeType: uploadFile.mimeType,
          fileName: uploadFile.name,
          questionCount: questionCountChoice,
          difficulty: difficultyChoice
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to process PDF into quiz.');
      }

      const { note: createdNote, quiz } = await res.json();
      onNoteUpdated(createdNote);
      setUploadFile(null);
      handleStartPractice(createdNote, quiz);
    } catch (err: any) {
      console.error('Error generating quiz from PDF:', err);
      setErrorMessage(err?.message || 'Failed to analyze PDF file and generate quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  // File selection handler
  const handleFileChange = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadFile({
        base64: reader.result as string,
        name: file.name,
        mimeType: file.type || 'application/pdf'
      });
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Option selection
  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (selectedAnswers[qIndex] !== undefined && instantFeedback) {
      // In instant feedback mode, answer is locked once picked
      return;
    }
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  // Finish and submit quiz
  const handleFinishQuiz = async () => {
    if (!activeQuiz || !activeNote) return;

    let correctCount = 0;
    activeQuiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / activeQuiz.length) * 100);

    const attempt: QuizAttempt = {
      id: `att_${Date.now()}`,
      timestamp: new Date().toISOString(),
      score: correctCount,
      totalQuestions: activeQuiz.length,
      percentage,
      userAnswers: selectedAnswers
    };

    setLatestAttempt(attempt);
    setIsQuizFinished(true);

    // Persist attempt to server
    try {
      const res = await fetch(`/api/notes/${activeNote.id}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(attempt)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          onNoteUpdated(data.note);
          setActiveNote(data.note);
        }
      }
    } catch (err) {
      console.error('Failed to save quiz attempt:', err);
    }
  };

  // ==========================================
  // VIEW: ACTIVE QUIZ IN PROGRESS
  // ==========================================
  if (activeQuiz && activeNote) {
    const totalQ = activeQuiz.length;
    const currentQ = activeQuiz[currentQuestionIndex];
    const userSelected = selectedAnswers[currentQuestionIndex];
    const isAnswered = userSelected !== undefined;
    const isCorrect = userSelected === currentQ.correctIndex;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Quiz Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                Exam Practice
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {activeNote.sourceType === 'pdf' ? 'PDF Exam Guide' : 'Smart Note'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-1">
              {activeNote.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Instant Feedback Toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={instantFeedback}
                onChange={(e) => setInstantFeedback(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 border-slate-300 cursor-pointer"
              />
              <span>Instant Explanations</span>
            </label>

            <button
              onClick={() => {
                if (confirm('Exit quiz session? Your current progress will be lost.')) {
                  setActiveQuiz(null);
                  setActiveNote(null);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>

        {/* ==========================================
            SUB-VIEW: QUIZ RESULTS / REPORT CARD
        ========================================== */}
        {isQuizFinished && latestAttempt ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-tr from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 mb-4">
              {latestAttempt.percentage >= 70 ? (
                <Trophy className="w-10 h-10" />
              ) : (
                <Award className="w-10 h-10" />
              )}
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
              {latestAttempt.percentage >= 80
                ? 'Outstanding Mastery!'
                : latestAttempt.percentage >= 60
                ? 'Well Done! Exam Ready'
                : 'Good Practice Attempt! Keep Revising'}
            </h3>

            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              You answered {latestAttempt.score} of {latestAttempt.totalQuestions} questions correctly from this document.
            </p>

            {/* Score Metric Cards */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-slate-500 block">Score</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {latestAttempt.score}/{latestAttempt.totalQuestions}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-slate-500 block">Percentage</span>
                <span className="text-2xl font-extrabold text-purple-600">
                  {latestAttempt.percentage}%
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-slate-500 block">Status</span>
                <span
                  className={`text-sm font-bold uppercase mt-1 block ${
                    latestAttempt.percentage >= 70 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {latestAttempt.percentage >= 70 ? 'Passed' : 'Needs Review'}
                </span>
              </div>
            </div>

            {/* Question by Question Review */}
            <div className="text-left mb-8 border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Question Review & Explanations</span>
              </h4>

              <div className="space-y-4">
                {activeQuiz.map((q, qIdx) => {
                  const userAns = selectedAnswers[qIdx];
                  const wasCorrect = userAns === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border ${
                        wasCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs font-bold text-slate-900">
                          {qIdx + 1}. {q.question}
                        </span>
                        {wasCorrect ? (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Missed</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <p>
                          <strong className="text-slate-800">Your choice:</strong>{' '}
                          {userAns !== undefined ? q.options[userAns] : 'Not answered'}
                        </p>
                        {!wasCorrect && (
                          <p>
                            <strong className="text-emerald-700">Correct choice:</strong>{' '}
                            {q.options[q.correctIndex]}
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-white/80 rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-slate-900 block mb-1">Pedagogical Explanation:</strong>
                        {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setCurrentQuestionIndex(0);
                  setIsQuizFinished(false);
                  setLatestAttempt(null);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake This Quiz</span>
              </button>

              <button
                onClick={() => handleGenerateForNote(activeNote)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Generate Fresh Questions</span>
              </button>

              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setActiveNote(null);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Back to Quiz Hub
              </button>
            </div>
          </div>
        ) : (
          /* ==========================================
              ACTIVE QUESTION CARD
          ========================================== */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Progress Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-purple-700">
                Question {currentQuestionIndex + 1} of {totalQ}
              </span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                Concept: {currentQ.concept}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / totalQ) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6">
              {currentQ.question}
            </h3>

            {/* 4 MCQ Option Cards */}
            <div className="space-y-3 mb-6">
              {currentQ.options.map((optionText, optIdx) => {
                const optLetter = ['A', 'B', 'C', 'D'][optIdx];
                const isSelected = userSelected === optIdx;
                const isThisCorrect = optIdx === currentQ.correctIndex;

                let cardStyle = 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/30';
                let pillStyle = 'bg-slate-100 text-slate-700 border-slate-300';

                if (isAnswered && instantFeedback) {
                  if (isThisCorrect) {
                    cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium';
                    pillStyle = 'bg-emerald-600 text-white border-emerald-600';
                  } else if (isSelected && !isThisCorrect) {
                    cardStyle = 'border-red-400 bg-red-50 text-red-950 font-medium';
                    pillStyle = 'bg-red-600 text-white border-red-600';
                  } else {
                    cardStyle = 'opacity-60 border-slate-200';
                  }
                } else if (isSelected) {
                  cardStyle = 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20';
                  pillStyle = 'bg-purple-600 text-white border-purple-600';
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                    className={`w-full p-4 text-left border rounded-xl flex items-start gap-3.5 transition-all cursor-pointer ${cardStyle}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg border font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${pillStyle}`}
                    >
                      {optLetter}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed flex-1 pt-0.5 text-slate-800">
                      {optionText}
                    </span>
                    {isAnswered && instantFeedback && isThisCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {isAnswered && instantFeedback && isSelected && !isThisCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback Explanation Box */}
            {isAnswered && instantFeedback && (
              <div
                className={`p-4 rounded-xl border mb-6 animate-in fade-in duration-200 ${
                  isCorrect
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-bold text-xs">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>Exam Insight: Option {['A', 'B', 'C', 'D'][currentQ.correctIndex]} is correct</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed opacity-95">{currentQ.explanation}</p>
              </div>
            )}

            {/* Navigation & Submission Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-3">
                {currentQuestionIndex < totalQ - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    disabled={!isAnswered}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishQuiz}
                    disabled={!isAnswered}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Complete Exam Quiz</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: QUIZ HUB & DIRECT PDF GENERATOR
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm border border-purple-800/40 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Exam Practice & Quiz Generator
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
            Master Your Upcoming Exams with AI Practice MCQs
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed mb-6">
            Upload any textbook chapter or syllabus PDF to auto-generate exam questions, or practice from notes you already transcribed. Every question features 4 realistic options and comprehensive explanations.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-purple-950 shadow-sm'
                  : 'bg-purple-800/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF & Generate Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('hub')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'hub'
                  ? 'bg-white text-purple-950 shadow-sm'
                  : 'bg-purple-800/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Practice from Saved Notes ({notes.length})</span>
            </button>
          </div>
        </div>

        {/* Decorative corner icon */}
        <GraduationCap className="absolute -bottom-8 -right-8 w-64 h-64 text-purple-500/10 pointer-events-none" />
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Loading overlay for generating quiz */}
      {isGenerating && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center text-purple-600 animate-pulse mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Generating Exam MCQs with Gemini 3.8 Flash
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {generationStep}
          </p>
          <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
            <div className="w-full h-full bg-purple-600 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* TAB 1: UPLOAD PDF & GENERATE EXAM QUIZ */}
      {!isGenerating && activeTab === 'upload' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Upload Syllabus or Lecture PDF
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gemini 3.8 Flash reads the PDF, transcribes topics into a student study guide, and synthesizes exam multiple-choice questions for practice.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileChange(file);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-500 bg-purple-50/50'
                  : uploadFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-purple-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                id="pdf-quiz-input"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
              />
              <label htmlFor="pdf-quiz-input" className="cursor-pointer block">
                {uploadFile ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-2" />
                    <p className="text-sm font-bold text-slate-900 truncate max-w-sm">
                      {uploadFile.name}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">PDF ready for examination synthesis</p>
                    <span className="text-[11px] text-slate-400 mt-2 underline">Click to choose a different PDF</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-12 h-12 text-purple-600 mb-2" />
                    <p className="text-sm font-bold text-slate-900">
                      Drop your course PDF here or click to browse
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Textbooks, lecture slides, research papers, or syllabus documents
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Quiz Configuration Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span>Number of Questions</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCountChoice(cnt)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        questionCountChoice === cnt
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {cnt} MCQs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  <span>Difficulty Level</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'easy', label: 'Basic' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'hard', label: 'Exam' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDifficultyChoice(lvl.id as any)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors capitalize cursor-pointer ${
                        difficultyChoice === lvl.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleUploadAndGenerate}
              disabled={!uploadFile}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Practice Exam & Start Practice</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PRACTICE FROM SAVED NOTES */}
      {!isGenerating && activeTab === 'hub' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Your Saved Notes & Study Guides
              </h2>
              <p className="text-xs text-slate-500">
                Generate or launch MCQ practice exams from any document in your vault.
              </p>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              <span className="font-bold text-purple-700">{notesWithQuiz.length}</span> with active quizzes
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">
                No notes found in your private dashboard
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Upload a PDF using the generator above or record a lecture memo to start practicing!
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Upload PDF Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => {
                const hasQuiz = note.quiz && note.quiz.length > 0;
                const bestAttempt = note.quizAttempts && note.quizAttempts.length > 0
                  ? note.quizAttempts.reduce((max, a) => (a.percentage > max.percentage ? a : max), note.quizAttempts[0])
                  : null;

                return (
                  <div
                    key={note.id}
                    className="bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            note.sourceType === 'pdf'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : note.sourceType === 'audio'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {note.sourceType.toUpperCase()}
                        </span>

                        {bestAttempt && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Trophy className="w-3 h-3" />
                            <span>High Score: {bestAttempt.percentage}%</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => onOpenNoteDetail(note)}
                        className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-purple-600 transition-colors cursor-pointer mb-2"
                      >
                        {note.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {note.executiveSummary || note.rawContent}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {hasQuiz ? `${note.quiz!.length} MCQs ready` : 'No quiz yet'}
                      </span>

                      <div className="flex items-center gap-2">
                        {hasQuiz ? (
                          <>
                            <button
                              onClick={() => handleGenerateForNote(note)}
                              title="Regenerate fresh questions"
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleStartPractice(note)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Practice Exam</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGenerateForNote(note)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-purple-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>Generate MCQs</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
