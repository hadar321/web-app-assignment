import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found, skipping embedding");
    return [];
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextStr = posts.map((p, i) => `Post ${i + 1} (Title: ${p.title}): ${p.content}`).join("\n\n");
  
  const prompt = `
You are a helpful assistant for an animal-focused social network.
A user asked the following question: "${query}"

Here are the most relevant posts from our community:
${contextStr}

Please answer the user's question based strictly on the content of these posts. Answer in Hebrew. If the posts don't contain enough information to answer the question, state that gracefully.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};
