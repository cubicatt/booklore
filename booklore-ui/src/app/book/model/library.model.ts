export interface Library {
  id?: number;
  name: string;
  paths: string[];
}

export interface LibraryApiResponse {
  content: Library[];
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
}
