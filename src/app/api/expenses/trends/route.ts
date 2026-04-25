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

    const [aggregate, categoryTotals] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: {
          userId: session.user.id,
          date: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const categories: Record<string, number> = {};
    for (const ct of categoryTotals) {
      categories[ct.category] = ct._sum.amount || 0;
    }

    results.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short" }),
      total: aggregate._sum.amount || 0,
      categories,
    });
  }

  return NextResponse.json({ trends: results });
}
