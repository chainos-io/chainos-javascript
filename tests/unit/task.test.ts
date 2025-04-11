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
    const task = new Task(jsFilePath);

    expect(task.getEnvironmentType()).toBe(TaskEnvironment.JAVASCRIPT);
    expect(task.getConfigPath()).toContain('package.json');
    expect(task.getConfig()).toHaveProperty('name', 'chainos-sdk');
  });

  test('should detect TypeScript environment from .ts file', () => {
    // Use a path from the current project structure
    const tsFilePath = path.resolve(__dirname, '../../src/index.ts');
    const task = new Task(tsFilePath);

    expect(task.getEnvironmentType()).toBe(TaskEnvironment.TYPESCRIPT);
    expect(task.getConfigPath()).toContain('package.json');
    expect(task.getConfig()).toHaveProperty('name', 'chainos-sdk');
  });

  test('should detect JavaScript environment from .jsx file', () => {
    const jsxFilePath = path.resolve(__dirname, '../../examples/test-jsx.jsx');

    // Create a temporary JSX file
    createTestFile(jsxFilePath, 'export const testJsx = () => <div>Test</div>;');

    try {
      const task = new Task(jsxFilePath);
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
      const task = new Task(tsxFilePath);
      expect(task.getEnvironmentType()).toBe(TaskEnvironment.TYPESCRIPT);
    } finally {
      cleanupTestFile(tsxFilePath);
    }
  });

  test('should return UNKNOWN for unsupported file types', () => {
    const unknownFilePath = path.resolve(__dirname, '../../README.md');
    const task = new Task(unknownFilePath);

    expect(task.getEnvironmentType()).toBe(TaskEnvironment.UNKNOWN);
    expect(task.getConfigPath()).toBeUndefined();
  });

  test('should handle Python files', () => {
    // This test will return UNKNOWN since we don't have Python files in the project
    // In a real Python project, it would detect Python environment
    const pythonFilePath = '/path/to/some/python/script.py';
    const task = new Task(pythonFilePath);

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
      const task = new Task(jsFilePath);
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
    const task = new Task(path.join(level2Dir, 'test.js'));

    // Create a method that exposes the private findFileUpwards method
    const findFile = (filename: string, startDir: string) => {
      // @ts-ignore - accessing private method for testing
      return task.findFileUpwards(filename, startDir);
    };

    const foundPath = findFile('mid-file.txt', level2Dir);
    expect(foundPath).toBe(path.join(level2Dir, 'mid-file.txt'));
  });

  test('should find file in parent directory', () => {
    const task = new Task(path.join(level3Dir, 'test.js'));

    // @ts-ignore - accessing private method for testing
    const foundPath = task.findFileUpwards('mid-file.txt', level3Dir);
    expect(foundPath).toBe(path.join(level2Dir, 'mid-file.txt'));
  });

  test('should find first file from an array of filenames', () => {
    const task = new Task(path.join(level3Dir, 'test.js'));

    // @ts-ignore - accessing private method for testing
    const foundPath = task.findFileUpwards(
      ['not-existing.txt', 'mid-file.txt', 'root-file.txt'],
      level3Dir,
    );
    expect(foundPath).toBe(path.join(level2Dir, 'mid-file.txt'));
  });

  test('should return undefined when file is not found', () => {
    const task = new Task(path.join(level3Dir, 'test.js'));

    // @ts-ignore - accessing private method for testing
    const foundPath = task.findFileUpwards('non-existent-file.txt', level3Dir, 2);
    expect(foundPath).toBeUndefined();
  });

  test('should respect maxDepth parameter', () => {
    const task = new Task(path.join(level3Dir, 'test.js'));

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

describe('Task Execution', () => {
  test('should execute a JavaScript task', async () => {
    // Create a temporary JS file with a test function
    const testDir = path.resolve(__dirname, '../../examples');
    const testFilePath = path.join(testDir, 'test-task.js');
    const testContent = `
      exports.testFunction = (inputs) => {
        return { 
          result: inputs.value * 2,
          message: 'Success'
        };
      };
    `;

    // Write the test file
    createTestFile(testFilePath, testContent);

    try {
      // Create a task pointing to our test function
      const task = new Task(testFilePath, { entryFunctionName: 'testFunction' });

      // Run the task
      const result = await task.run({ value: 21 });

      // Verify the result
      expect(result).toEqual({ result: 42, message: 'Success' });
    } finally {
      // Clean up - remove the test file
      cleanupTestFile(testFilePath);
    }
  });

  test('should use default main function name if not specified', async () => {
    const testDir = path.resolve(__dirname, '../../examples');
    const testFilePath = path.join(testDir, 'test-default-main.js');
    const testContent = `
      exports.main = (inputs) => {
        return { result: 'default main used' };
      };
    `;

    createTestFile(testFilePath, testContent);

    try {
      // Create task without specifying entryFunctionName
      const task = new Task(testFilePath);
      const result = await task.run();
      expect(result).toEqual({ result: 'default main used' });
    } finally {
      cleanupTestFile(testFilePath);
    }
  });

  test('should throw error if function does not exist', async () => {
    // Create a temporary JS file
    const testDir = path.resolve(__dirname, '../../examples');
    const testFilePath = path.join(testDir, 'test-task-error.js');
    const testContent = `
      exports.existingFunction = () => {
        return { result: 'success' };
      };
    `;

    // Write the test file
    createTestFile(testFilePath, testContent);

    try {
      // Create a task pointing to a non-existent function
      const task = new Task(testFilePath, { entryFunctionName: 'nonExistentFunction' });

      // Run the task and expect it to throw
      await expect(task.run()).rejects.toThrow(/Function 'nonExistentFunction' not found/);
    } finally {
      // Clean up - remove the test file
      cleanupTestFile(testFilePath);
    }
  });

  test('should throw error if file does not exist', async () => {
    // Create a task with a non-existent file
    const nonExistentPath = path.resolve(__dirname, 'does-not-exist.js');
    const task = new Task(nonExistentPath);

    // Run the task and expect it to throw
    await expect(task.run()).rejects.toThrow(/Task file not found/);
  });

  test('should throw error for unsupported environment', async () => {
    // Create a file with an unsupported extension
    const unsupportedFilePath = path.resolve(__dirname, '../../examples/unsupported.txt');
    createTestFile(unsupportedFilePath, 'This is not a supported file type');

    try {
      const task = new Task(unsupportedFilePath);
      await expect(task.run()).rejects.toThrow(/Unsupported task environment/);
    } finally {
      cleanupTestFile(unsupportedFilePath);
    }
  });

  test('should handle general errors during JS task execution', async () => {
    const testDir = path.resolve(__dirname, '../../examples');
    const testFilePath = path.join(testDir, 'test-error-task.js');
    const testContent = `
      exports.errorFunction = () => {
        throw new Error('Test error');
      };
    `;

    createTestFile(testFilePath, testContent);

    try {
      const task = new Task(testFilePath, { entryFunctionName: 'errorFunction' });
      await expect(task.run()).rejects.toThrow(/Error executing task/);
    } finally {
      cleanupTestFile(testFilePath);
    }
  });

  // Mock Python task tests without using Jest mocks
  describe('Python Task Execution', () => {
    // Create a test Python file and modify environment type manually
    test('should handle Python task execution', async () => {
      const pythonFilePath = path.resolve(__dirname, '../../examples/test.py');
      createTestFile(pythonFilePath, 'def main(inputs): return {"result": "python ran"}');

      // Create a custom exec implementation
      const originalExec = require('node:child_process').exec;

      try {
        // Override child_process.exec temporarily with our test version
        require('node:child_process').exec = (cmd: string, callback: any) => {
          // Simulate successful Python execution by creating the output file
          const match = cmd.match(/temp_output_([a-f0-9-]+)\.json/);
          if (match) {
            const tempId = match[1];
            const outputFile = path.join(
              path.dirname(pythonFilePath),
              `temp_output_${tempId}.json`,
            );
            // Create the expected output file
            fs.writeFileSync(outputFile, JSON.stringify({ result: 'python test complete' }));
          }

          // Call the callback with success
          setTimeout(() => {
            callback(null, 'Python output', '');
          }, 10);

          return { on: () => {} };
        };

        const task = new Task(pythonFilePath);

        // Set the environment type to Python
        // @ts-ignore - accessing private property for testing
        task.environment.type = TaskEnvironment.PYTHON;

        // Skip actual Python execution but test our handling code
        const result = await task.run({ test: true });
        expect(result).toHaveProperty('result');
      } finally {
        // Restore the original exec function
        require('node:child_process').exec = originalExec;
        cleanupTestFile(pythonFilePath);

        // Clean up any temp files that might have been created
        const tempFiles = fs.readdirSync(path.dirname(pythonFilePath));
        for (const file of tempFiles) {
          if (file.startsWith('temp_')) {
            cleanupTestFile(path.join(path.dirname(pythonFilePath), file));
          }
        }
      }
    });

    // Test error handling for Python tasks
    test('should handle Python execution errors', async () => {
      const pythonFilePath = path.resolve(__dirname, '../../examples/error.py');
      createTestFile(pythonFilePath, 'def main(inputs): raise Exception("Python error")');

      const originalExec = require('node:child_process').exec;

      try {
        // Override exec to simulate an error
        require('node:child_process').exec = (cmd: string, callback: any) => {
          setTimeout(() => {
            callback(new Error('Command failed'), '', 'Python error');
          }, 10);
          return { on: () => {} };
        };

        const task = new Task(pythonFilePath);
        // @ts-ignore - accessing private property for testing
        task.environment.type = TaskEnvironment.PYTHON;

        await expect(task.run()).rejects.toThrow(/Error executing Python task/);
      } finally {
        require('node:child_process').exec = originalExec;
        cleanupTestFile(pythonFilePath);
      }
    });

    test('should handle Python stderr output', async () => {
      const pythonFilePath = path.resolve(__dirname, '../../examples/warning.py');
      createTestFile(
        pythonFilePath,
        'def main(inputs): print("Warning", file=sys.stderr); return {}',
      );

      const originalExec = require('node:child_process').exec;

      try {
        // Override exec to simulate stderr output
        require('node:child_process').exec = (cmd: string, callback: any) => {
          setTimeout(() => {
            callback(null, '', 'Warning message');
          }, 10);
          return { on: () => {} };
        };

        const task = new Task(pythonFilePath);
        // @ts-ignore - accessing private property for testing
        task.environment.type = TaskEnvironment.PYTHON;

        await expect(task.run()).rejects.toThrow(/Error in Python task/);
      } finally {
        require('node:child_process').exec = originalExec;
        cleanupTestFile(pythonFilePath);
      }
    });

    test('should handle missing output file', async () => {
      const pythonFilePath = path.resolve(__dirname, '../../examples/no-output.py');
      createTestFile(pythonFilePath, 'def main(inputs): pass  # No output');

      const originalExec = require('node:child_process').exec;

      try {
        // Override exec to simulate successful execution but without creating output file
        require('node:child_process').exec = (cmd: string, callback: any) => {
          setTimeout(() => {
            callback(null, 'Python ran', '');
          }, 10);
          return { on: () => {} };
        };

        const task = new Task(pythonFilePath);
        // @ts-ignore - accessing private property for testing
        task.environment.type = TaskEnvironment.PYTHON;

        await expect(task.run()).rejects.toThrow(/Python task did not produce an output file/);
      } finally {
        require('node:child_process').exec = originalExec;
        cleanupTestFile(pythonFilePath);
      }
    });
  });
});
