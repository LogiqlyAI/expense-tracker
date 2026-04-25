import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./validations";

const client = new Anthropic();

// --- Insights ---

interface ExpenseData {
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  description?: string | null;
}

interface BudgetData {
  category: string | null;
  amount: number;
}

const insightSchema = z.object({
  summary: z.string(),
  trends: z.array(z.object({ text: z.string(), type: z.enum(["positive", "negative", "neutral"]) })),
  alerts: z.array(z.object({ text: z.string(), severity: z.enum(["warning", "critical"]) })),
  tips: z.array(z.string()),
});

export type InsightResult = z.infer<typeof insightSchema>;

export async function generateInsights(
  expenses: ExpenseData[],
  previousExpenses: ExpenseData[],
  budgets: BudgetData[]
): Promise<InsightResult> {
  const currentTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const prevTotal = previousExpenses.reduce((s, e) => s + e.amount, 0);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a personal finance analyst. Analyze this spending data and return ONLY valid JSON.

CURRENT MONTH EXPENSES (${expenses.length} transactions, total: $${currentTotal.toFixed(2)}):
${JSON.stringify(expenses.map((e) => ({ merchant: e.merchant, amount: e.amount, category: e.category, date: e.date })))}

PREVIOUS MONTH EXPENSES (${previousExpenses.length} transactions, total: $${prevTotal.toFixed(2)}):
${JSON.stringify(previousExpenses.map((e) => ({ merchant: e.merchant, amount: e.amount, category: e.category, date: e.date })))}

BUDGETS SET:
${budgets.length > 0 ? JSON.stringify(budgets.map((b) => ({ category: b.category || "OVERALL", limit: b.amount }))) : "No budgets set"}

Return this JSON structure:
{
  "summary": "1-2 sentence overview of spending this month",
  "trends": [{"text": "observation about spending pattern", "type": "positive|negative|neutral"}],
  "alerts": [{"text": "warning about overspending or budget", "severity": "warning|critical"}],
  "tips": ["actionable suggestion to save money"]
}

Rules:
- Compare current vs previous month for trends
- Flag categories where spending increased >20%
- If budgets exist, check if spending is on track
- Keep each insight concise (1 sentence)
- Return 2-4 trends, 0-2 alerts, 1-3 tips
- If no data, still return the structure with a helpful summary`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonText = jsonMatch[1].trim();

  const parsed = JSON.parse(jsonText);
  return insightSchema.parse(parsed);
}

// --- Search Query Parsing ---

const searchFiltersSchema = z.object({
  merchant: z.string().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export async function parseSearchQuery(query: string): Promise<SearchFilters> {
  const today = new Date().toISOString().split("T")[0];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Parse this expense search query into structured filters. Return ONLY valid JSON.

Query: "${query}"
Today's date: ${today}

Return this JSON (only include fields that the query specifies):
{
  "merchant": "merchant name to search for (partial match)",
  "category": "one of: GROCERIES, DINING, TRANSPORTATION, ENTERTAINMENT, UTILITIES, HEALTHCARE, SHOPPING, TRAVEL, OTHER",
  "dateFrom": "YYYY-MM-DD",
  "dateTo": "YYYY-MM-DD",
  "amountMin": 0.00,
  "amountMax": 0.00
}

Examples:
- "coffee last week" → {"merchant": "coffee", "dateFrom": "...", "dateTo": "..."}
- "dining over $50" → {"category": "DINING", "amountMin": 50}
- "grab rides in March" → {"merchant": "grab", "dateFrom": "2026-03-01", "dateTo": "2026-03-31"}
- "groceries under $20" → {"category": "GROCERIES", "amountMax": 20}

Return {} if the query is too vague to parse.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return {};

  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonText = jsonMatch[1].trim();

  try {
    const parsed = JSON.parse(jsonText);
    return searchFiltersSchema.parse(parsed);
  } catch {
    return {};
  }
}

// --- Receipt Scanning ---

const scanResultSchema = z.object({
  merchant: z.string(),
  amount: z.number(),
  date: z.string(),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type ScanResult = z.infer<typeof scanResultSchema>;

export async function scanReceipt(
  base64Data: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<ScanResult> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: "text",
            text: `Extract the following from this receipt image. Return ONLY valid JSON, no other text.

{
  "merchant": "store/restaurant name",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "one of: GROCERIES, DINING, TRANSPORTATION, ENTERTAINMENT, UTILITIES, HEALTHCARE, SHOPPING, TRAVEL, OTHER",
  "description": "brief description of purchase",
  "confidence": "HIGH | MEDIUM | LOW"
}

Rules:
- amount must be a number (the total/grand total, not subtotal)
- date in ISO format; if year is missing, assume ${new Date().getFullYear()}
- Pick the single best category
- Set confidence to LOW if the receipt is blurry or you're unsure about any field`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response (handle markdown code blocks)
  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText);
  const validated = scanResultSchema.parse(parsed);
  return validated;
}
