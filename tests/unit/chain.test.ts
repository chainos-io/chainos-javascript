// filepath: /Users/csarkissian/Documents/Work/chainos/chainos-javascript/tests/unit/chain.test.ts
import { Chain } from '../../src/models/chain';
import { Task, TaskEnvironment } from '../../src/models/task';
import path from 'node:path';
import fs from 'node:fs';
import { DEFAULT_FUNCTIONS_DIR } from '../../src/utils/functions/converter';

// Helper function to create mock tasks
const createMockTask = (id: string, filepath = '/path/to/task.js', options: any = {}) => {
  return new Task(id, filepath, options);
};

// Clean up test directories and files
const cleanupTestDir = (dir: string) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe('Chain Creation and Configuration', () => {
  test('should create a chain with required parameters', () => {
    const chain = new Chain('test-chain');

    expect(chain.id).toBe('test-chain');
    expect(chain.name).toBeUndefined();
    expect(chain.registry.size).toBe(0);
    expect(chain.entryPointId).toBeNull();
    expect(chain.contextJSON).toBe('{}');
  });

  test('should create a chain with optional name', () => {
    const chain = new Chain('test-chain', 'Test Chain Name');

    expect(chain.id).toBe('test-chain');
    expect(chain.name).toBe('Test Chain Name');
  });

  test('should allow registering a task', () => {
    const chain = new Chain('task-chain');
    const task = createMockTask('test-task');

    chain.register({
      id: 'task-entry',
      task,
    });

    expect(chain.registry.size).toBe(1);
    expect(chain.registry.has('task-entry')).toBe(true);
    expect(chain.registry.get('task-entry')?.task).toBe(task);
  });

  test('should allow registering multiple tasks', () => {
    const chain = new Chain('multi-task-chain');
    const task1 = createMockTask('task-1');
    const task2 = createMockTask('task-2');
    const task3 = createMockTask('task-3');

    chain
      .register({ id: 'entry-1', task: task1 })
      .register({ id: 'entry-2', task: task2 })
      .register({ id: 'entry-3', task: task3 });

    expect(chain.registry.size).toBe(3);
    expect(chain.registry.has('entry-1')).toBe(true);
    expect(chain.registry.has('entry-2')).toBe(true);
    expect(chain.registry.has('entry-3')).toBe(true);
  });

  test('should allow overwriting existing registry entries', () => {
    const chain = new Chain('overwrite-chain');
    const task1 = createMockTask('task-1');
    const task2 = createMockTask('task-2');

    chain.register({ id: 'entry', task: task1 });
    expect(chain.registry.get('entry')?.task).toBe(task1);

    chain.register({ id: 'entry', task: task2 });
    expect(chain.registry.get('entry')?.task).toBe(task2);
  });
});

describe('Chain Entry Point Management', () => {
  test('should set entry point for valid registry entry', () => {
    const chain = new Chain('entry-chain');
    const task = createMockTask('entry-task');

    chain.register({ id: 'entry', task });
    chain.setEntryPoint('entry');

    expect(chain.entryPointId).toBe('entry');
  });

  test('should throw error when setting entry point for non-existent registry entry', () => {
    const chain = new Chain('invalid-entry-chain');

    expect(() => {
      chain.setEntryPoint('non-existent');
    }).toThrow(/No registry entry found/);
  });

  test('should support chaining setEntryPoint method', () => {
    const chain = new Chain('chain-entry');
    const task = createMockTask('task');

    chain.register({ id: 'entry', task }).setEntryPoint('entry');

    expect(chain.entryPointId).toBe('entry');
  });
});

describe('Chain Registry with Processing Functions', () => {
  test('should support registering entries with preprocessing functions', () => {
    const chain = new Chain('preprocessing-chain');
    const task = createMockTask('main-task');
    const preprocessingFn = (input: any) => ({ ...input, processed: true });

    chain.register({
      id: 'with-preprocessing',
      task,
      preprocessing: preprocessingFn,
    });

    const entry = chain.registry.get('with-preprocessing');
    expect(entry?.preprocessing).toBe(preprocessingFn);
  });

  test('should support registering entries with postprocessing functions', () => {
    const chain = new Chain('postprocessing-chain');
    const task = createMockTask('main-task');
    const postprocessingFn = (input: any) => ({ ...input, postprocessed: true });

    chain.register({
      id: 'with-postprocessing',
      task,
      postprocessing: postprocessingFn,
    });

    const entry = chain.registry.get('with-postprocessing');
    expect(entry?.postprocessing).toBe(postprocessingFn);
  });

  test('should support registering entries with both pre and post processing', () => {
    const chain = new Chain('both-processing-chain');
    const task = createMockTask('main-task');
    const preFn = (input: any) => ({ ...input, pre: true });
    const postFn = (input: any) => ({ ...input, post: true });

    chain.register({
      id: 'with-both-processing',
      task,
      preprocessing: preFn,
      postprocessing: postFn,
    });

    const entry = chain.registry.get('with-both-processing');
    expect(entry?.preprocessing).toBe(preFn);
    expect(entry?.postprocessing).toBe(postFn);
  });

  test('should support registering entries with task-based preprocessing', () => {
    const chain = new Chain('task-preprocessing-chain');
    const mainTask = createMockTask('main-task');
    const preTask = createMockTask('pre-task');

    chain.register({
      id: 'task-preprocessing',
      task: mainTask,
      preprocessing: preTask,
    });

    const entry = chain.registry.get('task-preprocessing');
    expect(entry?.preprocessing).toBe(preTask);
  });

  test('should support registering entries with task-based postprocessing', () => {
    const chain = new Chain('task-postprocessing-chain');
    const mainTask = createMockTask('main-task');
    const postTask = createMockTask('post-task');

    chain.register({
      id: 'task-postprocessing',
      task: mainTask,
      postprocessing: postTask,
    });

    const entry = chain.registry.get('task-postprocessing');
    expect(entry?.postprocessing).toBe(postTask);
  });

  test('should support registering entries with targets', () => {
    const chain = new Chain('targets-chain');
    const task1 = createMockTask('task-1');
    const task2 = createMockTask('task-2');
    const task3 = createMockTask('task-3');

    chain.register({ id: 'entry-1', task: task1 });
    chain.register({ id: 'entry-2', task: task2 });
    chain.register({ id: 'entry-3', task: task3 });

    chain.register({
      id: 'with-targets',
      task: createMockTask('source-task'),
      targets: ['entry-1', 'entry-2', 'entry-3'],
    });

    const entry = chain.registry.get('with-targets');
    expect(entry?.targets).toEqual(['entry-1', 'entry-2', 'entry-3']);
  });
});

describe('Function Materialization', () => {
  const testFunctionsDir = path.join(process.cwd(), '.chainos-test', 'functions');

  beforeEach(() => {
    // Clean up the test directory before each test
    cleanupTestDir(testFunctionsDir);
  });

  afterAll(() => {
    // Clean up after all tests
    cleanupTestDir(testFunctionsDir);
    cleanupTestDir(DEFAULT_FUNCTIONS_DIR);
  });

  test('should materialize preprocessing functions', () => {
    const chain = new Chain('materialize-pre-chain');
    const task = createMockTask('main-task');
    const preprocessingFn = (input: any) => ({ ...input, preprocessed: true });

    chain.register({
      id: 'with-preprocessing',
      task,
      preprocessing: preprocessingFn,
    });

    chain.materializeProcessingFunctions({ outputDir: testFunctionsDir });

    // Get the materialized entry
    const entry = chain.registry.get('with-preprocessing');

    // Check that preprocessing is now a Task
    expect(entry?.preprocessing).toBeInstanceOf(Task);
    if (entry?.preprocessing instanceof Task) {
      expect(entry.preprocessing.filepath).toContain(testFunctionsDir);
      expect(entry.preprocessing.filepath).toContain('preprocessing');
      expect(entry.preprocessing.filepath).toContain('with-preprocessing');
    }

    // Check the file was created
    const materializedFunctions = chain.getMaterializedFunctions();
    expect(materializedFunctions).not.toBeNull();
    expect(Object.keys(materializedFunctions || {})).toHaveLength(1);
  });

  test('should materialize postprocessing functions', () => {
    const chain = new Chain('materialize-post-chain');
    const task = createMockTask('main-task');
    const postprocessingFn = (input: any) => ({ ...input, postprocessed: true });

    chain.register({
      id: 'with-postprocessing',
      task,
      postprocessing: postprocessingFn,
    });

    chain.materializeProcessingFunctions({ outputDir: testFunctionsDir });

    // Get the materialized entry
    const entry = chain.registry.get('with-postprocessing');

    // Check that postprocessing is now a Task
    expect(entry?.postprocessing).toBeInstanceOf(Task);
    if (entry?.postprocessing instanceof Task) {
      expect(entry.postprocessing.filepath).toContain(testFunctionsDir);
      expect(entry.postprocessing.filepath).toContain('postprocessing');
      expect(entry.postprocessing.filepath).toContain('with-postprocessing');
    }

    // Check the file was created
    const materializedFunctions = chain.getMaterializedFunctions();
    expect(materializedFunctions).not.toBeNull();
    expect(Object.keys(materializedFunctions || {})).toHaveLength(1);
  });

  test('should materialize both pre and post processing functions', () => {
    const chain = new Chain('materialize-both-chain');
    const task = createMockTask('main-task');
    const preFn = (input: any) => ({ ...input, pre: true });
    const postFn = (input: any) => ({ ...input, post: true });

    chain.register({
      id: 'with-both-processing',
      task,
      preprocessing: preFn,
      postprocessing: postFn,
    });

    chain.materializeProcessingFunctions({ outputDir: testFunctionsDir });

    // Get the materialized entry
    const entry = chain.registry.get('with-both-processing');

    // Check that both are now Tasks
    expect(entry?.preprocessing).toBeInstanceOf(Task);
    expect(entry?.postprocessing).toBeInstanceOf(Task);

    // Check the files were created
    const materializedFunctions = chain.getMaterializedFunctions();
    expect(materializedFunctions).not.toBeNull();
    expect(Object.keys(materializedFunctions || {})).toHaveLength(2);
  });

  test('should not materialize Task-based processing', () => {
    const chain = new Chain('task-processing-chain');
    const mainTask = createMockTask('main-task');
    const preTask = createMockTask('pre-task');
    const postTask = createMockTask('post-task');

    chain.register({
      id: 'task-processing',
      task: mainTask,
      preprocessing: preTask,
      postprocessing: postTask,
    });

    chain.materializeProcessingFunctions({ outputDir: testFunctionsDir });

    // Get the entry
    const entry = chain.registry.get('task-processing');

    // Verify that the Tasks remain unchanged
    expect(entry?.preprocessing).toBe(preTask);
    expect(entry?.postprocessing).toBe(postTask);

    // Check that no functions were materialized
    const materializedFunctions = chain.getMaterializedFunctions();
    expect(materializedFunctions).not.toBeNull();
    expect(Object.keys(materializedFunctions || {})).toHaveLength(0);
  });

  test('getMaterializedFunctions returns null when no functions are converted', () => {
    const chain = new Chain('no-functions-chain');
    const task = createMockTask('task');

    chain.register({ id: 'simple-entry', task });

    expect(chain.getMaterializedFunctions()).toBeNull();
  });
});

describe('Chain Compilation', () => {
  test('should compile a simple chain to JSON structure', () => {
    const chain = new Chain('simple-chain', 'Simple Chain');
    const task = createMockTask('test-task');

    chain.register({ id: 'simple-entry', task });
    chain.setEntryPoint('simple-entry');

    const compiled = chain.compile();

    expect(compiled.id).toBe('simple-chain');
    expect(compiled.name).toBe('Simple Chain');
    expect(compiled.entryPoint).toBe('simple-entry');
    expect(compiled.nodes).toHaveLength(1);
    expect(compiled.edges).toHaveLength(0);
    expect(compiled.statistics.totalNodes).toBe(1);
    expect(compiled.statistics.hasEntryPoint).toBe(true);
  });

  test('should compile a chain with multiple nodes', () => {
    const chain = new Chain('multi-node-chain');
    const task1 = createMockTask('task-1');
    const task2 = createMockTask('task-2');
    const task3 = createMockTask('task-3');

    chain.register({ id: 'node-1', task: task1 });
    chain.register({ id: 'node-2', task: task2 });
    chain.register({ id: 'node-3', task: task3 });

    const compiled = chain.compile();

    expect(compiled.nodes).toHaveLength(3);
  });

  test('should compile a chain with node connections (targets)', () => {
    const chain = new Chain('connected-chain');
    const task1 = createMockTask('task-1');
    const task2 = createMockTask('task-2');

    chain.register({ id: 'source', task: task1, targets: ['target'] });
    chain.register({ id: 'target', task: task2 });

    const compiled = chain.compile();

    expect(compiled.edges).toHaveLength(1);
    expect(compiled.edges[0].source).toBe('source');
    expect(compiled.edges[0].target).toBe('target');
  });

  test('should compile a chain with processing functions when materialized', () => {
    const testFunctionsDir = path.join(process.cwd(), '.chainos-test', 'functions-compile');

    // Clean up before test
    cleanupTestDir(testFunctionsDir);

    try {
      const chain = new Chain('processing-compile-chain');
      const task = createMockTask('main-task');
      const preFn = (input: any) => ({ ...input, pre: true });

      chain.register({
        id: 'with-preprocessing',
        task,
        preprocessing: preFn,
      });

      // Set options to use test directory
      chain.materializeProcessingFunctions({ outputDir: testFunctionsDir });

      const compiled = chain.compile();

      // Should have 2 nodes: the main task and the preprocessing node
      expect(compiled.nodes).toHaveLength(2);

      // Find the preprocessing node
      const preNode = compiled.nodes.find(
        (node: any) => node.type === 'preprocessing' && node.parentId === 'with-preprocessing',
      );

      expect(preNode).toBeDefined();
      expect(preNode.id).toContain('with-preprocessing_preprocessing');
      expect(preNode.task).toBeDefined();

      // Should have 1 edge connecting preprocessing to main task
      expect(compiled.edges).toHaveLength(1);
      expect(compiled.edges[0].source).toBe(preNode.id);
      expect(compiled.edges[0].target).toBe('with-preprocessing');
    } finally {
      // Clean up after test
      cleanupTestDir(testFunctionsDir);
    }
  });

  test('should compile a chain with materializeFunction option', () => {
    const testFunctionsDir = path.join(process.cwd(), '.chainos-test', 'functions-option');

    // Clean up before test
    cleanupTestDir(testFunctionsDir);

    try {
      const chain = new Chain('materialize-option-chain');
      const task = createMockTask('task');
      const postFn = (input: any) => ({ ...input, post: true });

      chain.register({
        id: 'entry',
        task,
        postprocessing: postFn,
      });

      // Set options to compile with materialization automatically
      const compiled = chain.compile({
        materializeFunctions: true,
      });

      // Should have 2 nodes: the main task and the postprocessing node
      expect(compiled.nodes).toHaveLength(2);

      // Find the postprocessing node
      const postNode = compiled.nodes.find(
        (node: any) => node.type === 'postprocessing' && node.parentId === 'entry',
      );

      expect(postNode).toBeDefined();
    } finally {
      // Clean up after test
      cleanupTestDir(DEFAULT_FUNCTIONS_DIR);
    }
  });

  test('should calculate task type distribution correctly', () => {
    const chain = new Chain('task-types-chain');

    // Create tasks with different environment types
    const jsTask = createMockTask('js-task', '/path/to/task.js');
    // Mock the environment detection
    jest.spyOn(jsTask, 'getEnvironmentType').mockImplementation(() => TaskEnvironment.JAVASCRIPT);

    const tsTask = createMockTask('ts-task', '/path/to/task.ts');
    jest.spyOn(tsTask, 'getEnvironmentType').mockImplementation(() => TaskEnvironment.TYPESCRIPT);

    chain.register({ id: 'js-entry', task: jsTask });
    chain.register({ id: 'ts-entry', task: tsTask });
    chain.register({ id: 'js-entry-2', task: jsTask });

    const compiled = chain.compile();

    // Check the statistics
    expect(compiled.statistics.taskTypes).toEqual({
      [TaskEnvironment.JAVASCRIPT]: 2,
      [TaskEnvironment.TYPESCRIPT]: 1,
    });
  });

  test('should handle complex workflows with pre/post processing and targets', () => {
    const chain = new Chain('complex-chain');

    // Create tasks
    const taskA = createMockTask('task-a');
    const taskB = createMockTask('task-b');
    const taskC = createMockTask('task-c');

    // Create processing tasks
    const preTaskB = createMockTask('pre-task-b');
    const postTaskB = createMockTask('post-task-b');

    // Register tasks with processing and targets
    chain.register({ id: 'node-a', task: taskA, targets: ['node-b'] });
    chain.register({
      id: 'node-b',
      task: taskB,
      preprocessing: preTaskB,
      postprocessing: postTaskB,
      targets: ['node-c'],
    });
    chain.register({ id: 'node-c', task: taskC });

    // Set entry point
    chain.setEntryPoint('node-a');

    // Compile the chain
    const compiled = chain.compile();

    // Should have 5 nodes: 3 main tasks + 1 pre + 1 post
    expect(compiled.nodes).toHaveLength(5);

    // Should have 3 edges: A->B_pre, B_pre->B, B->B_post, B_post->C
    expect(compiled.edges).toHaveLength(4);

    // The entry point should be node-a
    expect(compiled.entryPoint).toBe('node-a');
  });

  test('should handle entry point with preprocessing', () => {
    const chain = new Chain('entry-pre-chain');
    const task = createMockTask('main-task');
    const preTask = createMockTask('pre-task');

    chain.register({
      id: 'entry',
      task,
      preprocessing: preTask,
    });

    chain.setEntryPoint('entry');

    const compiled = chain.compile();

    // Should mark the preprocessing as the actual entry point
    expect(compiled.actualEntryPoint).toBe('entry_preprocessing');
  });
});
