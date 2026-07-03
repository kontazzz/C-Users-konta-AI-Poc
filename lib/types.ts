export type DiagnosisLevel = "Good" | "Caution" | "Avoid";

export interface DiagnosisResult {
  score: number;
  level: DiagnosisLevel;
  mainIngredientsSummary: string;
  recommendedBreeds: string[];
  recommendedLifeStages: string[];
  allergyWarnings: string[];
  avoidBreeds: string[];
  riskIngredients: string[];
  positiveIngredients: string[];
  similarPriceFoods: string[];
  similarIngredientFoods: string[];
  sameManufacturerFoods: string[];
  feedingNote: string;
  summary: string;
  disclaimer: string;
}

export interface DogProfile {
  name: string;
  ageYears: number | null;
  weightKg: number | null;
  breed: string;
  lifeStage: "puppy" | "adult" | "senior";
  allergies: string;
}

export interface DiagnosisRequest {
  dog: DogProfile;
  productId: number | null;
  barcodeText: string;
  manualIngredients: string;
  hasImage: boolean;
}

export const DISCLAIMER = "この診断は獣医師の診断や治療の代わりではありません。";
