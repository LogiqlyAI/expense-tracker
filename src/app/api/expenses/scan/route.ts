import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scanReceipt } from "@/lib/anthropic";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

type AllowedMediaType = (typeof ALLOWED_TYPES)[number];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type as AllowedMediaType)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const result = await scanReceipt(
      base64Data,
      file.type as AllowedMediaType
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Scan error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Could not read this receipt. Please try a clearer photo." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Failed to scan receipt. Please try again." },
      { status: 500 }
    );
  }
}
