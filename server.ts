import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Maximum payload size for receiving compressed base64 camera photos
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini SDK with telemetry headers
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Google GenAI SDK:", err);
  }
} else {
  console.warn("GEMINI_API_KEY environment variable is missing or placeholder. Running Gemini service in Sandbox Simulation Mode.");
}

// Help utility to parse data URL structure
function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    return {
      mimeType: "image/png",
      base64Data: dataUrl,
    };
  }
  return {
    mimeType: matches[1],
    base64Data: matches[2],
  };
}

// Server Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiEnabled: !!ai });
});

// Interactive 1S Checklist Analyzer Endpoint
app.post("/api/gemini/analyze-checklist", async (req, res) => {
  try {
    const { checklistImg } = req.body;
    if (!checklistImg) {
      return res.status(400).json({ error: "No image of checklist paper provided." });
    }

    const { mimeType, base64Data } = parseDataUrl(checklistImg);

    // If API Key is not available, we run a sophisticated, high-fidelity OCR simulation
    if (!ai) {
      console.log("Simulating 1S Checklist Inspection (No Gemini Key)...");
      // Simulate real-world 1S evaluations
      const simulatedScores = {
        sortingUnnecessary: Math.floor(Math.random() * 3) + 3, // 3 - 5
        clearAisles: Math.floor(Math.random() * 2) + 4,        // 4 - 5
        storageLabels: Math.floor(Math.random() * 3) + 2,      // 2 - 5
        binDisposal: Math.floor(Math.random() * 2) + 4,        // 4 - 5
        safetyHazards: Math.floor(Math.random() * 3) + 3,      // 3 - 5
      };
      const totalScore = Object.values(simulatedScores).reduce((a, b) => a + b, 0);
      const maxScore = 25;
      const compliancePercentage = Math.round((totalScore / maxScore) * 100);

      // 5% chance of misaligned warning to demo the "red visual alignment box"
      const isMisaligned = Math.random() < 0.08;

      if (isMisaligned) {
        return res.json({
          status: "invalid",
          message: "Checklist margins are slightly cut off or writings are blurry. Please realign the checklist paper boundary within the scanner box.",
          isReadable: false,
          extractedData: null,
          isSimulation: true,
        });
      }

      return res.json({
        status: "valid",
        message: "Starsteel 1S Checklist captured and parsed successfully! (Sandbox Simulation Mode)",
        isReadable: true,
        extractedData: {
          auditorName: "John Doe",
          auditorEmail: "tester@starsteel.com",
          zone: "MECHANICAL DEVELOPMENT - ZONE -4",
          date: new Date().toISOString().split("T")[0],
          scores: simulatedScores,
        },
        isSimulation: true,
      });
    }

    // Call the real Google Gemini API
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const promptText = `
      You are the high-precision document scanner and 5S auditor for "Starsteel 5S ZONE-WISE 1S AUDIT PERFORMANCE".
      Analyze the attached image of a handwritten or printed paper checklist.

      1. Alignment & Readability Check:
         - Inspect if the text, checkboxes, notes, and writings are fully visible, clear, and well-positioned.
         - If the image is blurry, upside down, excessively cut off, or not actually a checklist paper, return status "invalid" and specify a helpful instruction (e.g. "blurry", "misaligned") in the message.

      2. Score Extraction:
         We rate 1S compliance based on 5 parameters (each has a score from 1 to 5, where 1 is poor and 5 is outstanding):
         - Sorting Unnecessary Items (sortingUnnecessary)
         - Aisles & Doorways Clear (clearAisles)
         - Material & Tool Storage Organization/Labels (storageLabels)
         - Bin Disposal & Waste Segregation (binDisposal)
         - Safety Hazard Mitigation & Sorting (safetyHazards)

         Look for checkmarks, circled numbers, or written ratings.
         If ratings are not written, look for checked/unchecked boxes to assign standard scores (e.g., if fully checked, score 5; if blank, score 1).
         If it is a generic photo but readable, make an accurate assessment based on the items checked.

      3. Metadata Extraction:
         - Read the Auditor Name, Auditor Email, Zone, and Date if there is any visible handwriting.
         - For Zone, map it to one of these valid Starsteel zones if mentioned:
           - "C5 TO C8 - ZONE -1", "C1 TO C4 - ZONE -2", "ROUCHING - ZONE -3", "MECHANICAL DEVELOPMENT - ZONE -4", "MECHANICAL MAINTENANCE - ZONE -5", "HOT CHARGING - ZONE -6", "ECR ROOM ZONE -7", "CHAIN TRANSFER ZONE -8", "RHF & RFO -9", "ROLL SHOP -ZONE -10", "WORKSHOP -ZONE -10",
           - Or SMS branches: "FURNACE-1 -ZONE -1", "FURNACE-2 -ZONE 2", "CCM -ZONE -3", "FABRICATION YARD -ZONE -4", "SMS ELECTRICAL -ZONE-5", "SMS REWIDING ROOM -ZONE-6".
         - If not specified on the sheet, leave the metadata fields empty or use best guesses.

      Return a strict JSON object structure adhering to this schema:
      {
        "status": "valid" or "invalid",
        "message": "Reason for valid/invalid status",
        "isReadable": true or false,
        "extractedData": {
          "auditorName": "string or empty",
          "auditorEmail": "string or empty",
          "zone": "string matching layout list, or empty",
          "date": "YYYY-MM-DD or empty",
          "scores": {
            "sortingUnnecessary": number (integer 1 to 5),
            "clearAisles": number (integer 1 to 5),
            "storageLabels": number (integer 1 to 5),
            "binDisposal": number (integer 1 to 5),
            "safetyHazards": number (integer 1 to 5)
          }
        }
      }
    `;

    console.log("Analyzing camera capture via Gemini-3.5-Flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["status", "message", "isReadable"],
          properties: {
            status: { type: Type.STRING, description: "Whether the checklist is readable and acceptable." },
            message: { type: Type.STRING, description: "A message describing the checklist quality." },
            isReadable: { type: Type.BOOLEAN, description: "True if readable and can extract score data." },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                auditorName: { type: Type.STRING },
                auditorEmail: { type: Type.STRING },
                zone: { type: Type.STRING },
                date: { type: Type.STRING },
                scores: {
                  type: Type.OBJECT,
                  required: ["sortingUnnecessary", "clearAisles", "storageLabels", "binDisposal", "safetyHazards"],
                  properties: {
                    sortingUnnecessary: { type: Type.INTEGER },
                    clearAisles: { type: Type.INTEGER },
                    storageLabels: { type: Type.INTEGER },
                    binDisposal: { type: Type.INTEGER },
                    safetyHazards: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error) {
    console.error("Gemini paper analysis failed:", error);
    res.status(500).json({ error: "Checklist scanning service encountered an error.", details: String(error) });
  }
});

// Configure Vite middleware in development or serve static build files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in Development Mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in Production Mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Starsteel full-stack server listening on http://localhost:${PORT}`);
  });
}

startServer();
