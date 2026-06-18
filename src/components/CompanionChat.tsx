import React, { useState, useRef, useEffect } from "react";
import { CompanionDetail, CompanionRole, ChatMessage } from "../types";
import { MessageSquare, Send, Volume2, Sparkles, Loader2, Bot, User, Backpack } from "lucide-react";

export const COMPANIONS: CompanionDetail[] = [
  {
    id: "dragon",
    name: "Barnaby the Story Dragon",
    avatar: "🐉",
    color: "from-pink-400 to-purple-600",
    bgColor: "bg-purple-50",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    borderColor: "border-purple-300",
    roleDescription: "Helps brainstorm magical adventure story plots & crazy twists!",
    modelUsed: "gemini-2.5-pro (Creative Storyologist)",
    greeting: "Roooar! Happy to see you! I am Barnaby. Tell me, what kind of magical forest or crazy rocketship adventure should we imagine next?",
  },
  {
    id: "owl",
    name: "Pip the Wise Owl",
    avatar: "🦉",
    color: "from-amber-400 to-emerald-600",
    bgColor: "bg-emerald-50",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    borderColor: "border-emerald-300",
    roleDescription: "Answers any science, space, nature, or story question in simple kid terms.",
    modelUsed: "gemini-2.5-flash (Wise Knowledge Expert)",
    greeting: "Whooo-whooo! Hello young scholar! I am Pip. Ask me anything about how the moon shines, why leaves turn red, or secrets about our story!",
  },
  {
    id: "pup",
    name: "Sparky the Robo-Pup",
    avatar: "🐶",
    color: "from-cyan-400 to-blue-600",
    bgColor: "bg-blue-50",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    borderColor: "border-blue-300",
    roleDescription: "Tells rapid puzzle riddles and fun fast-talk robot facts!",
    modelUsed: "gemini-2.5-flash (Lightning Fast Companion)",
    greeting: "Arf! Arf! Click-clack! Sparky online! Want to play a lightning-fast word riddle or hear a fun fast-bark facts game? Ask me, woof!",
  },
];

interface CompanionChatProps {
  onSuggestTopic?: (topic: string) => void;
}

export function CompanionChat({ onSuggestTopic }: CompanionChatProps) {
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionRole>("dragon");
  const [messages, setMessages] = useState<Record<CompanionRole, ChatMessage[]>>({
    dragon: [{ role: "model", text: COMPANIONS[0].greeting }],
    owl: [{ role: "model", text: COMPANIONS[1].greeting }],
    pup: [{ role: "model", text: COMPANIONS[2].greeting }],
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const currentCompanion = COMPANIONS.find((c) => c.id === selectedCompanionId)!;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedCompanionId, isLoading]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) {}
      activeSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setSpeakingIndex(null);
  };

  const playRawPcmBase64 = (base64: string, sampleRate = 24000) => {
    stopAudio();
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const buffer = bytes.buffer;
      const int16Array = new Int16Array(buffer);

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass({ sampleRate });
      audioCtxRef.current = audioCtx;

      const audioBuffer = audioCtx.createBuffer(1, int16Array.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0; // Normalize little-endian PCM
      }

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      activeSourceRef.current = source;

      source.onended = () => {
        setSpeakingIndex(null);
      };
    } catch (err) {
      console.error("PCM Audio playback error:", err);
      setSpeakingIndex(null);
    }
  };

  const handleSpeak = async (text: string, index: number) => {
    if (speakingIndex === index) {
      stopAudio();
      return;
    }

    setSpeakingIndex(index);

    // Map companion to prebuilt voice configs
    let voiceName = "Kore"; // Warm/Friendly (default)
    if (selectedCompanionId === "dragon") voiceName = "Fenrir"; // Deep/Bold dragon
    if (selectedCompanionId === "owl") voiceName = "Charon"; // Calm/Wise owl
    if (selectedCompanionId === "pup") voiceName = "Puck"; // Cheerful/Clownish pup

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voiceName }),
      });

      const data = await response.json();
      if (data.audio) {
        playRawPcmBase64(data.audio);
      } else {
        throw new Error(data.error || "No audio returned.");
      }
    } catch (err) {
      console.error("TTS request error:", err);
      setSpeakingIndex(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    stopAudio();
    const userMessage = input.trim();
    setInput("");

    const currentHistory = messages[selectedCompanionId];
    const newHistory: ChatMessage[] = [...currentHistory, { role: "user", text: userMessage }];

    setMessages((prev) => ({
      ...prev,
      [selectedCompanionId]: newHistory,
    }));

    setIsLoading(true);

    try {
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companionId: selectedCompanionId,
          message: userMessage,
          history: currentHistory, // send previous turns
        }),
      });

      const responseData = await chatResponse.json();
      if (responseData.text) {
        const assistantText = responseData.text;
        setMessages((prev) => ({
          ...prev,
          [selectedCompanionId]: [...newHistory, { role: "model", text: assistantText }],
        }));
      } else {
        throw new Error(responseData.error || "Failed chat reply.");
      }
    } catch (err: any) {
      setMessages((prev) => ({
        ...prev,
        [selectedCompanionId]: [
          ...newHistory,
          { role: "model", text: `Oh double-woof and dragons! I hit a tiny pebble. Let's try saying that again: ${err.message}` },
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="companion-chat-module" className="flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
      {/* Header Selectable Companions */}
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pick Your Story Companion</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {COMPANIONS.map((companion) => {
            const isSelected = companion.id === selectedCompanionId;
            return (
              <button
                key={companion.id}
                id={`btn-select-${companion.id}`}
                onClick={() => {
                  stopAudio();
                  setSelectedCompanionId(companion.id);
                }}
                className={`p-2.5 rounded-2xl flex flex-col items-center border transition-all ${
                  isSelected
                    ? "bg-amber-100 border-amber-300 shadow-xs scale-102"
                    : "bg-white border-gray-200 hover:bg-gray-50 active:scale-98"
                }`}
              >
                <span className="text-2xl mb-1 filter drop-shadow-sm">{companion.avatar}</span>
                <span className="text-[10px] font-semibold text-center leading-tight truncate w-full text-gray-700">
                  {companion.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Companion Banner */}
      <div className={`px-4 py-2 bg-gradient-to-r ${currentCompanion.color} text-white flex items-center justify-between`}>
        <div className="truncate pr-2">
          <div className="text-xs font-bold flex items-center gap-1">
            <span>{currentCompanion.name}</span>
          </div>
          <p className="text-[9px] opacity-90 truncate">{currentCompanion.roleDescription}</p>
        </div>
        <span className="text-[8px] bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded-full font-mono shrink-0">
          {selectedCompanionId === "dragon" ? "gemini-2.5-pro" : "gemini-2.5-flash"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages[selectedCompanionId].map((msg, idx) => {
          const isModel = msg.role === "model";
          return (
            <div
              key={idx}
              id={`chat-msg-${idx}`}
              className={`flex items-start gap-2 ${isModel ? "justify-start" : "justify-end animate-fade-in"}`}
            >
              {isModel && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${currentCompanion.bgColor} border ${currentCompanion.borderColor}`}>
                  {currentCompanion.avatar}
                </div>
              )}

              <div className="relative group max-w-[80%]">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isModel
                      ? "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                      : "bg-amber-400 text-amber-950 font-medium rounded-tr-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {isModel && (
                  <button
                    id={`speech-btn-${idx}`}
                    title="Read response aloud"
                    onClick={() => handleSpeak(msg.text, idx)}
                    className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border shadow-xs transition-colors ${
                      speakingIndex === idx
                        ? "bg-red-500 text-white border-red-400 animate-pulse"
                        : "bg-white hover:bg-slate-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {!isModel && (
                <div className="w-6 h-6 rounded-full bg-amber-200 border border-amber-300 flex items-center justify-center text-[10px] text-amber-800 font-bold">
                  ME
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${currentCompanion.bgColor} border ${currentCompanion.borderColor} animate-bounce`}>
              {currentCompanion.avatar}
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-xs">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggest Topic Option for Story planning */}
      {selectedCompanionId === "dragon" && messages[selectedCompanionId].length > 1 && onSuggestTopic && (
        <div className="px-4 py-1.5 bg-purple-50 flex items-center gap-1.5 border-t border-purple-100 overflow-x-auto shrink-0">
          <span className="text-[9px] font-bold text-purple-700 uppercase shrink-0">Suggestions:</span>
          {["Candy Planet", "Super Space Kitty", "Deep Ocean Castle"].map((item) => (
            <button
              id={`suggest-${item.replaceAll(" ", "-")}`}
              key={item}
              onClick={() => {
                onSuggestTopic(item);
                setInput(`I want to write a story about a ${item}!`);
              }}
              className="text-[10px] bg-white border border-purple-200 text-purple-800 font-medium px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors whitespace-nowrap shrink-0"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
        <input
          id="chat-input-text"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Talk to ${currentCompanion.name.split(" ")[0]}...`}
          disabled={isLoading}
          className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:bg-white text-gray-800"
        />
        <button
          id="chat-submit-btn"
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-amber-400 hover:bg-amber-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-amber-400 disabled:scale-100 rounded-xl transition-all text-amber-950 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
