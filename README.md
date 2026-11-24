# subtitle-editor.org

## Design principles

- Permanently free and open-source under MIT license
- Fully web-based, no download or installation required
- No account signup or login required, edit subtitles directly in the landing page
- Front-end only with zero backend, thus:
  - Fully extensible and can be plugged in to a custom backend
  - Completely static, support PWA and works offline
  - Subtitle and media files stay local in your browser; hosted infrastructure observability and Google tags may process standard operational or analytics metadata
- Minimalist UX

I talked about my design principles in the [FAQ](https://subtitle-editor.org/faq) and [this issue](https://github.com/laubonghaudoi/subtitle-editor/issues/11#issuecomment-3201949429).

### Features

- Multi-track editing
- Waveform visualization
- Localization
- .srt / .vtt format support
- Progressive Web App (PWA)

### Tech stacks

- NextJS 16 + React 19
- shadcn + radix-ui + Tailwind CSS
- wavesurfer.js
- Native HTML media elements
- Tabler icons
- Motion

## Local Development

### Setup

```bash
git clone https://github.com/laubonghaudoi/subtitle-editor.git
cd subtitle-editor
npm install
# Run the development server with Turbopack.
npm run dev
# Create a production build and type-check.
npm run build
# Serve the pre-built app.
npm run start
```

### Project Structure

- `app/` – Next.js 16 routing, including the localized editor and FAQ in `app/[locale]/` and the offline fallback.
- `components/` – UI building blocks, with `components/ui/` holding shadcn-based primitives and domain widgets like `subtitle-list.tsx`.
- `context/` – Global state, including the undoable subtitle store.
- `hooks/` – Reusable client hooks (`use-undoable-state`, toast helpers).
- `lib/` – Pure utilities for parsing SRT/VTT, time conversions, and locale helpers.
- `messages/` – Per-locale translation catalogs consumed by `next-intl`.
- `tests/` – Node-based unit tests plus fixtures in `tests/fixtures/`.
- `public/` – Static assets (icons, favicons, etc.).

### Testing

```bash
npm test                # Run the entire suite
npm test -- parse-vtt.test.ts  # Focus on a single file
```

Tests rely on Node’s built-in `node:test` runner and cover parsing, time conversions, and multi-track behavior. Add fixtures under `tests/fixtures/` when validating new subtitle edge cases.

To check the public pages, run `npm run build` and `npm start`, then run `npm run test:seo` in another terminal. It checks the HTML, language links, redirects, and sitemap served on localhost:3000. Set `TEST_SITE_ORIGIN` to check another preview.

### Linting and Formatting

```bash
npm run lint          # ESLint owns code-quality linting
npm run format        # Apply Biome formatting
```

Biome is intentionally configured as the formatter only; ESLint owns lint rules.

## Internationalization

Locales are configured in `lib/locales.ts`. Each language has an editor message catalog and a separate FAQ translation under `app/[locale]/faq/copy/`. The editor and FAQ are pre-rendered for each locale. English uses `/` and `/faq`, and other languages use their locale prefix.

## Contributing

I will check issues and accept PRs regularly, but I am quite busy these days so I may not have time to develop new features. This is a community project and your contributions are always welcomed!

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
