import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  try {
    const data = await getNews(forceRefresh);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
