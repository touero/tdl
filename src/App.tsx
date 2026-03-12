import { useEffect, useState } from "react";
import type { DownloadFile, FilesApiResponse } from "./types";

export default function App() {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
      <h1>Index of /downloads</h1>
      <p className="status-line">
        {isLoading ? "Loading file index..." : `Total ${files.length} file(s)`}
        {errorMessage ? ` | ${errorMessage}` : ""}
      </p>
      <table className="listing-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Last modified</th>
            <th>Size</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
