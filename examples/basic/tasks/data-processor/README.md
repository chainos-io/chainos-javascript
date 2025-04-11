# Data Processor Task

A JavaScript-based data processing component for Chainos workflows.

## Features

- Data validation and sanitization
- Statistical calculations (mean, median, standard deviation)
- Filtering and normalization of numeric data
- Comprehensive error handling and logging

## Installation

```bash
# Install dependencies
npm install
```

## Usage

This task is designed to be used within a Chainos workflow but can also be used standalone:

```javascript
const { processData } = require('./src/index');

// Sample input data
const input = {
  data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
};

// Process the data
const result = processData(input);
console.log(JSON.stringify(result, null, 2));
```

## Input Format

The task accepts data in the following formats:

1. An array of numeric values:
   ```json
   [1, 2, 3, 4, 5]
   ```

2. An object with a `data` property containing an array:
   ```json
   {
     "data": [1, 2, 3, 4, 5],
     "metadata": {
       "source": "sensor-123",
       "timestamp": "2025-04-11T10:30:00Z"
     }
   }
   ```

## Output Format

The task produces output in the following format:

```json
{
  "success": true,
  "processed": {
    "original": [1, 2, 3, 4, 5],
    "filtered": [1, 2, 3, 4, 5],
    "transformed": [
      {"original": 1, "squared": 1, "normalized": 0},
      {"original": 2, "squared": 4, "normalized": 0.25},
      {"original": 3, "squared": 9, "normalized": 0.5},
      {"original": 4, "squared": 16, "normalized": 0.75},
      {"original": 5, "squared": 25, "normalized": 1}
    ],
    "stats": {
      "count": 5,
      "sum": 15,
      "mean": 3,
      "min": 1,
      "max": 5,
      "median": 3,
      "standardDeviation": 1.4142
    }
  },
  "metadata": {
    "executionTimeMs": 2,
    "timestamp": "2025-04-11T10:30:01Z",
    "recordsProcessed": 5,
    "processorVersion": "1.0.0"
  }
}
```

## Dependencies

- lodash: ^4.17.21 - Utility library for data manipulation
- winston: ^3.11.0 - Logging library