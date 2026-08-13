import { Source, SourceDriver, SourceType } from '../types'
import { EmbyDriver } from './emby/driver'
import { JellyfinDriver } from './jellyfin/driver'

/**
 * Get the appropriate driver class based on the source type
 */
type ConcreteSourceDriver = new (source: Source) => SourceDriver;

export default function getDriverBySource(type: SourceType): ConcreteSourceDriver {
    switch (type) {
        case SourceType.JELLYFIN_V1:
            return JellyfinDriver;
        case SourceType.EMBY_V1:
            return EmbyDriver;
        default:
            throw new Error(`Unsupported source type: ${type}`);
    }
}
