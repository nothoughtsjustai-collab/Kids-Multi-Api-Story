import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Fix node localhost resolution issues
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini SDK with User-Agent for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Guard helper to check for API keys safely on request time
const checkApiKey = (res: any) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: "GEMINI_API_KEY is not defined. Please add your key in Settings > Secrets.",
    });
    return false;
  }
  return true;
};

// --- API ROUTES ---

// 1. Generate Story Endpoint (supports custom models and system roles for multi-routing APIs)
app.post("/api/generate-story", async (req, res) => {
  if (!checkApiKey(res)) return;

  const {
    characterName,
    characterType,
    setting,
    theme,
    style,
    model = "gemini-2.5-flash",
    systemInstruction = "You are an award-winning children's book author and expert storyteller."
  } = req.body;

  try {
    const prompt = `Write a delightful, creative children's story (3-5 pages long) featuring:
- Hero: a ${characterType} named ${characterName}
- Location: a magical setting of "${setting}"
- Theme/Lesson: "${theme}"
- Visual Illustration Style specified: "${style}"

For each page, provide:
1. 2 to 4 simple, highly engaging sentences suited for a child.
2. A detailed illustration prompt for making matching artwork. Include character descriptors, colors, objects, lighting, and specify the art style "${style}" to keep illustrations visually beautiful of the story scene.

Return the result as clean JSON following the schema perfectly.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the children's story" },
            pages: {
              type: Type.ARRAY,
              description: "An ordered array of story pages",
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING, description: "Highly engaging child-friendly story paragraph (2-4 sentences)." },
                  illustrationPrompt: { type: Type.STRING, description: "Descriptive background, characters, actions, art details, and visual medium, written as a detailed prompt for an image generator (Imagen) to illustrate this scene." }
                },
                required: ["pageNumber", "text", "illustrationPrompt"]
              }
            }
          },
          required: ["title", "pages"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No text response generated from Gemini.");
    }

    const storyData = JSON.parse(response.text.trim());
    res.json(storyData);
  } catch (error: any) {
    console.error("Story generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate story." });
  }
});

// 2. Generate Illustration (gemini-2.5-flash-image)
app.post("/api/generate-illustration", async (req, res) => {
  if (!checkApiKey(res)) return;

  const { prompt, size } = req.body;
  const imageSize = size || "1K"; // Supported sizes: 1K, 2K, 4K

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `${prompt}. Kid-friendly, visually stunning, high-quality detailed illustration.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: imageSize
        }
      }
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
    } else {
      res.status(500).json({ error: "No image inlineData found in the response." });
    }
  } catch (error: any) {
    console.error("Illustration generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate illustration." });
  }
});

// 3. Convert Text to Speech (gemini-3.1-flash-tts-preview)
app.post("/api/tts", async (req, res) => {
  if (!checkApiKey(res)) return;

  const { text, voice } = req.body;
  const selectedVoice = voice || "Kore"; // Prebuilt Voices: Puck, Charon, Kore, Fenrir, Zephyr

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(500).json({ error: "No audio data found in TTS response." });
    }
  } catch (error: any) {
    console.error("TTS error:", error);
    res.status(500).json({ error: error.message || "Failed to convert text to speech." });
  }
});

// 4. Companion Chat
app.post("/api/chat", async (req, res) => {
  if (!checkApiKey(res)) return;

  const { companionId, message, history } = req.body;

  let modelName = "gemini-2.5-flash"; // Default
  let sysInstruction = "";

  if (companionId === "dragon") {
    modelName = "gemini-2.5-pro"; // Complex Narrative Task
    sysInstruction = `You are Barnaby, a warm, lively, and courageous purple storybook dragon! Speak directly to kids in a supportive, lively, and family-approved tone. Use imagination and prompt the child with helpful questions about story creation, narrative logic, and creative characters. Keep it playful and friendly!`;
  } else if (companionId === "owl") {
    modelName = "gemini-2.5-flash"; // General Educational Task
    sysInstruction = `You are Pip, a wise and thoughtful pixel-art owl scholar. You answer educational or scientific questions in an exciting way using simple kid-friendly metaphors. Speak kindly and clearly to explain amazing things about nature, science, space, or life. Encourage curiosity!`;
  } else if (companionId === "pup") {
    modelName = "gemini-2.5-flash"; // Fast, snappy, playful riddles
    sysInstruction = `You are Sparky, an ultra-fast, high-energy robotic pup! You tell rapid funny jokes, robotics fun-facts, and ask quick-fire simple word riddles. Keep answers quick, snappy, responsive, and bubble with cute puppy barks (like "Arf! Bzzzt!", "Woof! Click!")! This should feel fast and hyper-interactive.`;
  }

  try {
    // Standard modular format for multi-turn chat history
    const contents = [
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.8,
      },
    });

    if (response.text) {
      res.json({ text: response.text });
    } else {
      res.status(500).json({ error: "Empty chat response from Gemini." });
    }
  } catch (error: any) {
    console.error("Chat companion error:", error);
    res.status(500).json({ error: error.message || "Failed to chat with companion." });
  }
});

// --- CLIENT SERVING ---

// Integrate with Vite for development and static content structure for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
