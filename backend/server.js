const express = require("express");
const cors = require("cors");
const axios = require("axios");

// load env
require("dotenv").config()

const app = express();
const PORT = process.env.PORT || 4000;

console.log("process.env.CORS_ORIGIN", process.env.CORS_ORIGIN);

// middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN
}));

app.use(express.json({limit: "10mb"}));

const languageMap = {
  hi: "hi-IN",
  en: "en-US",
  default: "en-US",
};

const detectLanguage = (text) => {
  // Hindi unicode range: U+0900 - U+097F
  const hindiRegex = /[\u0900-\u097F]/;

  if (hindiRegex.test(text)) {
    return "hi";
  }

  return "en";
};

const splitTextByLanguage = (text) => {
  const words = text.split(/\s+/);
  const segments = [];

  let currentSegment = "";
  let wordLang = null;

  for (let word of words) {
    const lang = detectLanguage(word);

    if (wordLang === null) {
      wordLang = lang;
      currentSegment = word;
    } else if (wordLang === lang) {
      currentSegment += " " + word;
    } else {
      // language changed save current segment and start new one
      if (currentSegment.trim()) {
        segments.push({
          text: currentSegment.trim(),
          language: wordLang,
        });
      }
      currentSegment = word;
      wordLang = lang;
    }
  }

  // insert last segment
  if (currentSegment.trim()) {
    segments.push({
      text: currentSegment.trim(),
      language: wordLang,
    });
  }

  return segments;
};

app.get("/health", (req, res) => {
  res.json({ status: "Ok", message: "TTS service is running" });
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "Text is required" });
    }

    const segments = splitTextByLanguage(text);

    const audioSegments = [];

    for (let segment of segments) {
      const language = languageMap[segment.language] || languageMap.default;
      try {
        // Using Google Translate TTS API (free alternative)
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodeURIComponent(
          segment.text
        )}`;
        const response = await axios.get(ttsUrl, {
          responseType: "arraybuffer",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        audioSegments.push({
          audio: Buffer.from(response.data).toString("base64"),
          text: segment.text,
          language: segment.language,
        });
      } catch (error) {
        console.log(error);
      }
    }

    res
      .status(200)
      .json({ success: true, segments: audioSegments, originalText: text });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch audio",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Production server is live!`);
  }
});
