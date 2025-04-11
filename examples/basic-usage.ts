/**
 * Example usage of the Chainos SDK
 */
import { ChainosClient } from '../src';

// Create a new client instance with your API key
const client = new ChainosClient({
  apiKey: 'your-api-key-here',
});

/**
 * Example: List all workflows
 */
async function listWorkflows() {
  try {
    const workflows = await client.workflows.list();
    console.log('Found', workflows.data.length, 'workflows');
    console.log('Workflows:', workflows.data.map((w) => w.name).join(', '));
    return workflows;
  } catch (error) {
    console.error('Error listing workflows:', error.message);
    throw error;
  }
}

/**
 * Example: Create a new workflow
 */
async function createWorkflow() {
  try {
    const newWorkflow = await client.workflows.create({
      name: 'Example Workflow',
      description: 'Created via Chainos SDK example',
      steps: [
        {
          name: 'First Step',
          type: 'action',
          config: {
            // Step-specific configuration
          },
          position: 0,
        },
      ],
    });

    console.log('Created new workflow:', newWorkflow.name, 'with ID:', newWorkflow.id);
    return newWorkflow;
  } catch (error) {
    console.error('Error creating workflow:', error.message);
    throw error;
  }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('Running Chainos SDK example...');

  // List existing workflows
  const workflows = await listWorkflows();

  // Create a new workflow if there are fewer than 5
  if (workflows.data.length < 5) {
    await createWorkflow();
  }

  console.log('Example completed successfully!');
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample().catch((err) => {
    console.error('Example failed:', err);
    process.exit(1);
  });
}
