/**
 * Comprehensive example of Chainos workflow with JavaScript and Python tasks
 *
 * This example demonstrates a workflow with:
 * - A data processor written in JavaScript
 * - A Python logger that outputs messages in pink
 */
import { Chain, Task } from '../../src';
import path from 'node:path';

/**
 * Create and configure the workflow tasks
 */
function createTasks() {
  console.log('Creating workflow tasks...\n');

  // Create a data processing task (JavaScript)
  const dataProcessorTask = new Task(
    'data-processor',
    path.resolve(__dirname, './tasks/data-processor/src/index.js'),
    {
      displayName: 'Data Processor',
      entryFunctionName: 'processData',
      cpu: 0.5,
      memory: '1gb',
    },
  );

  // Create a Python logger task with pink output
  const pythonLoggerTask = new Task(
    'python-logger',
    path.resolve(__dirname, './tasks/python-logger/python_logger.py'),
    {
      displayName: 'Python Logger',
      entryFunctionName: 'log_data',
      cpu: 0.25,
      memory: '512mb',
    },
  );

  const typsecriptLoggerTask = new Task(
    'typescript-logger',
    path.resolve(__dirname, './tasks/typescript-logger/src/index.ts'),
    {
      displayName: 'TypeScript Logger',
      cpu: 0.25,
      memory: '256mb',
    },
  );

  console.log('Task environment types:');
  console.log('- Data Processor:', dataProcessorTask.getEnvironmentType());
  console.log('- Python Logger:', pythonLoggerTask.getEnvironmentType());
  console.log('- TypeScript Logger:', typsecriptLoggerTask.getEnvironmentType());

  return { dataProcessorTask, pythonLoggerTask, typsecriptLoggerTask };
}

/**
 * Build a workflow chain from the tasks
 */
function createChain(tasks: ReturnType<typeof createTasks>) {
  console.log('\nBuilding workflow chain...');

  // Create a new chain
  const chain = new Chain('data-logging-workflow', 'Data Processing and Pink Logging Workflow');

  // Add data processor task as entry point
  chain.register({
    id: 'data-processing-step',
    task: tasks.dataProcessorTask,
    preprocessing: new Task('data-validator', tasks.dataProcessorTask.filepath, {
      displayName: 'Data Validator',
      entryFunctionName: 'validateData',
      cpu: 0.25,
      memory: '256mb',
    }),
    targets: ['python-logger', 'typescript-logger-1', 'typescript-logger-2'],
  });

  // Set as entry point
  chain.setEntryPoint('data-processing-step');

  // Add Python logger task
  chain.register({
    id: 'python-logger',
    task: tasks.pythonLoggerTask,
  });

  // Add Typescript logger task
  chain.register({
    id: 'typescript-logger-1',
    task: tasks.typsecriptLoggerTask,
    postprocessing: (result: any) => {
      return {
        status: 'completed',
        loggingPerformed: true,
        timestamp: new Date().toISOString(),
        result,
      };
    },
    targets: ['typescript-logger-2'],
  });

  chain.register({
    id: 'typescript-logger-2',
    task: tasks.typsecriptLoggerTask,
    preprocessing: (inputs: any) => {
      const processingStepData = inputs['data-processing-step'] || {};
      const logger1Data = inputs['typescript-logger-1'] || {};
      return {
        originalData: processingStepData,
        enhancedData: logger1Data,
      };
    },
  });

  console.log('Chain created with entry point:', chain.entryPointId);
  console.log('Registered steps:', Array.from(chain.registry.keys()));

  return chain;
}

/**
 * Run the workflow example
 */
function runWorkflowExample() {
  console.log('Running Chainos Cross-Language Workflow Example...\n');

  try {
    // Create tasks
    const tasks = createTasks();

    // Build workflow chain
    const chain = createChain(tasks);

    const json = chain.compile({ materializeFunctions: true });

    console.log('Chain JSON:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Example failed:', err);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runWorkflowExample();
}
