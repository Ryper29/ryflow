import { useState, useEffect } from 'react';
import {
  validateApiKey,
  detectAiProvider,
  fetchAvailableGeminiModels,
  callAiAgent,
  DEFAULT_GEMINI_MODELS,
} from '../services/ai.js';

export function useAiAgent(runtimeContext = {}) {
  const [aiApiKey, setAiApiKey] = useState('');
  const [geminiModelsList, setGeminiModelsList] = useState(DEFAULT_GEMINI_MODELS);
  const [geminiModel, setGeminiModel] = useState(() => {
    try {
      const savedModel = localStorage.getItem('ryflow_gemini_model');
      return savedModel || DEFAULT_GEMINI_MODELS[0];
    } catch {
      return DEFAULT_GEMINI_MODELS[0];
    }
  });
  const [keyInput, setKeyInput] = useState('');
  const [keyValidationError, setKeyValidationError] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLastQuestion, setAiLastQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copiedAi, setCopiedAi] = useState(false);

  // Load AI key from secure storage
  useEffect(() => {
    let active = true;
    const loadKey = async () => {
      const secureKey = await window.electronAPI?.getAiKey?.();
      if (validateApiKey(secureKey || '').valid) {
        if (active) setAiApiKey(secureKey);
        return;
      }
      const legacyKey = localStorage.getItem('ryflow_ai_key') || '';
      if (!validateApiKey(legacyKey).valid) return;
      const migrated = await window.electronAPI?.setAiKey?.(legacyKey);
      if (migrated) localStorage.removeItem('ryflow_ai_key');
      if (active) setAiApiKey(legacyKey);
    };
    loadKey();
    return () => { active = false; };
  }, []);

  // Sync available Gemini models
  useEffect(() => {
    if (!aiApiKey) return;
    const prov = detectAiProvider(aiApiKey, geminiModel);
    if (prov.id === 'gemini') {
      fetchAvailableGeminiModels(aiApiKey).then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setGeminiModelsList(list);
          if (!list.includes(geminiModel)) {
            setGeminiModel(list[0]);
            try {
              localStorage.setItem('ryflow_gemini_model', list[0]);
            } catch {}
          }
        }
      });
    }
  }, [aiApiKey, geminiModel]);

  const cycleGeminiModel = () => {
    const currentIndex = geminiModelsList.indexOf(geminiModel);
    const nextModel = geminiModelsList[(currentIndex + 1) % geminiModelsList.length];
    setGeminiModel(nextModel);
    setAiError('');
    try {
      localStorage.setItem('ryflow_gemini_model', nextModel);
    } catch {}
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    const check = validateApiKey(trimmed);

    if (!check.valid) {
      setKeyValidationError(check.message);
      return;
    }

    const stored = await window.electronAPI?.setAiKey?.(trimmed);
    if (!stored && window.electronAPI?.setAiKey) {
      setKeyValidationError('Penyimpanan aman tidak tersedia.');
      return;
    }
    setAiApiKey(trimmed);
    setKeyInput('');
    setKeyValidationError('');
    setIsEditingKey(false);
    setAiError('');
  };

  const activeProvider = detectAiProvider(aiApiKey, geminiModel);

  const handleRemoveApiKey = async () => {
    setAiApiKey('');
    setKeyInput('');
    setKeyValidationError('');
    setIsEditingKey(true);
    await window.electronAPI?.clearAiKey?.();
  };

  const askAi = async (customQuestion, overrideContext) => {
    const question = (customQuestion ?? aiPrompt).trim();
    if (!question || !aiApiKey || aiLoading) return;

    const ctx = { ...runtimeContext, ...overrideContext };
    const { media, weather, weatherLabel, todos } = ctx;

    setAiPrompt('');
    setAiLastQuestion(question);
    setAiLoading(true);
    setAiError('');
    setAiResponse('');

    const now = new Date();
    const fullDateString = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const fullTimeString = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let systemPrompt = `Kamu adalah Ryflow AI, asisten pribadi yang ringkas, hangat, dan kontekstual. 
Jawab dalam bahasa Indonesia, gunakan nada percakapan natural (tidak kaku/robot), singkat padat, dan langsung ke inti. Hindari penjelasan bertele-tele kecuali diminta.

KONTEKS REAL-TIME:
- Tanggal & Waktu: ${fullDateString}, ${fullTimeString} WIB
- Cuaca: ${weather?.city || '—'} (${weather?.temp ?? '—'}°C, ${weather?.humidity ?? '—'}%, ${weatherLabel || '—'})
- Lagu: ${media?.title ?? 'Tidak ada'} — ${media?.artist ?? '—'}

TAMBAHAN:
- Jika user menanyakan arti lagu, berikan interpretasi lirik yang mendalam tapi singkat.
- Jika user meminta fokus hari ini, berikan 2-3 prioritas berdasarkan agenda yang belum selesai.`;

    const todosList = todos?.filter((t) => !t.done).map((t) => t.text).join(', ') || 'Tidak ada';
    if (todosList !== 'Tidak ada') {
      systemPrompt += `\n- Agenda belum selesai: ${todosList}`;
    }

    try {
      const result = await callAiAgent({
        apiKey: aiApiKey,
        prompt: question,
        systemPrompt,
        geminiModel,
      });
      if (result.usedModel && result.usedModel !== geminiModel) {
        setGeminiModel(result.usedModel);
        try {
          localStorage.setItem('ryflow_gemini_model', result.usedModel);
        } catch {}
      }
      if (result.availableModels) {
        setGeminiModelsList(result.availableModels);
      }
      setAiResponse(result.text);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAi = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 1500);
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    askAi();
  };

  return {
    aiApiKey,
    setAiApiKey,
    geminiModelsList,
    geminiModel,
    setGeminiModel,
    keyInput,
    setKeyInput,
    keyValidationError,
    setKeyValidationError,
    isEditingKey,
    setIsEditingKey,
    aiPrompt,
    setAiPrompt,
    aiResponse,
    setAiResponse,
    aiLastQuestion,
    setAiLastQuestion,
    aiLoading,
    aiError,
    setAiError,
    copiedAi,
    activeProvider,
    cycleGeminiModel,
    handleSaveApiKey,
    handleRemoveApiKey,
    askAi,
    handleCopyAi,
    handleAiSubmit,
  };
}