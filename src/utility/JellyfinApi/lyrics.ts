import { Lyrics } from '@/store/music/types';
import { fetchApi } from './lib';

export async function retrieveTrackLyrics(trackId: string): Promise<Lyrics> {
    return fetchApi<Lyrics>(`/Audio/${trackId}/Lyrics`);
}
