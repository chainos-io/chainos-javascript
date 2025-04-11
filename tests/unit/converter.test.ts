// filepath: /Users/csarkissian/Documents/Work/chainos/chainos-javascript/tests/unit/converter.test.ts
import {
  FunctionConverter,
  functionToTask,
  DEFAULT_FUNCTIONS_DIR,
} from '../../src/utils/functions/converter';
import { Task } from '../../src/models/task';
import fs from 'node:fs';
import path from 'node:path';

// Helper to clean up test directories
const cleanupTestDir = (dir: string) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe('Function to Task Conversion', () => {
  const testDir = path.join(process.cwd(), '.chainos-test', 'converter-tests');

  beforeEach(() => {
    // Clean up before each test
    cleanupTestDir(testDir);
  });

  afterAll(() => {
    // Clean up after all tests
    cleanupTestDir(testDir);
    cleanupTestDir(DEFAULT_FUNCTIONS_DIR);
  });

  test('should convert a simple function to a task file', () => {
    const simpleFunction = (input: any) => {
      return { processed: true, input };
    };

    const result = functionToTask(simpleFunction, 'preprocessing', 'test-task', {
      outputDir: testDir,
    });

    // Check results
    expect(result.task).toBeInstanceOf(Task);
    expect(result.functionName).toContain('processor_preprocessing_test-task');
    expect(result.filePath).toContain(testDir);
    expect(result.filePath).toContain('.js'); // Default extension

    // Check the created file exists
    expect(fs.existsSync(result.filePath)).toBe(true);

    // Check file content
    const content = fs.readFileSync(result.filePath, 'utf8');
    expect(content).toContain('function main(input, context)');
    expect(content).toContain('module.exports = { main }');
    expect(content).toContain('Original function:');
    expect(content).toContain('return { processed: true, input }');
  });

  test('should convert a function to a TypeScript file when specified', () => {
    const tsFunction = (input: any) => {
      return { processed: true, input };
    };

    const result = functionToTask(tsFunction, 'postprocessing', 'ts-task', {
      outputDir: testDir,
      extension: '.ts',
    });

    // Check results
    expect(result.filePath).toContain('.ts'); // TypeScript extension

    // Check file content
    const content = fs.readFileSync(result.filePath, 'utf8');
    expect(content).toContain('export function main(input: any, context?: any): any');
    expect(content).not.toContain('module.exports');
  });

  test("should create the output directory if it doesn't exist", () => {
    const nestedDir = path.join(testDir, 'nested', 'dir');
    const simpleFunction = (input: any) => input;

    // Directory should not exist yet
    expect(fs.existsSync(nestedDir)).toBe(false);

    functionToTask(simpleFunction, 'preprocessing', 'nested-task', { outputDir: nestedDir });

    // Directory should exist now
    expect(fs.existsSync(nestedDir)).toBe(true);
  });

  test('should use custom name prefix when provided', () => {
    const prefixFunction = (input: any) => input;

    const result = functionToTask(prefixFunction, 'preprocessing', 'prefix-task', {
      outputDir: testDir,
      namePrefix: 'custom_prefix_',
    });

    expect(result.functionName).toContain('custom_prefix_preprocessing_prefix-task');
    expect(result.filePath).toContain('custom_prefix_preprocessing_prefix-task');
  });

  test('should handle complex functions with multiple lines', () => {
    const complexFunction = (input: any, context: any) => {
      // This is a multi-line function with comments
      const result = {
        processed: true,
        input,
        context,
        timestamp: new Date().toISOString(),
        computed: input.value * 2,
      };

      // Return the processed data
      return result;
    };

    const result = functionToTask(complexFunction, 'preprocessing', 'complex-task', {
      outputDir: testDir,
    });

    // Check file content
    const content = fs.readFileSync(result.filePath, 'utf8');
    expect(content).toContain('multi-line function with comments');
    expect(content).toContain('timestamp: new Date().toISOString()');
    expect(content).toContain('computed: input.value * 2');
  });
});

describe('FunctionConverter Class', () => {
  const testDir = path.join(process.cwd(), '.chainos-test', 'converter-class-tests');

  beforeEach(() => {
    // Clean up before each test
    cleanupTestDir(testDir);
  });

  afterAll(() => {
    // Clean up after all tests
    cleanupTestDir(testDir);
  });

  test('should initialize with default options', () => {
    const converter = new FunctionConverter();
    expect(converter).toBeDefined();

    // Initial state should have no conversions
    expect(converter.getConversions().size).toBe(0);
  });

  test('should initialize with custom options', () => {
    const converter = new FunctionConverter({
      outputDir: testDir,
      extension: '.ts',
      namePrefix: 'custom_',
    });
    expect(converter).toBeDefined();
  });

  test('should convert a function to a task', () => {
    const converter = new FunctionConverter({ outputDir: testDir });
    const testFunction = (input: any) => ({ ...input, test: true });

    const task = converter.convertFunction(testFunction, 'preprocessing', 'converter-task');

    // Should return a task
    expect(task).toBeInstanceOf(Task);
    expect(task.id).toContain('preprocessing-converter-task');

    // Should store the conversion
    const conversions = converter.getConversions();
    expect(conversions.size).toBe(1);
    expect(conversions.has(testFunction)).toBe(true);

    // Result should contain all expected properties
    const result = conversions.get(testFunction);
    expect(result?.task).toBe(task);
    expect(result?.filePath).toContain(testDir);
    expect(result?.functionName).toContain('processor_preprocessing_converter-task');

    // Check file was created
    expect(fs.existsSync(result?.filePath as string)).toBe(true);
  });

  test('should reuse existing task for same function', () => {
    const converter = new FunctionConverter({ outputDir: testDir });
    const sharedFunction = (input: any) => ({ ...input, shared: true });

    // Convert the function for the first time
    const task1 = converter.convertFunction(sharedFunction, 'preprocessing', 'first-task');

    // Convert the same function again for a different task
    const task2 = converter.convertFunction(
      sharedFunction,
      'postprocessing', // Different type
      'second-task', // Different parent
    );

    // Should return the same task
    expect(task2).toBe(task1);

    // Should only have one conversion stored
    const conversions = converter.getConversions();
    expect(conversions.size).toBe(1);
    expect(conversions.has(sharedFunction)).toBe(true);
  });

  test('should handle different functions as different conversions', () => {
    const converter = new FunctionConverter({ outputDir: testDir });
    const function1 = (input: any) => ({ ...input, type: 1 });
    const function2 = (input: any) => ({ ...input, type: 2 });

    // Convert both functions
    const task1 = converter.convertFunction(function1, 'preprocessing', 'task');
    const task2 = converter.convertFunction(function2, 'preprocessing', 'task');

    // Should return different tasks
    expect(task1).not.toBe(task2);

    // Should have two conversions stored
    const conversions = converter.getConversions();
    expect(conversions.size).toBe(2);
    expect(conversions.has(function1)).toBe(true);
    expect(conversions.has(function2)).toBe(true);
  });
});
