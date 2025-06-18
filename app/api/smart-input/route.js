import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyAgent = process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined;

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = process.env.OPENAI_API_KEY;

const WEBHOOKS = {
  task:           "https://elsman1.app.n8n.cloud/webhook/chatgpt-log",
  lead:           "https://elsman1.app.n8n.cloud/webhook/applications",
  finance:        "https://elsman1.app.n8n.cloud/webhook/many",
  messageHistory: "https://elsman1.app.n8n.cloud/webhook/istoriya",
  realestate:     "https://elsman1.app.n8n.cloud/webhook/doma",
  subscription:   "https://elsman1.app.n8n.cloud/webhook/bills",
  content:        "https://elsman1.app.n8n.cloud/webhook/content",
  other:          "https://elsman1.app.n8n.cloud/webhook/istoriya",
};

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: 'OPENAI_API_KEY is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1) Классификация через GPT
    const res = await fetch(OPENAI_URL, {
      agent: proxyAgent,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
Ты умный ассистент, который на вход получает любое сообщение от пользователя и всегда возвращает JSON-объект с этими полями:
  • type: один из [task, lead, finance, messageHistory, realestate, subscription, content, other]
  • title: строка — основное содержание (задача, текст заявки и т.д.)
  • amount: число — если речь про деньги (иначе omit)
  • due: строка-дата в формате YYYY-MM-DD, если упоминается дедлайн (иначе omit)
  • client: имя клиента, если упоминалось
  • details: любые дополнительные сведения
Просто верни JSON как текст, без пояснений.`
          },
          { role: "user", content: text }
        ],
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('OpenAI API error:', res.status, errorData);
      throw new Error(`OpenAI status ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    // 2) Выбираем нужный Webhook
    const webhookUrl = WEBHOOKS[parsed.type] || WEBHOOKS.other;

    // 3) Отправляем данные в n8n
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    return new Response(JSON.stringify({ ok: true, routed: parsed.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error("SMART-INPUT Error:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
