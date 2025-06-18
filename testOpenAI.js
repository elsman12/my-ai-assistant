// testOpenAI.js
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROXY_URL = process.env.OPENAI_PROXY_URL; // например "http://user:pass@host:port"
const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

async function testOpenAI() {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      agent,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello from test!' }],
        max_tokens: 5,
      }),
    });

    if (!res.ok) {
      console.error(`Ошибка OpenAI: статус ${res.status}`);
      const err = await res.json();
      console.error('Ответ API:', err);
      return;
    }

    const data = await res.json();
    console.log('Успешный ответ OpenAI:', data.choices[0].message.content);
  } catch (error) {
    console.error('Ошибка при запросе к OpenAI:', error);
  }
}

testOpenAI();
