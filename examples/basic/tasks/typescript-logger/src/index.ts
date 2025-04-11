/**
 * TypeScript Logger Task for Chainos Workflow
 *
 * A simple task that logs input data to the console in yellow color using chalk.
 */
import chalk from 'chalk';

/**
 * Logger interface for consistent return format
 */
interface LoggerResult {
  success: boolean;
  message: string;
  input_logged: any;
  metadata: {
    execution_time_ms: number;
    logger: string;
  };
  timestamp: string;
  log_id: string;
}

/**
 * Main entry point for the TypeScript logger task
 *
 * @param input - Input data from the workflow
 * @param context - Workflow context information (optional)
 * @returns Object containing logging results
 */
export function main(input: any, context?: any): LoggerResult {
  console.log(chalk.yellow('TypeScript logger task started'));

  const startTime = Date.now();

  // Generate a request ID
  const requestId = `log_${Date.now()}`;

  // Log the input data in yellow
  console.log(chalk.yellow(`=== Log Entry: ${requestId} ===`));
  console.log(chalk.yellow('Input data:'));
  console.log(chalk.yellow(JSON.stringify(input, null, 2)));

  if (context) {
    console.log(chalk.yellow('Context:'));
    console.log(chalk.yellow(JSON.stringify(context, null, 2)));
  }

  // Add a small delay to make the logging visible
  setTimeout(() => {}, 200);

  // Build a response
  const executionTime = Date.now() - startTime;

  const response: LoggerResult = {
    success: true,
    message: 'Data logged successfully in yellow!',
    input_logged: input,
    metadata: {
      execution_time_ms: executionTime,
      logger: 'typescript_yellow_logger',
    },
    timestamp: new Date().toISOString(),
    log_id: requestId,
  };

  console.log(chalk.yellow(`TypeScript logger task completed in ${executionTime}ms`));

  return response;
}

// For testing purposes
if (require.main === module) {
  // Example input data
  const testInput = {
    message: 'This is a test log message',
    data: {
      value: 42,
      status: 'completed',
      items: ['apple', 'banana', 'cherry'],
    },
  };

  // Test the logger
  const result = main(testInput);
  console.log('\nResult object:');
  console.log(JSON.stringify(result, null, 2));
}
