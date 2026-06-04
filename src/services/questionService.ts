import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '@/src/lib/firebase';
import { Question } from '@/src/types';

export async function getQuestionsByConcept(conceptId: string, minDifficulty: number): Promise<Question[]> {
  try {
    const q = query(
      collection(db, 'questions'),
      where('conceptId', '==', conceptId),
      where('difficulty', '>=', minDifficulty)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Question));
  } catch (error) {
    return handleFirestoreError(error, 'list', `questions?conceptId=${conceptId}`);
  }
}

const API_BASE = "https://academic-velocity-5wi47aamqq-uc.a.run.app";

export async function fetchExternalQuestions(section: string = 'math', limit: number = 20): Promise<Question[]> {
  console.log(`[fetchExternalQuestions] fetching for ${section} limit ${limit} from ${API_BASE}`);
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/questions?section=${section}&limit=${limit}`, {
      signal: controller.signal
    });
    clearTimeout(id);
    
    console.log(`[fetchExternalQuestions] fetch response status:`, res.status);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    console.log(`[fetchExternalQuestions] fetched data length:`, data?.questions?.length);
    
    return data.questions.map((q: any) => {
      // Map choices object to array
      const options = Object.values(q.choices) as string[];
      const letters = Object.keys(q.choices);
      const correctAnswerIndex = letters.indexOf(q.answer);

      return {
        id: q.id || Math.random().toString(36).substr(2, 9),
        text: q.stem,
        options: options,
        correctAnswerIndex: correctAnswerIndex,
        conceptId: q.skill_id,
        difficulty: q.difficulty,
        explanation: q.explanation || "No detailed explanation available.",
        strategyTip: "Standard approach recommended.",
        syntheticDisclosed: true
      } as Question;
    });
  } catch (error) {
    console.error("Failed to fetch external questions, using fallback demo data:", error);
    // Provide a small pool of fallback questions
    return [
      {
        id: 'q1',
        text: 'If x + 5 = 12, what is the value of 3x - 4?',
        options: ['17', '21', '25', '31'],
        correctAnswerIndex: 0,
        conceptId: 'algebra',
        difficulty: 1,
        explanation: 'First, solve x + 5 = 12 for x: x = 7. Then substitute x = 7 into 3x - 4: 3(7) - 4 = 21 - 4 = 17.',
        strategyTip: 'Speed Hack: Solve for x instantly (7) and plug into the second expression.',
        trickPattern: 'Trap: Calculating x and stopping (picking 7 if it were an option).',
        syntheticDisclosed: true
      },
      {
        id: 'q2',
        text: 'A circular pizza has a diameter of 12 inches. What is the area of a slice that subtends a 60-degree angle at the center?',
        options: ['2π', '6π', '9π', '12π'],
        correctAnswerIndex: 1, 
        conceptId: 'geometry',
        difficulty: 3,
        explanation: 'The pizza has a diameter of 12 inches, so its radius r is 6 inches. The area of the entire pizza is πr² = π(6²) = 36π square inches. A 60-degree slice is (60/360) = 1/6 of the total area. Therefore, the area of the slice is 36π / 6 = 6π square inches.',
        strategyTip: '5-Second Rule: The area is 1/6 of the total. Total is (6^2)π = 36π. 36/6 = 6.',
        trickPattern: "Trap Answer: 12π (using diameter instead of radius).",
        syntheticDisclosed: true
      }
    ];
  }
}

export async function enrichQuestionWithAI(question: Question): Promise<Question> {
  try {
    const res = await fetch("/api/questions/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    // Explicitly ensure the explanation and other enriched fields are updated in the Question object
    return {
      ...question,
      explanation: data.explanation || question.explanation,
      strategyTip: data.strategyTip || question.strategyTip,
      trickPattern: data.trickPattern || question.trickPattern
    };
  } catch (error) {
    console.error("Enrichment failed:", error);
    return question;
  }
}

// Seed function for demo
export async function seedDemoQuestions() {
  const demoQuestions: Question[] = [
    {
      id: 'q1',
      text: 'If x + 5 = 12, what is the value of 3x - 4?',
      options: ['17', '21', '25', '31'],
      correctAnswerIndex: 0, // x=7, 3(7)-4 = 17
      conceptId: 'algebra',
      difficulty: 1,
      explanation: 'First, solve x + 5 = 12 for x: x = 7. Then substitute x = 7 into 3x - 4: 3(7) - 4 = 21 - 4 = 17.',
      strategyTip: 'Speed Hack: Solve for x instantly (7) and plug into the second expression.',
      trickPattern: 'Trap: Calculating x and stopping (picking 7 if it were an option).',
      syntheticDisclosed: true
    },
    {
      id: 'q2',
      text: 'A circular pizza has a diameter of 12 inches. What is the area of a slice that subtends a 60-degree angle at the center?',
      options: ['2π', '6π', '9π', '12π'],
      correctAnswerIndex: 1, // r=6, Area=36π, slice=60/360 = 1/6. 36π/6 = 6π
      conceptId: 'geometry',
      difficulty: 3,
      explanation: 'The pizza has a diameter of 12 inches, so its radius r is 6 inches. The area of the entire pizza is πr² = π(6²) = 36π square inches. A 60-degree slice is 60/360 = 1/6 of the total area. Therefore, the area of the slice is 36π / 6 = 6π square inches.',
      strategyTip: '5-Second Rule: The area is 1/6 of the total. Total is (6^2)π = 36π. 36/6 = 6.',
      trickPattern: "Trap Answer: 12π (using diameter instead of radius).",
      syntheticDisclosed: true
    }
  ];

  for (const q of demoQuestions) {
    try {
      await setDoc(doc(db, 'questions', q.id), q);
    } catch (error) {
      handleFirestoreError(error, 'create', `questions/${q.id}`);
    }
  }
}
