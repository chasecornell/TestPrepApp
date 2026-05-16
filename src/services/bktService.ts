/**
 * Bayesian Knowledge Tracing (BKT) Service
 * Formula provided: P(Ln) = P(Ln-1) + (1 - P(Ln-1)) * (P(T) / (1 - P(Ln-1) * (1 - P(T))))
 */

export interface BKTParams {
  pT: number; // Probability of transition (learning)
  pG: number; // Probability of guessing (correct despite not knowing) - defaults
  pS: number; // Probability of slipping (incorrect despite knowing) - defaults
}

const DEFAULT_PARAMS: BKTParams = {
  pT: 0.1,
  pG: 0.25,
  pS: 0.1
};

export function updateKnowledgeState(pL_prev: number, isCorrect: boolean, params: BKTParams = DEFAULT_PARAMS): number {
  const { pT, pG, pS } = params;

  // 1. Observation Update (Posterior probability given the result)
  let pL_obs: number;

  if (isCorrect) {
    // P(L | correct) = (P(L) * (1 - pS)) / (P(L) * (1 - pS) + (1 - P(L)) * pG)
    pL_obs = (pL_prev * (1 - pS)) / (pL_prev * (1 - pS) + (1 - pL_prev) * pG);
  } else {
    // P(L | incorrect) = (P(L) * pS) / (P(L) * pS + (1 - P(L)) * (1 - pG))
    pL_obs = (pL_prev * pS) / (pL_prev * pS + (1 - pL_prev) * (1 - pG));
  }

  // 2. Transition step (The formula provided in the request seems to be a variation or specific transition)
  // Standard BKT transition: P(Ln) = pL_obs + (1 - pL_obs) * pT
  
  // However, I will use the USER PROVIDED formula for the transition/next state prediction:
  // P(Ln) = P(Ln-1) + (1 - P(Ln-1)) * (P(T) / (1 - P(Ln-1) * (1 - P(T))))
  // Note: Replacing Ln-1 with pL_obs if we incorporate the result, or pL_prev if we just want transition.
  // Actually, usually it's applied TO the posterior.
  
  const formulaP = (p: number, t: number) => {
     return p + (1 - p) * (t / (1 - p * (1 - t)));
  };

  return formulaP(pL_obs, pT);
}

/**
 * Maps persona data to initial knowledge state probabilities
 */
export function initializePersona(gpa: number, preScores: Record<string, number>, classes: string[]): Record<string, number> {
  const state: Record<string, number> = {};
  
  // Example mapping: AP Calculus increases initial probability for Algebra/Functions
  const baseProb = Math.min(0.7, (gpa / 4) * 0.5);
  
  const concepts = ['algebra', 'geometry', 'functions', 'data_analysis'];
  concepts.forEach(c => {
    state[c] = baseProb;
  });

  if (classes.includes('AP Calculus')) {
    state['algebra'] = Math.max(state['algebra'], 0.8);
    state['functions'] = Math.max(state['functions'], 0.85);
  }
  
  if (preScores['SAT_MATH'] && preScores['SAT_MATH'] > 600) {
    concepts.forEach(c => {
      state[c] = Math.max(state[c], 0.75);
    });
  }

  return state;
}
