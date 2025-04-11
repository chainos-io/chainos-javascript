import type { Task } from './task';
import { FunctionConverter, type FunctionToTaskOptions } from '../utils/functions/converter';

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

  /**
   * Array of chainRegistryEntry ids that this task
   * could execute next in the chain sequence.
   */
  targets?: string[];
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
   * ID of the entry point for this chain
   */
  entryPointId: string | null;

  /**
   * Function converter instance for materializing anonymous functions
   */
  private functionConverter: FunctionConverter | null = null;

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
    this.entryPointId = null;
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

  /**
   * Set an entry as the starting point for this chain
   *
   * @param id The ID of a registered entry to set as the entry point
   * @returns The Chain instance for method chaining
   * @throws Error if the ID does not correspond to a registered entry
   */
  setEntryPoint(id: string): Chain {
    if (!this.registry.has(id)) {
      throw new Error(`Cannot set entry point: No registry entry found with ID '${id}'`);
    }
    this.entryPointId = id;
    return this;
  }

  /**
   * Materializes any anonymous function processors into proper task files
   * This allows functions to be serialized and visualized properly
   *
   * @param options Options for the conversion process
   * @returns The Chain instance for method chaining
   */
  materializeProcessingFunctions(options: FunctionToTaskOptions = {}): Chain {
    // Create a function converter if we don't have one
    if (!this.functionConverter) {
      this.functionConverter = new FunctionConverter(options);
    }

    // Loop through all registry entries
    for (const [id, entry] of this.registry.entries()) {
      // Check for and convert preprocessing function
      if (entry.preprocessing && typeof entry.preprocessing === 'function') {
        entry.preprocessing = this.functionConverter.convertFunction(
          entry.preprocessing,
          'preprocessing',
          entry.id,
        );
      }

      // Check for and convert postprocessing function
      if (entry.postprocessing && typeof entry.postprocessing === 'function') {
        entry.postprocessing = this.functionConverter.convertFunction(
          entry.postprocessing,
          'postprocessing',
          entry.id,
        );
      }
    }

    return this;
  }

  /**
   * Get all materialized functions if any functions have been converted
   *
   * @returns Information about converted functions or null if none
   */
  getMaterializedFunctions(): { [key: string]: any } | null {
    if (!this.functionConverter) {
      return null;
    }

    const result: { [key: string]: any } = {};
    const conversions = this.functionConverter.getConversions();

    for (const [fn, conversionData] of conversions.entries()) {
      // Use function source as key to help identify the function
      const fnSource = `${fn.toString().substring(0, 30)}...`;
      result[fnSource] = {
        task: conversionData.task.id,
        filePath: conversionData.filePath,
        functionName: conversionData.functionName,
      };
    }

    return result;
  }

  /**
   * Compiles the chain to a JSON representation for visualization or serialization
   * If materializeProcessingFunctions() hasn't been called first, functions
   * will be represented as placeholders in the output
   *
   * @param options Optional options for compilation
   * @returns A JSON-serializable object representing the chain's structure
   */
  compile(options: { materializeFunctions?: boolean } = {}): Record<string, any> {
    // If requested, materialize functions before compiling
    if (options.materializeFunctions) {
      this.materializeProcessingFunctions();
    }

    // Create the base structure
    const compiledChain: Record<string, any> = {
      id: this.id,
      name: this.name || this.id,
      entryPoint: this.entryPointId,
      nodes: [],
      edges: [],
    };

    // Track nodes and their potential flow targets
    const nodeIds = new Set<string>();
    const edges: Array<{ source: string; target: string }> = [];

    // Process preprocessing and postprocessing steps
    const processingNodes: Array<{
      id: string;
      parentId: string;
      type: 'preprocessing' | 'postprocessing';
      task?: Task;
      isFunction?: boolean;
    }> = [];

    // First pass: create main task nodes and collect processing steps
    for (const [id, entry] of this.registry.entries()) {
      // Add the main node
      const node: Record<string, any> = {
        id: entry.id,
        type: 'task',
      };

      // Add task details if available
      if (entry.task) {
        node.task = {
          id: entry.task.id,
          name: entry.task.name,
          filepath: entry.task.filepath,
          main: entry.task.main,
          environment: entry.task.getEnvironmentType(),
          resources: {
            cpu: entry.task.cpu,
            memory: entry.task.memory,
          },
        };
      }

      // Add marketplace ID if available
      if (entry.marketplaceId) {
        node.marketplaceId = entry.marketplaceId;
      }

      // Register preprocessing as a separate node
      if (entry.preprocessing) {
        const preprocessingId = `${entry.id}_preprocessing`;

        if (typeof entry.preprocessing === 'function') {
          processingNodes.push({
            id: preprocessingId,
            parentId: entry.id,
            type: 'preprocessing',
            isFunction: true,
          });
        } else {
          // It's a Task
          processingNodes.push({
            id: preprocessingId,
            parentId: entry.id,
            type: 'preprocessing',
            task: entry.preprocessing,
          });
        }
      }

      // Register postprocessing as a separate node
      if (entry.postprocessing) {
        const postprocessingId = `${entry.id}_postprocessing`;

        if (typeof entry.postprocessing === 'function') {
          processingNodes.push({
            id: postprocessingId,
            parentId: entry.id,
            type: 'postprocessing',
            isFunction: true,
          });
        } else {
          // It's a Task
          processingNodes.push({
            id: postprocessingId,
            parentId: entry.id,
            type: 'postprocessing',
            task: entry.postprocessing,
          });
        }
      }

      // Store original targets for later processing
      if (entry.targets && entry.targets.length > 0) {
        node.targets = entry.targets;
      }

      // Add the node to the compiled structure
      compiledChain.nodes.push(node);
      nodeIds.add(entry.id);
    }

    // Second pass: add processing nodes and adjust edges
    for (const processingNode of processingNodes) {
      const nodeInfo: Record<string, any> = {
        id: processingNode.id,
        type: processingNode.type,
        parentId: processingNode.parentId,
      };

      if (processingNode.isFunction) {
        nodeInfo.function = true;
      } else if (processingNode.task) {
        // Add task details
        nodeInfo.task = {
          id: processingNode.task.id,
          name: processingNode.task.name,
          filepath: processingNode.task.filepath,
          main: processingNode.task.main,
          environment: processingNode.task.getEnvironmentType(),
          resources: {
            cpu: processingNode.task.cpu,
            memory: processingNode.task.memory,
          },
        };
      }

      // Add the processing node
      compiledChain.nodes.push(nodeInfo);
      nodeIds.add(processingNode.id);

      // Create edges for preprocessing and postprocessing
      if (processingNode.type === 'preprocessing') {
        // Input → Preprocessing → Node
        // The parent node's inputs should go through preprocessing
        const entry = this.registry.get(processingNode.parentId);

        // Connect the entry point to preprocessing if applicable
        if (this.entryPointId === processingNode.parentId) {
          // Entry point directly connects to preprocessing
        }

        // Connect preprocessing to its parent node
        edges.push({
          source: processingNode.id,
          target: processingNode.parentId,
        });
      } else if (processingNode.type === 'postprocessing') {
        // Node → Postprocessing → Outputs
        const entry = this.registry.get(processingNode.parentId);

        // Connect the parent node to its postprocessing
        edges.push({
          source: processingNode.parentId,
          target: processingNode.id,
        });

        // Connect postprocessing to original targets if any
        if (entry?.targets) {
          for (const targetId of entry.targets) {
            edges.push({
              source: processingNode.id,
              target: targetId,
            });
          }
        }
      }
    }

    // Third pass: connect main nodes (where no postprocessing exists)
    for (const [id, entry] of this.registry.entries()) {
      // Only add direct edges if the node doesn't have postprocessing
      if (!entry.postprocessing && entry.targets) {
        for (const targetId of entry.targets) {
          // Check if target has preprocessing
          const targetNode = this.registry.get(targetId);
          if (targetNode?.preprocessing) {
            // If target has preprocessing, connect to its preprocessing node
            edges.push({
              source: entry.id,
              target: `${targetId}_preprocessing`,
            });
          } else {
            // Connect directly to target
            edges.push({
              source: entry.id,
              target: targetId,
            });
          }
        }
      }
    }

    // Adjust connections for the entry point
    if (this.entryPointId) {
      const entryNode = this.registry.get(this.entryPointId);
      if (entryNode?.preprocessing) {
        // If entry point has preprocessing, create special marker to indicate
        // workflow starts with preprocessing
        compiledChain.actualEntryPoint = `${this.entryPointId}_preprocessing`;
      }
    }

    // Add all edges to the compiled structure
    // Filter out any edges that reference non-existent nodes
    compiledChain.edges = edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );

    // Calculate some statistics about the chain
    compiledChain.statistics = {
      totalNodes: compiledChain.nodes.length,
      totalEdges: compiledChain.edges.length,
      hasEntryPoint: !!this.entryPointId,
      taskTypes: this.getTaskTypeDistribution(),
    };

    return compiledChain;
  }

  /**
   * Helper method to get distribution of task types in the chain
   *
   * @returns Object with counts of different task environments
   */
  private getTaskTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const [_, entry] of this.registry.entries()) {
      if (entry.task) {
        const envType = entry.task.getEnvironmentType();
        distribution[envType] = (distribution[envType] || 0) + 1;
      }
    }

    return distribution;
  }
}
