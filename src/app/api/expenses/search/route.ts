import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSearchQuery } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { query } = body;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const filters = await parseSearchQuery(query.trim());

    // Build Prisma where clause
    const where: Record<string, unknown> = { userId: session.user.id };

    if (filters.merchant) {
      where.merchant = { contains: filters.merchant, mode: "insensitive" };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo + "T23:59:59.999Z");
      where.date = dateFilter;
    }

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      const amountFilter: Record<string, number> = {};
      if (filters.amountMin !== undefined) amountFilter.gte = filters.amountMin;
      if (filters.amountMax !== undefined) amountFilter.lte = filters.amountMax;
      where.amount = amountFilter;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json({
      expenses,
      filters,
      query: query.trim(),
    });
  } catch (error) {
    console.error("Search error:", error);
    // Fallback: simple merchant search
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        merchant: { contains: query.trim(), mode: "insensitive" },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json({
      expenses,
      filters: { merchant: query.trim() },
      query: query.trim(),
    });
  }
}
