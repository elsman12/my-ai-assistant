import { supabase } from '../../supabaseClient';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { message, userId, chatId } = await req.json();

    if (!userId) {
      console.log('Ошибка: не задан userId');
      return new Response(JSON.stringify({ text: 'Не задан userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      console.log('Ошибка: нет текста для отправки');
      return new Response(JSON.stringify({ text: 'Нет текста для отправки.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Сохраняем сообщение пользователя в Supabase
    const { error: insertUserError } = await supabase
      .from('messages')
      .insert([{ user_id: userId, chat_id: chatId, role: 'user', text: message }]);
    if (insertUserError) {
      console.error('Ошибка вставки сообщения пользователя:', insertUserError);
    } else {
      console.log('Сообщение пользователя сохранено в Supabase');
    }

    // === ОТПРАВКА СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ В n8n ===
    try {
      const n8nWebhookUrl = 'https://elsman123.app.n8n.cloud/webhook/1e363cd4-c36d-4c74-8a80-f1b66a0287fc';
      const webhookRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "Тема": message || "Без темы",
          "Текст сообщения": message || "",
          "Дата": new Date().toISOString()
        }),
      });

      if (!webhookRes.ok) {
        const err = await webhookRes.text();
        console.error('Ошибка вызова n8n webhook:', err);
      } else {
        console.log('Данные успешно отправлены в n8n webhook');
      }
    } catch (e) {
      console.error('Ошибка отправки в n8n webhook:', e);
    }

    // === ЗАПРОС К OPENROUTER ===
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log('Ошибка: не задан OPENROUTER_API_KEY');
      return new Response(JSON.stringify({ text: 'Не задан OPENROUTER_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-70b-instruct',
        messages: [
          {
            role: 'system',
            content: `Ты — помощник, который отвечает только на русском языке.
Пиши грамотно, структурированно, без смешения языков.
Используй Markdown для форматирования (абзацы, списки, выделения).
Отвечай четко, подробно и понятно.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.log(`Ошибка OpenRouter: ${res.status} ${errorText}`);
      throw new Error(`OpenRouter error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const aiText = data.choices?.[0]?.message?.content?.trim() || 'Извините, сейчас недоступно.';
    console.log('Ответ AI получен:', aiText);

    // Сохраняем ответ AI в Supabase
    const { error: insertAiError } = await supabase
      .from('messages')
      .insert([{ user_id: userId, chat_id: chatId, role: 'assistant', text: aiText }]);
    if (insertAiError) {
      console.error('Ошибка вставки сообщения AI:', insertAiError);
    } else {
      console.log('Ответ AI сохранён в Supabase');
    }

    // === ОТПРАВКА ОТВЕТА AI В n8n ===
    try {
      const n8nWebhookUrl = 'https://elsman123.app.n8n.cloud/webhook/1e363cd4-c36d-4c74-8a80-f1b66a0287fc';
      const webhookRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "Тема": "Ответ ассистента",
          "Текст сообщения": aiText || "",
          "Дата": new Date().toISOString()
        }),
      });

      if (!webhookRes.ok) {
        const err = await webhookRes.text();
        console.error('Ошибка вызова n8n webhook (AI):', err);
      } else {
        console.log('Ответ AI отправлен в n8n webhook');
      }
    } catch (e) {
      console.error('Ошибка отправки в n8n webhook (AI):', e);
    }

    return new Response(JSON.stringify({ text: aiText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Ошибка /api/chat:', error);
    return new Response(
      JSON.stringify({ text: 'Извините, сейчас недоступно.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
