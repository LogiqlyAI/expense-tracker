import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateInsights } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const year = parseInt(body.year || String(new Date().getFullYear()));
  const month = parseInt(body.month || String(new Date().getMonth() + 1));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const prevStartDate = new Date(year, month - 2, 1);
  const prevEndDate = startDate;

  try {
    const [expenses, previousExpenses, budgets] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: session.user.id, date: { gte: startDate, lt: endDate } },
        orderBy: { date: "desc" },
      }),
      prisma.expense.findMany({
        where: { userId: session.user.id, date: { gte: prevStartDate, lt: prevEndDate } },
        orderBy: { date: "desc" },
      }),
      prisma.budget.findMany({
        where: { userId: session.user.id },
      }),
    ]);

    const expenseData = expenses.map((e) => ({
      merchant: e.merchant,
      amount: e.amount,
      currency: e.currency,
      date: e.date.toISOString().split("T")[0],
      category: e.category,
      description: e.description,
    }));

    const prevExpenseData = previousExpenses.map((e) => ({
      merchant: e.merchant,
      amount: e.amount,
      currency: e.currency,
      date: e.date.toISOString().split("T")[0],
      category: e.category,
      description: e.description,
    }));

    const budgetData = budgets.map((b) => ({
      category: b.category,
      amount: b.amount,
    }));

    const insights = await generateInsights(expenseData, prevExpenseData, budgetData);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
