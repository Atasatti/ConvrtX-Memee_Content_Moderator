# Aegis — frontend

Next.js 16 operator console for the Memee content moderation API, built on a
strict **MVVM** separation.

## Running

```sh
npm install
npm run dev     # http://localhost:3000
```

The backend must be running at `http://127.0.0.1:8000`. To point somewhere else,
copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Architecture

The dependency rule is one-directional: **View → ViewModel → Model**. Nothing
points back up.

```
src/
├── models/            MODEL — domain types + wire contracts. No React.
│   ├── common.model.ts        RiskLevel, Result<T>, AppError
│   ├── moderation.model.ts    ModerationVerdict, CategoryScore
│   ├── nsfw.model.ts          NsfwClassification, ImageAnalysis, VideoAnalysis
│   ├── scan.model.ts          ScanRecord, ScanStats
│   ├── upload.model.ts        File validation rules
│   └── dto/                   Raw API shapes + DTO→domain mappers
│
├── services/          MODEL — data access. The only code that knows URLs.
│   ├── http/apiClient.ts      Transport, error normalization, upload progress
│   ├── moderation.service.ts  All seven backend endpoints
│   ├── system.service.ts      /health
│   └── scanHistory.service.ts persistent history API + legacy migration
│
├── viewmodels/        VIEWMODEL — state + commands. No JSX.
│   ├── shared/useAnalysisCommand.ts   status, progress, cancel, history logging
│   ├── shared/useFileSelection.ts     file choice, validation, object URLs
│   ├── scanHistoryStore.tsx           shared scan log backed by SQLite
│   └── use*ViewModel.ts               one per screen
│
├── views/             VIEW — presentational React only.
│   ├── components/    Card, Button, ScoreBar, FrameTimeline, Dropzone, …
│   ├── screens/       One per route
│   ├── shell/         AppShell, navigation, API status badge
│   └── theme/risk.ts  Risk level → status color + label
│
└── app/               Next.js routes. Each page is a thin wrapper over a screen.
```

### The rules this enforces

- **Views never fetch.** No component imports from `services/`. They read state
  and call commands off a ViewModel hook.
- **ViewModels never render.** No JSX, no DOM types beyond `File`.
- **Models are framework-free.** `models/` imports no React and no `fetch`.
- **The API's shape stops at the mapper.** `dto/api.dto.ts` describes the wire
  format; `dto/mappers.ts` converts it to domain types. If the backend renames a
  field, only the mapper changes.

### Error handling

Services return `Result<T>` (`{ok: true, value}` or `{ok: false, error}`) rather
than throwing, so ViewModels branch on failure without try/catch and every
failure reaches the UI as a typed `AppError`. `apiClient` normalizes the three
error shapes this backend produces: `{detail: string}`, FastAPI's
`{detail: [{msg}]}` validation arrays, and the `{error: string}` body that
`analyze_text` returns with a 500.

### Why XMLHttpRequest for uploads

`fetch` cannot report upload progress. Video files run to hundreds of megabytes
and video scans take minutes, so `apiClient.postForm` uses `XMLHttpRequest` to
drive a real progress bar, then switches to an indeterminate sweep once the
bytes are delivered rather than faking a server-side percentage.

### Data visualization

Two color jobs, applied deliberately:

- **Magnitude** — bar length carries the value, in one recessive sequential violet.
- **State** — the reserved status palette (good / warning / serious / critical),
  always paired with an icon and a text label so meaning never rides on hue
  alone. Score bars only take a status color once they cross the finding
  threshold, which keeps the eye on what matters.

The five risk bands map onto four status colors; `safe` and `low` share a color
and are distinguished by their label. There is no categorical palette because
nothing in this UI encodes identity by hue.

The console is dark-only by design — it is an operator tool, not a document.
