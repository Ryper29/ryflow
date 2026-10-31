export const DEFAULT_GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-pro-latest',
  'gemini-2.5-flash',
];

let cachedDiscoveredModels = null;
let cachedKeyForModels = '';

export async function fetchAvailableGeminiModels(cleanKey) {
  if (cachedDiscoveredModels && cachedKeyForModels === cleanKey) {
    return cachedDiscoveredModels;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`
    );
    if (!res.ok) return DEFAULT_GEMINI_MODELS;
    const data = await res.json();
    if (!Array.isArray(data.models)) return DEFAULT_GEMINI_MODELS;

    const validModels = data.models
      .filter(
        (m) =>
          m.name?.startsWith('models/gemini') &&
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          !/embedding|imagen|veo|tts|audio|robotics|computer-use|aqa|learnlm/i.test(m.name)
      )
      .map((m) => m.name.replace(/^models\//, ''));

    const scoreModel = (id) => {
      if (id.includes('gemini-3') && id.includes('flash')) return 100;
      if (id === 'gemini-flash-latest') return 90;
      if (id.includes('2.5-flash-lite')) return 80;
      if (id.includes('flash')) return 70;
      if (id.includes('gemini-3') && id.includes('pro')) return 60;
      if (id === 'gemini-pro-latest') return 50;
      return 10;
    };

    validModels.sort((a, b) => scoreModel(b) - scoreModel(a));

    if (validModels.length > 0) {
      cachedDiscoveredModels = validModels;
      cachedKeyForModels = cleanKey;
      return validModels;
    }
  } catch {}
  return DEFAULT_GEMINI_MODELS;
}

export function validateApiKey(key) {
  const k = (key || '').trim();
  if (!k) {
    return { valid: false, message: 'API Key tidak boleh kosong.' };
  }
  if (/\s/.test(k)) {
    return { valid: false, message: 'API Key tidak boleh mengandung spasi.' };
  }
  if (k.length < 10) {
    return { valid: false, message: 'API Key terlalu pendek (minimal 10 karakter).' };
  }
  return { valid: true };
}

export function detectAiProvider(key, geminiModel = DEFAULT_GEMINI_MODELS[0]) {
  const k = (key || '').trim();
  if (!k) return { id: 'gemini', name: geminiModel, model: geminiModel };

  if (k.startsWith('sk-ant-')) {
    return { id: 'anthropic', name: 'Claude 3.5 Haiku', model: 'claude-3-5-haiku-latest' };
  }
  if (k.startsWith('AQ') || k.startsWith('AIza')) {
    return { id: 'gemini', name: geminiModel, model: geminiModel };
  }
  if (k.startsWith('grok_') || k.startsWith('xai-')) {
    return { id: 'grok', name: 'Grok', model: 'grok-2-latest' };
  }
  if (k.startsWith('gsk_')) {
    return { id: 'groq', name: 'Groq Llama 3.3', model: 'llama-3.3-70b-versatile' };
  }
  if (k.startsWith('sk-')) {
    return { id: 'openai', name: 'OpenAI GPT-4o Mini', model: 'gpt-4o-mini' };
  }

  return { id: 'gemini', name: geminiModel, model: geminiModel };
}

export function mapAiHttpError(status, rawMessage = '') {
  const msg = String(rawMessage).toLowerCase();
  if (status === 401 || status === 403 || msg.includes('api key not valid') || msg.includes('invalid api key') || msg.includes('authentication')) {
    return 'API Key salah atau sudah kedaluwarsa. Coba ganti API Key.';
  }
  if (status === 429 || msg.includes('quota') || msg.includes('rate limit')) {
    return 'Terlalu banyak permintaan. Coba lagi beberapa saat.';
  }
  if (status >= 500) {
    return 'Server AI sedang bermasalah. Coba beberapa menit lagi.';
  }
  return rawMessage || 'Gagal memproses permintaan AI.';
}

async function callGemini({ cleanKey, prompt, systemPrompt, geminiModel, discovered }) {
  const modelsToTry = [
    ...(discovered.includes(geminiModel) ? [geminiModel] : []),
    ...discovered.filter((m) => m !== geminiModel),
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 350 },
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons.';
      return { text: replyText, usedModel: modelName, availableModels: discovered };
    }

    const errMsg = data.error?.message || '';
    if (res.status === 404 || /no longer available|not found|not supported|deprecated/i.test(errMsg)) {
      lastError = new Error(errMsg);
      continue;
    }

    throw new Error(mapAiHttpError(res.status, errMsg));
  }

  throw lastError || new Error('Tidak ada model Gemini yang tersedia untuk API Key ini.');
}

async function callGrok({ cleanKey, prompt, systemPrompt }) {
  const endpoints = [
    { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-2-latest' },
    { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
  ];
  let lastErr = null;

  for (const ep of endpoints) {
    const res = await fetch(ep.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        model: ep.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 350,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { text: data.choices?.[0]?.message?.content || 'Tidak ada respons.' };
    }
    lastErr = new Error(mapAiHttpError(res.status, data.error?.message));
  }

  throw lastErr;
}

async function callGroq({ cleanKey, prompt, systemPrompt }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 350,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mapAiHttpError(res.status, data.error?.message));
  }
  return { text: data.choices?.[0]?.message?.content || 'Tidak ada respons.' };
}

async function callAnthropic({ cleanKey, prompt, systemPrompt }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cleanKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 350,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mapAiHttpError(res.status, data.error?.message));
  }
  return { text: data.content?.[0]?.text || 'Tidak ada respons.' };
}

async function callOpenAI({ cleanKey, prompt, systemPrompt }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 350,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mapAiHttpError(res.status, data.error?.message));
  }
  return { text: data.choices?.[0]?.message?.content || 'Tidak ada respons.' };
}

export async function callAiAgent({ apiKey, prompt, systemPrompt, geminiModel = DEFAULT_GEMINI_MODELS[0] }) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Tidak ada koneksi internet.');
  }

  const cleanKey = (apiKey || '').trim();
  const validation = validateApiKey(cleanKey);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const provider = detectAiProvider(cleanKey, geminiModel);

  try {
    if (provider.id === 'gemini') {
      const discovered = await fetchAvailableGeminiModels(cleanKey);
      return callGemini({ cleanKey, prompt, systemPrompt, geminiModel, discovered });
    }
    if (provider.id === 'grok') {
      return callGrok({ cleanKey, prompt, systemPrompt });
    }
    if (provider.id === 'groq') {
      return callGroq({ cleanKey, prompt, systemPrompt });
    }
    if (provider.id === 'anthropic') {
      return callAnthropic({ cleanKey, prompt, systemPrompt });
    }
    return callOpenAI({ cleanKey, prompt, systemPrompt });
  } catch (err) {
    if (err.name === 'TypeError' || /failed to fetch|network/i.test(err.message)) {
      throw new Error('Tidak ada koneksi internet.');
    }
    throw err;
  }
}