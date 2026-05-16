import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Question } from '../types';
import QuestionView from './QuestionView';
import { ChevronLeft, Loader2, Target, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  questionIds: string[];
  onExit: () => void;
  onCorrect: (questionId: string) => void;
}

export default function MistakeBankView({ questionIds, onExit, onCorrect }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadQuestions() {
      const qs: Question[] = [];
      for (const id of questionIds) {
        const qSnap = await getDoc(doc(db, 'questions', id));
        if (qSnap.exists()) {
          qs.push(qSnap.data() as Question);
        }
      }
      setQuestions(qs);
      setLoading(false);
    }
    loadQuestions();
  }, [questionIds]);

  const handleAnswer = (correct: boolean, timeTaken: number) => {
    if (correct) {
      onCorrect(questions[currentIndex].id);
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        // Finished the bank or just showing summary
      }
    }, 2000);
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
         <Loader2 className="w-12 h-12 text-neon-pink animate-spin" />
         <p className="text-neon-pink font-black tracking-widest uppercase italic">Rebuilding Logic Nodes...</p>
       </div>
     );
  }

  if (questions.length === 0 || currentIndex >= questions.length) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 p-12 card-glass border-neon-cyan/20">
        <div className="w-24 h-24 bg-neon-cyan/20 border border-neon-cyan rounded-full mx-auto flex items-center justify-center shadow-neon-cyan/30 shadow-2xl">
          <CheckCircle2 className="w-12 h-12 text-neon-cyan" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Logic Restored</h2>
          <p className="text-gray-400">All identified traps in the mirror bank have been analyzed and bypassed.</p>
        </div>
        <button onClick={onExit} className="w-full btn-primary">RETURN TO TERMINAL</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto flex justify-between items-center px-4">
        <button onClick={onExit} className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-white uppercase tracking-widest">
           <ChevronLeft className="w-4 h-4" /> Exit Review
        </button>
        <div className="text-xs font-black uppercase tracking-widest text-neon-pink">
          Bank Review: {currentIndex + 1} / {questions.length}
        </div>
      </div>
      
      <QuestionView 
        question={questions[currentIndex]} 
        onAnswer={handleAnswer} 
      />
    </div>
  );
}
