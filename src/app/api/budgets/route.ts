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

  const budget = await prisma.budget.upsert({
    where: {
      userId_category: {
        userId: session.user.id,
        category: category || null,
      },
    },
    update: { amount },
    create: {
      userId: session.user.id,
      category: category || null,
      amount,
    },
  });

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
