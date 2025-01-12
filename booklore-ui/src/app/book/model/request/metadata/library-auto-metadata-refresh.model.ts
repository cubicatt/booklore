import {MetadataProvider} from '../../provider.model';

export interface LibraryAutoMetadataRefreshRequest {
  libraryId: number,
  metadataProvider: MetadataProvider,
  replaceCover: boolean
}
