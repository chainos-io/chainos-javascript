/**
 * Custom error class for Chainos SDK errors
 */
export class ChainosError extends Error {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * Error response data
   */
  data: any;

  /**
   * Create a new ChainosError
   *
   * @param message Error message
   * @param status HTTP status code
   * @param data Error response data
   */
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ChainosError';
    this.status = status;
    this.data = data;
  }
}
