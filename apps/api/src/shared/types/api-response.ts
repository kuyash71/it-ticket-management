export interface ApiErrorResponse {
  errorCode: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
