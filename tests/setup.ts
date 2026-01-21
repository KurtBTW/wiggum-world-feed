// Jest test setup
import 'dotenv/config';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./prisma/test.db';

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
};
