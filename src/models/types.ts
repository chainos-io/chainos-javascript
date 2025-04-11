/**
 * Core models for the Chainos SDK
 */

/**
 * Chain status enum
 */
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

/**
 * Interface for Chain API responses
 */
export interface ChainResponse {
  /**
   * Unique identifier for the chain
   */
  id: string;

  /**
   * Name of the chain
   */
  name: string;

  /**
   * Description of the chain
   */
  description?: string;

  /**
   * Current status of the chain
   */
  status: WorkflowStatus;

  /**
   * When the chain was created
   */
  createdAt: string;

  /**
   * When the chain was last updated
   */
  updatedAt: string;

  /**
   * Tasks in the chain
   */
  tasks: TaskResponse[];
}

/**
 * Interface for Task API responses
 */
export interface TaskResponse {
  /**
   * Unique identifier for the task
   */
  id: string;

  /**
   * Name of the task
   */
  name: string;

  /**
   * Filepath of the task implementation
   */
  filepath: string;

  /**
   * Main function or entry point for the task
   */
  main: string;
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  /**
   * Page number (1-based)
   */
  page?: number;

  /**
   * Number of items per page
   */
  limit?: number;
}

/**
 * Generic paginated response from API
 */
export interface PaginatedResponse<T> {
  /**
   * Data items
   */
  data: T[];

  /**
   * Pagination metadata
   */
  meta: {
    /**
     * Total count of items
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
  };
}
