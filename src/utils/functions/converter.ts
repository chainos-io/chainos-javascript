/**
 * Function serialization utilities
 *
 * This module provides utilities for converting anonymous functions used in
 * preprocessing and postprocessing steps into serializable task files.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Task } from '../../models/task';

/**
 * Directory to store generated function files
 */
export const DEFAULT_FUNCTIONS_DIR = path.join(process.cwd(), '.chainos', 'functions');

/**
 * Options for converting functions to tasks
 */
export interface FunctionToTaskOptions {
  /**
   * Directory to store generated function files
   * Defaults to .chainos/functions in current working directory
   */
  outputDir?: string;

  /**
   * File extension to use for generated files
   * Defaults to .js
   */
  extension?: '.js' | '.ts';

  /**
   * Prefix for generated function names
   * Defaults to 'processor_'
   */
  namePrefix?: string;
}

/**
 * Result of converting a function to a task
 */
export interface FunctionConversionResult {
  /**
   * The generated task
   */
  task: Task;

  /**
   * Path to the generated file
   */
  filePath: string;

  /**
   * Generated function name
   */
  functionName: string;

  /**
   * Original function string representation
   */
  originalFunction: string;
}

/**
 * Generate a unique ID using crypto module
 *
 * @returns A short unique identifier
 */
function generateUniqueId(): string {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Converts an anonymous function to a task by writing it to a file
 *
 * @param fn The function to convert
 * @param processingType Whether this is a preprocessing or postprocessing function
 * @param parentTaskId The ID of the parent task
 * @param options Options for the conversion
 * @returns Information about the converted function and created task
 */
export function functionToTask(
  fn: (...args: any[]) => any,
  processingType: 'preprocessing' | 'postprocessing',
  parentTaskId: string,
  options: FunctionToTaskOptions = {},
): FunctionConversionResult {
  // Set up options with defaults
  const outputDir = options.outputDir || DEFAULT_FUNCTIONS_DIR;
  const extension = options.extension || '.js';
  const namePrefix = options.namePrefix || 'processor_';

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate a unique name for the function
  const functionId = generateUniqueId();
  const functionName = `${namePrefix}${processingType}_${parentTaskId}_${functionId}`;

  // Get the function's source code
  const functionSource = fn.toString();

  // Generate the file content
  let fileContent: string;

  if (extension === '.ts') {
    fileContent = `/**
 * Generated ${processingType} function for task ${parentTaskId}
 * Generated on: ${new Date().toISOString()}
 */

/**
 * Main entry point for the ${processingType} task
 * 
 * @param input The input data from the workflow
 * @param context Workflow context information
 * @returns Processed data
 */
export function main(input: any, context?: any): any {
  // Original function: ${functionSource.replace(/\n/g, '\n  // ')}
  
  // Convert to proper function call syntax
  const fn = ${functionSource};
  return fn(input, context);
}
`;
  } else {
    fileContent = `/**
 * Generated ${processingType} function for task ${parentTaskId}
 * Generated on: ${new Date().toISOString()}
 */

/**
 * Main entry point for the ${processingType} task
 * 
 * @param {any} input - The input data from the workflow
 * @param {any} context - Workflow context information
 * @returns {any} Processed data
 */
function main(input, context) {
  // Original function: ${functionSource.replace(/\n/g, '\n  // ')}
  
  // Convert to proper function call syntax
  const fn = ${functionSource};
  return fn(input, context);
}

module.exports = { main };
`;
  }

  // Write the file
  const fileName = `${functionName}${extension}`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, fileContent);

  // Create a task for the function
  const task = new Task(`${processingType}-${parentTaskId}-${functionId}`, filePath, {
    displayName: `${processingType.charAt(0).toUpperCase() + processingType.slice(1)} for ${parentTaskId}`,
  });

  return {
    task,
    filePath,
    functionName,
    originalFunction: functionSource,
  };
}

/**
 * Utility class for managing function conversions in a chain
 */
export class FunctionConverter {
  private conversions: Map<(...args: any[]) => any, FunctionConversionResult> = new Map();
  private options: FunctionToTaskOptions;

  /**
   * Create a new FunctionConverter
   *
   * @param options Options for converting functions to tasks
   */
  constructor(options: FunctionToTaskOptions = {}) {
    this.options = options;
  }

  /**
   * Convert a processing function to a task if it's not already converted
   *
   * @param fn The function to convert
   * @param processingType Whether this is preprocessing or postprocessing
   * @param parentTaskId ID of the parent task
   * @returns The task representation of the function
   */
  convertFunction(
    fn: (...args: any[]) => any,
    processingType: 'preprocessing' | 'postprocessing',
    parentTaskId: string,
  ): Task {
    // Check if we've already converted this function
    if (this.conversions.has(fn)) {
      return this.conversions.get(fn)!.task;
    }

    // Convert the function to a task
    const result = functionToTask(fn, processingType, parentTaskId, this.options);

    // Store the conversion for reuse
    this.conversions.set(fn, result);

    return result.task;
  }

  /**
   * Get all conversions that have been performed
   */
  getConversions(): Map<(...args: any[]) => any, FunctionConversionResult> {
    return this.conversions;
  }
}
