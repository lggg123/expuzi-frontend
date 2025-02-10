import axios from 'axios';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any): APIError => {
  if (error instanceof APIError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    return new APIError(
      error.response?.data?.message || 'API request failed',
      error.response?.status || 500,
      'API_REQUEST_FAILED'
    );
  }

  return new APIError(error.message || 'Unknown error occurred');
}; 