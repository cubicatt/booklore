import {MetadataProvider} from '../provider.model';

export interface BookAutoMetadataRefresh {
  bookIds: number[],
  metadataProvider: MetadataProvider,
  replaceCover: boolean
}
