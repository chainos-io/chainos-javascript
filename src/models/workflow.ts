/**
 * Core workflow models for the Chainos SDK
 */

/**
 * Workflow status enum
 */
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

/**
 * Represents a Chainos workflow
 */
export interface Workflow {
  /**
   * Unique identifier for the workflow
   */
  id: string;

  /**
   * Name of the workflow
   */
  name: string;

  /**
   * Description of the workflow
   */
  description?: string;

  /**
   * Current status of the workflow
   */
  status: WorkflowStatus;

  /**
   * When the workflow was created
   */
  createdAt: string;

  /**
   * When the workflow was last updated
   */
  updatedAt: string;

  /**
   * Workflow steps
   */
  steps: WorkflowStep[];
}

/**
 * Represents a step in a workflow
 */
export interface WorkflowStep {
  /**
   * Unique identifier for the step
   */
  id: string;

  /**
   * Name of the step
   */
  name: string;

  /**
   * Type of the step
   */
  type: string;

  /**
   * Configuration for the step
   */
  config: Record<string, any>;

  /**
   * Position of the step in the workflow
   */
  position: number;
}
