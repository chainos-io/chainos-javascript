import axios, { type AxiosInstance } from 'axios';
import { type ChainosConfig, defaultConfig } from '../config';
import { ChainosError } from '../utils/errors';

/**
 * The main client for interacting with the Chainos API
 */
export class ChainosClient {
  private readonly apiClient: AxiosInstance;
  private readonly config: ChainosConfig;

  /**
   * API methods for working with workflows
   */

  /**
   * Create a new ChainosClient instance
   *
   * @param config Configuration for the Chainos client
   */
  constructor(config: Partial<ChainosConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    this.apiClient = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'chainos-sdk-js/0.1.0',
      },
      timeout: this.config.timeout || 30000,
    });

    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use(async (config) => {
      if (this.config.apiKey) {
        config.headers.Authorization = `Bearer ${this.config.apiKey}`;
      }
      return config;
    });

    // Initialize API resources
  }

  /**
   * Make a request to the Chainos API
   *
   * @param method HTTP method
   * @param path API path
   * @param data Request data (for POST, PUT, PATCH)
   * @param params Query parameters
   * @returns Promise with the response data
   */
  async request<T>(method: string, path: string, data?: any, params?: any): Promise<T> {
    try {
      const response = await this.apiClient.request<T>({
        method,
        url: path,
        data,
        params,
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new ChainosError(
          `API Error: ${error.response.status} ${error.response.statusText}`,
          error.response.status,
          error.response.data,
        );
      }

      throw new ChainosError(`Network Error: ${error.message}`, 0, null);
    }
  }

  /**
   * Get account information
   *
   * @returns Promise with account information
   */
  async getAccount() {
    return this.request<any>('GET', '/account', undefined);
  }

  // Additional API methods will be implemented here
}
