// POST /api/chat — streaming chat con Claude via SSE.
// Body: { prompt: string, candidateSlug?: string }
// Response: text/event-stream con eventos JSON.

import type { APIRoute } from 'astro';

export const prerender = false;

const CHAT_DISABLED = process.env.DISABLE_CHAT === '1';

export const POST: APIRoute = async ({ request }) => {
  if (CHAT_DISABLED) {
    return new Response(JSON.stringify({ error: 'chat_disabled', message: 'Chat con Claude no disponible en este servidor. Usa el formulario.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Lazy import — solo si chat está activo (evita crash en CPUs sin AVX al boot)
  const { runChat } = await import('../../lib/claude/agent.mjs');
  let body: { prompt?: string; candidateSlug?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 });
  }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'empty_prompt' }), { status: 400 });
  }

  const abortController = new AbortController();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Keep-alive ping every 15s in case Claude takes a while
      const ping = setInterval(() => send('ping', { t: Date.now() }), 15000);

      try {
        const q = runChat(prompt, { candidateSlug: body.candidateSlug, abortController });

        for await (const msg of q) {
          if (abortController.signal.aborted) break;

          switch (msg.type) {
            case 'assistant': {
              for (const block of msg.message.content as Array<any>) {
                if (block.type === 'text') {
                  send('text', { text: block.text });
                } else if (block.type === 'tool_use') {
                  send('tool_use', { id: block.id, name: block.name, input: block.input });
                }
              }
              break;
            }
            case 'user': {
              // Echo de tool_result — sólo loggear los exitosos brevemente
              for (const block of (msg.message.content as Array<any>) ?? []) {
                if (block.type === 'tool_result') {
                  const text = Array.isArray(block.content)
                    ? block.content.map((c: any) => c.text ?? '').join('')
                    : (block.content ?? '');
                  send('tool_result', { tool_use_id: block.tool_use_id, is_error: !!block.is_error, text: text.slice(0, 4000) });
                }
              }
              break;
            }
            case 'result': {
              send('done', {
                is_error: msg.is_error,
                duration_ms: msg.duration_ms,
                num_turns: msg.num_turns,
                subtype: msg.subtype,
              });
              break;
            }
            case 'system': {
              if (msg.subtype === 'compact_boundary') send('compact', {});
              // resto: ignorar (init, hook_started, hook_response, etc)
              break;
            }
          }
        }
      } catch (err: any) {
        send('error', { message: err?.message ?? String(err) });
      } finally {
        clearInterval(ping);
        try { controller.close(); } catch {}
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
