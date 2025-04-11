/**
 * Custom error classes for the Chainos workflow system
 */

/**
 * SoftError represents a non-fatal error that allows workflow execution to continue
 * It includes data that can be passed to the next step in the chain
 */
export class SoftError extends Error {
  /**
   * Data to be passed to the next step in the chain
   */
  data: Record<string, any>;

  /**
   * Create a new SoftError
   *
   * @param message Error message describing what went wrong
   * @param data Data to be passed to the next step in the chain
   */
  constructor(message: string, data: Record<string, any>) {
    super(message);
    this.name = 'SoftError';
    this.data = data;
  }
}

/**
 * FatalError represents a critical error that should halt workflow execution
 */
export class FatalError extends Error {
  /**
   * Create a new FatalError
   *
   * @param message Error message describing the critical error
   */
  constructor(message: string) {
    super(message);
    this.name = 'FatalError';
  }
}
