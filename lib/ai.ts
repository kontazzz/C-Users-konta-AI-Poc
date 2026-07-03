import { DISCLAIMER, DiagnosisResult, DogProfile } from "./types";
import {
  ProductAllergen,
  ProductIngredient,
  ProductSummary,
  SimilarFood,
} from "./foodDb";

export interface DiagnosisFacts {
  product: ProductSummary | null;
  ingredients: ProductIngredient[];
  allergens: ProductAllergen[];
  similarPriceFoods: SimilarFood[];
  similarIngredientFoods: SimilarFood[];
  sameManufacturerFoods: SimilarFood[];
  manualIngredients: string;
  barcodeText: string;
}

const LIFE_STAGE_LABELS: Record<DogProfile["lifeStage"], string> = {
  puppy: "子犬",
  adult: "成犬",
  senior: "高齢犬",
};

function foodLabel(f: SimilarFood): string {
  return `${f.brand_name} ${f.product_name}`;
}

function parseAllergies(allergies: string): string[] {
  return allergies
    .split(/[、,\s/・]+/)
    .map((a) => a.trim())
    .filter(Boolean);
}

// DBの事実のみから保守的に診断結果を組み立てる(AI API未設定時のフォールバック兼、
// AI結果の similar* 項目の正本)。商品事実の捏造はしない。
export function buildRuleBasedResult(
  facts: DiagnosisFacts,
  dog: DogProfile
): DiagnosisResult {
  const dogAllergies = parseAllergies(dog.allergies);
  const containsAllergens = facts.allergens
    .filter((a) => a.assertion === "contains" || a.assertion === "may_contain")
    .map((a) => a.allergen_name);

  const allergyHits = dogAllergies.filter((da) =>
    containsAllergens.some((ca) => ca.includes(da) || da.includes(ca))
  );

  const ingredientNames = facts.ingredients.map((i) => i.display_name);
  const hasDbData = facts.product !== null;
  const hasIngredientData = ingredientNames.length > 0 || facts.manualIngredients.trim() !== "";

  let score = 70;
  const allergyWarnings: string[] = [];
  const riskIngredients: string[] = [];

  for (const hit of allergyHits) {
    score -= 30;
    allergyWarnings.push(
      `この商品はアレルゲン「${hit}」を含む可能性があります(メーカー表示または原材料からの推定)。`
    );
  }
  riskIngredients.push(...allergyHits);

  if (dogAllergies.length > 0 && facts.allergens.length === 0) {
    allergyWarnings.push(
      "この商品のアレルゲン情報がデータベースに未登録のため、アレルギー適合性は判定できません。メーカーの原材料表示を必ずご確認ください。"
    );
  }

  const recommendedLifeStages = facts.product?.life_stages
    ? facts.product.life_stages.split(",").map((s) => s.trim())
    : [];
  const dogStageLabel = LIFE_STAGE_LABELS[dog.lifeStage];
  const stageMatched = recommendedLifeStages.some(
    (s) => s.includes(dogStageLabel) || s.includes("全年齢")
  );
  if (recommendedLifeStages.length > 0) {
    if (stageMatched) {
      score += 10;
    } else {
      score -= 15;
    }
  }

  if (!hasIngredientData) {
    score -= 10;
  }
  score = Math.max(0, Math.min(100, score));

  let level: DiagnosisResult["level"] = "Good";
  if (allergyHits.length > 0) {
    level = "Avoid";
  } else if (score < 60 || !hasDbData || !hasIngredientData) {
    level = "Caution";
  }

  const recommendedBreeds = facts.product?.breed_sizes
    ? facts.product.breed_sizes.split(",").map((s) => s.trim())
    : [];

  const mainIngredientsSummary = hasIngredientData
    ? [
        ingredientNames.length > 0
          ? `データベース上の主要原材料: ${ingredientNames.join("、")}`
          : "",
        facts.manualIngredients.trim() !== ""
          ? `入力された原材料: ${facts.manualIngredients.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join(" / ")
    : "原材料情報がデータベースに未登録です。パッケージの原材料表示をご確認ください。";

  const uncertaintyNotes: string[] = [];
  if (!hasDbData) {
    uncertaintyNotes.push("商品がデータベースで選択されていないため、判定の確実性は低いです。");
  }
  if (!hasIngredientData) {
    uncertaintyNotes.push("原材料データが不足しています。");
  }

  const summaryParts = [
    facts.product
      ? `「${facts.product.brand_name} ${facts.product.product_name}」を${dog.name || "愛犬"}(${dogStageLabel})向けに評価しました。`
      : `選択商品なしで入力情報のみから評価しました。`,
    allergyHits.length > 0
      ? "登録されたアレルギーと一致する可能性のある成分があるため、使用は推奨しません。"
      : dogAllergies.length > 0
        ? "登録されたアレルギーと明確に一致する成分はデータベース上では確認されませんでしたが、必ず表示をご確認ください。"
        : "特筆すべきリスクはデータベース上では確認されませんでした。",
    ...uncertaintyNotes,
  ];

  return {
    score,
    level,
    mainIngredientsSummary,
    recommendedBreeds,
    recommendedLifeStages,
    allergyWarnings,
    avoidBreeds: [],
    riskIngredients,
    positiveIngredients: ingredientNames.filter((n) => !allergyHits.some((h) => n.includes(h))),
    similarPriceFoods: facts.similarPriceFoods.map(foodLabel),
    similarIngredientFoods: facts.similarIngredientFoods.map(foodLabel),
    sameManufacturerFoods: facts.sameManufacturerFoods.map(foodLabel),
    feedingNote:
      "フードの切り替えは7〜10日かけて少しずつ行い、給与量はパッケージ記載のメーカー推奨量に従ってください。体調に変化があれば使用を中止してください。",
    summary: summaryParts.join(" "),
    disclaimer: DISCLAIMER,
  };
}

// OpenAI互換API プレースホルダ。AI_API_KEY 未設定・失敗時はルールベースにフォールバック。
export async function diagnose(
  facts: DiagnosisFacts,
  dog: DogProfile
): Promise<DiagnosisResult> {
  const fallback = buildRuleBasedResult(facts, dog);
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL;
  if (!apiKey || !baseUrl) {
    return fallback;
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "あなたはドッグフードの適合性を保守的に評価するアシスタントです。",
              "与えられたデータベースの事実だけを根拠にし、商品に関する事実を創作しないでください。",
              "医療的な診断や治療の助言はしないでください。データが不足している場合は不確実であることを明記してください。",
              "次のキーを持つJSONオブジェクトのみを返してください: score(0-100の数値), level(\"Good\"|\"Caution\"|\"Avoid\"), mainIngredientsSummary(string), recommendedBreeds(string[]), recommendedLifeStages(string[]), allergyWarnings(string[]), avoidBreeds(string[]), riskIngredients(string[]), positiveIngredients(string[]), similarPriceFoods(string[]), similarIngredientFoods(string[]), sameManufacturerFoods(string[]), feedingNote(string), summary(string), disclaimer(string)。",
              "すべて日本語で書いてください。",
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              dog,
              databaseFacts: facts,
            }),
          },
        ],
      }),
    });
    if (!res.ok) {
      return fallback;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return fallback;
    }
    const parsed = JSON.parse(content) as Partial<DiagnosisResult>;

    // 類似フード3項目は必ずDBの結果で上書きし、免責文とスコア範囲を強制する。
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score ?? fallback.score))),
      level: ["Good", "Caution", "Avoid"].includes(parsed.level as string)
        ? (parsed.level as DiagnosisResult["level"])
        : fallback.level,
      mainIngredientsSummary: String(parsed.mainIngredientsSummary ?? fallback.mainIngredientsSummary),
      recommendedBreeds: Array.isArray(parsed.recommendedBreeds)
        ? parsed.recommendedBreeds.map(String)
        : fallback.recommendedBreeds,
      recommendedLifeStages: Array.isArray(parsed.recommendedLifeStages)
        ? parsed.recommendedLifeStages.map(String)
        : fallback.recommendedLifeStages,
      allergyWarnings: Array.isArray(parsed.allergyWarnings)
        ? parsed.allergyWarnings.map(String)
        : fallback.allergyWarnings,
      avoidBreeds: Array.isArray(parsed.avoidBreeds) ? parsed.avoidBreeds.map(String) : [],
      riskIngredients: Array.isArray(parsed.riskIngredients)
        ? parsed.riskIngredients.map(String)
        : fallback.riskIngredients,
      positiveIngredients: Array.isArray(parsed.positiveIngredients)
        ? parsed.positiveIngredients.map(String)
        : fallback.positiveIngredients,
      similarPriceFoods: fallback.similarPriceFoods,
      similarIngredientFoods: fallback.similarIngredientFoods,
      sameManufacturerFoods: fallback.sameManufacturerFoods,
      feedingNote: String(parsed.feedingNote ?? fallback.feedingNote),
      summary: String(parsed.summary ?? fallback.summary),
      disclaimer: DISCLAIMER,
    };
  } catch {
    return fallback;
  }
}
