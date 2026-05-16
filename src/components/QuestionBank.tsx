import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchExternalQuestions, enrichQuestionWithAI } from "../services/questionService";
import { Question } from "../types";
import { Zap, ChevronLeft, ChevronRight, Loader2, Target, AlertCircle, Sparkles } from "lucide-react";

interface Props {
  onExit: () => void;
}

export default function QuestionBank({ onExit }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [section, setSection] = useState("math");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);

  async function handleEnrich() {
    if (!q) return;
    setEnriching(true);
    const enriched = await enrichQuestionWithAI(q);
    setQuestions(prev => prev.map((item, idx) => idx === current ? enriched : item));
    setEnriching(false);
  }

  async function loadQuestions() {
    setLoading(true);
    const data = await fetchExternalQuestions(section, 20);
    setQuestions(data);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setLoading(false);
  }

  useEffect(() => { loadQuestions(); }, [section]);

  const q = questions[current];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
        <p className="text-neon-cyan font-black tracking-widest uppercase">Syncing Mirror Bank...</p>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="text-center p-12 card-glass border-neon-pink/20">
        <AlertCircle className="w-12 h-12 text-neon-pink mx-auto mb-4" />
        <h3 className="text-xl font-bold uppercase mb-2">Connection Latency</h3>
        <p className="text-gray-500 mb-6">The external question synthesis engine is currently recalibrating.</p>
        <button onClick={loadQuestions} className="btn-primary bg-neon-pink shadow-neon-pink/20">RETRY SYNC</button>
      </div>
    );
  }

  const isCorrect = selected === q.correctAnswerIndex;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
        <div className="flex w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 no-scrollbar">
          {["math", "reading", "english_grammar"].map(s => (
            <button 
              key={s} 
              onClick={() => setSection(s)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-tighter rounded-xl transition-all ${
                section === s 
                  ? "bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <button onClick={onExit} className="text-xs font-bold text-gray-500 hover:text-neon-pink flex items-center gap-1 uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4" /> Exit Library
        </button>
      </div>

      {/* Progress Bar */}
      <div className="card-glass border-white/5 flex items-center justify-between p-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xl sm:text-2xl font-black text-neon-cyan">{current + 1} <span className="text-gray-700">/</span> {questions.length}</span>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Node ID</span>
            <span className="text-[10px] font-mono">{q.conceptId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500">Difficulty</span>
           <div className="flex gap-0.5 sm:gap-1">
             {[1, 2, 3, 4, 5].map(d => (
               <div key={d} className={`w-1.5 sm:w-2 h-3 sm:h-4 rounded-sm ${d <= q.difficulty ? 'bg-neon-cyan' : 'bg-white/5'}`} />
             ))}
           </div>
        </div>
      </div>

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={q.id + current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="card-glass border-neon-cyan/20 p-5 sm:p-8">
            <p className="text-lg sm:text-xl leading-relaxed font-medium mb-6 sm:mb-8">
              {q.text}
            </p>

            <div className="grid gap-3">
              {q.options.map((text, idx) => {
                const isSelected = selected === idx;
                const isActualCorrect = q.correctAnswerIndex === idx;
                
                let borderColor = "border-white/10";
                let textColor = "text-gray-300";
                let bgColor = "bg-white/5";

                if (revealed) {
                  if (isActualCorrect) {
                     borderColor = "border-neon-cyan";
                     textColor = "text-neon-cyan";
                     bgColor = "bg-neon-cyan/10";
                  } else if (isSelected) {
                     borderColor = "border-neon-pink";
                     textColor = "text-neon-pink";
                     bgColor = "bg-neon-pink/10";
                  }
                } else if (isSelected) {
                  borderColor = "border-neon-cyan";
                  textColor = "text-white";
                }

                return (
                  <button
                    key={idx}
                    disabled={revealed}
                    onClick={() => setSelected(idx)}
                    className={`w-full p-5 text-left rounded-2xl border flex items-center gap-4 transition-all group ${borderColor} ${textColor} ${bgColor} ${!revealed && 'hover:bg-white/10'}`}
                  >
                    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black text-xs transition-all ${
                       isSelected ? 'bg-current text-black border-transparent' : 'border-current/20'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 font-medium">{text}</span>
                    {revealed && isActualCorrect && <Zap className="w-5 h-5 fill-current" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation / Hack */}
          {revealed && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Detailed Explanation */}
              <div className="card-glass border-neon-cyan/20 bg-neon-cyan/5 p-6">
                <div className="flex items-center gap-2 mb-4 text-neon-cyan">
                  <Target className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Neural Link Explanation</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-200">{q.explanation || q.strategyTip}</p>
              </div>

              {/* Strategy & Trick */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card-glass border-neon-yellow/30 bg-neon-yellow/5 p-5">
                   <div className="flex items-center gap-2 mb-2 text-neon-yellow">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Strategy Tip</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-300 leading-relaxed">{q.strategyTip}</p>
                </div>

                {q.trickPattern && (
                  <div className="card-glass border-neon-pink/30 bg-neon-pink/5 p-5">
                    <div className="flex items-center gap-2 mb-2 text-neon-pink">
                      <Zap className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Trick Pattern</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-300 leading-relaxed">{q.trickPattern}</p>
                  </div>
                )}
              </div>

              {!q.trickPattern && (
                <button 
                  onClick={handleEnrich}
                  disabled={enriching}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-neon-cyan"
                >
                  {enriching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-neon-yellow" />
                  )}
                  {enriching ? 'Enriching Node...' : 'Enhance Node with Gemini AI'}
                </button>
              )}
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            {!revealed ? (
              <button 
                disabled={selected === null}
                onClick={() => setRevealed(true)}
                className="w-full btn-primary disabled:opacity-30 disabled:cursor-not-allowed py-4"
              >
                EXECUTE ANALYSIS
              </button>
            ) : (
              <>
                <div className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isCorrect ? 'text-neon-cyan' : 'text-neon-pink'}`}>
                  {isCorrect ? '✓ NODE AUTHENTICATED' : '✗ LOGIC GAP DETECTED'}
                </div>
                <button 
                  onClick={() => {
                    if (current + 1 < questions.length) {
                      setCurrent(c => c + 1);
                      setSelected(null);
                      setRevealed(false);
                    } else {
                      loadQuestions();
                    }
                  }}
                  className="w-full sm:w-auto btn-primary py-4 px-8 flex items-center justify-center gap-2"
                >
                  {current + 1 < questions.length ? 'NEXT NODE' : 'SYNC NEW BATCH'} <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
