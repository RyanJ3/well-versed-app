# Well Versed Application Tests

## Structure

```
tests/
├── backend/              # Backend Python tests
│   ├── auth/            # Authentication tests
│   └── ...              # Other unit tests
└── frontend/            # Frontend Angular tests (when added)
```

## Running Tests

```bash
npm test                  # Run all backend tests
npm run test:backend      # Run all backend tests (verbose)
npm run test:auth         # Run authentication tests only
npm run test:coverage     # Run with coverage report
npm run test:all          # Run both backend and frontend tests
npm run test:frontend     # Run Angular tests
```

## Test Configuration

- **pytest.ini**: Python test configuration
- **package.json**: NPM scripts for running tests

## Current Tests

### Authentication Tests (`/tests/backend/auth/`)
- Test SimpleLocalAuth implementation
- Cover login, logout, tokens, blacklisting
- 11 tests passing

### Query Optimization Tests (`/tests/backend/`)
- Test N+1 query prevention
- Verify batch loading utilities
- 5 tests passing

## Test Status

✅ **All Tests Passing**: 16 tests
✅ **No Warnings**: Clean test output
✅ **No Skipped/Deselected Tests**: Only active tests included