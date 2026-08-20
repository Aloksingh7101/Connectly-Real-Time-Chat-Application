const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_jwt_secret_for_ci';
process.env.MONGO_URI = 'placeholder'; // overwritten below before any model is used
process.env.NODE_ENV = 'test';

let mongoServer;

// Runs once before all test files: starts an isolated in-memory Mongo
// instance so tests never touch a real database and can run in CI
// without any external service.
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections between tests so each test starts from a clean slate.
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
