/**
 * Common types used throughout the Chainos SDK
 */

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  /**
   * Total number of items available
   */
  total: number;

  /**
   * Current page number
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Whether there are more pages
   */
  hasMore: boolean;
}

/**
 * Standard pagination parameters for list requests
 */
export interface PaginationParams {
  /**
   * Page number to retrieve
   */
  page?: number;

  /**
   * Number of items per page
   */
  limit?: number;
}

/**
 * Standard response for paginated list endpoints
 */
export interface PaginatedResponse<T> {
  /**
   * List of items
   */
  data: T[];

  /**
   * Pagination metadata
   */
  meta: PaginationMeta;
}

/**
 * Standard response wrapper
 */
export interface ApiResponse<T> {
  /**
   * Response data
   */
  data: T;

  /**
   * Response metadata
   */
  meta?: Record<string, any>;
}
