import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Budget fetch error:", error);
    return NextResponse.json({ budgets: [] });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { category, amount } = body;

  if (typeof amount !== "number" || amount < 0) {
    return NextResponse.json({ error: "Amount must be a non-negative number" }, { status: 400 });
  }

  const cat = category || null;

  // Prisma upsert doesn't work with null in composite unique keys (NULL != NULL in SQL)
  // So we manually find + update or create
  const existing = await prisma.budget.findFirst({
    where: { userId: session.user.id, category: cat },
  });

  let budget;
  if (existing) {
    budget = await prisma.budget.update({
      where: { id: existing.id },
      data: { amount },
    });
  } else {
    budget = await prisma.budget.create({
      data: { userId: session.user.id, category: cat, amount },
    });
  }

  return NextResponse.json({ budget });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { category } = body;

  await prisma.budget.deleteMany({
    where: {
      userId: session.user.id,
      category: category || null,
    },
  });

  return NextResponse.json({ success: true });
}
