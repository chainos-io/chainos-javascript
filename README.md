# Chainos TypeScript SDK

A powerful TypeScript SDK for interacting with the Chainos workflow tool API.

## Installation

Install the SDK using your preferred package manager:

```bash
# Using npm
npm install chainos-sdk

# Using Yarn
yarn add chainos-sdk
```

## Quick Start

```typescript
import { ChainosClient } from 'chainos-sdk';

// Initialize the client with your API key
const client = new ChainosClient({
  apiKey: 'your-api-key',
  // Optional: Override the base URL
  // baseUrl: 'https://custom-api.chainos.io/v1'
});

// Example: List all workflows
async function listWorkflows() {
  try {
    const workflows = await client.workflows.list();
    console.log(`Found ${workflows.data.length} workflows`);
    return workflows;
  } catch (error) {
    console.error('Error listing workflows:', error.message);
  }
}

// Example: Create a new workflow
async function createWorkflow() {
  try {
    const workflow = await client.workflows.create({
      name: 'My New Workflow',
      description: 'Created with the Chainos SDK'
    });
    console.log('Created workflow:', workflow.id);
    return workflow;
  } catch (error) {
    console.error('Error creating workflow:', error.message);
  }
}
```

## API Documentation

### Authentication

The SDK requires an API key for authentication. You can obtain your API key from the Chainos dashboard.

```typescript
const client = new ChainosClient({
  apiKey: 'your-api-key'
});
```

### Error Handling

All API methods return promises that resolve with the requested data or reject with a `ChainosError` instance:

```typescript
try {
  const workflow = await client.workflows.get('non-existent-id');
} catch (error) {
  if (error.status === 404) {
    console.error('Workflow not found');
  } else {
    console.error('An error occurred:', error.message);
  }
}
```

### Workflows API

#### List workflows

```typescript
// List all workflows (paginated)
const workflows = await client.workflows.list();

// With pagination parameters
const page2 = await client.workflows.list({ page: 2, limit: 10 });
```

#### Get a workflow

```typescript
const workflow = await client.workflows.get('workflow-id');
```

#### Create a workflow

```typescript
const newWorkflow = await client.workflows.create({
  name: 'My Workflow',
  description: 'A workflow created with the SDK',
  steps: [
    {
      name: 'First Step',
      type: 'action',
      config: { /* step-specific config */ },
      position: 0
    }
  ]
});
```

#### Update a workflow

```typescript
const updatedWorkflow = await client.workflows.update('workflow-id', {
  name: 'Updated Workflow Name',
  description: 'Updated description'
});
```

#### Delete a workflow

```typescript
await client.workflows.delete('workflow-id');
```

#### Activate/Deactivate a workflow

```typescript
// Activate
const activatedWorkflow = await client.workflows.activate('workflow-id');

// Deactivate
const deactivatedWorkflow = await client.workflows.deactivate('workflow-id');
```

## Development

### Building

```bash
# Install dependencies
yarn

# Build the SDK
yarn build
```

### Testing

```bash
# Run tests
yarn test
```

## License

MIT