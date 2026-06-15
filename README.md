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
