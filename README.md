# Neil

Personal homepage for `neil.guion.io`.

## Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Deploy

```bash
bun run deploy:prod
```

Cloudflare Workers assets publish everything in `dist`. Files in
`public/library` are copied to `/library/*`, so shared book PDFs can be linked
directly from the homepage after they are added.

## Resume

```bash
bun run resume:build
```

For live rebuilds while editing:

```bash
bun run resume:watch
```

The resume uses `Source Han Serif SC`; the kosmos WSL environment provides
Typst and the CJK font package. If you are outside that environment, set
`TYPST_FONT_PATH` to a directory containing Source Han Serif fonts. The build
script fails fast if Typst cannot see the font, instead of producing a PDF with
boxed Chinese text.
