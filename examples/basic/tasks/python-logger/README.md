# Python Logger Task

A simple Python task that logs input data to the console in pink color using the Loguru library.

## Features

- Custom pink-colored logging output using Loguru's SUCCESS level
- Detailed logging of input data and context
- Simple implementation with Loguru for better logging management
- Compatible with the Chainos workflow system

## Installation

This task requires the Loguru package:

```bash
# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

This task is designed to be used within a Chainos workflow but can also be used standalone:

```python
from python_logger import log_data

# Sample input data
input_data = {
    "message": "Hello pink logger!",
    "data": {
        "value": 42,
        "items": ["apple", "banana", "cherry"]
    }
}

# Log the data
result = log_data(input_data)
print(result)
```

## Input Format

The task accepts any JSON-serializable data structure. For example:

```json
{
  "message": "Log message",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

## Output Format

The task produces output in the following format:

```json
{
  "success": true,
  "message": "Data logged successfully in pink!",
  "input_logged": { /* original input data */ },
  "metadata": {
    "execution_time_ms": 204,
    "logger": "loguru_pink_logger"
  },
  "timestamp": "2025-04-11T15:42:23.456Z",
  "log_id": "log_1712345678"
}
```

## How it Works

The task uses Loguru's customizable logging capabilities to output log messages in pink using the SUCCESS log level. The logger captures all input data and formats it nicely for viewing in the console.