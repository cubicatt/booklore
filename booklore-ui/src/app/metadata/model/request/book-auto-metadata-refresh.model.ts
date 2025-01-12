import {MetadataProvider} from '../../../book/model/provider.model';

export interface BookAutoMetadataRefresh {
  bookIds: number[],
  metadataProvider: MetadataProvider,
  replaceCover: boolean
}
