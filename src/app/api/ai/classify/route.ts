import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch Departments and Categories
    const { data: departments } = await supabase.from("departments").select("id, name");
    const { data: categories } = await supabase.from("categories").select("id, name, department_id");

    if (!departments || !categories) {
      throw new Error("Failed to load taxonomy from database.");
    }

    // Build taxonomy map for prompt
    const taxonomy = departments.map((d) => ({
      departmentName: d.name,
      departmentId: d.id,
      categories: categories
        .filter((c) => c.department_id === d.id)
        .map((c) => ({ categoryName: c.name, categoryId: c.id })),
    }));

    const prompt = `
You are an intelligent grievance routing assistant for a municipal government and CPGRAMS portal.
Your job is to read a citizen's natural language description of their problem and classify it into one of the provided departments and categories.

Before classifying, you must first critically ANALYZE the grievance. Identify the core issue, who is affected, and what government body would typically handle it.
After your analysis, select the MOST APPROPRIATE department and category from the provided taxonomy.

Here are the available departments and their categories:
${JSON.stringify(taxonomy, null, 2)}

Citizen Description: "${description}"

Respond strictly with a JSON object in this exact format (do not use markdown tags like \`\`\`json):
{
  "analysis": "Your step-by-step reasoning about the core issue and what type of department should handle it.",
  "suggestedDepartmentId": "uuid-string-from-taxonomy",
  "suggestedCategoryId": "uuid-string-from-taxonomy",
  "confidence": number-between-0-and-100,
  "reasoning": "A concise 1-sentence explanation of why this specific department/category was chosen."
}

If the description is complete gibberish or entirely unrelated to government services, set suggestedDepartmentId and suggestedCategoryId to null, and confidence to 0.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty AI response");

    const result = JSON.parse(responseText);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("AI Classification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
