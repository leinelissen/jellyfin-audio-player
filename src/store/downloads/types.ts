import { EntityId } from '@reduxjs/toolkit';

export interface DownloadEntity {
    id: EntityId;
    progress: number;
    isFailed: boolean;
    isComplete: boolean;
    size?: number;
    location: string;
    jobId?: number;
}
