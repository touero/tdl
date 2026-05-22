import { useEffect, useState } from "react";
import type { DownloadFile, FilesApiResponse } from "./types";

function shortSha256(value: string) {
  if (!value || value === "-" || value.length <= 16) {
    return value || "-";
  }

  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

export default function App() {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedHash, setCopiedHash] = useState("");

  async function copyHash(value: string) {
    if (!value || value === "-") {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedHash(value);
      window.setTimeout(() => {
        setCopiedHash((current) => (current === value ? "" : current));
      }, 1200);
    } catch {
      setErrorMessage("复制失败，请检查浏览器权限。");
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadFiles() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/files");
        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`);
        }

        const payload = (await response.json()) as FilesApiResponse;
        if (isMounted) {
          setFiles(payload.files);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "加载文件列表失败");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFiles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <div className="title-row">
        <h1>Index of /downloads</h1>
        <a className="repo-link" href="https://github.com/touero/tdl" target="_blank" rel="noreferrer">
          Repo
        </a>
      </div>
      <p className="status-line">
        {isLoading ? "Loading file index..." : `Total ${files.length} file(s)`}
        {errorMessage ? ` | ${errorMessage}` : ""}
      </p>
      <table className="listing-table">
        <colgroup>
          <col className="col-name" />
          <col className="col-description" />
          <col className="col-updated" />
          <col className="col-size" />
          <col className="col-sha256" />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Last modified</th>
            <th>Size</th>
            <th>SHA-256</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label="Name">
              <a href="/">../</a>
            </td>
            <td data-label="Description">Parent Directory</td>
            <td data-label="Last modified">-</td>
            <td data-label="Size">-</td>
            <td data-label="SHA-256">-</td>
          </tr>
          {files.map((file) => (
            <tr key={file.url}>
              <td data-label="Name">
                <a href={file.url} download>
                  {file.name}
                </a>
              </td>
              <td data-label="Description">{file.description}</td>
              <td data-label="Last modified">{file.updatedAt}</td>
              <td data-label="Size">{file.size}</td>
              <td data-label="SHA-256" className="sha-cell">
                <code title={file.sha256}>{shortSha256(file.sha256)}</code>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => void copyHash(file.sha256)}
                  disabled={file.sha256 === "-"}
                  aria-label={`Copy SHA-256 of ${file.name}`}
                  title={copiedHash === file.sha256 ? "Copied" : "Copy full SHA-256"}
                >
                  <span aria-hidden="true">{copiedHash === file.sha256 ? "✓" : "⧉"}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="page-note">
        <p>
          Copyright © 2026 weiensong.
        </p>
      </footer>
    </main>
  );
}
