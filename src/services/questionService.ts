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
  try {
    const res = await fetch(`${API_BASE}/questions?section=${section}&limit=${limit}`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    
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
    // Provide a small pool of fallback questions mapped by section
    const fallbackData: Record<string, Question[]> = {
      math: [
        {
          id: 'act-math-1',
          text: 'At a college track meet, there are 3 jumping events: high jump, long jump, and triple jump. The Venn diagram below shows the distribution of the number of athletes competing in each jumping event. How many athletes are competing in both high jump and triple jump but not long jump?\n\nHigh Jump Circle contains: 5, 9, 3, 1\nLong Jump Circle contains: 7, 9, 6, 1\nTriple Jump Circle contains: 2, 3, 6, 1\n\nIntersections:\nHigh Jump & Long Jump only: 9\nHigh Jump & Triple Jump only: 3\nLong Jump & Triple Jump only: 6\nAll Three: 1\n\nHigh Jump only: 5\nLong Jump only: 7\nTriple Jump only: 2',
          options: ['3', '4', '10', '19'],
          correctAnswerIndex: 0,
          conceptId: 'probability_sets',
          difficulty: 1,
          explanation: 'The Venn diagram region for intersection between high jump and triple jump that is completely outside the long jump circle contains the number 3.',
          strategyTip: 'Simply locate the overlapping region for high jump and triple jump, excluding the long jump region entirely.',
          trickPattern: 'Misinterpreting the regions or mistakenly adding the center "1".',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-2',
          text: 'A function, f, is defined by the equation f(x) = x² + 5. What is f(3) + 1?',
          options: ['9', '11', '12', '15'],
          correctAnswerIndex: 3,
          conceptId: 'functions',
          difficulty: 1,
          explanation: 'First, find f(3): f(3) = 3² + 5 = 9 + 5 = 14. Then add 1: 14 + 1 = 15.',
          strategyTip: 'Calculate the function value first, then perform any additional operations outside the function.',
          trickPattern: 'Forgetting to add 1 at the end and choosing 14 (if available) or miscalculating.',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-3',
          text: 'Given b = 40 and c = -16, b + c is equal to the product of -4 and what number?',
          options: ['-14', '-6', '6', '14'],
          correctAnswerIndex: 1,
          conceptId: 'algebra',
          difficulty: 1,
          explanation: 'Calculate b + c: 40 + (-16) = 24. We are looking for x such that 24 = -4 * x. Solving for x yields x = -6.',
          strategyTip: 'Formulate the equation Step-by-Step and solve for the unknown.',
          trickPattern: 'Handling negative signs incorrectly, yielding 6.',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-4',
          text: 'It takes Collin 24 minutes to walk to school in the morning. What fraction of his 24-hour day is spent walking to school in the morning?',
          options: ['1 / 1,440', '1 / 60', '1 / 24', '1 / 12'],
          correctAnswerIndex: 1,
          conceptId: 'fractions_rates',
          difficulty: 2,
          explanation: 'Convert hours directly to minutes: 24 hours * 60 minutes = 1440 minutes. The fraction is 24 / 1440 = 1 / 60.',
          strategyTip: 'Pay attention to units! Don\'t put 24/24.',
          trickPattern: 'Choosing 1/24 directly without converting units.',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-5',
          text: 'Which of the following is equivalent to (6x + 3y) - (y - 2x)?',
          options: ['4x + 2y', '5x + y', '5x + 5y', '8x + 2y'],
          correctAnswerIndex: 3,
          conceptId: 'algebra',
          difficulty: 1,
          explanation: 'Distribute the negative sign to get 6x + 3y - y + 2x. Combine like terms: 6x + 2x = 8x, and 3y - y = 2y. The result is 8x + 2y.',
          strategyTip: 'Always distribute negatives cleanly across polynomials before simplifying.',
          trickPattern: 'Failing to distribute the negative to the -2x term, which yields 4x + 2y.',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-6',
          text: 'If x = 3, what is the value of 2x^2 - 4x + 1?',
          options: ['-5', '5', '7', '19'],
          correctAnswerIndex: 2,
          conceptId: 'algebra',
          difficulty: 1,
          explanation: 'Substitute 3 for x: 2(3)^2 - 4(3) + 1 = 2(9) - 12 + 1 = 18 - 12 + 1 = 7.',
          strategyTip: 'Perform exponentiation before multiplication.',
          trickPattern: 'Calculating (2x)^2 instead of 2(x^2).',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-7',
          text: 'In a right triangle, the hypotenuse is 13 and one leg is 5. What is the length of the other leg?',
          options: ['8', '11', '12', '144'],
          correctAnswerIndex: 2,
          conceptId: 'geometry',
          difficulty: 2,
          explanation: 'Use the Pythagorean theorem: a^2 + b^2 = c^2. 5^2 + b^2 = 13^2, so 25 + b^2 = 169. b^2 = 144, meaning b = 12.',
          strategyTip: 'Memorize common Pythagorean triples like 5-12-13 to save time.',
          trickPattern: 'Forgetting to take the square root of 144.',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-8',
          text: 'A store is offering a 20% discount on a $50 shirt. If there is a 5% sales tax applied AFTER the discount, what is the final price?',
          options: ['$40.00', '$42.00', '$42.50', '$45.00'],
          correctAnswerIndex: 1,
          conceptId: 'word_problems',
          difficulty: 2,
          explanation: 'First apply the 20% discount: $50 - (0.20 * 50) = $40. Then apply the 5% tax: $40 * 1.05 = $42.',
          strategyTip: 'Always apply sequential percentage changes step-by-step; they are not additive.',
          trickPattern: 'Adding the percentages (20% - 5% = 15%) and taking 15% off.',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-9',
          text: 'What is the sum of the interior angles of a regular hexagon?',
          options: ['360°', '540°', '720°', '900°'],
          correctAnswerIndex: 2,
          conceptId: 'geometry',
          difficulty: 2,
          explanation: 'The formula for the sum of interior angles is (n - 2) * 180. For a hexagon, n = 6. (6 - 2) * 180 = 4 * 180 = 720°.',
          strategyTip: 'Remember the interior angles formula (n-2)*180, where n is the number of sides.',
          trickPattern: 'Guessing 360°, which is the sum of exterior angles, not interior.',
          syntheticDisclosed: true
        },
        {
          id: 'act-math-10',
          text: 'Solve for y: 3(y - 2) = 5y - 14',
          options: ['y = 2', 'y = 4', 'y = -4', 'y = 8'],
          correctAnswerIndex: 1,
          conceptId: 'algebra',
          difficulty: 2,
          explanation: 'Distribute: 3y - 6 = 5y - 14. Subtract 3y from both sides: -6 = 2y - 14. Add 14 to both sides: 8 = 2y. y = 4.',
          strategyTip: 'Combine variables on one side and constants on the other.',
          trickPattern: 'Making a sign error during subtraction, yielding y = -4.',
          syntheticDisclosed: true
        }
      ],
      english_grammar: [
        {
          id: 'act-eng-1',
          text: 'Every summer at the Choctaw Indian Fair in central Mississippi, hundreds gather. [A] This multiday tournament in summer celebrates the fast-paced game of stickball.\n\nWhich choice is least redundant in context for the underlined portion "multiday tournament in summer"?',
          options: ['No Change', 'multiday tournament in Mississippi', 'annual multiday tournament', 'multiday tournament'],
          correctAnswerIndex: 3,
          conceptId: 'conciseness',
          difficulty: 2,
          explanation: 'The preceding sentence already establishes that the event happens "Every summer" and "in central Mississippi". Therefore, repeating "in summer" or "in Mississippi" is redundant. "annual" is also redundant with "Every summer". The most concise and clear option is just "multiday tournament".',
          strategyTip: 'Always check the preceding sentences for context to avoid redundancy and unnecessary repetition.',
          trickPattern: 'Choosing "annual" because it sounds formal but ignoring the repetition.',
          syntheticDisclosed: true
        }
      ],
      reading: [
        {
          id: 'act-read-1',
          text: 'Passage A: "I was with my son, who was ten at the time, and we were on our way to his school when I saw an entire stack of newspapers go up into the air, a trashy celebration! We passed a newsstand. The man selling the papers was doing a pretty good job holding down copies of the Times and the Post... but he was having trouble with the Daily News, which eventually escaped, almost the whole stack, and was then whipped quickly and frantically into the vortex."\n\nIn the context of the passage, the event described most nearly serves to:',
          options: ['provide an anecdote that illustrates the power of the wind in Brooklyn.', 'describe the newspaper seller\'s amusement as the papers were tossed about by the wind.', 'recount an experience that left the narrator wary of the wind in Brooklyn.', 'suggest that there are areas of Brooklyn that are intolerable because of the wind.'],
          correctAnswerIndex: 0,
          conceptId: 'main_idea',
          difficulty: 2,
          explanation: 'The anecdote details newspapers flying up all the way into the sky, vividly illustrating the sheer power of the "vortex" wind the author was describing.',
          strategyTip: 'Read the paragraph looking for its broader purpose within the essay\'s main theme regarding the wind.',
          trickPattern: 'Picking answers with unsupported negative emotional tones like "wary" or "intolerable".',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-2',
          text: 'Passage A: "Often I walk my daughter... through the vortex on her way back and forth to school, even though it\'s a little out of our way—after years of forced wind-watching, her older brother walks alone now, noticing, I hope, the wind on his own."\n\nWhich of the following statements best captures how the narrator of Passage A feels about the way his children might perceive the Brooklyn wind?',
          options: ['He suspects the wind annoys them and assumes they take measures to avoid it.', 'He hopes they share his interest in the wind and seek it out themselves.', 'He feels they don\'t appreciate the wind or other facets of nature as much as they should.', 'He hopes they notice how calm Brooklyn can be when the wind is not blowing.'],
          correctAnswerIndex: 1,
          conceptId: 'author_intent',
          difficulty: 3,
          explanation: 'The author hopes that his older son, who now walks alone, is "noticing... the wind on his own," indicating a desire for his children to appreciate the natural phenomenon just as he does.',
          strategyTip: 'Look closely at the explicit sentiments expressed by the author, explicitly words like "I hope".',
          trickPattern: 'Inferring negativity from "forced wind-watching" rather than seeing his ultimate desire for them to notice it.',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-3',
          text: 'Passage A: "We face the Court-Montague Building and a London plane tree whose branches are notable among Brooklyn trees for their lack of plastic shopping bags. The wind rips the bags away."\n\nAccording to the narrator of Passage A, the branches of the London plane tree near the Court-Montague Building are notable for:',
          options: ['their exceptional length and graceful shape.', 'the fact that they don\'t have plastic shopping bags clinging to them.', 'the sound they make when the wind whips through them.', 'their ability to provide shade for the nearby farmer\'s market.'],
          correctAnswerIndex: 1,
          conceptId: 'detail_recognition',
          difficulty: 1,
          explanation: 'The passage explicitly states that the branches are notable "for their lack of plastic shopping bags."',
          strategyTip: 'Do not overthink detail questions. Use the exact wording in the text to answer.',
          trickPattern: 'Guessing reasonable, tree-related things like "shade" or "sound" without reading the text.',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-4',
          text: 'Passage B: "When my mother explained that the metal wheels of horse-drawn vehicles wore the street down harder than modern rubber tires filled with air, I was catapulted into a new understanding of a previous era."\n\nAccording to the narrator of Passage B, some manhole covers she encountered as a child were rubbed smooth partly because of:',
          options: ['the metal-wheeled vehicles of Brooklyn\'s past.', 'urban renewal projects over many decades.', 'road resurfacing methods that were unduly destructive.', 'centuries of foot traffic at Brooklyn\'s intersections.'],
          correctAnswerIndex: 0,
          conceptId: 'detail_recognition',
          difficulty: 1,
          explanation: 'The text highlights that the narrator\'s mother explained the metal wheels of horse-drawn vehicles caused the streets—and street furniture—to wear down.',
          strategyTip: 'Find the specific cause-and-effect relationship detailed in the text.',
          trickPattern: 'Picking "foot traffic," as it\'s a very common reason for worn pavement but not the one specified in the text.',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-5',
          text: 'Passage B: "The past had never seemed very believable to me, until then... But thanks to manhole covers and several stretches of street still paved with Belgian blocks... I could suddenly fathom that Brooklyn had been something different once too. History had happened here."\n\nIt can reasonably be inferred from Passage B that one result of the excursions the narrator took around Brooklyn with her mother was the narrator\'s:',
          options: ['lifelong commitment to urban renewal and preservation.', 'increased appreciation for the history of other American cities.', 'fuller notion of what her city was like during different eras.', 'decision to expose her own children to art museums.'],
          correctAnswerIndex: 2,
          conceptId: 'inference',
          difficulty: 2,
          explanation: 'The textual reference to sudden realization that "Brooklyn had been something different once" highlights a new, fuller understanding of the varied eras of Brooklyn.',
          strategyTip: 'Match the inference locally to the thematic realization mentioned at the end of the narrative.',
          trickPattern: 'Extrapolating too far out to "commitment to preservation" or "other American cities".',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-6',
          text: 'Passage C: "By the time the conductor swung aboard, the great steel beast was already panting and shivering... Then there was a jolt, and the train lunged out of the station. Inside the cabin, passengers swayed in unison, like fields of grain caught in a sudden breeze."\n\nThe author compares the passengers to "fields of grain" primarily to emphasize:',
          options: ['their submissive and conformist nature in public spaces.', 'the collective, synchronized movement caused by the train.', 'their deep connection to agricultural lifestyles.', 'the golden, sunlit environment inside the cabin.'],
          correctAnswerIndex: 1,
          conceptId: 'figurative_language',
          difficulty: 2,
          explanation: 'The simile describes the physical effect of the train moving, which makes everyone sway together "in unison" just as fields of grain sway in a breeze.',
          strategyTip: 'Look at the immediate physical context (the train lunging) to interpret the figurative language.',
          trickPattern: 'Reading too deeply into psychological traits like "conformism".',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-7',
          text: 'Passage D: "While earlier generations relied primarily on the printed word, modern society is engulfed in visual media. The transition has not merely changed how we receive information; it has fundamentally altered the very structure of our arguments, replacing long-form logic with emotional imagery."\n\nThe author\'s attitude toward the shift from printed word to visual media is best described as:',
          options: ['enthusiastic and welcoming.', 'cautious and slightly critical.', 'indifferent and purely objective.', 'confused and overwhelmed.'],
          correctAnswerIndex: 1,
          conceptId: 'author_intent',
          difficulty: 3,
          explanation: 'The author notes that this shift has replaced "long-form logic with emotional imagery," implying a critical view of losing logical structure for emotion.',
          strategyTip: 'Look for value-laden words ("replacing long-form logic with emotional imagery") to gauge tone.',
          trickPattern: 'Assuming the author is purely objective just because they are describing a historical shift.',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-8',
          text: 'Passage E: "The discovery of the coelacanth in 1938 was a shock. Thought to have gone extinct with the dinosaurs 65 million years ago, this lobe-finned fish was suddenly very real, proving that the deep ocean holds secrets we have barely begun to fathom."\n\nIn the context of the passage, the phrase "barely begun to fathom" most nearly means:',
          options: ['only started to map the seafloor.', 'just begun to understand or discover.', 'failed to measure the depth of the ocean.', 'newly learned how to fish in deep waters.'],
          correctAnswerIndex: 1,
          conceptId: 'vocab_in_context',
          difficulty: 1,
          explanation: 'In this context, "fathom" means to understand or comprehend the secrets of the deep ocean.',
          strategyTip: 'Substitute the answer choices back into the original sentence to see which preserves the meaning.',
          trickPattern: 'Choosing a literal definition of a word (fathom as a unit of depth) when it is used figuratively.',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-9',
          text: 'Passage F: "She sat by the window, watching the rain blur the streetlights into glowing, amorphous orbs. The city felt distant tonight, muffled by the relentless downpour, matching the heavy quiet that had settled over her apartment since he left."\n\nBased on the passage, the setting of the rain serves primarily to:',
          options: ['showcase the beauty of the city at night.', 'mirror the protagonist\'s internal sense of isolation and heaviness.', 'foreshadow an impending natural disaster.', 'create suspense before a major conflict.'],
          correctAnswerIndex: 1,
          conceptId: 'main_idea',
          difficulty: 2,
          explanation: 'The heavy rain and "muffled" city explicitly parallel the "heavy quiet" and emotional distance in her own life.',
          strategyTip: 'Connect the environmental description directly to the character\'s emotional state in the same sentence.',
          trickPattern: 'Choosing purely aesthetic observations (beauty of the city) when a deeper emotional parallel is present.',
          syntheticDisclosed: true
        },
        {
          id: 'act-read-10',
          text: 'Passage G: "The committee concluded that while the new policy was theoretically sound, its practical implementation would require resources far exceeding the current municipal budget, effectively rendering the proposal dead on arrival."\n\nThe phrase "dead on arrival" means that the proposal:',
          options: ['was physically destroyed before being read.', 'will not be enacted because it is impossible to fund.', 'was extremely unpopular with the committee members.', 'arrived past the designated deadline for submissions.'],
          correctAnswerIndex: 1,
          conceptId: 'vocab_in_context',
          difficulty: 2,
          explanation: 'The proposal is "dead on arrival" because its required resources exceed the budget, meaning it basically cannot be enacted from the very start.',
          strategyTip: 'Link the idiom to the logical obstacle mentioned immediately before it (lack of funding).',
          trickPattern: 'Choosing literal interpretations like arriving past the deadline.',
          syntheticDisclosed: true
        }
      ],
      science: [
        {
          id: 'act-sci-1',
          text: 'Table 2 shows the melting point (MP) and boiling point (BP) at 1 atm for several cycloalkanes:\nCyclopropane: MP -128, BP -31\nCyclobutane: MP -91, BP 13\nCyclopentane: MP -93, BP 49\nCyclohexane: MP 7, BP 81\n\nAccording to Table 2, at 1 atm, what is the BP of the alkane with the chemical formula C5H10 (Cyclopentane)?',
          options: ['-130°C', '-93°C', '36°C', '49°C'],
          correctAnswerIndex: 3,
          conceptId: 'data_interpretation',
          difficulty: 1,
          explanation: 'Locate Cyclopentane (C5H10) in Table 2. Its boiling point (BP) is listed as 49°C.',
          strategyTip: 'Match the molecule name/formula directly to its row and ensure you look at the correct column (BP, not MP).',
          trickPattern: 'Accidentally citing Melting Point (MP) instead of Boiling Point (BP).',
          syntheticDisclosed: true
        },
        {
          id: 'act-sci-2',
          text: 'Table 1 shows properties of n-alkanes at 1 atm:\nPropane: MP -187, BP -42\nButane: MP -138, BP -1\nPentane: MP -130, BP 36\nHexane: MP -95, BP 69\nHeptane: MP -91, BP 98\nOctane: MP -57, BP 126\nNonane: MP -53, BP 151\n\nFor the n-alkanes listed in Table 1, as the number of carbon atoms per molecule increases, the BP at 1 atm:',
          options: ['increases only.', 'decreases only.', 'increases and then decreases.', 'decreases and then increases.'],
          correctAnswerIndex: 0,
          conceptId: 'trend_analysis',
          difficulty: 1,
          explanation: 'Reading the BP column down the list representing increasing molecular carbon atoms, the values go from -42 to 151 uninterrupted. Thus, it increases only.',
          strategyTip: 'Verify the trend explicitly line by line across ALL rows before solidifying an answer.',
          trickPattern: 'Looking at MP instead of BP (however, MP also increases).',
          syntheticDisclosed: true
        },
        {
          id: 'act-sci-3',
          text: 'Table 2 shows the melting point (MP) and boiling point (BP) at 1 atm for several cycloalkanes:\nCyclopropane: MP -128, BP -31\nCyclobutane: MP -91, BP 13\nCyclopentane: MP -93, BP 49\nCyclohexane: MP 7, BP 81\nCycloheptane: MP -8, BP 119\nCyclooctane: MP 15, BP 151\nCyclononane: MP 11, BP 173\n\nAt 1 atm, how many of the cycloalkanes listed in Table 2 have an MP above the MP of ice (0°C)?',
          options: ['1', '3', '4', '7'],
          correctAnswerIndex: 1,
          conceptId: 'data_interpretation',
          difficulty: 2,
          explanation: 'The MP of ice is 0 °C. The cycloalkanes with an MP above 0 °C are Cyclohexane (7 °C), Cyclooctane (15 °C), and Cyclononane (11 °C). That totals 3.',
          strategyTip: 'Translate outside real-world knowledge ("MP of ice is 0") directly to the data table bounds.',
          trickPattern: 'A subtle mistake on negative values or guessing.',
          syntheticDisclosed: true
        }
      ]
    };

    const qs = fallbackData[section] || fallbackData['math'];
    // Shuffle the array of questions so they cycle
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    // Return up to `limit` questions per session
    const sliceCount = Math.min(limit, qs.length);
    return shuffled.slice(0, sliceCount);
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

export async function getRemediation(concept: string, recentMistakes: Question[]) {
  try {
    const res = await fetch("/api/questions/remediate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept, recentMistakes }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    // Map the returned reviewQuestion into a full Question
    if (data.reviewQuestion) {
       data.reviewQuestion = {
         id: 'remediation-' + Math.random().toString(36).substr(2, 9),
         ...data.reviewQuestion,
         conceptId: concept,
         difficulty: 1, // Remediation is always easy
         syntheticDisclosed: true
       };
    }
    return data; // { remediationText: string, reviewQuestion: Question }
  } catch (error) {
    console.error("Remediation failed:", error);
    return null;
  }
}

export async function getHarderQuestion(concept: string, currentDifficulty: number) {
  try {
    const res = await fetch("/api/questions/generate-harder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept, currentDifficulty }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    return {
      id: 'harder-' + Math.random().toString(36).substr(2, 9),
      ...data,
      conceptId: concept,
      difficulty: currentDifficulty + 1,
      syntheticDisclosed: true
    } as Question;
  } catch (error) {
    console.error("Harder question generation failed:", error);
    return null;
  }
}

// Seed function for demo
export async function seedDemoQuestions() {
  const demoQuestions: Question[] = [
    {
      id: 'act-math-1',
      text: 'At a college track meet, there are 3 jumping events: high jump, long jump, and triple jump. The Venn diagram below shows the distribution of the number of athletes competing in each jumping event. How many athletes are competing in both high jump and triple jump but not long jump?\n\nHigh Jump Circle contains: 5, 9, 3, 1\nLong Jump Circle contains: 7, 9, 6, 1\nTriple Jump Circle contains: 2, 3, 6, 1\n\nIntersections:\nHigh Jump & Long Jump only: 9\nHigh Jump & Triple Jump only: 3\nLong Jump & Triple Jump only: 6\nAll Three: 1\n\nHigh Jump only: 5\nLong Jump only: 7\nTriple Jump only: 2',
      options: ['3', '4', '10', '19'],
      correctAnswerIndex: 0,
      conceptId: 'math',
      difficulty: 1,
      explanation: 'The Venn diagram region for intersection between high jump and triple jump that is completely outside the long jump circle contains the number 3.',
      strategyTip: 'Simply locate the overlapping region for high jump and triple jump, excluding the long jump region entirely.',
      trickPattern: 'Misinterpreting the regions or mistakenly adding the center "1".',
      syntheticDisclosed: true
    },
    {
      id: 'act-math-2',
      text: 'A function, f, is defined by the equation f(x) = x² + 5. What is f(3) + 1?',
      options: ['9', '11', '12', '15'],
      correctAnswerIndex: 3,
      conceptId: 'math',
      difficulty: 1,
      explanation: 'First, find f(3): f(3) = 3² + 5 = 9 + 5 = 14. Then add 1: 14 + 1 = 15.',
      strategyTip: 'Calculate the function value first, then perform any additional operations outside the function.',
      trickPattern: 'Forgetting to add 1 at the end and choosing 14 (if available) or miscalculating.',
      syntheticDisclosed: true
    },
    {
      id: 'act-eng-1',
      text: 'Every summer at the Choctaw Indian Fair in central Mississippi, hundreds gather. [A] This multiday tournament in summer celebrates the fast-paced game of stickball.\n\nWhich choice is least redundant in context for the underlined portion "multiday tournament in summer"?',
      options: ['No Change', 'multiday tournament in Mississippi', 'annual multiday tournament', 'multiday tournament'],
      correctAnswerIndex: 3,
      conceptId: 'english_grammar',
      difficulty: 2,
      explanation: 'The preceding sentence already establishes that the event happens "Every summer" and "in central Mississippi". Therefore, repeating "in summer" or "in Mississippi" is redundant. "annual" is also redundant with "Every summer". The most concise and clear option is just "multiday tournament".',
      strategyTip: 'Always check the preceding sentences for context to avoid redundancy and unnecessary repetition.',
      trickPattern: 'Choosing "annual" because it sounds formal but ignoring the repetition.',
      syntheticDisclosed: true
    },
    {
      id: 'act-read-1',
      text: 'I was with my son, who was ten at the time, and we were on our way to his school when I saw an entire stack of newspapers go up into the air, a trashy celebration! We passed a newsstand. The man selling the papers was doing a pretty good job holding down copies of the Times and the Post... but he was having trouble with the Daily News, which eventually escaped, almost the whole stack, and was then whipped quickly and frantically into the vortex.\n\nIn the context of the passage, the event described most nearly serves to:',
      options: ['provide an anecdote that illustrates the power of the wind in Brooklyn.', 'describe the newspaper seller\'s amusement as the papers were tossed about by the wind.', 'recount an experience that left the narrator wary of the wind in Brooklyn.', 'suggest that there are areas of Brooklyn that are intolerable because of the wind.'],
      correctAnswerIndex: 0,
      conceptId: 'reading',
      difficulty: 2,
      explanation: 'The anecdote details newspapers flying up all the way into the sky, vividly illustrating the sheer power of the "vortex" wind the author was describing.',
      strategyTip: 'Read the paragraph looking for its broader purpose within the essay\'s main theme regarding the wind.',
      trickPattern: 'Picking answers with unsupported negative emotional tones like "wary" or "intolerable".',
      syntheticDisclosed: true
    },
    {
      id: 'act-sci-1',
      text: 'Table 2 shows the melting point (MP) and boiling point (BP) at 1 atm for several cycloalkanes:\nCyclopropane: MP -128, BP -31\nCyclobutane: MP -91, BP 13\nCyclopentane: MP -93, BP 49\nCyclohexane: MP 7, BP 81\n\nAccording to Table 2, at 1 atm, what is the BP of the alkane with the chemical formula C5H10 (Cyclopentane)?',
      options: ['-130°C', '-93°C', '36°C', '49°C'],
      correctAnswerIndex: 3,
      conceptId: 'science',
      difficulty: 1,
      explanation: 'Locate Cyclopentane (C5H10) in Table 2. Its boiling point (BP) is listed as 49°C.',
      strategyTip: 'Match the molecule name/formula directly to its row and ensure you look at the correct column (BP, not MP).',
      trickPattern: 'Accidentally citing Melting Point (MP) instead of Boiling Point (BP).',
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
