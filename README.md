# Chainos JavaScript SDK

A powerful JavaScript/TypeScript SDK for creating, managing, and executing workflows with the Chainos system.

## Installation

Install the SDK using your preferred package manager:

```bash
# Using npm
npm install chainos-sdk

# Using Yarn
yarn add chainos-sdk
```

## Quick Start

### Creating a Workflow Chain

```typescript
import { Chain, Task } from 'chainos-sdk';
import path from 'node:path';

// Create tasks
const dataProcessorTask = new Task(
  'data-processor',
  path.resolve(__dirname, './tasks/data-processor.js'),
  {
    displayName: 'Data Processor',
    entryFunctionName: 'processData',
    cpu: 0.5,
    memory: '1gb',
  }
);

const loggerTask = new Task(
  'logger',
  path.resolve(__dirname, './tasks/logger.py'),
  {
    displayName: 'Logger',
    entryFunctionName: 'log_data',
    cpu: 0.25,
    memory: '512mb',
  }
);

// Build workflow chain
const chain = new Chain('my-workflow', 'My First Workflow');

// Add tasks to chain
chain.register({
  id: 'processing-step',
  task: dataProcessorTask,
  targets: ['logger-step']
});

chain.register({
  id: 'logger-step',
  task: loggerTask
});

// Set entry point
chain.setEntryPoint('processing-step');

// Compile the chain to JSON
const json = chain.compile({ materializeFunctions: true });
console.log(JSON.stringify(json, null, 2));
```

### Using API Client

```typescript
import { ChainosClient } from 'chainos-sdk';

// Initialize the client with your API key
const client = new ChainosClient({
  apiKey: 'your-api-key'
});

// Example: Get account information
async function getAccountInfo() {
  try {
    const account = await client.getAccount();
    console.log('Account info:', account);
    return account;
  } catch (error) {
    console.error('Error getting account info:', error.message);
  }
}
```

## Core Concepts

### Tasks

A Task represents a single unit of work within a workflow. Tasks can be implemented in different programming languages including JavaScript, TypeScript, and Python.

```typescript
// Creating a task
const task = new Task('my-task', './path/to/implementation.js', {
  displayName: 'My Custom Task',
  entryFunctionName: 'main', // Default
  cpu: 0.5,                  // CPU allocation in increments of 0.25
  memory: '512mb'            // Memory allocation, normalized to increments of 256MB
});

// Getting environment information
const envType = task.getEnvironmentType(); // JAVASCRIPT, TYPESCRIPT, PYTHON, or UNKNOWN
```

### Chains

A Chain represents a workflow that connects multiple tasks together in a directed graph.

```typescript
// Creating a chain
const chain = new Chain('unique-id', 'Human-Readable Name');

// Adding tasks with connections
chain.register({
  id: 'step-1',
  task: task1,
  targets: ['step-2', 'step-3'] // Connect to these steps
});

chain.register({
  id: 'step-2',
  task: task2,
  preprocessing: preprocessingTask, // Optional task to run before the main task
  postprocessing: (result) => {     // Optional function to process the result
    return { processed: result };
  }
});

// Set the entry point
chain.setEntryPoint('step-1');

// Materialize functions into executable files
chain.materializeProcessingFunctions();

// Compile the chain to a JSON representation
const json = chain.compile();
```

## Advanced Features

### Preprocessing and Postprocessing

Tasks can have preprocessing and postprocessing steps:

```typescript
chain.register({
  id: 'data-step',
  task: dataTask,
  preprocessing: validationTask,  // Run this task before dataTask
  postprocessing: (result) => {   // Run this function after dataTask
    return {
      status: 'completed',
      timestamp: new Date().toISOString(),
      result
    };
  }
});
```

When using anonymous functions, the SDK can automatically convert them to executable task files:

```typescript
// Convert anonymous functions to tasks
chain.materializeProcessingFunctions({
  outputDir: './.chainos/functions', // Where to store generated files
  extension: '.js',                  // File extension (.js or .ts)
  namePrefix: 'processor_'           // Prefix for function names
});
```

### Multi-Language Support

The SDK automatically detects the programming language of each task:

```typescript
// JavaScript task
const jsTask = new Task('js-task', './tasks/processor.js');

// TypeScript task
const tsTask = new Task('ts-task', './tasks/logger.ts');

// Python task
const pyTask = new Task('py-task', './tasks/analyzer.py');

console.log(jsTask.getEnvironmentType()); // JAVASCRIPT
console.log(tsTask.getEnvironmentType()); // TYPESCRIPT
console.log(pyTask.getEnvironmentType()); // PYTHON
```

## Error Handling

The SDK provides custom error classes for different error scenarios:

```typescript
import { SoftError, FatalError } from 'chainos-sdk';

function validateInput(data) {
  if (!data) {
    // Critical error - should stop execution
    throw new FatalError('No data provided');
  }
  
  if (data.items.length === 0) {
    // Non-critical error - can continue with default data
    throw new SoftError('Empty items array', { items: [1, 2, 3] });
  }
  
  return data;
}
```

## Examples

Check out the examples directory for complete working samples:

- Basic workflow with JavaScript, TypeScript, and Python tasks
- Advanced preprocessing and postprocessing
- Error handling patterns
- API client usage

## Development

### Building

```bash
# Install dependencies
yarn

# Build the SDK
yarn build
```

### Testing

```bash
# Run tests
yarn test
```

### Linting

```bash
# Lint code
yarn lint

# Format code
yarn format
```

## License

MIT