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

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate, lt: endDate },
    },
    select: { amount: true, quantity: true, category: true },
  });

  const categoryMap: Record<string, { total: number; count: number }> = {};
  let totalSpent = 0;

  for (const e of expenses) {
    const lineTotal = e.amount * e.quantity;
    totalSpent += lineTotal;
    if (!categoryMap[e.category]) {
      categoryMap[e.category] = { total: 0, count: 0 };
    }
    categoryMap[e.category].total += lineTotal;
    categoryMap[e.category].count += 1;
  }

  const categories = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
  }));

  return NextResponse.json({
    categories,
    totalSpent,
    expenseCount: expenses.length,
    year,
    month,
  });
}
