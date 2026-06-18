import React, { useState, useEffect, useRef } from "react";
import { Story, StoryPage, StoryCreationConfig, ApiRoute } from "./types";
import { CompanionChat } from "./components/CompanionChat";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Wand2,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Palette,
  VolumeX,
  Languages,
  Check,
  Megaphone,
  Download,
  Plus,
  Play,
  Pause,
  Film,
  Music,
  Layers,
  Settings,
  Trash2,
  FileCheck,
  Tv,
  MessageSquare,
  Bot,
} from "lucide-react";

// Initial custom/predefined children's API Routes
const INITIAL_API_ROUTES: ApiRoute[] = [
  {
    id: "gemini-fairytale",
    name: "Standard Fairy-tale API",
    endpoint: "/api/generate-story",
    model: "gemini-2.5-flash",
    systemInstruction: "You are an award-winning children's book author. You write magical fairytale bedtime stories for young kids with cozy settings and moral lessons of friendship.",
    icon: "✨",
  },
  {
    id: "gemini-scifi",
    name: "Cosmic Sci-Fi Space Route",
    endpoint: "/api/generate-story",
    model: "gemini-2.5-flash",
    systemInstruction: "You are a fun science fiction kid's writer. You write funny cosmic journey stories with friendly little spaceships, shiny stars, and playful alien pups.",
    icon: "🚀",
  },
  {
    id: "gemini-detective",
    name: "Mystery Puzzle API",
    endpoint: "/api/generate-story",
    model: "gemini-2.5-pro",
    systemInstruction: "You are an expert children's mystery novelist. You write riddle-filled adventure stories with smart detectives (like owls and bunnies) solving lighthearted magical crimes.",
    icon: "🔍",
  },
];

const CHARACTER_TYPES = [
  { label: "🐰 Tiny Bunny", value: "bunny" },
  { label: "🤖 Cute Robot", value: "little robot" },
  { label: "🐉 Friendly Dragon", value: "friendly baby dragon" },
  { label: "🦊 Clever Fox", value: "clever young fox" },
];

const SETTINGS = [
  { label: "🍭 Candy Kingdom", value: "a magical candy kingdom with marshmallow clouds" },
  { label: "🚀 Outer Space Station", value: "a colorful cosmic space playground" },
  { label: "🌳 Whispering Woods", value: "a beautiful glowing ancient forest" },
  { label: "🏰 Floating Clouds Castle", value: "a majestic sky palace floating above the rainbow" },
];

const THEMES = [
  { label: "🤝 Happy Sharing", value: "the power and joy of sharing with friends" },
  { label: "🦁 Being Courageous", value: "how trying something new can be surprisingly exciting" },
  { label: "💡 Kindness & Helpfulness", value: "making the world brighter with small acts of kindness" },
  { label: "🌟 Following Dreams", value: "never giving up on what you truly love to do" },
];

const ART_STYLES = [
  { label: "🎨 Cozy Watercolor", value: "Soft magical pastel watercolor children's book sketch" },
  { label: "👾 Retro Pixel Art", value: "Bright colorful friendly retro 16-bit pixel art" },
  { label: "🧸 Cute Claymation", value: "3D textured miniature clay play-doh model children's style" },
  { label: "✨ Neon Glow Vector", value: "Vibrant fantasy neon vector flat illustration" },
];

const VOICES = [
  { label: "👩 Kore (Cheerful & Warm)", value: "Kore" },
  { label: "👶 Puck (Playful & High-Pitch)", value: "Puck" },
  { label: "🧙 Fenrir (Deep & Adventurous)", value: "Fenrir" },
  { label: "🧑 Zephyr (Calm & Gentle)", value: "Zephyr" },
  { label: "🦉 Charon (Wise & Slow)", value: "Charon" },
];

export default function App() {
  // Multi API Routes
  const [apiRoutes, setApiRoutes] = useState<ApiRoute[]>(INITIAL_API_ROUTES);
  const [activeApiRouteId, setActiveApiRouteId] = useState<string>("gemini-fairytale");
  const [showNewApiForm, setShowNewApiForm] = useState(false);

  // New API Form State
  const [newApiName, setNewApiName] = useState("");
  const [newApiModel, setNewApiModel] = useState("gemini-2.5-flash");
  const [newApiPrompt, setNewApiPrompt] = useState("");
  const [newApiIcon, setNewApiIcon] = useState("✨");

  // Playlist of Generated Story Video Projects
  const [storyPlaylist, setStoryPlaylist] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  const [config, setConfig] = useState<StoryCreationConfig>({
    characterName: "Barnaby",
    characterType: "friendly baby dragon",
    setting: "a magical candy kingdom with marshmallow clouds",
    theme: "the power and joy of sharing with friends",
    style: "Soft magical pastel watercolor children's book sketch",
    voice: "Kore",
    imageSize: "1K",
    apiRouteId: "gemini-fairytale",
  });

  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState("");
  const [customSetting, setCustomSetting] = useState("");
  const [customTheme, setCustomTheme] = useState("");

  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isIllustratingPage, setIsIllustratingPage] = useState<Record<string, Record<number, boolean>>>({});
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  // Audio and continuous playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Autoplay / Presentation Slide video mode
  const [isAutoplayingVideo, setIsAutoplayingVideo] = useState(false);
  const autoplayTimerRef = useRef<any>(null);

  // Video compiler / rendering state
  const [isCompilingVideo, setIsCompilingVideo] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const compileCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);

  const activeStory = storyPlaylist.find((s) => s.id === activeStoryId) || null;

  // Active workspace viewpoint: 'generator' | 'theater' | 'shelf' | 'companions' | 'apis'
  const [activeTab, setActiveTab] = useState<"generator" | "theater" | "shelf" | "companions" | "apis">("generator");

  // Word/Sentence Text highlighting learning center
  const [highlightMode, setHighlightMode] = useState<'sentence' | 'word' | 'none'>('sentence');
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioElapsedTime, setAudioElapsedTime] = useState<number>(0);
  const playbackIntervalRef = useRef<any>(null);
  const highlightModeRef = useRef<string>("sentence");

  useEffect(() => {
    highlightModeRef.current = highlightMode;
  }, [highlightMode]);

  // word/sentence utilities
  const getSentences = (text: string): string[] => {
    return text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+(\s+|$)/g)?.map(s => s.trim()).filter(Boolean) || [text];
  };

  const getWords = (text: string): string[] => {
    return text.split(/\s+/).filter(Boolean);
  };

  // Helper to get active sentence index based on elapsed time of buffer playback
  const getActiveSentenceIndex = (text: string, elapsed: number, duration: number) => {
    if (duration <= 0 || elapsed <= 0) return 0;
    const sentences = getSentences(text);
    if (sentences.length <= 1) return 0;

    const totalLength = sentences.reduce((acc, s) => acc + s.length, 0);
    let cumulativeLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sLen = sentences[i].length;
      const itemStart = (cumulativeLength / totalLength) * duration;
      const itemEnd = ((cumulativeLength + sLen) / totalLength) * duration;
      if (elapsed >= itemStart && elapsed < itemEnd) {
        return i;
      }
      cumulativeLength += sLen;
    }
    return elapsed >= duration ? sentences.length - 1 : 0;
  };

  // Helper to get active word index based on elapsed time of buffer playback
  const getActiveWordIndex = (text: string, elapsed: number, duration: number) => {
    if (duration <= 0 || elapsed <= 0) return 0;
    const words = getWords(text);
    if (words.length <= 1) return 0;

    const totalLength = words.reduce((acc, w) => acc + w.length, 0);
    let cumulativeLength = 0;

    for (let i = 0; i < words.length; i++) {
      const wLen = words[i].length;
      const itemStart = (cumulativeLength / totalLength) * duration;
      const itemEnd = ((cumulativeLength + wLen) / totalLength) * duration;
      if (elapsed >= itemStart && elapsed < itemEnd) {
        return i;
      }
      cumulativeLength += wLen;
    }
    return elapsed >= duration ? words.length - 1 : 0;
  };

  // Sync suggestion topic from active Companion chat
  const handleSuggestTopic = (topic: string) => {
    setCustomSetting(topic);
    setConfig((prev) => ({
      ...prev,
      setting: topic,
    }));
    setActiveTab("generator");
  };

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
    setIsPlayingAudio(false);

    // Clear timing highlights interval and states
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setAudioElapsedTime(0);
    setAudioDuration(0);
  };

  // Play audio byte stream & cache option
  const playRawPcmBase64 = (base64: string, sampleRate = 24000, onEndedCallback?: () => void) => {
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
        channelData[i] = int16Array[i] / 32768.0;
      }

      const duration = audioBuffer.duration;
      setAudioDuration(duration);
      setAudioElapsedTime(0);

      const startTime = Date.now();
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= duration) {
          setAudioElapsedTime(duration);
          clearInterval(playbackIntervalRef.current);
        } else {
          setAudioElapsedTime(elapsed);
          // Automatically sync step index with audio spotlight
          const currentMode = highlightModeRef.current;
          if (activeStory) {
            const currentText = activeStory.pages[currentPageIdx].text;
            if (currentMode === "sentence") {
              const activeIdx = getActiveSentenceIndex(currentText, elapsed, duration);
              setSelectedStepIdx(activeIdx);
            } else if (currentMode === "word") {
              const activeIdx = getActiveWordIndex(currentText, elapsed, duration);
              setSelectedStepIdx(activeIdx);
            }
          }
        }
      }, 30); // 30ms high frequency tracking for smooth visual transitions

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      activeSourceRef.current = source;
      setIsPlayingAudio(true);

      source.onended = () => {
        setIsPlayingAudio(false);
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
        setAudioElapsedTime(0);
        setAudioDuration(0);
        if (onEndedCallback) onEndedCallback();
      };
    } catch (err) {
      console.error("Audio playback error:", err);
      setIsPlayingAudio(false);
      if (onEndedCallback) onEndedCallback();
    }
  };

  // Convert Text to Speech
  const fetchSpeech = async (text: string, forceVoice?: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: forceVoice || config.voice,
        }),
      });

      const data = await response.json();
      return data.audio || null;
    } catch (err) {
      console.error("Speech generation error:", err);
      return null;
    }
  };

  // Play a short dynamic snippet of sentence or word for interactive sandbox practice
  const readSnippetAloud = async (snippet: string) => {
    stopAudio();
    setIsPlayingAudio(true);
    setApiError(null);

    try {
      const audioBytes = await fetchSpeech(snippet);
      if (audioBytes) {
        playRawPcmBase64(audioBytes, 24000);
      } else {
        throw new Error("No speech data produced for snippet.");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(`Oh pickles! We couldn't render Pip's voice for the snippet: ${err.message}`);
      setIsPlayingAudio(false);
    }
  };

  const readPageAloud = async (text: string, pageIdx: number, onComplete?: () => void) => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    setIsPlayingAudio(true);
    setApiError(null);

    // Use cached bytes if available
    if (activeStory && activeStory.pages[pageIdx].audioBase64) {
      playRawPcmBase64(activeStory.pages[pageIdx].audioBase64!, 24000, onComplete);
      return;
    }

    try {
      const audioBytes = await fetchSpeech(text);
      if (audioBytes) {
        // Cache the audio base64 in state for faster offline access and saving
        setStoryPlaylist((prev) =>
          prev.map((s) => {
            if (s.id === activeStoryId) {
              const updatedPages = [...s.pages];
              updatedPages[pageIdx] = {
                ...updatedPages[pageIdx],
                audioBase64: audioBytes,
              };
              return { ...s, pages: updatedPages };
            }
            return s;
          })
        );

        playRawPcmBase64(audioBytes, 24000, onComplete);
      } else {
        throw new Error("No speech data produced.");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(`Oh pickles! We couldn't render Pip's voice right now: ${err.message}`);
      setIsPlayingAudio(false);
      if (onComplete) onComplete();
    }
  };

  // Generate dynamic illustrations for pages on-demand
  const generatePageIllustration = async (targetStoryId: string, pageIdx: number) => {
    const currentProj = storyPlaylist.find((s) => s.id === targetStoryId);
    if (!currentProj) return;

    const page = currentProj.pages[pageIdx];

    setIsIllustratingPage((prev) => ({
      ...prev,
      [targetStoryId]: {
        ...(prev[targetStoryId] || {}),
        [pageIdx]: true,
      },
    }));
    setApiError(null);

    try {
      const response = await fetch("/api/generate-illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: page.illustrationPrompt,
          size: config.imageSize,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setStoryPlaylist((prev) =>
          prev.map((s) => {
            if (s.id === targetStoryId) {
              const updatedPages = [...s.pages];
              updatedPages[pageIdx] = {
                ...updatedPages[pageIdx],
                imageUrl: data.imageUrl,
              };
              return { ...s, pages: updatedPages };
            }
            return s;
          })
        );
      } else {
        throw new Error(data.error || "Failed drawing.");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(`Illustrator got color stuck in page ${pageIdx + 1}: ${err.message}`);
    } finally {
      setIsIllustratingPage((prev) => ({
        ...prev,
        [targetStoryId]: {
          ...(prev[targetStoryId] || {}),
          [pageIdx]: false,
        },
      }));
    }
  };

  // Handle Multi API Route addition
  const handleAddApiRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName.trim() || !newApiPrompt.trim()) return;

    const newRoute: ApiRoute = {
      id: "api-" + Date.now(),
      name: newApiName.trim(),
      endpoint: "/api/generate-story",
      model: newApiModel,
      systemInstruction: newApiPrompt.trim(),
      icon: newApiIcon,
    };

    setApiRoutes((prev) => [...prev, newRoute]);
    setActiveApiRouteId(newRoute.id);
    setShowNewApiForm(false);
    setNewApiName("");
    setNewApiPrompt("");
    setNewApiIcon("✨");
  };

  const handleDeleteApiRoute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (INITIAL_API_ROUTES.some((r) => r.id === id)) return; // Prevent deleting core defaults
    setApiRoutes((prev) => prev.filter((r) => r.id !== id));
    if (activeApiRouteId === id) {
      setActiveApiRouteId("gemini-fairytale");
    }
  };

  // Generate a customized story project using active Multi-API system configurations
  const handleCreateStory = async () => {
    setIsGeneratingStory(true);
    setActiveTab("theater");
    setApiError(null);
    stopAudio();

    const charName = customName.trim() || config.characterName;
    const charType = customType.trim() || config.characterType;
    const finalSetting = customSetting.trim() || config.setting;
    const finalTheme = customTheme.trim() || config.theme;

    const targetRoute = apiRoutes.find((r) => r.id === activeApiRouteId) || apiRoutes[0];

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: charName,
          characterType: charType,
          setting: finalSetting,
          theme: finalTheme,
          style: config.style,
          model: targetRoute.model,
          systemInstruction: targetRoute.systemInstruction,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.title && data.pages) {
        const freshStory: Story = {
          id: String(Date.now()),
          title: data.title,
          author: `${targetRoute.name} (${targetRoute.model})`,
          style: config.style,
          voice: config.voice,
          imageSize: config.imageSize,
          pages: data.pages,
          apiRouteId: activeApiRouteId,
        };

        setStoryPlaylist((prev) => [freshStory, ...prev]);
        setActiveStoryId(freshStory.id);
        setCurrentPageIdx(0);

        // Bootstrap generation for the first page image
        setTimeout(() => {
          generatePageIllustration(freshStory.id, 0);
        }, 150);
      } else {
        throw new Error("Story response format incomplete.");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(`Failed generating story using API route [${targetRoute.name}]: ${err.message}`);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Delete a project from session playlist
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopAudio();
    setStoryPlaylist((prev) => prev.filter((s) => s.id !== id));
    if (activeStoryId === id) {
      setActiveStoryId(null);
      setCurrentPageIdx(0);
    }
  };

  // Playback Auto Video Carousel
  const toggleAutoplayVideo = () => {
    if (isAutoplayingVideo) {
      setIsAutoplayingVideo(false);
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      stopAudio();
      return;
    }

    if (!activeStory) return;
    setIsAutoplayingVideo(true);
    playNextAutoplaySlide(currentPageIdx);
  };

  const playNextAutoplaySlide = (idx: number) => {
    if (!activeStory) return;
    setCurrentPageIdx(idx);

    // Bootstrap illustration drawing if missing
    if (!activeStory.pages[idx].imageUrl && !isIllustratingPage[activeStory.id]?.[idx]) {
      generatePageIllustration(activeStory.id, idx);
    }

    // Auto read aloud this slide
    readPageAloud(activeStory.pages[idx].text, idx, () => {
      // Once voice completes, transition to next slide after short delay
      if (idx < activeStory.pages.length - 1) {
        autoplayTimerRef.current = setTimeout(() => {
          playNextAutoplaySlide(idx + 1);
        }, 1200);
      } else {
        setIsAutoplayingVideo(false);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
    };
  }, []);

  const handlePageNavigation = (nextIdx: number) => {
    stopAudio();
    setIsAutoplayingVideo(false);
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    setCurrentPageIdx(nextIdx);
    setSelectedStepIdx(0); // Reset interactive step index to 0 for next page

    if (activeStory && !activeStory.pages[nextIdx].imageUrl && !isIllustratingPage[activeStory.id]?.[nextIdx]) {
      generatePageIllustration(activeStory.id, nextIdx);
    }
  };

  // EXPORTS & SAVES CENTER

  // 1. Batch Save All Images
  const saveAllImages = () => {
    if (!activeStory) return;
    setApiError(null);

    let count = 0;
    activeStory.pages.forEach((page, i) => {
      if (page.imageUrl) {
        count++;
        // Trigger standard browser blob or base64 data URL downloads
        const link = document.createElement("a");
        link.href = page.imageUrl;
        link.download = `${activeStory.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_page_${i+1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });

    if (count === 0) {
      setApiError("Oh no! Ensure illustrations are generated before saving them.");
    }
  };

  // 2. Batch Save All Audios
  const saveAllAudios = async () => {
    if (!activeStory) return;
    setApiError(null);

    setIsCompilingVideo(true);
    setCompileProgress(10);

    try {
      for (let i = 0; i < activeStory.pages.length; i++) {
        setCompileProgress(Math.floor(10 + (80 * i) / activeStory.pages.length));
        const page = activeStory.pages[i];
        let audioBase64 = page.audioBase64;

        if (!audioBase64) {
          audioBase64 = (await fetchSpeech(page.text)) || undefined;
        }

        if (audioBase64) {
          // Trigger file download
          const link = document.createElement("a");
          link.href = `data:audio/wav;base64,${audioBase64}`;
          link.download = `${activeStory.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_voice_page_${i+1}.wav`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (e: any) {
      setApiError(`Could not save all audio channels: ${e.message}`);
    } finally {
      setIsCompilingVideo(false);
      setCompileProgress(0);
    }
  };

  // 3. Compile Real MP4/WebM Video (Real canvas stream record)
  const compileAndSaveVideo = async () => {
    if (!activeStory) return;
    setApiError(null);

    // Verify support
    if (!HTMLCanvasElement.prototype.captureStream) {
      setApiError("Your browser frame permissions restrains direct canvas recording. Open app in new tab to capture video.");
      return;
    }

    // Force draw illustrations first
    const unGeneratedPages = activeStory.pages.some((p) => !p.imageUrl);
    if (unGeneratedPages) {
      setApiError("Please make sure all page images are loaded before exporting video.");
      return;
    }

    setIsCompilingVideo(true);
    setCompileProgress(15);

    try {
      const canvas = compileCanvasRef.current || document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not acquire two-dimensional canvas render frame.");

      const recordedChunks: Blob[] = [];
      const stream = canvas.captureStream(24);

      // Support voice merging if options permit
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(videoBlob);

        // Download
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = `${activeStory.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_cartoon.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsCompilingVideo(false);
        setCompileProgress(0);
      };

      mediaRecorder.start();

      // Loop through slides in canvas compiler
      for (let i = 0; i < activeStory.pages.length; i++) {
        setCompileProgress(Math.floor(20 + (70 * i) / activeStory.pages.length));
        const page = activeStory.pages[i];

        // Draw image frame on canvas
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = page.imageUrl!;

        await new Promise((resolve) => {
          img.onload = () => {
            // Draw zoom slide effect over 3.5 seconds
            let step = 0;
            const maxSteps = 70; // ~3 seconds at 24fps
            const renderInterval = setInterval(() => {
              if (step >= maxSteps) {
                clearInterval(renderInterval);
                resolve(true);
                return;
              }

              // Dynamic Ken Burns Zoom style effect
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const zoom = 1 + (step * 0.05) / maxSteps;
              const w = canvas.width * zoom;
              const h = canvas.height * zoom;
              const dx = (canvas.width - w) / 2;
              const dy = (canvas.height - h) / 2;

              ctx.drawImage(img, dx, dy, w, h);

              // Tint bottom text box
              ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
              ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

              // Subtitle captions
              ctx.fillStyle = "#FFFFFF";
              ctx.font = "bold 14px sans-serif";
              ctx.textAlign = "center";

              // Wrap sentences nicely on canvas text frame
              const words = `${page.text}`.split(" ");
              let line = "";
              let y = canvas.height - 85;
              const lineHeight = 18;

              for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + " ";
                const metrics = ctx.measureText(testLine);
                if (metrics.width > canvas.width - 40 && n > 0) {
                  ctx.fillText(line, canvas.width / 2, y);
                  line = words[n] + " ";
                  y += lineHeight;
                } else {
                  line = testLine;
                }
              }
              ctx.fillText(line, canvas.width / 2, y);

              // Draw decorative page number
              ctx.fillStyle = "#FBBF24";
              ctx.font = "900 11px sans-serif";
              ctx.fillText(`PAGE ${i + 1}`, canvas.width / 2, canvas.height - 100);

              step++;
            }, 40); // 24fps
          };
          img.onerror = () => {
            // Fallback draw solid background
            ctx.fillStyle = "#F97316";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(page.text, 50, canvas.height / 2);
            resolve(true);
          };
        });
      }

      // Stop compiler recording
      setTimeout(() => {
        mediaRecorder.stop();
      }, 500);
    } catch (err: any) {
      console.error(err);
      setApiError(`Could not compile video project: ${err.message}`);
      setIsCompilingVideo(false);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-linear-to-b from-sky-100 via-amber-50 to-orange-150 font-sans text-gray-800 flex flex-col antialiased">
      {/* Playful Header */}
      <header id="main-header" className="bg-white/90 backdrop-blur-md border-b border-orange-100 py-3 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-md animate-bounce shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600">
                  Kids Multi-API Story & Video Studio
                </h1>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200">
                  Pro Studio
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                Unlimited APIs • Playlist Creator • Direct Video MP4/WebM Export
              </p>
            </div>
          </div>

          {/* Quick System Route Widget selection bar */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">Active API:</span>
            {apiRoutes.map((route) => {
              const isActive = route.id === activeApiRouteId;
              return (
                <button
                  key={route.id}
                  id={`header-api-select-${route.id}`}
                  onClick={() => {
                    stopAudio();
                    setActiveApiRouteId(route.id);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-amber-400 border-amber-500 text-amber-950 shadow-xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{route.icon}</span>
                  <span>{route.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Studio Arena */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Playful Error Notification */}
        {apiError && (
          <div className="col-span-12 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-xs animate-fade-in text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-spin-slow">🔮</span>
              <p className="text-xs text-rose-800 font-semibold">{apiError}</p>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="px-3.5 py-1.5 bg-rose-200 hover:bg-rose-300 active:scale-95 text-rose-950 text-[10px] font-black uppercase rounded-lg transition-all"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Playful Side Navigation Sidebar (3/12 Columns) */}
        <nav className="col-span-12 lg:col-span-3 flex flex-col gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-orange-100 shadow-xs">
          {/* Logo / Mascot Avatar */}
          <div className="hidden lg:flex flex-col items-center p-4 text-center bg-gradient-to-br from-amber-400 via-orange-300 to-pink-300 rounded-2xl relative overflow-hidden text-white mb-2 shadow-inner">
            <span className="text-4xl animate-bounce mb-1 filter drop-shadow-sm">🧙‍♂️</span>
            <h3 className="text-xs font-black uppercase tracking-wider">Mage Teller</h3>
            <p className="text-[9px] opacity-90 select-none">Studio Assistant</p>
          </div>

          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 scrollbar-none">
            {/* Tab 1: Toybox Creator */}
            <button
              id="sidebar-tab-generator"
              type="button"
              onClick={() => {
                stopAudio();
                setActiveTab("generator");
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left border shrink-0 lg:w-full select-none cursor-pointer ${
                activeTab === "generator"
                  ? "bg-amber-400 border-amber-500 text-amber-950 font-black shadow-sm scale-102"
                  : "bg-white border-gray-150 text-gray-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-orange-500" />
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <span>Toybox Creator</span>
                <span className="text-[9px] font-medium opacity-75 hidden lg:block truncate">
                  Write & Design Books
                </span>
              </div>
            </button>

            {/* Tab 2: Illustrated Theater */}
            <button
              id="sidebar-tab-theater"
              type="button"
              onClick={() => {
                stopAudio();
                setActiveTab("theater");
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left border shrink-0 lg:w-full select-none cursor-pointer ${
                activeTab === "theater"
                  ? "bg-amber-400 border-amber-500 text-amber-950 font-black shadow-sm scale-102"
                  : "bg-white border-gray-150 text-gray-600 hover:bg-slate-50"
              }`}
            >
              <Tv className="w-4 h-4 shrink-0 text-pink-500" />
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <span>Illustrated Theater</span>
                <span className="text-[9px] font-medium opacity-75 hidden lg:block truncate">
                  {activeStoryId ? "🎬 Interactive Show" : "📚 Load a story"}
                </span>
              </div>
              {activeStoryId && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden lg:block" />
              )}
            </button>

            {/* Tab 3: Cartoon Shelf */}
            <button
              id="sidebar-tab-shelf"
              type="button"
              onClick={() => {
                stopAudio();
                setActiveTab("shelf");
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left border shrink-0 lg:w-full select-none cursor-pointer ${
                activeTab === "shelf"
                  ? "bg-amber-400 border-amber-500 text-amber-950 font-black shadow-sm scale-102"
                  : "bg-white border-gray-150 text-gray-600 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0 text-purple-500" />
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <span>Cartoon Shelf</span>
                <span className="text-[9px] font-medium opacity-75 hidden lg:block truncate">
                  {storyPlaylist.length === 1 ? "1 Saved Show" : `${storyPlaylist.length} Saved Shows`}
                </span>
              </div>
              {storyPlaylist.length > 0 && (
                <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center shrink-0">
                  {storyPlaylist.length}
                </span>
              )}
            </button>

            {/* Tab 4: AI Playrooms */}
            <button
              id="sidebar-tab-companions"
              type="button"
              onClick={() => {
                stopAudio();
                setActiveTab("companions");
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left border shrink-0 lg:w-full select-none cursor-pointer ${
                activeTab === "companions"
                  ? "bg-amber-400 border-amber-500 text-amber-950 font-black shadow-sm scale-102"
                  : "bg-white border-gray-150 text-gray-600 hover:bg-slate-50"
              }`}
            >
              <Bot className="w-4 h-4 shrink-0 text-blue-500" />
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <span>AI Playrooms</span>
                <span className="text-[9px] font-medium opacity-75 hidden lg:block truncate">Chat with Pip & friends</span>
              </div>
            </button>

            {/* Tab 5: Routing Console */}
            <button
              id="sidebar-tab-apis"
              type="button"
              onClick={() => {
                stopAudio();
                setActiveTab("apis");
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left border shrink-0 lg:w-full select-none cursor-pointer ${
                activeTab === "apis"
                  ? "bg-amber-400 border-amber-500 text-amber-950 font-black shadow-sm scale-102"
                  : "bg-white border-gray-150 text-gray-600 hover:bg-slate-50"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-500" />
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <span>Routing Console</span>
                <span className="text-[9px] font-medium opacity-75 hidden lg:block truncate">Configure Roles</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Playful Central Workspace (9/12 Columns) */}
        <section className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          {/* Multi API Configuration panel */}
          <div id="apis-panel" className={`bg-white rounded-3xl p-5 border border-amber-100 shadow-md ${activeTab === "apis" ? "block" : "hidden"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Manage Multi-Routing API Endpoints
                </h3>
              </div>

              <button
                id="btn-toggle-new-api"
                onClick={() => setShowNewApiForm(!showNewApiForm)}
                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 text-white font-bold rounded-lg text-[10px] uppercase transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                {showNewApiForm ? "Cancel" : "Add Custom API"}
              </button>
            </div>

            {/* Configured API Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {apiRoutes.map((route) => {
                const isActive = route.id === activeApiRouteId;
                const isSystemDefault = INITIAL_API_ROUTES.some((r) => r.id === route.id);
                return (
                  <div
                    key={route.id}
                    onClick={() => {
                      stopAudio();
                      setActiveApiRouteId(route.id);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between h-32 select-none group text-left ${
                      isActive
                        ? "bg-amber-50/75 border-amber-400 ring-2 ring-amber-200"
                        : "bg-slate-50/50 hover:bg-slate-50 border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl filter drop-shadow-xs">{route.icon}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[7.5px] bg-slate-200 text-slate-800 px-1 py-0.5 rounded-sm font-mono leading-none">
                            {route.model.replace("gemini-", "")}
                          </span>
                          {!isSystemDefault && (
                            <button
                              onClick={(e) => handleDeleteApiRoute(route.id, e)}
                              className="text-gray-400 hover:text-red-500 p-0.5"
                              title="Delete custom endpoint"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-extrabold text-gray-800 truncate">
                        {route.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 line-clamp-2 leading-snug mt-1 italic">
                        "{route.systemInstruction}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                      <span className="text-[8.5px] text-gray-400 font-bold uppercase truncate">
                        {route.endpoint}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-amber-500 stroke-[3px]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expand New API Form */}
            {showNewApiForm && (
              <form onSubmit={handleAddApiRoute} className="mt-4 p-4 bg-orange-50/50 border border-orange-200 rounded-2xl text-left space-y-3 animate-slide-down">
                <h4 className="text-xs font-black text-orange-950 uppercase">Configure New API Routing Pathway</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">1. API Name / Route Tag</label>
                    <input
                      id="input-new-api-name"
                      type="text"
                      required
                      placeholder="My Funny Robot Story API..."
                      value={newApiName}
                      onChange={(e) => setNewApiName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 font-medium"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">2. Gemini Backend Model</label>
                    <select
                      id="select-new-api-model"
                      value={newApiModel}
                      onChange={(e) => setNewApiModel(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700"
                    >
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Creative)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Complex & Deep)</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">3. Choose Icon</label>
                    <select
                      id="select-new-api-icon"
                      value={newApiIcon}
                      onChange={(e) => setNewApiIcon(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700"
                    >
                      <option value="✨">✨ Sparkling Fairy</option>
                      <option value="🛸">🛸 Alien Saucer</option>
                      <option value="🍕">🍕 Funny Pizza</option>
                      <option value="🦖">🦖 Cute Dino</option>
                      <option value="🧸">🧸 Teddy Bear</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase">4. Storytelling System Role Instructions</label>
                  <textarea
                    id="input-new-api-prompt"
                    required
                    rows={2}
                    placeholder="E.g., You write bedtime fantasy mysteries featuring small dinosaur pets experiencing simple daily puzzles. Keep sentence constructions rhythmic."
                    value={newApiPrompt}
                    onChange={(e) => setNewApiPrompt(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 placeholder:text-gray-400"
                  />
                </div>

                <button
                  id="btn-add-route-action"
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-xs rounded-xl shadow-xs hover:from-orange-500 transition-colors uppercase"
                >
                  Create Endpoint Route
                </button>
              </form>
            )}
          </div>

          <div id="generator-panel" className={activeTab === "generator" ? "flex flex-col gap-6" : "hidden"}>
            {/* STORY GENERATOR SCREEN */}
            <div id="creator-workspace" className="bg-white rounded-3xl p-6 border border-amber-100 shadow-md flex flex-col gap-6 animate-fade-in">
              <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 p-6 rounded-2xl text-white relative overflow-hidden shadow-xs text-left">
                <div className="absolute right-2 -bottom-2 text-6xl opacity-20 transform rotate-12">🎬</div>
                <div className="absolute left-1/2 top-4 text-4xl opacity-10">🌟</div>
                <h2 className="text-2xl font-black mb-1">Make Your Own Storybook!</h2>
                <p className="text-xs text-amber-50">Choose characters, themes, and illustrations to design interactive adventures in seconds!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                {/* 1. Hero Setup */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    🦸 1. Name Your Main Hero
                  </label>
                  <input
                    id="hero-name-input"
                    type="text"
                    placeholder="E.g., Barnaby, Bella, Sparky..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-amber-300 focus:outline-none transition-all placeholder:text-gray-400 text-gray-800 font-medium"
                  />

                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider pt-2">
                    🦄 What kind of hero?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHARACTER_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        id={`btn-char-${ct.value.replaceAll(" ", "-")}`}
                        type="button"
                        onClick={() => {
                          setCustomType("");
                          setConfig((prev) => ({ ...prev, characterType: ct.value }));
                        }}
                        className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition-all ${
                          config.characterType === ct.value && !customType
                            ? "bg-amber-100 border-amber-400 text-amber-950 shadow-xs scale-102"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-slate-50"
                        }`}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                  <input
                    id="custom-char-input"
                    type="text"
                    placeholder="Or type a custom hero (e.g. friendly bear)"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-amber-300 focus:outline-none placeholder:text-gray-400 text-gray-800"
                  />
                </div>

                {/* 2. Setting / Lesson Theme */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    🏝️ 2. Where Does the Story Happen?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SETTINGS.map((st) => (
                      <button
                        key={st.value}
                        id={`btn-set-${st.label.replace("🍭 ", "").replace("🚀 ", "").replace("🌳 ", "").replace("🏰 ", "")}`}
                        type="button"
                        onClick={() => {
                          setCustomSetting("");
                          setConfig((prev) => ({ ...prev, setting: st.value }));
                        }}
                        className={`p-2 rounded-xl text-left text-[11px] font-semibold border transition-all ${
                          config.setting === st.value && !customSetting
                            ? "bg-amber-100 border-amber-400 text-amber-950 shadow-xs scale-102"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-slate-50"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                  <input
                     id="custom-setting-input"
                    type="text"
                    placeholder="Or type a custom setting (e.g. cloud city)"
                    value={customSetting}
                    onChange={(e) => setCustomSetting(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-amber-300 focus:outline-none placeholder:text-gray-400 text-gray-800"
                  />
                </div>
              </div>

              {/* 3. Theme & Lesson */}
              <div className="border-t border-dashed border-gray-100 pt-4 space-y-3 text-left">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  🌟 3. Pick a Story Theme / Moral Lesson
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {THEMES.map((th) => (
                    <button
                      key={th.value}
                      id={`btn-theme-${th.label.replace("🤝 ", "").replace("🦁 ", "").replace("💡 ", "").replace("🌟 ", "")}`}
                      type="button"
                      onClick={() => {
                        setCustomTheme("");
                        setConfig((prev) => ({ ...prev, theme: th.value }));
                      }}
                      className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                        config.theme === th.value && !customTheme
                          ? "bg-amber-100 border-amber-400 text-amber-950 shadow-xs scale-102"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-slate-50"
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
                <input
                  id="custom-theme-input"
                  type="text"
                  placeholder="Or write a custom story message & prompt moral lessons"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-amber-300 focus:outline-none placeholder:text-gray-400 text-gray-800"
                />
              </div>

              {/* 4. Artistic Style & Sound Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dashed border-gray-100 pt-4 text-left">
                {/* Art Design */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-amber-500" /> Art Style
                  </label>
                  <select
                    id="select-art-style"
                    value={config.style}
                    onChange={(e) => setConfig((prev) => ({ ...prev, style: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:ring-2 focus:ring-amber-300 focus:outline-none font-medium"
                  >
                    {ART_STYLES.map((art) => (
                      <option key={art.value} value={art.value}>
                        {art.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Narrator Voice */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Megaphone className="w-3.5 h-3.5 text-orange-500" /> Narrator Voice
                  </label>
                  <select
                    id="select-voice"
                    value={config.voice}
                    onChange={(e) => setConfig((prev) => ({ ...prev, voice: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:ring-2 focus:ring-amber-300 focus:outline-none font-medium"
                  >
                    {VOICES.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dimension Setup */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Illustration Size
                  </label>
                  <div className="grid grid-cols-3 gap-1 animate-pulse">
                    {(["1K", "2K", "4K"] as const).map((sz) => (
                      <button
                        key={sz}
                        id={`btn-size-${sz}`}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, imageSize: sz }))}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          config.imageSize === sz
                            ? "bg-amber-100 border-amber-400 text-amber-950"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] text-gray-400 block text-center">
                    {config.imageSize === "1K" ? "Fast Creation" : config.imageSize === "2K" ? "HD Quality" : "Ultra Sharp (High Load)"}
                  </span>
                </div>
              </div>

              {/* Big Creative Call to Action! */}
              <button
                id="btn-create-storybook"
                onClick={handleCreateStory}
                disabled={isGeneratingStory}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 active:scale-99 disabled:opacity-40 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-base border-t border-white/20 uppercase"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                Write & Draw My Cartoon Book!
              </button>
            </div>
          </div>

          {/* INTERACTIVE ILLUSTRATED THEATER / VIDEO CONTROLS */}
          <div id="theater-panel" className={activeTab === "theater" ? "flex flex-col gap-6" : "hidden"}>
            {isGeneratingStory ? (
              /* GENERATION LOADING */
              <div id="generation-spinner" className="bg-white rounded-3xl p-12 border border-amber-100 shadow-md flex flex-col items-center justify-center gap-6 min-h-[480px]">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  🧩
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-extrabold text-amber-500 animate-pulse">
                  Deploying New API Routing Pathway...
                </h3>
                <p className="text-xs text-gray-500 max-w-md">
                  Gemini is mapping narrative structures, applying specific system instructions, and designing customized chapters for your kid storybook project.
                </p>
              </div>

              <div className="flex gap-2.5 mt-4">
                <div className="px-3 py-1.5 bg-purple-50 text-[10px] text-purple-700 font-bold border border-purple-200 rounded-lg">
                  📝 Drafting Words
                </div>
                <div className="px-3 py-1.5 bg-orange-50 text-[10px] text-orange-700 font-bold border border-orange-200 rounded-lg">
                  🎨 Arranging Colors
                </div>
                <div className="px-3 py-1.5 bg-cyan-50 text-[10px] text-cyan-700 font-bold border border-cyan-200 rounded-lg">
                  🎬 Merging Slides
                </div>
              </div>
            </div>
          ) : activeStory ? (
            /* STORY THEATER & VIDEO PLAYBACK */
            <div id="storybook-theater" className="bg-white rounded-3xl border border-amber-100 shadow-md overflow-hidden flex flex-col animate-scale-up text-left">
                {/* Book Header Controls */}
                <div className="p-4 bg-orange-400 text-white flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📖</span>
                    <div>
                      <h2 className="font-black text-sm md:text-base tracking-tight truncate max-w-xs md:max-w-lg leading-tight">
                        {activeStory.title}
                      </h2>
                      <p className="text-[10px] opacity-90 font-medium">Route: {activeStory.author}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Autoplay continuous Show / Animated Video playback */}
                    <button
                      id="btn-trigger-autoplay"
                      onClick={toggleAutoplayVideo}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 font-black uppercase rounded-lg text-[10px] transition-all shadow-xs ${
                        isAutoplayingVideo
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-white text-orange-500 hover:bg-slate-50"
                      }`}
                    >
                      {isAutoplayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isAutoplayingVideo ? "Pause Show" : "Autoplay Show!"}
                    </button>

                    <button
                      id="btn-restart-book"
                      onClick={() => {
                        stopAudio();
                        setIsAutoplayingVideo(false);
                        setActiveStoryId(null);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/35 active:scale-95 transition-all text-white font-bold rounded-lg text-[10px] uppercase border border-white/20"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Close Project
                    </button>
                  </div>
                </div>

                {/* Page Theater Arena */}
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Left Column: Big Beautiful Art frame */}
                  <div className="relative group rounded-2xl bg-amber-50 border border-amber-200 h-80 md:h-[350px] shadow-inner overflow-hidden flex flex-col items-center justify-center">
                    {activeStory.pages[currentPageIdx].imageUrl ? (
                      <>
                        <img
                          id={`story-art-${currentPageIdx}`}
                          src={activeStory.pages[currentPageIdx].imageUrl}
                          alt={`Illustration for page ${currentPageIdx + 1}`}
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            isAutoplayingVideo ? "scale-104 animate-pulse-slow" : "scale-100"
                          }`}
                        />
                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md text-[9px] text-white/90 px-2.5 py-1 rounded-lg text-center truncate">
                          Illustration Style: <span className="text-amber-300 font-bold">{activeStory.style}</span>
                        </div>
                      </>
                    ) : (
                      /* Rendering state */
                      <div className="text-center p-6 space-y-3 flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider animate-bounce">
                          Generating Dynamic Art ({activeStory.imageSize})
                        </span>
                        <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed italic">
                          "{activeStory.pages[currentPageIdx].illustrationPrompt}"
                        </p>
                      </div>
                    )}

                    {/* Redraw button */}
                    {activeStory.pages[currentPageIdx].imageUrl && !isIllustratingPage[activeStory.id]?.[currentPageIdx] && (
                      <button
                        id="btn-redraw-illustration"
                        onClick={() => generatePageIllustration(activeStory.id, currentPageIdx)}
                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 shadow-md rounded-full transition-all active:scale-90"
                        title="Redraw scene"
                      >
                        <Wand2 className="w-4 h-4 text-amber-600 animate-spin-slow" />
                      </button>
                    )}
                  </div>

                  {/* Right Column: Narrative slide and voice buttons */}
                  <div className="flex flex-col justify-between py-2 space-y-4">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-full text-[10px] tracking-wide border border-amber-200">
                          ✨ Page {currentPageIdx + 1} of {activeStory.pages.length}
                        </span>

                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                          <span>Voice:</span>
                          <span className="text-gray-700 font-black">{activeStory.voice}</span>
                        </div>
                      </div>

                      {/* Spotlight Highlight Mode Toggle (Step-by-Step UI Setup) */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <span className="text-[9px] font-black uppercase text-slate-500 pl-2">Spotlight:</span>
                        <div className="flex items-center gap-0.5">
                          <button
                            id="mode-sentence"
                            onClick={() => { setHighlightMode('sentence'); stopAudio(); setSelectedStepIdx(0); }}
                            className={`px-2.5 py-1 text-[10.5px] font-black rounded-lg transition-all cursor-pointer ${
                              highlightMode === 'sentence'
                                ? "bg-amber-400 text-amber-950 shadow-xs scale-102"
                                : "text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            💬 Sentence
                          </button>
                          <button
                            id="mode-word"
                            onClick={() => { setHighlightMode('word'); stopAudio(); setSelectedStepIdx(0); }}
                            className={`px-2.5 py-1 text-[10.5px] font-black rounded-lg transition-all cursor-pointer ${
                              highlightMode === 'word'
                                ? "bg-amber-400 text-amber-950 shadow-xs scale-102"
                                : "text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            🔤 Word
                          </button>
                          <button
                            id="mode-none"
                            onClick={() => { setHighlightMode('none'); stopAudio(); setSelectedStepIdx(0); }}
                            className={`px-2.5 py-1 text-[10.5px] font-black rounded-lg transition-all cursor-pointer ${
                              highlightMode === 'none'
                                ? "bg-amber-400 text-amber-950 shadow-xs scale-100"
                                : "text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            📖 Classic
                          </button>
                        </div>
                      </div>

                      {/* Render text with corresponding interactive highlight mode */}
                      {highlightMode === 'none' && (
                        <p id="story-block-text" className="text-base md:text-lg font-medium text-slate-800 leading-relaxed font-sans first-letter:text-4xl first-letter:font-extrabold first-letter:text-orange-500">
                          {activeStory.pages[currentPageIdx].text}
                        </p>
                      )}

                      {highlightMode === 'sentence' && (
                        <div id="story-block-text" className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {getSentences(activeStory.pages[currentPageIdx].text).map((sentence, sIdx) => {
                            const isCurrentActive = isPlayingAudio && getActiveSentenceIndex(activeStory.pages[currentPageIdx].text, audioElapsedTime, audioDuration) === sIdx;
                            return (
                              <span
                                key={sIdx}
                                id={`story-sentence-${sIdx}`}
                                onClick={() => {
                                  setSelectedStepIdx(sIdx);
                                  readSnippetAloud(sentence);
                                }}
                                className={`block p-2.5 rounded-xl border transition-all cursor-pointer select-none text-xs md:text-sm ${
                                  isCurrentActive
                                    ? "bg-amber-100 border-amber-400 font-extrabold text-amber-950 shadow-xs animate-sentence-pulse"
                                    : sIdx === selectedStepIdx
                                    ? "bg-orange-50 border-orange-300 font-bold text-orange-950 scale-101"
                                    : "bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 text-slate-600 font-medium"
                                }`}
                                title="Click to speak sentence"
                              >
                                <span className="text-[8px] uppercase font-bold text-amber-700 mr-2 bg-amber-200/50 px-1 py-0.5 rounded-md">Sentence {sIdx + 1}</span>
                                {sentence}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {highlightMode === 'word' && (
                        <div id="story-block-text" className="flex flex-wrap gap-x-1.5 gap-y-2 p-3 rounded-2xl bg-amber-50/30 border border-amber-100 max-h-[220px] overflow-y-auto">
                          {getWords(activeStory.pages[currentPageIdx].text).map((word, wIdx) => {
                            const isCurrentActive = isPlayingAudio && getActiveWordIndex(activeStory.pages[currentPageIdx].text, audioElapsedTime, audioDuration) === wIdx;
                            return (
                              <span
                                key={wIdx}
                                id={`story-word-${wIdx}`}
                                onClick={() => {
                                  setSelectedStepIdx(wIdx);
                                  readSnippetAloud(word);
                                }}
                                className={`px-2 py-1 text-xs md:text-sm font-semibold rounded-lg cursor-pointer transition-all select-none ${
                                  isCurrentActive
                                    ? "bg-amber-300 text-amber-950 font-black shadow-xs scale-108 animate-word-bounce"
                                    : wIdx === selectedStepIdx
                                    ? "bg-orange-200 text-orange-950 font-bold"
                                    : "hover:bg-slate-100 text-slate-600"
                                }`}
                                title="Click to speak word"
                              >
                                {word}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Interactive Stepper Control Hub (Step-by-Step UI) */}
                      {highlightMode !== 'none' && (
                        <div className="bg-gradient-to-r from-orange-400/90 to-amber-400 p-2.5 rounded-xl text-white flex flex-col gap-1.5 shadow-inner text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">🎓</span>
                              <h4 className="text-[10px] font-black uppercase tracking-wider">Step-by-Step interactive reader</h4>
                            </div>
                            <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                              {highlightMode === 'sentence' ? `Sentence ${selectedStepIdx + 1} of ${getSentences(activeStory.pages[currentPageIdx].text).length}` : `Word ${selectedStepIdx + 1} of ${getWords(activeStory.pages[currentPageIdx].text).length}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <button
                              onClick={() => {
                                setSelectedStepIdx((prev) => Math.max(0, prev - 1));
                              }}
                              disabled={selectedStepIdx === 0}
                              className="py-1 px-2.5 bg-white/20 hover:bg-white/35 disabled:opacity-30 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-white/10 cursor-pointer"
                            >
                              <ArrowLeft className="w-3 h-3" /> Prev
                            </button>

                            <button
                              onClick={() => {
                                const textTokens = highlightMode === 'sentence'
                                  ? getSentences(activeStory.pages[currentPageIdx].text)
                                  : getWords(activeStory.pages[currentPageIdx].text);
                                if (textTokens[selectedStepIdx]) {
                                  readSnippetAloud(textTokens[selectedStepIdx]);
                                }
                              }}
                              className="px-3 py-1 bg-white text-orange-600 hover:scale-102 active:scale-95 shadow-sm font-extrabold uppercase rounded-full text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3 text-orange-500" />
                              Say active
                            </button>

                            <button
                              onClick={() => {
                                const maxSteps = highlightMode === 'sentence'
                                  ? getSentences(activeStory.pages[currentPageIdx].text).length
                                  : getWords(activeStory.pages[currentPageIdx].text).length;
                                setSelectedStepIdx((prev) => Math.min(maxSteps - 1, prev + 1));
                              }}
                              disabled={
                                selectedStepIdx >=
                                (highlightMode === 'sentence'
                                  ? getSentences(activeStory.pages[currentPageIdx].text).length - 1
                                  : getWords(activeStory.pages[currentPageIdx].text).length - 1)
                              }
                              className="py-1 px-2.5 bg-white/20 hover:bg-white/35 disabled:opacity-30 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-white/10 cursor-pointer"
                            >
                              Next <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Speech reader control */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm shadow-xs shrink-0">
                          📢
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-gray-700 leading-tight">Narrate Aloud</p>
                          <p className="text-[9px] text-gray-400">Play standard Gemini TTS voices</p>
                        </div>
                      </div>

                      <button
                        id="btn-read-aloud"
                        onClick={() => readPageAloud(activeStory.pages[currentPageIdx].text, currentPageIdx)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 ${
                          isPlayingAudio
                            ? "bg-red-500 hover:bg-red-600 animate-pulse outline-hidden"
                            : "bg-amber-400 hover:bg-amber-500 text-amber-950 border-b-2 border-amber-500"
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {isPlayingAudio ? "Stop Reading" : "Read Page!"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPORTS & BATCH SAVES DRAWER (Satisfies: "save all images audio or save as video") */}
                <div className="mx-6 mb-2 p-4 bg-orange-50/50 border border-orange-200 rounded-2xl">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="text-left">
                      <h4 className="text-xs font-black text-orange-950 uppercase flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-orange-500" />
                        Project Exporting Depot
                      </h4>
                      <p className="text-[9.5px] text-gray-500 leading-tight">
                        Save all your generated media clips to your local device!
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Save All Images */}
                      <button
                        id="btn-save-all-images"
                        onClick={saveAllImages}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-orange-200 text-orange-950 text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
                        title="Download all slide images"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        Save All Images
                      </button>

                      {/* Save All Audio tracks */}
                      <button
                        id="btn-save-all-audios"
                        onClick={saveAllAudios}
                        disabled={isCompilingVideo}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-orange-200 text-orange-950 text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-40"
                        title="Compile and download speech narrators"
                      >
                        <Music className="w-3.5 h-3.5 text-green-500" />
                        Save All Audios
                      </button>

                      {/* Save as Video */}
                      <button
                        id="btn-save-as-video"
                        onClick={compileAndSaveVideo}
                        disabled={isCompilingVideo}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 text-white text-xs font-black rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-40"
                        title="Render canvas stream into actual play video"
                      >
                        <Film className="w-3.5 h-3.5 text-white" />
                        {isCompilingVideo ? "Compiling..." : "Save as Video (WebM)"}
                      </button>
                    </div>
                  </div>

                  {/* Compile feedback and progress */}
                  {isCompilingVideo && (
                    <div className="mt-3 text-left space-y-1 animate-pulse">
                      <div className="flex justify-between text-[9px] font-bold text-orange-800">
                        <span>Status: Packing high fidelity multimedia cartoon assets...</span>
                        <span>{compileProgress}%</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-1.5">
                        <div
                          className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${compileProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Slide Nav indicators */}
                <div className="bg-amber-50 border-t border-amber-100 px-6 py-4 flex items-center justify-between">
                  <button
                    id="btn-prev-page"
                    disabled={currentPageIdx === 0}
                    onClick={() => handlePageNavigation(currentPageIdx - 1)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl text-xs text-amber-950 font-bold border border-amber-200 transition-colors shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <div className="flex items-center gap-1">
                    {activeStory.pages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageNavigation(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i === currentPageIdx ? "bg-amber-500 scale-125" : "bg-amber-200"
                        }`}
                        title={`Page ${i + 1}`}
                      />
                    ))}
                  </div>

                  {currentPageIdx < activeStory.pages.length - 1 ? (
                    <button
                      id="btn-next-page"
                      onClick={() => handlePageNavigation(currentPageIdx + 1)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 rounded-xl text-xs text-amber-950 font-black transition-colors shadow-xs"
                    >
                      Next Page
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      id="btn-finish-book"
                      onClick={() => {
                        stopAudio();
                        setIsAutoplayingVideo(false);
                        setActiveStoryId(null);
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white rounded-xl text-xs font-black transition-colors shadow-xs"
                    >
                      Finished! (New Tale)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* THEATER PLACEHOLDER */
              <div className="bg-white rounded-3xl p-12 border border-amber-100 shadow-md flex flex-col items-center justify-center text-center gap-6 min-h-[480px] animate-fade-in">
                <span className="text-6xl animate-bounce">🎬</span>
                <div className="space-y-2">
                  <h3 className="text-base font-black text-slate-800 animate-pulse">Your Illustrated Theater</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Build a fairytale under <span className="font-bold text-orange-500">Toybox Creator</span>, or resume an existing one in your <span className="font-bold text-purple-500">Cartoon Shelf</span> to start the show!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("generator")}
                  className="px-5 py-2 hover:scale-102 transition-transform bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-black rounded-xl uppercase shadow-xs cursor-pointer animate-pulse"
                >
                  Create a Cartoon!
                </button>
              </div>
            )}
          </div>

          {/* PROJECT PLAYLIST LISTING (Satisfies: "makes me many videos") */}
          <div id="playlist-workspace" className={`bg-white rounded-3xl p-5 border border-amber-100 shadow-md text-left ${activeTab === "shelf" ? "block animate-fade-in" : "hidden"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-orange-500 animate-spin-slow" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Cartoons & Video projects Playlist ({storyPlaylist.length})
                </h4>
              </div>

              {storyPlaylist.length > 0 && (
                <button
                  id="btn-clear-playlist"
                  onClick={() => {
                    stopAudio();
                    setIsAutoplayingVideo(false);
                    setStoryPlaylist([]);
                    setActiveStoryId(null);
                  }}
                  className="text-[9px] text-gray-400 hover:text-red-500 font-extrabold uppercase"
                >
                  Clear All
                </button>
              )}
            </div>

            {storyPlaylist.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs italic flex flex-col items-center gap-4">
                <span>No active cartoons generated in playlist yet. Create a story to populate your video projects!</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("generator")}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 text-white font-black rounded-xl text-[11px] uppercase transition-all shadow-sm cursor-pointer"
                >
                  Write & Draw a Cartoon Show!
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {storyPlaylist.map((item) => {
                  const isActive = item.id === activeStoryId;
                  const firstPageWithImg = item.pages.find((p) => p.imageUrl);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        stopAudio();
                        setIsAutoplayingVideo(false);
                        setActiveStoryId(item.id);
                        setCurrentPageIdx(0);
                        setActiveTab("theater");
                      }}
                      id={`project-card-${item.id}`}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 relative select-none ${
                        isActive
                          ? "bg-amber-100/50 border-amber-400 ring-2 ring-amber-100 shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 border-gray-200"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-orange-100 border border-orange-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {firstPageWithImg ? (
                          <img
                            src={firstPageWithImg.imageUrl}
                            alt="Book preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl animate-spin-slow">🎨</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <span className="text-[8px] bg-amber-200 text-amber-900 border border-amber-300 font-extrabold rounded-md px-1 py-0.5 uppercase tracking-wide">
                          Video Story
                        </span>
                        <h4 className="text-xs font-black text-gray-800 truncate mt-1">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 truncate">
                          Style: {item.style}
                        </p>
                        <p className="text-[9px] font-semibold text-orange-600 mt-1">
                          {item.pages.length} Pages • Voice: {item.voice}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteProject(item.id, e)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 scale-90"
                        title="Delete story"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DYNAMIC CHAT COMPANIONS SCREEN */}
          <div id="companions-workspace" className={`h-[560px] lg:h-[660px] pb-4 ${activeTab === "companions" ? "block animate-fade-in" : "hidden"}`}>
            <CompanionChat onSuggestTopic={handleSuggestTopic} />
          </div>
        </section>
      </main>

      {/* Hidden compilation Canvas element for compiling WebM video frames without altering interface */}
      <canvas ref={compileCanvasRef} className="hidden" />

      {/* Playful Footer */}
      <footer id="main-footer" className="bg-white border-t border-orange-100 py-4 px-6 text-center text-xs text-gray-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Kids Audio & Video Storybook Studio. Built with high-fidelity server-authority.</p>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="font-bold uppercase tracking-wider text-amber-500">
              ⚡ Gemini-v3 Multi-Routing Engine Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
