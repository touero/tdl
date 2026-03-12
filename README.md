# R2 Auto-Updating Download Site

This is a React + Vite + Cloudflare Workers project deployed at `downloads.weiensong.top`.

The homepage keeps an Apache-style directory listing, but the file data is read from Cloudflare R2 in real time. After you upload a new file to R2, it appears on the page as soon as you refresh the site.

## How It Works

- The frontend is deployed as Cloudflare Workers Assets.
- The Worker exposes `/api/files`, which reads the current object list from R2.
- The Worker exposes `/api/download?key=...`, which streams downloads directly from R2.
- As long as files are uploaded to R2, the listing updates automatically. You do not need to redeploy the frontend.

## Local Development

```bash
npm install
npm run dev
```

After startup:

- Frontend: `http://127.0.0.1:5173`
- Worker API: `http://127.0.0.1:8787`

Vite already proxies `/api` requests to the local Worker.

## Build

```bash
npm run build
```

## Deploy to Cloudflare

1. Log in to Cloudflare:

```bash
npx wrangler login
```

2. Create the R2 buckets. If you already have buckets, update the bucket names in [wrangler.toml](./wrangler.toml) to match your real setup:

```bash
npx wrangler r2 bucket create downloads-weiensong-top
npx wrangler r2 bucket create downloads-weiensong-top-preview
```

3. Make sure `downloads.weiensong.top` is onboarded in Cloudflare and supports a Worker custom domain.

4. Deploy:

```bash
npm run deploy
```

## How New Uploads Show Up Automatically

By default, only objects under the `downloads/` prefix are listed. This prefix is configured in [wrangler.toml](./wrangler.toml).

When uploading files, place the object key under that prefix. For example:

```bash
npx wrangler r2 object put downloads-weiensong-top/downloads/demo.zip --file ./demo.zip
```

Once the upload finishes, refresh `https://downloads.weiensong.top` and the new file will be visible.

To reduce typing, the repository includes a `Makefile`:

```bash
make upload FILE=./tricky_brains_ost.wav
make meta
make deploy
```

`make meta` uploads [r2-meta.example.json](./r2-meta.example.json) by default. You can also provide your own JSON file:

```bash
make meta META_FILE=./my-meta.json
```

## Where the Description Column Comes From

The Description column is loaded from `downloads/_meta.json` in the same R2 bucket. The Worker reads that JSON file and matches descriptions by object key. If no entry is found, the UI shows `-`.

See [r2-meta.example.json](./r2-meta.example.json) for the expected format:

```json
{
  "downloads/tricky_brains_ost.wav": "Tricky Brains soundtrack file",
  "downloads/demo.zip": "Example archive"
}
```

The update flow is simple:

1. Maintain a local JSON file.
2. Upload it to `downloads/_meta.json` in R2.

For example:

```bash
npx wrangler r2 object put downloads-weiensong-top/downloads/_meta.json --file ./r2-meta.example.json --remote
```

After that, your regular workflow is:

- Upload files under the `downloads/` prefix.
- Update `downloads/_meta.json` whenever you want to change descriptions.

Refreshing the page will show both the new files and the new descriptions. No redeploy is required.

## Key Files

- Page logic: [src/App.tsx](./src/App.tsx)
- Page styles: [src/styles.css](./src/styles.css)
- Worker API: [worker/index.ts](./worker/index.ts)
- Cloudflare configuration: [wrangler.toml](./wrangler.toml)

## License

This project is licensed under the Apache License 2.0 and attributed to [touero](https://github.com/touero).
