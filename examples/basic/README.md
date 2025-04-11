# Chainos Cross-Language Workflow Example

This example demonstrates how to build a cross-language workflow using the Chainos JavaScript SDK. The workflow showcases integration between JavaScript, TypeScript, and Python tasks, demonstrating the flexibility of the Chainos system.

## Overview

This example creates a multi-step workflow that:

1. Processes data with a JavaScript task
2. Logs output with both Python and TypeScript loggers
3. Uses custom preprocessing and postprocessing functions
4. Demonstrates task chaining with different programming languages

## Project Structure

```
examples/basic/
├── index.ts               # Main example code
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── tasks/                 # Task implementations
│   ├── data-processor/    # JavaScript data processor
│   ├── python-logger/     # Python logger (pink output)
│   └── typescript-logger/ # TypeScript logger (yellow output)
└── .chainos/              # Generated function files (created at runtime)
```

## Tasks Overview

1. **Data Processor** (JavaScript)
   - Validates and processes numeric data
   - Calculates statistics like mean, median, standard deviation
   - Normalizes and transforms data

2. **Python Logger** (Python with Loguru)
   - Logs input data with vibrant pink formatting
   - Provides execution metrics and timestamps

3. **TypeScript Logger** (TypeScript with Chalk)
   - Logs input data with yellow formatting
   - Includes simple metadata about the logged information

## Chain Structure

The example creates a workflow with the following visual structure:

```
┌─────────────────────────────────────────────────────────┐
│                  data-processing-step                   │
│                                                         │
│ Task: data-processor                                    │
│                                                         │
│ preprocessing:                                          │
│ data-validator                                          │
└───────────┬─────────────────────┬───────────────────────┘
            │                     │                       │
            ▼                     ▼                       │
┌───────────────────┐ ┌───────────────────────┐           │
│   python-logger   │ │   typescript-logger-1 │           │
│                   │ │                       │           │
│ Task: python-     │ │ Task: typescript-     │           │
│ logger            │ │ logger                │           │
└───────────────────┘ │                       │           │
                      │ postprocessing:       │           │
                      │ format result         │           │
                      └──────────┬────────────┘           │
                                 │                        │
                                 ▼                        ▼
                      ┌───────────────────────────────────┐
                      │        typescript-logger-2        │
                      │                                   │
                      │ Task: typescript-logger           │
                      │                                   │
                      │ preprocessing:                    │
                      │ combine inputs from               │
                      │ data-processing-step              │
                      │ and typescript-logger-1           │
                      └───────────────────────────────────┘                           
```

## Features Demonstrated

- Cross-language task execution
- Workflow branching with multiple targets
- Custom preprocessing and postprocessing
- Materialization of anonymous functions into executable tasks
- Resource allocation (CPU and memory)
- Environment detection for different programming languages

## Running the Example

```bash
# Install dependencies
yarn install

# Run the example
yarn start
```

## Expected Output

The example will:

1. Create and configure tasks
2. Build a workflow chain
3. Materialize any anonymous functions
4. Compile and display the chain structure as JSON

## Requirements

- Node.js 14+
- Python 3.6+ (for Python logger)
- Required packages:
  - JavaScript: lodash, winston
  - Python: loguru
  - TypeScript: chalk