export interface MasteryEngineInput {
  previousMastery: number;
  isCorrect: boolean;
  score: number;
  difficulty?: string;
}

export interface MasteryEngineResult {
  newMastery: number;
  delta: number;
  algorithmVersion: number;
}

export class MasteryEngineV1 {
  public readonly algorithmVersion = 1;

  calculate(input: MasteryEngineInput): MasteryEngineResult {
    const current = this.clamp(input.previousMastery);
    const baseDelta = input.isCorrect ? Math.max(8, Math.round((input.score || 0) / 20)) : -10;
    const difficultyAdjustment =
      input.difficulty === 'hard' ? 2 : input.difficulty === 'easy' ? -1 : 0;
    const delta = input.isCorrect ? baseDelta + difficultyAdjustment : baseDelta;
    return {
      newMastery: this.clamp(current + delta),
      delta,
      algorithmVersion: this.algorithmVersion,
    };
  }

  private clamp(value: number): number {
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  }
}
