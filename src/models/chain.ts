import type { Task } from './task';

/**
 * Type definition for the processor function
 */
export type ProcessorFunction = (input: any, context: string) => any;

/**
 * Represents a registry entry in a Chain
 */
export interface ChainRegistryEntry {
  /**
   * User-defined identifier for the registry entry
   */
  id: string;

  /**
   * Optional task associated with this registry entry
   */
  task?: Task;

  /**
   * Optional marketplace identifier
   */
  marketplaceId?: string;

  /**
   * Optional preprocessing function or task
   * Executes before the task runs
   */
  preprocessing?: ProcessorFunction | Task;

  /**
   * Optional postprocessing function or task
   * Executes after the task completes
   */
  postprocessing?: ProcessorFunction | Task;
}

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
   * Registry of items in the chain
   */
  registry: Map<string, ChainRegistryEntry>;

  /**
   * Context for the chain
   */
  contextJSON: string;

  /**
   * Create a new Chain
   *
   * @param id Unique identifier for the chain
   * @param name Optional name for the chain
   */
  constructor(id: string, name?: string) {
    this.id = id;
    this.name = name;
    this.registry = new Map<string, ChainRegistryEntry>();
    this.contextJSON = '{}';
  }

  /**
   * Add an entry to the chain registry
   *
   * @param entry The registry entry to add
   * @returns The Chain instance for method chaining
   */
  register(entry: ChainRegistryEntry): Chain {
    this.registry.set(entry.id, entry);
    return this;
  }
}
