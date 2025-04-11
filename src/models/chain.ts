import { WorkflowStatus } from './types';
import type { Task } from './task';

/**
 * Represents a Chain of tasks in the Chainos system
 */
export class Chain {
  /**
   * Unique identifier for the chain
   */
  id: string;

  /**
   * Name of the chain
   */
  name?: string;

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
  private tasks: Map<string, Task>;

  /**
   * Create a new Chain
   *
   * @param id Unique identifier for the chain
   */
  constructor(id: string) {
    this.id = id;
    this.status = WorkflowStatus.DRAFT;
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    this.tasks = new Map();
  }

  /**
   * Register a task to the chain
   *
   * @param id Unique identifier for the task
   * @param name Name of the task
   * @param task Task object
   * @returns The chain instance for chaining
   */
  register(id: string, name: string, task: Task): Chain {
    if (this.tasks.has(id)) {
      throw new Error(`Task with id ${id} already exists in the chain`);
    }

    this.tasks.set(id, task);
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Get all tasks in the chain
   *
   * @returns An array of tasks
   */
  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get a task by its id
   *
   * @param id Task id
   * @returns The task or undefined if not found
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Remove a task from the chain
   *
   * @param id Task id
   * @returns true if the task was removed, false otherwise
   */
  removeTask(id: string): boolean {
    const result = this.tasks.delete(id);
    if (result) {
      this.updatedAt = new Date().toISOString();
    }
    return result;
  }
}
