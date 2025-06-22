import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    // Можно получить параметры пагинации из query (например, ?start_cursor=xxx)
    const url = new URL(req.url);
    const start_cursor = url.searchParams.get('start_cursor');

    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: start_cursor || undefined,
      page_size: 20, // например, 20 записей за раз
      sorts: [
        {
          property: 'Дата',
          direction: 'descending',
        },
      ],
    });

    // Формируем удобный для фронтенда формат
    const results = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        tema: props["Тема"]?.title?.[0]?.text?.content || '',
        text: props["Текст сообщения"]?.rich_text?.[0]?.text?.content || '',
        who: props["Кто"]?.select?.name || '',
        date: props["Дата"]?.date?.start || '',
      };
    });

    return new Response(JSON.stringify({
      results,
      has_more: response.has_more,
      next_cursor: response.next_cursor,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Ошибка получения сообщений из Notion:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
