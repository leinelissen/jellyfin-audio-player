export interface DownloadEntity {
    id: string;
    progress: number;
    isFailed: boolean;
    isComplete: boolean;
    size?: number;
    location?: string;
    jobId?: number;
    error?: string;
}
