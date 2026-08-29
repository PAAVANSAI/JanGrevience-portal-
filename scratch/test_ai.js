require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = `
You are an intelligent grievance routing assistant for a municipal government and CPGRAMS portal.
Your job is to read a citizen's natural language description of their problem and classify it into one of the provided departments and categories.

Before classifying, you must first critically ANALYZE the grievance against the provided department descriptions. Identify the core issue, who is affected, and what government body would typically handle it.
After your analysis, select the MOST APPROPRIATE department and category from the provided taxonomy. If you are unsure, you MUST select the "Other / Not Sure" department if it exists, or the "Other" category within a matched department.

Here are the available departments and their categories (with descriptions of what they handle):
[
  {
    "departmentName": "Electricity Board",
    "departmentDescription": "Handles power outages, billing, and new connections.",
    "departmentId": "dept-uuid-123",
    "categories": [
      {
        "categoryName": "Streetlight Not Working",
        "categoryDescription": null,
        "categoryId": "cat-uuid-456"
      }
    ]
  }
]

Citizen Description: "Street light pole #45 outside my house has been completely off for the last 3 days."

Respond strictly with a JSON object in this exact format (do not use markdown tags like \`\`\`json):
{
  "analysis": "Your step-by-step reasoning about the core issue and what type of department should handle it.",
  "suggestedDepartmentId": "uuid-string-from-taxonomy",
  "suggestedCategoryId": "uuid-string-from-taxonomy",
  "confidence": 95,
  "reasoning": "A concise 1-sentence explanation of why this specific department/category was chosen."
}

If the description is complete gibberish or entirely unrelated to government services, set suggestedDepartmentId and suggestedCategoryId to null, and confidence to 0.
`;

ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: prompt,
  config: { responseMimeType: 'application/json' }
}).then(res => console.log(res.text)).catch(console.error);
