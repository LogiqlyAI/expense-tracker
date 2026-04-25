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
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const [categoryTotals, aggregates] = await Promise.all([
    prisma.expense.groupBy({
      by: ["category"],
      where: {
        userId: session.user.id,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const categories = categoryTotals.map((ct) => ({
    category: ct.category,
    total: ct._sum.amount || 0,
    count: ct._count,
  }));

  return NextResponse.json({
    categories,
    totalSpent: aggregates._sum.amount || 0,
    expenseCount: aggregates._count,
    year,
    month,
  });
}
