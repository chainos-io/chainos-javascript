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

  /**
   * CPU allocation for the task in increments of 0.25 (minimum: 0.25)
   */
  cpu?: number;

  /**
   * Memory allocation for the task in format like "512mb", "2gb", or "1tb"
   * Operates in increments of 256mb
   */
  memory?: string;
}

/**
 * Represents a Task that can be added to a Chain
 */
export class Task {
  /**
   * Unique identifier for the task
   */
  private _id: string;

  /**
   * Display name of the task
   */
  private _name: string;

  /**
   * Filepath of the task implementation
   */
  private _filepath: string;

  /**
   * Main function or entry point for the task
   */
  private _main: string;

  /**
   * Environment information for the task
   */
  private _environment: EnvironmentConfig;

  /**
   * CPU allocation for the task (in increments of 0.25, minimum 0.25)
   */
  private _cpu: number;

  /**
   * Memory allocation for the task (in format like "512mb" or "2gb")
   */
  private _memory: string;

  /**
   * Create a new Task
   *
   * @param filepath Filepath of the task implementation
   * @param options Optional configuration for the task
   * @param options.displayName Display name for the task (defaults to filepath)
   * @param options.entryFunctionName Entry function name (defaults to "main")
   * @param options.cpu CPU allocation in increments of 0.25 (minimum: 0.25)
   * @param options.memory Memory allocation in format like "512mb" or "2gb"
   */
  constructor(id: string, filepath: string, options: TaskOptions = {}) {
    this._id = id;
    this._filepath = filepath;
    this._name = options.displayName || filepath;
    this._main = options.entryFunctionName || 'main';
    this._environment = this.detectEnvironment();

    // Validate and set CPU
    if (options.cpu !== undefined) {
      // Ensure CPU is at least 0.25 and in increments of 0.25
      const normalizedCpu = Math.max(0.25, Math.ceil(options.cpu * 4) / 4);
      this._cpu = normalizedCpu;
    } else {
      this._cpu = 0.25; // Default to minimum
    }

    // Validate and set memory
    if (options.memory !== undefined) {
      this._memory = this.normalizeMemory(options.memory);
    } else {
      this._memory = '1gb'; // Default value
    }
  }

  /**
   * Get the task's ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the task's display name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the task's filepath
   */
  get filepath(): string {
    return this._filepath;
  }

  /**
   * Get the task's main function name
   */
  get main(): string {
    return this._main;
  }

  /**
   * Get the task's environment configuration
   */
  get environment(): EnvironmentConfig {
    return this._environment;
  }

  /**
   * Get the task's CPU allocation
   */
  get cpu(): number {
    return this._cpu;
  }

  /**
   * Get the task's memory allocation
   */
  get memory(): string {
    return this._memory;
  }

  /**
   * Normalize memory string to ensure it follows the correct format
   * and uses increments of 256MB
   *
   * @param memory Memory string (e.g., "512mb", "2gb", "1tb")
   * @returns Normalized memory string
   */
  private normalizeMemory(memory: string): string {
    // Convert to lowercase for consistent parsing
    const lowerMemory = memory.toLowerCase();

    // Extract value and unit
    const match = lowerMemory.match(/^(\d+(\.\d+)?)([mgt]b)$/);
    if (!match) {
      return '256mb'; // Default if format is invalid
    }

    const value = Number.parseFloat(match[1]);
    const unit = match[3];

    // Convert to MB for normalization
    let valueInMb: number;
    if (unit === 'tb') {
      valueInMb = value * 1024 * 1024; // TB to MB
    } else if (unit === 'gb') {
      valueInMb = value * 1024; // GB to MB
    } else {
      valueInMb = value; // Already in MB
    }

    // Normalize to increments of 256MB
    const normalizedMb = Math.max(256, Math.ceil(valueInMb / 256) * 256);

    return `${normalizedMb}mb`;
  }

  /**
   * Detect the environment configuration based on the task's filepath
   *
   * @returns The detected environment configuration
   */
  private detectEnvironment(): EnvironmentConfig {
    const dirPath = path.dirname(this._filepath);
    const extension = path.extname(this._filepath).toLowerCase();

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
    return this._environment.type;
  }

  /**
   * Get the environment configuration file path
   *
   * @returns The path to the environment configuration file
   */
  getConfigPath(): string | undefined {
    return this._environment.configPath;
  }

  /**
   * Get the parsed environment configuration
   *
   * @returns The environment configuration data
   */
  getConfig(): any {
    return this._environment.config;
  }
}
