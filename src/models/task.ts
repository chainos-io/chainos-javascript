import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Supported runtime environments for tasks
 */
export enum TaskEnvironment {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  UNKNOWN = 'unknown',
}

/**
 * Environment configuration information
 */
export interface EnvironmentConfig {
  /**
   * Type of environment (javascript, python, etc.)
   */
  type: TaskEnvironment;

  /**
   * Path to the environment configuration file
   */
  configPath?: string;

  /**
   * Configuration data (parsed from config file)
   */
  config?: any;
}

/**
 * Options for creating a Task
 */
export interface TaskOptions {
  /**
   * Display name of the task
   */
  displayName?: string;

  /**
   * Entry function or main point for the task
   */
  entryFunctionName?: string;
}

/**
 * Represents a Task that can be added to a Chain
 */
export class Task {
  /**
   * Unique identifier for the task
   */
  id: string;

  /**
   * Display name of the task
   */
  name: string;

  /**
   * Filepath of the task implementation
   */
  filepath: string;

  /**
   * Main function or entry point for the task
   */
  main: string;

  /**
   * Environment information for the task
   */
  environment: EnvironmentConfig;

  /**
   * Create a new Task
   *
   * @param filepath Filepath of the task implementation
   * @param options Optional configuration for the task
   * @param options.displayName Display name for the task (defaults to filepath)
   * @param options.entryFunctionName Entry function name (defaults to "main")
   */
  constructor(filepath: string, options: TaskOptions = {}) {
    this.id = crypto.randomUUID();
    this.filepath = filepath;
    this.name = options.displayName || filepath;
    this.main = options.entryFunctionName || 'main';
    this.environment = this.detectEnvironment();
  }

  /**
   * Detect the environment configuration based on the task's filepath
   *
   * @returns The detected environment configuration
   */
  private detectEnvironment(): EnvironmentConfig {
    const dirPath = path.dirname(this.filepath);
    const extension = path.extname(this.filepath).toLowerCase();

    // Default environment configuration
    const envConfig: EnvironmentConfig = {
      type: TaskEnvironment.UNKNOWN,
    };

    // Check for JavaScript/TypeScript environment
    if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) {
      // Look for package.json in the current directory or any parent directory
      const packageJsonPath = this.findFileUpwards('package.json', dirPath);

      if (packageJsonPath) {
        try {
          const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          envConfig.type = extension.includes('ts')
            ? TaskEnvironment.TYPESCRIPT
            : TaskEnvironment.JAVASCRIPT;
          envConfig.configPath = packageJsonPath;
          envConfig.config = packageData;
        } catch (error) {
          console.error(`Error parsing package.json at ${packageJsonPath}:`, error);
        }
      }
    }

    // Check for Python environment
    else if (['.py'].includes(extension)) {
      // Look for setup.py, requirements.txt, or pyproject.toml
      const pythonConfigPath = this.findFileUpwards(
        ['requirements.txt', 'setup.py', 'pyproject.toml'],
        dirPath,
      );

      if (pythonConfigPath) {
        envConfig.type = TaskEnvironment.PYTHON;
        envConfig.configPath = pythonConfigPath;

        // For a more complete implementation, we could parse the config file based on its type
      }
    }

    return envConfig;
  }

  /**
   * Find a file by traversing up the directory tree from the starting directory
   *
   * @param filename The filename or array of filenames to find
   * @param startDir The directory to start searching from
   * @param maxDepth Maximum directory levels to traverse upwards (default: 5)
   * @returns The path to the first found file, or undefined if not found
   */
  private findFileUpwards(
    filename: string | string[],
    startDir: string,
    maxDepth = 5,
  ): string | undefined {
    const filenames = Array.isArray(filename) ? filename : [filename];
    let currentDir = startDir;
    let depth = 0;

    while (depth < maxDepth) {
      for (const name of filenames) {
        const filePath = path.join(currentDir, name);
        if (fs.existsSync(filePath)) {
          return filePath;
        }
      }

      // Move up one directory
      const parentDir = path.dirname(currentDir);

      // If we've reached the root directory, stop searching
      if (parentDir === currentDir) {
        break;
      }

      currentDir = parentDir;
      depth++;
    }

    return undefined;
  }

  /**
   * Get the detected environment type
   *
   * @returns The task's environment type
   */
  getEnvironmentType(): TaskEnvironment {
    return this.environment.type;
  }

  /**
   * Get the environment configuration file path
   *
   * @returns The path to the environment configuration file
   */
  getConfigPath(): string | undefined {
    return this.environment.configPath;
  }

  /**
   * Get the parsed environment configuration
   *
   * @returns The environment configuration data
   */
  getConfig(): any {
    return this.environment.config;
  }

  /**
   * Run the task with provided inputs
   *
   * @param inputs Data to pass to the task function
   * @returns Promise with the task execution result
   * @throws Error if the task cannot be executed
   */
  async run(inputs: any = {}): Promise<any> {
    if (!fs.existsSync(this.filepath)) {
      throw new Error(`Task file not found: ${this.filepath}`);
    }

    switch (this.environment.type) {
      case TaskEnvironment.JAVASCRIPT:
      case TaskEnvironment.TYPESCRIPT:
        return this.runJsTask(inputs);

      case TaskEnvironment.PYTHON:
        return this.runPythonTask(inputs);

      default:
        throw new Error(`Unsupported task environment: ${this.environment.type}`);
    }
  }

  /**
   * Run a JavaScript/TypeScript task
   *
   * @param inputs Data to pass to the task function
   * @returns Promise with the task execution result
   * @throws Error if the function cannot be executed
   */
  private async runJsTask(inputs: any): Promise<any> {
    try {
      // Import the module (will work for both JS and TS when TS is transpiled)
      const moduleImport = await import(this.filepath);

      // Check if the specified function exists
      if (typeof moduleImport[this.main] !== 'function') {
        throw new Error(`Function '${this.main}' not found in module '${this.filepath}'`);
      }

      // Execute the function
      return await moduleImport[this.main](inputs);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error executing task '${this.name}': ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Run a Python task using child_process
   *
   * @param inputs Data to pass to the task function
   * @returns Promise with the task execution result
   * @throws Error if the function cannot be executed
   */
  private async runPythonTask(inputs: any): Promise<any> {
    const { exec } = await import('node:child_process');

    return new Promise((resolve, reject) => {
      // Create a temporary file to store the inputs
      const tempInputFile = path.join(path.dirname(this.filepath), `temp_input_${this.id}.json`);

      // Create a temporary file to store the outputs
      const tempOutputFile = path.join(path.dirname(this.filepath), `temp_output_${this.id}.json`);

      try {
        // Write inputs to the temporary file
        fs.writeFileSync(tempInputFile, JSON.stringify(inputs));

        // Build the Python command to execute the function
        const pythonCommand = `python -c "
import json
import importlib.util
import sys
import os

# Load input
with open('${tempInputFile.replace(/\\/g, '\\\\')}', 'r') as f:
    inputs = json.load(f)

# Import the module
spec = importlib.util.spec_from_file_location('module', '${this.filepath.replace(/\\/g, '\\\\')}')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Check if function exists
if not hasattr(module, '${this.main}'):
    sys.stderr.write('Function \\'${this.main}\\' not found in module')
    sys.exit(1)

# Execute function
result = module.${this.main}(inputs)

# Write result to output file
with open('${tempOutputFile.replace(/\\/g, '\\\\')}', 'w') as f:
    json.dump(result, f)
"`;

        // Execute the Python command
        exec(pythonCommand, (error, stdout, stderr) => {
          try {
            // Clean up the temporary input file
            if (fs.existsSync(tempInputFile)) {
              fs.unlinkSync(tempInputFile);
            }

            if (error) {
              reject(new Error(`Error executing Python task: ${stderr || error.message}`));
              return;
            }

            if (stderr) {
              reject(new Error(`Error in Python task: ${stderr}`));
              return;
            }

            // Check if output file exists
            if (!fs.existsSync(tempOutputFile)) {
              reject(new Error('Python task did not produce an output file'));
              return;
            }

            // Read and parse the output
            const output = JSON.parse(fs.readFileSync(tempOutputFile, 'utf8'));

            // Clean up the temporary output file
            fs.unlinkSync(tempOutputFile);

            resolve(output);
          } catch (cleanupError: any) {
            reject(new Error(`Error processing Python task results: ${cleanupError.message}`));
          }
        });
      } catch (error: any) {
        // Clean up temporary files if they exist
        if (fs.existsSync(tempInputFile)) {
          fs.unlinkSync(tempInputFile);
        }
        if (fs.existsSync(tempOutputFile)) {
          fs.unlinkSync(tempOutputFile);
        }

        reject(new Error(`Error setting up Python task: ${error.message}`));
      }
    });
  }
}
