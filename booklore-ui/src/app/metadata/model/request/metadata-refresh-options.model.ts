export interface MetadataRefreshOptions {
  defaultProvider: string;
  refreshCovers: boolean;
  mergeCategories: boolean;
  fieldOptions?: FieldOptions;
}

export interface FieldProvider {
  default: string | null;
  p2: string | null;
  p1: string | null;
}

export interface FieldOptions {
  title: FieldProvider;
  description: FieldProvider;
  authors: FieldProvider;
  categories: FieldProvider;
  cover: FieldProvider;
}
