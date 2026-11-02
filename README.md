# Nexo by LBs IAs

**Un chat, todos los modelos.** Espacio de trabajo privado, bilingüe y
multimodelo que habla con OpenAI, Anthropic, Google Gemini, OpenRouter, Groq,
Mistral, DeepSeek y xAI desde la misma conversación, con **tus propias claves**.

- Streaming token a token (SSE) en los tres protocolos de proveedor.
- Cambio de modelo en caliente, sin perder la conversación.
- **Modo comparación**: la misma pregunta a 2 o 3 modelos, en columnas.
- **Biblioteca de prompts**: instrucciones incluidas en ES/EN y prompts propios.
- **Adjuntos de texto y código** con vista previa, límites y contexto para el modelo.
- **Búsqueda global** en títulos y en todas las respuestas.
- **Paleta de comandos** (`⌘/Ctrl+K`) y atajos para todo.
- **Estadísticas de uso** y exportación JSON / Markdown.
- **PWA instalable** con interfaz offline y tema claro/oscuro.
- Interfaz **bilingüe real** (ES/EN) con detección automática y selector.
- Historial en el navegador con buscar, renombrar, borrar, exportar e importar.
- Sin base de datos, sin sesiones, sin registro. No hay servidor que guarde
  tus claves ni tus chats.

## Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Cliente | React 19 + TypeScript + Vite | Un solo bundle, sin framework de UI extra |
| Estilos | CSS propio con tokens | Sin Tailwind ni runtime de estilos |
| API | Hono sobre `fetch` | Corre igual en Workers y en Bun |
| Streaming | SSE nativo | Sin websockets ni servidores de estado |
| Persistencia | `localStorage` tolerante | Sin cuentas ni base de datos |
| Despliegue | Cloudflare Workers + assets | Sin origen frío, sin contenedores |

Dependencias de runtime: `hono`, `react`, `react-dom`, `react-markdown`,
`remark-gfm`. El motor de Markdown se carga en un chunk aparte, solo cuando hay
una respuesta que pintar.

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

## Atajos

| Atajo | Acción |
| --- | --- |
| `⌘/Ctrl + K` | Paleta de comandos (acciones, chats, prompts y modelos) |
| `⌘/Ctrl + ⇧ + F` | Búsqueda global en títulos y mensajes |
| `⌘/Ctrl + ⇧ + P` | Biblioteca de prompts |
| `⌘/Ctrl + ,` | Ajustes |
| `Enter` | Enviar (configurable; `⇧ + Enter` salto de línea) |
| `Esc` | Cerrar cualquier capa |

## Idioma y tema

- El idioma se detecta del navegador y se puede fijar en **Ajustes → Aspecto**.
- Las instrucciones predeterminadas del asistente siguen el idioma activo; si
  escribes las tuyas, se conservan y puedes restaurarlas con un clic.
- El tema (oscuro, claro o sistema) y el color de acento se aplican **antes del
  primer pintado**, sin destellos.
- La API localiza sus errores con `x-locale` y `Accept-Language`.

## PWA y modo offline

- `public/manifest.webmanifest` declara la app instalable (iconos 192/512).
- `public/sw.js` precachea el shell **y los assets con hash** que referencia el
  HTML; después usa caché en tiempo de ejecución para el resto.
- El historial sigue disponible porque vive en `localStorage`.
- El service worker **nunca cachea `/api/`**: ni claves ni respuestas del
  proveedor pasan por la caché.
- Solo se registra en producción para no interferir con el HMR de Vite.

Regenerar los iconos (sin dependencias externas):

```sh
bun run icons
```

## Build y despliegue

```sh
bun run typecheck # TypeScript estricto, sin emitir
bun run build     # dist/client (SPA) + dist/server/index.js (Worker)
bun run deploy    # build + wrangler deploy
```

### Cloudflare Workers

```sh
bunx wrangler login
bunx wrangler secret put OPENAI_API_KEY     # opcional, por proveedor
bun run deploy
```

`wrangler.jsonc` declara el Worker (`src/worker.ts`), los assets
(`dist/client`) y el fallback SPA. Si no defines secretos, la app funciona
igual: cada usuario trae su clave.

### Freebuff Sites

`deploy.json` describe el Worker precompilado y los assets. Ejecuta
`bun run build` y publica ese manifiesto con la herramienta de Sites.

## Cómo funciona

```txt
src/
  shared/providers.ts    catálogo de proveedores (lista blanca) y modelos
  shared/types.ts        conversaciones, adjuntos, ajustes
  shared/i18n.ts         diccionario ES/EN y utilidades de formato
  shared/meta.ts         nombre y versión de la aplicación
  server/index.ts        API Hono: /api/chat (SSE), /api/models, /api/providers
  server/adapters.ts     OpenAI-compatible · Anthropic · Gemini → un solo stream
  worker.ts              entrada del Worker: API + assets
  dev.ts                 entrada Bun para desarrollo
  App.tsx                estado, streaming paralelo, paleta, persistencia
  components/            Sidebar, ChatView, ModelMenu, SettingsDialog, Markdown,
                         Artifacts, CommandPalette, SearchOverlay, PromptDialog
  lib/i18n.tsx           contexto de idioma para React
  lib/store.ts           localStorage tolerante, reparación, sanitización y export
  lib/attachments.ts     lectura y límites de archivos de texto/código
  lib/prompts.ts         biblioteca de prompts propios
  lib/search.ts          búsqueda lineal en títulos y mensajes
  lib/stats.ts           estadísticas de uso en una pasada
  lib/toast.ts           avisos efímeros
  lib/pwa.ts             instalación y registro del service worker
```

Cada respuesta es una *parte* independiente dentro del turno del asistente.
Por eso el modo comparación no necesita nada especial: se abren varias
peticiones a la vez y cada una rellena su tarjeta. Regenerar reemplaza el turno
y reutiliza los mismos modelos.

Detalles que evitan fallos raros:

- Al cargar, cualquier respuesta a medias queda como **detenida**, así el
  composer nunca se bloquea tras recargar.
- Todo lo que entra de `localStorage` o de un JSON importado se **repara y
  sanitiza** antes de renderizarse (turnos, partes y adjuntos).
- El servidor rechaza peticiones con un `Origin` de otra web (403) y valida
  JSON, proveedor, modelo y mensajes antes de llamar al proveedor.
- Las escrituras SSE y el cierre del stream toleran que el cliente corte la
  conexión a mitad de respuesta; el lector del cliente acepta `\r\n`.
- Los errores de proveedor (401, 402, 404, 429…) se muestran con su detalle y
  una pista en el idioma activo.
- La lista de modelos se limita a 400 entradas para no saturar el selector.
- El service worker no interfiere con `/api/` ni con el desarrollo.

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

- El servidor recorta a 48 mensajes, 60 000 caracteres por mensaje, 240 000
  caracteres en total y 8 192 tokens de salida.
- Cada adjunto acepta hasta 200 KB / 24 000 caracteres; máximo 3 archivos y
  48 000 caracteres en conjunto.
- Las claves en `localStorage` son cómodas pero no están cifradas: cualquiera
  con acceso a ese navegador puede leerlas. No las uses en equipos compartidos.
- El historial vive en `localStorage` (unos 5 MB). Si guardas conversaciones muy
  largas, exporta y limpia.
- Sin tests automatizados: verificación con `bun run typecheck`, `bun run build`
  y pruebas de humo de la UI y del API (`/api/health`, `/api/chat`,
  `/api/models`).

## Archivos generados (artefactos)

Cuando una respuesta incluye un bloque de código con un nombre —por ejemplo
`### guia.md` seguido de un bloque ```md— Nexo lo detecta y muestra una tarjeta
descargable bajo la respuesta, con nombre real, tamaño y tipo. El botón
*Descargar* crea el archivo en el navegador (Blob + `URL.createObjectURL`); no
hay servidor de archivos ni almacenamiento intermedio.

- Nombres reconocidos por la extensión del bloque (`md`, `json`, `ts`, `html`,
  `csv`, `sql`, `py`…) o por el nombre escrito justo antes.
- Los bloques de menos de 24 caracteres se ignoran: son fragmentos, no archivos.
- Mientras la respuesta se está escribiendo no aparece la tarjeta.
- La conversación completa también se exporta en Markdown desde la cabecera.

## En vivo

- Producción: <https://site-49bb794aa6e842d68dad3db8d211eaf5.freebuff.page/>
- Preview: <https://site-25a791cf07804e25b6127b1e3ce9000a.freebuff.page>

Sin secretos configurados: cada persona pega su clave en Ajustes → Claves.
