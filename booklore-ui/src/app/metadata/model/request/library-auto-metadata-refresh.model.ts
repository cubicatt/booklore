import {MetadataProvider} from '../../../book/model/provider.model';

export interface LibraryAutoMetadataRefreshRequest {
  libraryId: number,
  metadataProvider: MetadataProvider,
  replaceCover: boolean
}
