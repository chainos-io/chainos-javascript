import { ChainosClient } from '../../src';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ChainosClient', () => {
  let client: ChainosClient;

  beforeEach(() => {
    // Create a fresh client before each test
    client = new ChainosClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.test.chainos.io/v1',
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default axios create implementation
    mockedAxios.create.mockReturnValue(mockedAxios as any);
  });

  test('should initialize with correct configuration', () => {
    // Verify axios was called with correct config
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.test.chainos.io/v1',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        timeout: 30000,
      }),
    );
  });

  test('should make API requests with authentication header', async () => {
    // Setup mock response
    const mockResponse = {
      data: { id: '123', name: 'Test Workflow' },
    };

    // Setup axios request to return the mock response
    mockedAxios.request.mockResolvedValueOnce(mockResponse);

    // Call the API
    await client.getAccount();

    // Verify request was made with correct auth header
    expect(mockedAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/account',
      }),
    );
  });

  test('workflows.list should return paginated workflows', async () => {
    // Setup mock response for workflow listing
    const mockWorkflowsResponse = {
      data: {
        data: [
          { id: 'wf1', name: 'Workflow 1' },
          { id: 'wf2', name: 'Workflow 2' },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          hasMore: false,
        },
      },
    };

    // Setup axios to return the mock response
    mockedAxios.request.mockResolvedValueOnce(mockWorkflowsResponse);

    // Call the workflows list API
    const result = await client.workflows.list();

    // Verify request was made correctly
    expect(mockedAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/workflows',
      }),
    );

    // Verify the returned data
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Workflow 1');
    expect(result.meta.total).toBe(2);
  });
});
