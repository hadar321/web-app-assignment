import axios from "axios";

const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
const huggingFaceEmbeddingModel = process.env.HUGGINGFACE_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const huggingFaceTextModel = process.env.HUGGINGFACE_TEXT_MODEL || "google/flan-t5-small";

let lastAiRequestTime = 0;
let requestQueue: Promise<unknown> = Promise.resolve();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enqueueAiRequest<T>(fn: () => Promise<T>): Promise<T> {
  const queued = requestQueue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, 3000 - (now - lastAiRequestTime));
    if (wait > 0) {
      await delay(wait);
    }
    const result = await fn();
    lastAiRequestTime = Date.now();
    return result;
  });
  requestQueue = queued.catch(() => undefined);
  return queued as Promise<T>;
}

export function isAiEnabled(): boolean {
  return Boolean(huggingFaceApiKey);
}

async function requestHuggingFaceModel(model: string, payload: object): Promise<any> {
  if (!huggingFaceApiKey) {
    throw new Error("Hugging Face API key is not configured.");
  }

  const response = await enqueueAiRequest(() =>
    axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${huggingFaceApiKey}`,
          "Content-Type": "application/json",
        },
      },
    ),
  );

  return response.data;
}

async function embedWithHuggingFace(text: string): Promise<number[] | undefined> {
  if (!huggingFaceApiKey) {
    return undefined;
  }

  const data = await requestHuggingFaceModel(huggingFaceEmbeddingModel, { inputs: text });
  if (Array.isArray(data)) {
    return data as number[];
  }
  if (Array.isArray(data?.embedding)) {
    return data.embedding as number[];
  }
  return undefined;
}

export async function embedText(text: string): Promise<number[] | undefined> {
  if (!text?.trim()) {
    return undefined;
  }

  return embedWithHuggingFace(text);
}

export async function answerFromChunks(
  query: string,
  chunks: { chunkText: string; postId: string; chunkIndex: number }[],
): Promise<string | undefined> {
  if (!chunks.length) {
    return undefined;
  }

  const formattedChunks = chunks
    .map((chunk, index) => `Chunk ${index + 1} (post ${chunk.postId}): ${chunk.chunkText}`)
    .join("\n\n");

  const prompt = `The user asked: "${query}". Use only the following chunks from posts to answer concisely and helpfully. Do not invent facts beyond the provided chunks.\n\n${formattedChunks}`;

  const data = await requestHuggingFaceModel(huggingFaceTextModel, {
    inputs: prompt,
    parameters: {
      max_new_tokens: 250,
      temperature: 0.7,
      return_full_text: false,
    },
    options: { wait_for_model: true },
  });

  if (Array.isArray(data) && typeof data[0]?.generated_text === "string") {
    return data[0].generated_text.trim();
  }
  if (typeof data?.generated_text === "string") {
    return data.generated_text.trim();
  }
  return undefined;
}
