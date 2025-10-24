import { useRef, useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audioSegments, setAudioSegments] = useState([]);
  const audioRefs = useRef([]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    setError("");
  };

  const getLanguageLabel = (lang) => {
    const labels = {
      hi: "Hindi",
      en: "English",
      default: "Auto",
    };
    return labels[lang] || labels.default;
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      setError("Please enter some text to get speech");
    }

    setError("");
    setIsLoading(true);
    setAudioSegments([]);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await response.json();
      console.log("data", data);
      if (data.success) {
        setAudioSegments(data.segments);
      } else {
        setError(data.error || "Failed to generate speech");
      }
    } catch (e) {
      setError("Network error");
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h2>Multilingual Text to Audio App</h2>
        </header>

        <div className="input-section">
          <div className="input-container">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Type your text here... Mix Hindi and English as you like!"
              className="text-input"
              rows={6}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button
            className="generate-btn"
            onClick={generateSpeech}
            disabled={isLoading}
          >
            {isLoading ? "Generating" : "Generate Speech"}
          </button>
        </div>
      </div>

      {audioSegments.length > 0 && (
        <div className="audio-section">
          <h3>Generated Audio Segments</h3>
          <div className="segment-container">
            {audioSegments.map((segment, index) => (
              <div key={index} className="audio-segment">
                <div className="segment-header">
                  <span
                    className="language-tag"
                    style={{ backgroundColor: "#e68080ff" }}
                  >
                    {getLanguageLabel(segment.language)}
                  </span>
                  <span className="segment-text">{segment.text}</span>
                </div>
                <audio
                  className="audio-player"
                  ref={(el) => audioRefs.current[index] == el}
                  controls
                >
                  <source
                    src={`data:audio/mpeg; base64, ${segment.audio}`}
                    type="audio/mpeg"
                  />
                  Your browser does not support he audio element
                </audio>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
