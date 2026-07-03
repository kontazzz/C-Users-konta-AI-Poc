import { NextRequest, NextResponse } from "next/server";
import {
  getProduct,
  getProductAllergens,
  getProductIngredients,
  getSameManufacturerFoods,
  getSimilarIngredientFoods,
  getSimilarPriceFoods,
} from "@/lib/foodDb";
import { diagnose, DiagnosisFacts } from "@/lib/ai";
import { createUserClient } from "@/lib/supabaseClient";
import { DiagnosisRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const supabase = createUserClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: DiagnosisRequest;
  try {
    body = (await req.json()) as DiagnosisRequest;
  } catch {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }
  if (!body.dog?.name?.trim()) {
    return NextResponse.json({ error: "犬の名前を入力してください。" }, { status: 400 });
  }

  const productId = body.productId;
  const facts: DiagnosisFacts = {
    product: productId != null ? getProduct(productId) : null,
    ingredients: productId != null ? getProductIngredients(productId) : [],
    allergens: productId != null ? getProductAllergens(productId) : [],
    similarPriceFoods: productId != null ? getSimilarPriceFoods(productId) : [],
    similarIngredientFoods: productId != null ? getSimilarIngredientFoods(productId) : [],
    sameManufacturerFoods: productId != null ? getSameManufacturerFoods(productId) : [],
    manualIngredients: body.manualIngredients ?? "",
    barcodeText: body.barcodeText ?? "",
  };

  const result = await diagnose(facts, body.dog);

  // 犬プロフィールを保存(同名は上書き)し、診断履歴を保存する。
  const userId = userData.user.id;
  const { data: dogRow } = await supabase
    .from("dogs")
    .upsert(
      {
        user_id: userId,
        name: body.dog.name.trim(),
        age_years: body.dog.ageYears,
        weight_kg: body.dog.weightKg,
        breed: body.dog.breed,
        life_stage: body.dog.lifeStage,
        allergies: body.dog.allergies,
      },
      { onConflict: "user_id,name" }
    )
    .select("id")
    .single();

  const { error: insertError } = await supabase.from("diagnoses").insert({
    user_id: userId,
    dog_id: dogRow?.id ?? null,
    dog_name: body.dog.name.trim(),
    product_id: facts.product?.product_id ?? null,
    product_name: facts.product
      ? `${facts.product.brand_name} ${facts.product.product_name}`
      : null,
    input: body,
    result,
  });

  return NextResponse.json({
    result,
    saved: !insertError,
    saveError: insertError?.message ?? null,
  });
}
