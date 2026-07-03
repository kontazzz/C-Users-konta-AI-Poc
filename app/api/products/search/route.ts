import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/foodDb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const products = searchProducts(q, 20);
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json(
      { error: "商品データベースを読み込めませんでした。dog_food_jp.sqlite が生成済みか確認してください。" },
      { status: 500 }
    );
  }
}
