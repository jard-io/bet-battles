// Random number generator for bet outcomes with 1/3 probability each
export const generateBetOutcome = (): 'WIN' | 'LOSS' | 'TBD' => {
  const random = Math.random();
  if (random < 0.333) {
    return 'WIN';
  } else if (random < 0.666) {
    return 'LOSS';
  } else {
    return 'TBD';
  }
};

// Simulate whether a pick hits or not based on the line
export const simulatePickOutcome = (pickType: 'OVER' | 'UNDER', line: number): 'WIN' | 'LOSS' => {
  // Generate a random actual value around the line with some variance
  const variance = line * 0.2; // 20% variance
  const actualValue = line + (Math.random() - 0.5) * variance * 2;
  
  if (pickType === 'OVER') {
    return actualValue > line ? 'WIN' : 'LOSS';
  } else {
    return actualValue < line ? 'WIN' : 'LOSS';
  }
};

// Generate random delay for simulating real-time results
export const getRandomDelay = (min: number = 1000, max: number = 5000): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
