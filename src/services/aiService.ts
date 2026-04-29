import { GoogleGenerativeAI } from "@google/generative-ai";

export const chunkText = (text: string, size: number = 800, overlap: number = 100): string[] => {
  const chunks: string[] = [];
  if (!text) return chunks;

  let i = 0;
  while (i < text.length) {
    chunks.push(text.substring(i, i + size));
    if (i + size >= text.length) break;
    i += (size - overlap);
  }
  return chunks;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found, skipping embedding");
    return [];
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Using the model you specified
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const generateAnswer = async (query: string, posts: any[]): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) {
    return "The AI functionality is not available because the GEMINI_API_KEY is missing.";
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Using the model you specified
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextStr = posts.map((p, i) => `Source [${i + 1}] (Title: ${p.title}, Author: ${p.sender?.username || 'Unknown'}):\n${p.content}`).join("\n\n---\n\n");

  const prompt = `
אתה עוזר חכם ברשת חברתית לבעלי חיים בשם MatchTail.
המשתמש שאל: "${query}"

להלן המידע הרלוונטי ביותר מהקהילה (מקורות):
${contextStr}

הנחיות למתן התשובה:
1. ענה בעברית בלבד.
2. התבסס אך ורק על המידע שסופק לעיל. אם המידע לא קיים במקורות, ציין זאת בנימוס.
3. עליך לציין בפירוש על איזה מקור אתה מתבסס בתשובתך (למשל: "לפי הפוסט של [שם], ...").
4. אם יש סתירות בין מקורות, ציין זאת.
5. שמור על טון חיובי ועוזר.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};
