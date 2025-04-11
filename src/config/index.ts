/**
 * Configuration options for the Chainos SDK
 */
export interface ChainosConfig {
  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Base URL for the Chainos API
   * @default "https://api.chainos.io/v1"
   */
  baseUrl: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
}

/**
 * Default configuration for the Chainos SDK
 */
export const defaultConfig: ChainosConfig = {
  baseUrl: 'https://api.chainos.io/v1',
  timeout: 30000,
};
