# Incremental Build Plan

## Overview
Building out features incrementally from `feature/complete-test-suite-changes` branch, with improvements.

## Reference Command
```bash
# View differences
git diff main..feature/complete-test-suite-changes --name-status

# View specific file from feature branch
git show feature/complete-test-suite-changes:path/to/file
```

## Progress Tracking

### Phase 1: Basic Authentication ✅
- [x] `backend/infrastructure/auth/__init__.py`
- [x] `backend/infrastructure/auth/cognito_config.py` (simplified version)
- [x] `backend/api/auth_routes.py`
- [x] `backend/main.py` (auth integration)
- [x] `frontend/src/app/services/auth/auth.service.ts`
- [x] `frontend/src/app/guards/auth.guard.ts`
- [x] `frontend/src/app/pages/login/*`
- [x] Update routes with auth

### Phase 2: Enhanced Authentication Components
**From feature branch, still needed:**
- [ ] `backend/infrastructure/auth/cognito_service.py` - Full Cognito integration
- [ ] `backend/infrastructure/audit_logger.py` - Audit logging
- [ ] `backend/infrastructure/token_blacklist.py` - Token invalidation
- [ ] `backend/middleware/auth_middleware.py` - Request authentication
- [ ] `backend/middleware/rate_limit.py` - Rate limiting (WITH SECURITY FIX)
- [ ] `.env.example` - Environment template
- [ ] Frontend interceptor for auth headers

### Phase 3: Test Suite Infrastructure
- [ ] `tests/` directory structure
- [ ] `tests/backend/conftest.py` - Pytest configuration
- [ ] `tests/backend/test_auth.py` - Auth unit tests
- [ ] `tests/backend/test_api.py` - API tests
- [ ] `tests/integration/test_auth_integration.py` - Integration tests
- [ ] `tests/security/test_security.py` - Security tests
- [ ] `tests/Makefile` - Test orchestration
- [ ] `tests/requirements.txt` - Test dependencies

### Phase 4: Test Migration
- [ ] Migrate `test_auth_me.sh` → integration tests
- [ ] Migrate `test_rate_limit.sh` → integration tests
- [ ] Migrate `test_secure_auth.sh` → integration tests
- [ ] Migrate `test_browser_login.sh` → E2E tests
- [ ] Migrate `test_clean_login.html` → E2E tests
- [ ] Remove old test files

### Phase 5: NPM Test Integration
- [ ] `package.json` - Root package with test scripts
- [ ] `scripts/npm-test.sh` - Test runner script
- [ ] `run-tests.js` - Node test runner
- [ ] Update npm scripts

### Phase 6: Security & Quality
- [ ] `backend/.bandit` - Security scanning config
- [ ] Fix MD5 vulnerability in rate_limit.py
- [ ] Add security headers
- [ ] Configure CORS properly

### Phase 7: CI/CD
- [ ] `.github/workflows/test.yml` - GitHub Actions
- [ ] `.githooks/pre-push` - Git hooks
- [ ] Docker compose improvements

### Phase 8: Documentation & Organization
- [ ] Move docs to `/docs`
- [ ] Move scripts to `/scripts`
- [ ] Update README.md
- [ ] Create comprehensive docs

## Key Improvements to Make

1. **Rate Limiting Fix**: Add `usedforsecurity=False` to MD5 usage
2. **Test Organization**: Better structure than shell scripts
3. **Documentation**: Explain each component's purpose
4. **Environment Variables**: Clear `.env.example` file
5. **Error Handling**: Better error messages

## Commands for Each Phase

### View what's in feature branch:
```bash
# See specific file
git show feature/complete-test-suite-changes:backend/middleware/rate_limit.py

# Compare implementations
git diff main..feature/complete-test-suite-changes backend/middleware/rate_limit.py
```

### Test after each phase:
```bash
# Backend
cd backend && ./venv/bin/python -m pytest

# Frontend  
cd frontend && npm test

# Full suite (after Phase 5)
npm test
```

## Questions to Answer Per Component

For each file we add:
1. What problem does this solve?
2. How does it integrate with existing code?
3. Are there any security concerns?
4. Can we simplify or improve it?
5. Is it necessary for the current phase?

## Current Status
- **Completed**: Phase 1 (Basic Auth)
- **Current**: Ready to start Phase 2
- **Next Decision**: Which enhanced auth component to add first?