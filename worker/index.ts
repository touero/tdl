import type { DownloadFile, FilesApiResponse } from "../src/types";

interface Env {
  ASSETS: Fetcher;
  FILES_BUCKET: R2Bucket;
  DOWNLOAD_PREFIX?: string;
}

interface FileDescriptionMap {
  [key: string]: string;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    headers: {
      "cache-control": "no-store"
    },
    ...init
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai"
  })
    .format(date)
    .replace(/\//g, "-");
}

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }

  const units = ["K", "M", "G", "T"];
  let size = bytes;
  let unitIndex = -1;

  do {
    size /= 1024;
    unitIndex += 1;
  } while (size >= 1024 && unitIndex < units.length - 1);

  const fractionDigits = size >= 10 ? 0 : 1;
  return `${size.toFixed(fractionDigits)}${units[unitIndex]}`;
}

function getDisplayName(key: string) {
  const segments = key.split("/");
  return segments[segments.length - 1] || key;
}

function getMetadataKey(prefix: string) {
  return `${prefix}_meta.json`;
}

async function loadDescriptionMap(
  bucket: R2Bucket,
  metadataKey: string
): Promise<FileDescriptionMap> {
  const metadataObject = await bucket.get(metadataKey);
  if (!metadataObject) {
    return {};
  }

  try {
    return (await metadataObject.json<FileDescriptionMap>()) || {};
  } catch {
    return {};
  }
}

async function listAllFiles(bucket: R2Bucket, prefix: string): Promise<DownloadFile[]> {
  const files: DownloadFile[] = [];
  let cursor: string | undefined;
  const metadataKey = getMetadataKey(prefix);
  const descriptions = await loadDescriptionMap(bucket, metadataKey);

  do {
    const result = await bucket.list({
      cursor,
      limit: 1000,
      prefix
    });

    for (const object of result.objects) {
      if (object.key === metadataKey) {
        continue;
      }

      files.push({
        name: getDisplayName(object.key),
        description: descriptions[object.key] || "-",
        size: formatSize(object.size),
        updatedAt: formatDate(object.uploaded),
        url: `/api/download?key=${encodeURIComponent(object.key)}`
      });
    }

    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  files.sort((left, right) => left.name.localeCompare(right.name, "en"));
  return files;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const prefix = env.DOWNLOAD_PREFIX || "";

    if (request.method === "GET" && url.pathname === "/api/files") {
      const files: FilesApiResponse = {
        files: await listAllFiles(env.FILES_BUCKET, prefix)
      };
      return jsonResponse(files);
    }

    if (request.method === "GET" && url.pathname === "/api/download") {
      const key = url.searchParams.get("key");
      if (!key) {
        return jsonResponse({ message: "缺少 key 参数。" }, { status: 400 });
      }

      const object = await env.FILES_BUCKET.get(key);
      if (!object) {
        return jsonResponse({ message: `R2 中不存在 ${key}。` }, { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set(
        "content-type",
        object.httpMetadata?.contentType || "application/octet-stream"
      );
      headers.set(
        "content-disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(getDisplayName(key))}`
      );
      headers.set("cache-control", "private, max-age=0, must-revalidate");

      return new Response(object.body, {
        headers
      });
    }

    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
