# Nexo

**Un chat, todos los modelos.** Aplicación web ligera que habla con OpenAI,
Anthropic, Google Gemini, OpenRouter, Groq, Mistral, DeepSeek y xAI desde la
misma conversación, con **tus propias claves**.

- Streaming token a token (SSE) en los tres protocolos de proveedor.
- Cambio de modelo en caliente, sin perder la conversación.
- **Modo comparación**: la misma pregunta a 2 o 3 modelos, en columnas, para
  quedarte con la mejor respuesta.
- Ajustes reales: instrucciones del sistema, temperatura, límite de tokens,
  tema, color de acento y comportamiento de Enter.
- Historial en el navegador con buscar, renombrar, borrar, exportar e importar
  (JSON completo o **Markdown legible** por conversación).
- Atajos: `⌘/Ctrl+K` nuevo chat, `⌘/Ctrl+,` ajustes.
- Sin base de datos, sin sesiones, sin registro. No hay servidor que guarde
  tus claves ni tus chats.
- Desplegable en Cloudflare Workers o en cualquier servidor con Bun.

## Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Cliente | React 19 + TypeScript + Vite | Un solo bundle, sin framework de UI extra |
| Estilos | CSS propio | Sin Tailwind ni runtime de estilos |
| API | Hono sobre `fetch` | Corre igual en Workers y en Bun |
| Streaming | SSE nativo | Sin websockets ni servidores de estado |
| Despliegue | Cloudflare Workers + assets estáticos | Sin origen frío, sin contenedores |

Dependencias de runtime: `hono`, `react`, `react-dom`, `react-markdown`,
`remark-gfm`. El motor de Markdown se carga en un chunk aparte, solo cuando hay
una respuesta que pintar, para que el primer arranque pese menos.

## Arrancar en local

Requiere [Bun](https://bun.sh) 1.1+ (recomendado) o Node 20+ con `npm`.

```sh
bun install
bun run dev
```

- Cliente: <http://localhost:5173>
- API: <http://localhost:8787> (Vite reenvía `/api` allí, así que todo comparte
  origen y no hay CORS)

Abre **Ajustes → Claves**, pega la clave de un proveedor y pulsa *Probar* para
verificar la conexión y listar sus modelos reales.

### Claves: navegador o servidor

Las claves que pegas se guardan en `localStorage` y viajan en la cabecera
`x-provider-key` de cada petición. El servidor las reenvía al proveedor en el
momento y no las escribe en disco ni en logs. Si prefieres que el dueño del
despliegue pague las llamadas, define variables de entorno
(`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, …): los usuarios pueden dejar el campo
vacío y la app usará la del servidor.

## Build y despliegue

```sh
bun run build     # dist/client (SPA) + dist/server/index.js (Worker)
bun run typecheck # TypeScript estricto, sin emitir
bun run deploy    # build + wrangler deploy
```

### Cloudflare Workers

```sh
bunx wrangler login
bunx wrangler secret put OPENAI_API_KEY     # opcional, por proveedor
bun run deploy
```

`wrangler.jsonc` ya declara el Worker (`src/worker.ts`), los assets
(`dist/client`) y el fallback SPA. Si no defines secretos, la app funciona
igual: cada usuario trae su clave.

### Freebuff Sites

`deploy.json` describe el Worker precompilado y los assets. Ejecuta
`bun run build` y publica ese manifiesto con la herramienta de Sites.

### GitHub

```sh
git init && git add . && git commit -m "Nexo"
git remote add origin git@github.com:<usuario>/nexo.git
git push -u origin main
```

`.env` y `.wrangler/` ya están en `.gitignore`; no subas claves.

## Cómo funciona

```
src/
  shared/providers.ts   catálogo de proveedores (lista blanca) y modelos
  shared/types.ts       conversaciones, respuestas parciales, ajustes
  server/index.ts       API Hono: /api/chat (SSE), /api/models, /api/providers
  server/adapters.ts    OpenAI-compatible · Anthropic · Gemini → un solo stream
  worker.ts             entrada del Worker: API + assets
  dev.ts                entrada Bun para desarrollo
  App.tsx               estado, streaming paralelo, persistencia, exportación
  components/           Sidebar, ChatView, ModelMenu, SettingsDialog, Markdown
  lib/api.ts            lector SSE del cliente y listado de modelos
  lib/store.ts          localStorage tolerante, reparación y exportación
```

Cada respuesta es una *parte* independiente dentro del turno del asistente.
Por eso el modo comparación no necesita nada especial: se abren varias
peticiones a la vez y cada una rellena su tarjeta. Regenerar reemplaza el turno
y reutiliza los mismos modelos.

Detalles que evitan fallos raros:

- Al cargar, cualquier respuesta que quedó a medias se marca como **detenida**
  (no como «en curso»), así el composer nunca se queda bloqueado tras recargar.
- El servidor rechaza peticiones con un `Origin` de otra web (403): con claves
  del servidor, nadie puede gastar tu saldo desde su página. Los hosts de
  loopback se consideran el mismo origen para no romper el proxy de Vite.
- Las escrituras SSE y el cierre del stream toleran que el cliente corte la
  conexión a mitad de respuesta.
- Lista de modelos limitada a 400 entradas para no saturar el selector.

Añadir un proveedor compatible con OpenAI es una entrada en
`src/shared/providers.ts`:

```ts
{
  id: 'miprovedor',
  name: 'Mi Proveedor',
  kind: 'openai',
  baseUrl: 'https://api.miprovedor.com/v1',
  keyEnv: 'MIPROVEDOR_API_KEY',
  keyUrl: 'https://miprovedor.com/keys',
  models: ['modelo-rapido', 'modelo-grande'],
  color: '#22ccaa',
}
```

Para protocolos distintos, añade una función generadora en
`src/server/adapters.ts` y un caso en `streamChat`.

## Límites y decisiones

- El servidor recorta a 48 mensajes y 16 000 caracteres por mensaje, y a
  8 192 tokens de salida, para que una petición no se dispare.
- El modelo se envía tal cual: no hay lista blanca por modelo, solo por
  proveedor. Es deliberado, para poder usar cualquier modelo nuevo sin tocar
  código; si alojas la app con claves del servidor, limita los modelos a mano.
- Las claves en `localStorage` son cómodas pero no están cifradas: cualquiera
  con acceso a ese navegador puede leerlas. No las uses en equipos compartidos.
- El historial vive en `localStorage` (unos 5 MB). Si guardas conversaciones muy
  largas, exporta y limpia; el siguiente paso natural es IndexedDB.
- Los errores del proveedor (401, 402, 404, 429…) se muestran tal cual llegan,
  con una pista en español.
- Sin tests: verificación con `bun run typecheck`, `bun run build` y pruebas de
  humo del API (`/api/health`, `/api/chat`, `/api/models`).

## Archivos generados (artefactos)

Cuando una respuesta incluye un bloque de código con un nombre —por ejemplo
`### guia.md` seguido de un bloque ```md— Nexo lo detecta y muestra una tarjeta
descargable bajo la respuesta, con nombre real, tamaño y tipo. El botón
*Descargar* crea el archivo en el navegador (Blob + `URL.createObjectURL`); no
hay servidor de archivos ni almacenamiento intermedio.

- Nombres reconocidos por la extensión del bloque (`md`, `json`, `ts`, `html`,
  `csv`, `sql`, `py`…) o por el nombre escrito justo antes.
- Los bloques de menos de 24 caracteres se ignoran: son fragmentos, no archivos.
- Mientras la respuesta se está escribiendo no aparece la tarjeta, para no
  ofrecer descargas a medias.
- La conversación completa también se puede exportar en Markdown desde la
  cabecera del chat (icono de descarga).

## En vivo

- Producción: <https://site-49bb794aa6e842d68dad3db8d211eaf5.freebuff.page/>
- Preview: <https://site-25a791cf07804e25b6127b1e3ce9000a.freebuff.page>

Sin secretos configurados: cada persona pega su clave en Ajustes → Claves.
