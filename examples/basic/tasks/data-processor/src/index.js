/**
 * Data Processor Task for Chainos Workflow
 *
 * This module handles data processing operations including:
 * - Data validation
 * - Transformation
 * - Statistical calculations
 * - Filtering
 */
const _ = require('lodash');
const winston = require('winston');
const { SoftError, FatalError } = require('../../../../../src');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

/**
 * Validates input data against expected schema
 *
 * @param {Object} data - Input data to validate
 * @returns {Object} Validation result with success flag and errors if any
 * @throws {FatalError} If critical validation fails
 * @throws {SoftError} If non-critical validation issues are found
 */
function validateData(data, chain) {
  logger.info('Validating input data', { dataType: typeof data });

  // Check if data is present
  if (!data) {
    throw new FatalError('No data provided');
  }

  // Check if data is an array or contains a data array
  const dataArray = Array.isArray(data) ? data : data.data;

  if (!dataArray || !Array.isArray(dataArray)) {
    throw new FatalError('Data must be an array or contain a data array property');
  }

  const res = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  // Check if data array has elements
  if (dataArray.length === 0) {
    // This is a soft error - we can continue with empty data but should notify
    throw new SoftError('Data array is empty', res);
  }

  // Return valid data with timestamp
  return res;
}

/**
 * Transforms data by applying filtering and calculations
 *
 * @param {Array} data - Array of numeric values to transform
 * @returns {Object} Transformed data with statistics
 */
function transformData(data) {
  logger.info('Transforming data', { dataLength: data.length });

  // Filter out non-numeric values
  const numericData = data.filter((item) => typeof item === 'number' && !Number.isNaN(item));

  if (numericData.length === 0) {
    logger.warn('No numeric data found after filtering');
    return {
      original: data,
      filtered: [],
      stats: {
        count: 0,
        sum: 0,
        mean: 0,
        min: null,
        max: null,
      },
    };
  }

  // Calculate statistics
  const stats = {
    count: numericData.length,
    sum: _.sum(numericData),
    mean: _.mean(numericData),
    min: _.min(numericData),
    max: _.max(numericData),
    median: _.sortBy(numericData)[Math.floor(numericData.length / 2)],
    standardDeviation: calculateStandardDeviation(numericData),
  };

  // Create transformed data with additional derived values
  const transformed = numericData.map((value) => ({
    original: value,
    squared: value ** 2,
    normalized: (value - stats.min) / (stats.max - stats.min),
  }));

  return {
    original: data,
    filtered: numericData,
    transformed,
    stats,
  };
}

/**
 * Calculates standard deviation for a set of numbers
 *
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} Standard deviation
 */
function calculateStandardDeviation(values) {
  const mean = _.mean(values);
  const squareDiffs = values.map((value) => (value - mean) ** 2);
  const variance = _.mean(squareDiffs);
  return Math.sqrt(variance);
}

/**
 * Main entry point for the data processor task
 *
 * @param {Object} input - Input data from the workflow (assumed to be already validated)
 * @returns {Object} Processed data with statistics and metadata
 */
function processData(input) {
  logger.info('Data processor task started', { timestamp: new Date().toISOString() });

  try {
    const startTime = Date.now();

    // Process the data
    const result = transformData(input.data);

    const executionTime = Date.now() - startTime;

    logger.info('Data preprocessing complete', {
      executionTimeMs: executionTime,
      recordsProcessed: dataArray.length,
    });

    return {
      success: true,
      processed: result,
      metadata: {
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
        recordsProcessed: dataArray.length,
        processorVersion: '1.0.0',
      },
    };
  } catch (error) {
    logger.error('Error processing data', { error: error.message, stack: error.stack });

    throw new FatalError('Data processing failed', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export the main function and helper functions for testing
module.exports = {
  processData,
  validateData,
  transformData,
  calculateStandardDeviation,
};
