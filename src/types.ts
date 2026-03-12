export interface DownloadFile {
  name: string;
  description: string;
  size: string;
  updatedAt: string;
  url: string;
}

export interface FilesApiResponse {
  files: DownloadFile[];
}
