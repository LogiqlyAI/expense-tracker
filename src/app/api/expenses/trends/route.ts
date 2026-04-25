import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const monthsBack = parseInt(searchParams.get("months") || "6");

  const now = new Date();
  const results: { month: string; label: string; total: number; categories: Record<string, number> }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lt: endDate },
      },
      select: { amount: true, quantity: true, category: true },
    });

    let total = 0;
    const categories: Record<string, number> = {};
    for (const e of expenses) {
      const lineTotal = e.amount * e.quantity;
      total += lineTotal;
      categories[e.category] = (categories[e.category] || 0) + lineTotal;
    }

    results.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short" }),
      total,
      categories,
    });
  }

  return NextResponse.json({ trends: results });
}
