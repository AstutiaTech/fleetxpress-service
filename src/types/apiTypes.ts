// Error data structure when status is false
export interface ApiErrorData {
  response?: {
    message: string;
    error?: string;
    statusCode?: number;
  };
  status?: number;
  options?: Record<string, unknown>;
  message: string;
  name?: string;
}

// API Response structure - when status is true, data is T; when status is false, data is ApiErrorData
export interface ApiResponse<T> {
  data: T; // When status is true, data is T; when status is false, data contains error information (cast as ApiErrorData when needed)
  message?: string;
  status: boolean;
  statusType?: string; // e.g., "BAD_REQUEST", "NOT_FOUND", etc.
  response?: {
    message: string; // Less specific error message
  };
  meta?: unknown;
}
  
  export interface ApiOkResponse {
    message: string;
    status: boolean;
  }
  
  export interface ApiPaginatedResponseMeta {
    total: number;
    page: number;
    limit: number;
    baseUrl: string;
  }

  export interface ApiPaginatedResponse<T> {
    status: boolean;
    response: {
      message: string;
    };
    meta: ApiPaginatedResponseMeta;
    data: T[];
  }