// const { CosmosClient } = require('@azure/cosmos');
// require('dotenv').config();

// // Cosmos DB configuration
// const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
// const cosmosKey = process.env.COSMOS_KEY;
// const databaseId = 'UserActivityDB';
// const containerId = 'Activities';

// if (!cosmosEndpoint || !cosmosKey) {
//     throw new Error('Environment variables COSMOS_ENDPOINT and COSMOS_KEY must be set.');
// }

// const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });

// async function ensureDatabaseAndContainer() {
//     const { database } = await cosmosClient.databases.createIfNotExists({ id: databaseId });
//     console.log(`Database '${database.id}' ready`);

//     const { container } = await database.containers.createIfNotExists({ id: containerId });
//     console.log(`Container '${container.id}' ready`);
// }

// async function logActivity(activity) {
//     const database = cosmosClient.database(databaseId);
//     const container = database.container(containerId);
//     const { resource } = await container.items.create(activity);
//     console.log('Activity logged:', resource);
//     return resource;
// }

// module.exports = {
//     ensureDatabaseAndContainer,
//     logActivity,
// };
