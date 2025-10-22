
export const CLUBS = [
  'Driver', '3-Wood', '5-Wood',
  '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron',
  'Pitching Wedge', 'Sand Wedge', 'Lob Wedge', 'Putter'
] as const;

export const AVERAGE_CARRY_DISTANCES: { [key: string]: { amateurMale: number, proMale: number } } = {
  'Driver': { amateurMale: 220, proMale: 290 },
  '3-Wood': { amateurMale: 200, proMale: 250 },
  '5-Wood': { amateurMale: 185, proMale: 235 },
  '3-Iron': { amateurMale: 175, proMale: 225 },
  '4-Iron': { amateurMale: 165, proMale: 210 },
  '5-Iron': { amateurMale: 155, proMale: 200 },
  '6-Iron': { amateurMale: 145, proMale: 190 },
  '7-Iron': { amateurMale: 135, proMale: 175 },
  '8-Iron': { amateurMale: 125, proMale: 160 },
  '9-Iron': { amateurMale: 115, proMale: 145 },
  'Pitching Wedge': { amateurMale: 105, proMale: 130 },
  'Sand Wedge': { amateurMale: 80, proMale: 100 },
  'Lob Wedge': { amateurMale: 60, proMale: 85 },
  'Putter': { amateurMale: 0, proMale: 0},
};

export const VIEWS = {
  ANALYSIS: 'ANALYSIS',
  HISTORY: 'HISTORY'
} as const;
