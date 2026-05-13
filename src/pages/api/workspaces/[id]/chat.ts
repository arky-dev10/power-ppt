// GET  /api/workspaces/:id/chat       → historial
// POST /api/workspaces/:id/chat       → agrega mensaje user + responde con stub
// DELETE /api/workspaces/:id/chat     → limpia historial
import type { APIRoute } from 'astro';
import { readMeta, readChat, appendChat, clearChat, listResearchFiles, listOutputs } from '../../../../lib/workspaces.mjs';

export const prerender = false;

export const GET: APIRoute = ({ params }) => {
  const id = params.id as string;
  if (!readMeta(id)) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  return Response.json({ ok: true, messages: readChat(id) });
};

export const DELETE: APIRoute = ({ params }) => {
  const id = params.id as string;
  if (!readMeta(id)) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  clearChat(id);
  return Response.json({ ok: true });
};

function stubReply(prompt: string, ctx: { files: any[]; outputs: any[]; type: string }): string {
  const p = prompt.toLowerCase();
  const fileCount = ctx.files.length;
  const outCount = ctx.outputs.length;

  if (/hola|hi|hey/.test(p)) return `Hola. Tengo ${fileCount} archivo(s) en research y ${outCount} output(s) generado(s). ¿Qué hacemos?`;
  if (/archivo|file|subido|sube/.test(p)) {
    if (!fileCount) return 'Aún no subiste archivos. Arrastrá PDFs, DOCX, encuestas o imágenes al panel izquierdo.';
    return `Veo ${fileCount} archivo(s): ${ctx.files.map(f => f.name).slice(0,5).join(', ')}${fileCount > 5 ? '…' : ''}.`;
  }
  if (/presentaci[oó]n|slides/.test(p)) return 'El chat real con Claude está pendiente. Por ahora, usá el form rápido o el panel de preview para ver los outputs ya generados.';
  if (/diagnostico|territorial/.test(p)) return 'El diagnóstico territorial ECD está disponible como tab del preview si ya hay datos. Si no, podés cargar territorial.json en outputs/.';
  if (/perfil|5n|vetting/.test(p)) return 'El perfil 5N requiere datos del candidato. Subí documentos a research/ y cuando active el chat real, los voy a analizar.';
  return `Recibido. (Backend del chat con Claude está pendiente — esto es una respuesta stub. Tu mensaje quedó guardado y cuando active Claude responde en serio.)`;
}

export const POST: APIRoute = async ({ params, request }) => {
  const id = params.id as string;
  const meta = readMeta(id);
  if (!meta) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });

  try {
    const body = await request.json() as any;
    const text = String(body.text ?? '').trim();
    if (!text) return Response.json({ ok: false, error: 'empty' }, { status: 400 });

    appendChat(id, { role: 'user', content: text });

    const reply = stubReply(text, {
      files: listResearchFiles(id),
      outputs: listOutputs(id),
      type: meta.type,
    });
    appendChat(id, { role: 'assistant', content: reply, stub: true });

    return Response.json({ ok: true, reply });
  } catch (err: any) {
    return Response.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
};
