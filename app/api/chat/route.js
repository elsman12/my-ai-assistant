import { HttpsProxyAgent } from 'https-proxy-agent';

export const runtime = 'nodejs';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROXY_URL = process.env.OPENAI_PROXY_URL; // прокси, если есть
const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Функция с retry для вызова OpenAI
async function callOpenAIWithRetry(payload, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(OPENAI_URL, {
        agent,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        if (i < retries - 1) {
          // Ждем перед повторной попыткой
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        } else {
          throw new Error('OpenAI rate limit exceeded');
        }
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`OpenAI error: ${errorData.message || res.status}`);
      }

      return await res.json();

    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return new Response(
        JSON.stringify({ text: 'Нет текста для отправки.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000,
    };

    // Вызов с retry
    const data = await callOpenAIWithRetry(payload);

    const aiText = data.choices?.[0]?.message?.content?.trim() || 'Извините, сейчас недоступно.';

    return new Response(
      JSON.stringify({ text: aiText }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ошибка /api/chat:', error);
    return new Response(
      JSON.stringify({ text: 'Извините, сейчас недоступно.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
