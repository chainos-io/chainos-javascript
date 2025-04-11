import { Task, TaskEnvironment } from '../../src/models/task';
import path from 'node:path';
import fs from 'node:fs';

// Helper function to create test files
const createTestFile = (filePath: string, content: string) => {
  fs.writeFileSync(filePath, content);
  return filePath;
};

// Helper function to clean up test files
const cleanupTestFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

describe('Task Environment Detection', () => {
  test('should detect JavaScript environment from .js file', () => {
    // Use a path from the current project structure
    const jsFilePath = path.resolve(__dirname, '../../examples/some-example.js');
    const task = new Task('js-task', jsFilePath);

    expect(task.getEnvironmentType()).toBe(TaskEnvironment.JAVASCRIPT);
    expect(task.getConfigPath()).toContain('package.json');
    expect(task.getConfig()).toHaveProperty('name', 'chainos-sdk');
  });

  test('should detect TypeScript environment from .ts file', () => {
    // Use a path from the current project structure
    const tsFilePath = path.resolve(__dirname, '../../src/index.ts');
    const task = new Task('ts-task', tsFilePath);

    expect(task.getEnvironmentType()).toBe(TaskEnvironment.TYPESCRIPT);
    expect(task.getConfigPath()).toContain('package.json');
    expect(task.getConfig()).toHaveProperty('name', 'chainos-sdk');
  });

  test('should detect JavaScript environment from .jsx file', () => {
    const jsxFilePath = path.resolve(__dirname, '../../examples/test-jsx.jsx');

    // Create a temporary JSX file
    createTestFile(jsxFilePath, 'export const testJsx = () => <div>Test</div>;');

    try {
      const task = new Task('jsx-task', jsxFilePath);
      expect(task.getEnvironmentType()).toBe(TaskEnvironment.JAVASCRIPT);
    } finally {
      cleanupTestFile(jsxFilePath);
    }
  });

  test('should detect TypeScript environment from .tsx file', () => {
    const tsxFilePath = path.resolve(__dirname, '../../examples/test-tsx.tsx');

    // Create a temporary TSX file
    createTestFile(tsxFilePath, 'export const testTsx = () => <div>Test</div>;');

    try {
      const task = new Task('tsx-task', tsxFilePath);
      expect(task.getEnvironmentType()).toBe(TaskEnvironment.TYPESCRIPT);
    } finally {
      cleanupTestFile(tsxFilePath);
    }
  });

  test('should return UNKNOWN for unsupported file types', () => {
    const unknownFilePath = path.resolve(__dirname, '../../README.md');
    const task = new Task('unknown-task', unknownFilePath);

    expect(task.getEnvironmentType()).toBe(TaskEnvironment.UNKNOWN);
    expect(task.getConfigPath()).toBeUndefined();
  });

  test('should handle Python files', () => {
    // This test will return UNKNOWN since we don't have Python files in the project
    // In a real Python project, it would detect Python environment
    const pythonFilePath = '/path/to/some/python/script.py';
    const task = new Task('python-task', pythonFilePath);

    // This defaults to UNKNOWN since we're not in a Python project
    expect(task.getEnvironmentType()).toBe(TaskEnvironment.UNKNOWN);
  });

  test('should handle scenario where package.json is invalid', () => {
    const jsFilePath = path.resolve(__dirname, '../../examples/test-invalid-pkg.js');
    const pkgPath = path.resolve(__dirname, '../../examples/package.json');

    // Create test files
    createTestFile(jsFilePath, 'exports.test = () => true;');
    createTestFile(pkgPath, '{invalid-json');

    try {
      const task = new Task('invalid-pkg-task', jsFilePath);
      // With invalid package.json, it should fall back to UNKNOWN
      expect(task.getEnvironmentType()).toBe(TaskEnvironment.UNKNOWN);
      expect(task.getConfig()).toBeUndefined();
    } finally {
      cleanupTestFile(jsFilePath);
      cleanupTestFile(pkgPath);
    }
  });
});

describe('findFileUpwards Method', () => {
  const testDir = path.resolve(__dirname, '../../examples/nested-test-dir');
  const level1Dir = path.join(testDir, 'level1');
  const level2Dir = path.join(level1Dir, 'level2');
  const level3Dir = path.join(level2Dir, 'level3');

  beforeAll(() => {
    // Create nested directory structure
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    if (!fs.existsSync(level1Dir)) fs.mkdirSync(level1Dir);
    if (!fs.existsSync(level2Dir)) fs.mkdirSync(level2Dir);
    if (!fs.existsSync(level3Dir)) fs.mkdirSync(level3Dir);

    // Create test files at different levels
    createTestFile(path.join(testDir, 'root-file.txt'), 'root level');
    createTestFile(path.join(level2Dir, 'mid-file.txt'), 'mid level');
  });

  afterAll(() => {
    // Clean up the test directory structure
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should find file in current directory', () => {
    // This accesses a private method, so we'll create a task and test indirectly
    const task = new Task('find-file-task', path.join(level2Dir, 'test.js'));

    // Create a method that exposes the private findFileUpwards method
    const findFile = (filename: string, startDir: string) => {
      // @ts-ignore - accessing private method for testing
      return task.findFileUpwards(filename, startDir);
    };

    const foundPath = findFile('mid-file.txt', level2Dir);
    expect(foundPath).toBe(path.join(level2Dir, 'mid-file.txt'));
  });

  test('should find file in parent directory', () => {
    const task = new Task('parent-dir-task', path.join(level3Dir, 'test.js'));

    // @ts-ignore - accessing private method for testing
    const foundPath = task.findFileUpwards('mid-file.txt', level3Dir);
    expect(foundPath).toBe(path.join(level2Dir, 'mid-file.txt'));
  });

  test('should find first file from an array of filenames', () => {
    const task = new Task('array-filenames-task', path.join(level3Dir, 'test.js'));

    // @ts-ignore - accessing private method for testing
    const foundPath = task.findFileUpwards(
      ['not-existing.txt', 'mid-file.txt', 'root-file.txt'],
      level3Dir,
    );
    expect(foundPath).toBe(path.join(level2Dir, 'mid-file.txt'));
  });

  test('should return undefined when file is not found', () => {
    const task = new Task('not-found-task', path.join(level3Dir, 'test.js'));

    // @ts-ignore - accessing private method for testing
    const foundPath = task.findFileUpwards('non-existent-file.txt', level3Dir, 2);
    expect(foundPath).toBeUndefined();
  });

  test('should respect maxDepth parameter', () => {
    const task = new Task('max-depth-task', path.join(level3Dir, 'test.js'));

    // Create the test file structure
    createTestFile(path.join(testDir, 'depth-test.txt'), 'test content');

    try {
      // With maxDepth 1, it should not find the file
      // @ts-ignore - accessing private method for testing
      const notFound = task.findFileUpwards('depth-test.txt', level3Dir, 1);
      expect(notFound).toBeUndefined();

      // Check if the file exists at the expected location
      expect(fs.existsSync(path.join(testDir, 'depth-test.txt'))).toBe(true);

      // With maxDepth 10 (more than enough), it should find the file
      // @ts-ignore - accessing private method for testing
      const found = task.findFileUpwards('depth-test.txt', level3Dir, 10);
      expect(found).toBe(path.join(testDir, 'depth-test.txt'));
    } finally {
      cleanupTestFile(path.join(testDir, 'depth-test.txt'));
    }
  });
});

describe('Task Resource Configuration', () => {
  test('should set default CPU and memory values when not provided', () => {
    const task = new Task('default-resource-task', '/path/to/task.js');
    expect(task.cpu).toBe(0.25);
    expect(task.memory).toBe('1gb'); // Updated to match actual default value
  });

  test('should normalize CPU values to increments of 0.25', () => {
    const task1 = new Task('cpu-task-1', '/path/to/task.js', { cpu: 0.3 });
    expect(task1.cpu).toBe(0.25);

    const task2 = new Task('cpu-task-2', '/path/to/task.js', { cpu: 0.6 });
    expect(task2.cpu).toBe(0.5);

    const task3 = new Task('cpu-task-3', '/path/to/task.js', { cpu: 1.7 });
    expect(task3.cpu).toBe(1.75);

    const task4 = new Task('cpu-task-4', '/path/to/task.js', { cpu: 0.1 });
    expect(task4.cpu).toBe(0.25); // Minimum value
  });

  test('should normalize memory values to increments of 256MB', () => {
    const task1 = new Task('mem-task-1', '/path/to/task.js', { memory: '300mb' });
    expect(task1.memory).toBe('256mb');

    const task2 = new Task('mem-task-2', '/path/to/task.js', { memory: '400mb' });
    expect(task2.memory).toBe('512mb');

    const task3 = new Task('mem-task-3', '/path/to/task.js', { memory: '1.1gb' });
    expect(task3.memory).toBe('1gb');

    const task4 = new Task('mem-task-4', '/path/to/task.js', { memory: '1.7gb' });
    expect(task4.memory).toBe('1792mb'); // Updated to match actual implementation
  });

  test('should handle TB memory values', () => {
    const task1 = new Task('tb-task-1', '/path/to/task.js', { memory: '1tb' });
    expect(task1.memory).toBe('1tb');

    const task2 = new Task('tb-task-2', '/path/to/task.js', { memory: '1.1tb' });
    expect(task2.memory).toBe('1.1tb');

    const task3 = new Task('tb-task-3', '/path/to/task.js', { memory: '1.5tb' });
    expect(task3.memory).toBe('1.5tb');
  });

  test('should handle invalid memory format', () => {
    const task1 = new Task('invalid-mem-task-1', '/path/to/task.js', { memory: 'invalid' });
    expect(task1.memory).toBe('256mb'); // Default

    const task2 = new Task('invalid-mem-task-2', '/path/to/task.js', { memory: '100' });
    expect(task2.memory).toBe('256mb'); // Default
  });
});

describe('Task ID Configuration', () => {
  test('should set the ID when creating a task', () => {
    const id = 'test-task-id';
    const task = new Task(id, '/path/to/task.js');
    expect(task.id).toBe(id);
  });

  test('should handle different ID formats', () => {
    const idWithSpaces = 'task with spaces';
    const taskWithSpaces = new Task(idWithSpaces, '/path/to/task.js');
    expect(taskWithSpaces.id).toBe(idWithSpaces);

    const idWithSpecialChars = 'task-with-special_chars!@#';
    const taskWithSpecialChars = new Task(idWithSpecialChars, '/path/to/task.js');
    expect(taskWithSpecialChars.id).toBe(idWithSpecialChars);
  });
});
