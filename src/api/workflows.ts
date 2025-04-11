import type { ChainosClient } from './client';
import type { PaginatedResponse, PaginationParams, Workflow, WorkflowStatus } from '../models';

/**
 * Interface for creating a new workflow
 */
export interface CreateWorkflowParams {
  name: string;
  description?: string;
  steps?: any[];
}

/**
 * Interface for updating a workflow
 */
export interface UpdateWorkflowParams {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
}

/**
 * API methods for working with Chainos workflows
 */
export class WorkflowsApi {
  private client: ChainosClient;

  constructor(client: ChainosClient) {
    this.client = client;
  }

  /**
   * Get a list of workflows
   *
   * @param params Pagination parameters
   * @returns Promise with paginated workflow list
   */
  async list(params?: PaginationParams): Promise<PaginatedResponse<Workflow>> {
    return this.client.request<PaginatedResponse<Workflow>>('GET', '/workflows', undefined, params);
  }

  /**
   * Get a single workflow by ID
   *
   * @param id Workflow ID
   * @returns Promise with workflow details
   */
  async get(id: string): Promise<Workflow> {
    return this.client.request<Workflow>('GET', `/workflows/${id}`);
  }

  /**
   * Create a new workflow
   *
   * @param data Workflow creation parameters
   * @returns Promise with the created workflow
   */
  async create(data: CreateWorkflowParams): Promise<Workflow> {
    return this.client.request<Workflow>('POST', '/workflows', data);
  }

  /**
   * Update an existing workflow
   *
   * @param id Workflow ID
   * @param data Workflow update parameters
   * @returns Promise with the updated workflow
   */
  async update(id: string, data: UpdateWorkflowParams): Promise<Workflow> {
    return this.client.request<Workflow>('PATCH', `/workflows/${id}`, data);
  }

  /**
   * Delete a workflow
   *
   * @param id Workflow ID
   * @returns Promise that resolves when the workflow is deleted
   */
  async delete(id: string): Promise<void> {
    await this.client.request<void>('DELETE', `/workflows/${id}`);
  }

  /**
   * Activate a workflow
   *
   * @param id Workflow ID
   * @returns Promise with the updated workflow
   */
  async activate(id: string): Promise<Workflow> {
    return this.client.request<Workflow>('POST', `/workflows/${id}/activate`, {});
  }

  /**
   * Deactivate a workflow
   *
   * @param id Workflow ID
   * @returns Promise with the updated workflow
   */
  async deactivate(id: string): Promise<Workflow> {
    return this.client.request<Workflow>('POST', `/workflows/${id}/deactivate`, {});
  }
}
