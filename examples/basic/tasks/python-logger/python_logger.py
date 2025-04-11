#!/usr/bin/env python3
"""
Python Logger Task for Chainos Workflow

A simple task that logs input data to the console in pink color using Loguru.
"""
import json
import time
from datetime import datetime
import sys
from loguru import logger # type: ignore

# Configure Loguru logger
# Remove default handler
logger.remove()

# Add custom handler with pink color for SUCCESS level
# In Loguru, you can customize colors with markup tags
logger.level("SUCCESS", color="<magenta>")
logger.add(
    sys.stdout,
    format="<magenta>{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {message}</magenta>",
    level="INFO",
    colorize=True
)

def log_data(input_data, context=None):
    """
    Main entry point for the Python logger task
    
    Args:
        input_data: Input data from the workflow
        context: Workflow context information (optional)
        
    Returns:
        Dict containing logging results
    """
    logger.info("Python logger task started")
    
    start_time = time.time()
    
    # Generate a request ID
    request_id = f"log_{int(time.time())}"
    
    # Log the input data prettily using logger.success for pink output
    logger.success(f"=== Log Entry: {request_id} ===")
    logger.success(f"Input data: {json.dumps(input_data, indent=2)}")
    
    if context:
        logger.success(f"Context: {json.dumps(context, indent=2)}")
    
    # Add a small delay to make the logging visible
    time.sleep(0.2)
    
    # Build a response
    execution_time = time.time() - start_time
    
    response = {
        "success": True,
        "message": "Data logged successfully in pink!",
        "input_logged": input_data,
        "metadata": {
            "execution_time_ms": round(execution_time * 1000),
            "logger": "loguru_pink_logger"
        },
        "timestamp": datetime.now().isoformat(),
        "log_id": request_id
    }
    
    logger.success(f"Python logger task completed in {execution_time:.2f}s")
    
    return response

# For testing purposes
if __name__ == "__main__":
    # Example input data
    test_input = {
        "message": "This is a test log message",
        "data": {
            "value": 42,
            "status": "completed",
            "items": ["apple", "banana", "cherry"]
        }
    }
    
    # Test the logger
    result = log_data(test_input)
    print("\nResult object:")
    print(json.dumps(result, indent=2))