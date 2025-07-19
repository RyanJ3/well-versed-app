# System Architecture - Well Versed

## Overview

Well Versed follows a modern three-tier architecture with clear separation of concerns between the presentation layer (Angular), application layer (FastAPI), and data layer (PostgreSQL).

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Angular)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Components  │  │   Services   │  │     Models       │    │
│  │             │  │              │  │                  │    │
│  │ - Pages     │  │ - UserService│  │ - User           │    │
│  │ - Navigation│  │ - VerseService│ │ - Verse          │    │
│  │ - Cards     │  │ - DeckService│  │ - Deck           │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┴────────────────────────────────┐
│                      Backend (FastAPI)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Routers   │  │   Services   │  │    Database      │    │
│  │             │  │              │  │                  │    │
│  │ - users     │  │ - API.Bible  │  │ - Connection     │    │
│  │ - verses    │  │ - ESV API    │  │ - Pool           │    │
│  │ - decks     │  │              │  │ - Transactions   │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ SQL
┌────────────────────────────┴────────────────────────────────┐
│                    Database (PostgreSQL)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Schema: wellversed01dev                             │    │
│  │ - Core tables (users, verses)                       │    │
│  │ - Feature tables (decks, courses)                   │    │
│  │ - Indexes and triggers                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: Angular 19 with standalone components
- **Language**: TypeScript 5.6
- **Styling**: SCSS with modern glassmorphism design
- **Build**: Vite-based Angular CLI
- **State Management**: RxJS Observables

### Project Structure
```
frontend/src/app/
├── core/                    # Core functionality
│   ├── models/             # TypeScript interfaces
│   │   ├── user.ts
│   │   ├── verse.ts
│   │   └── deck.ts
│   └── services/           # API communication
│       ├── user.service.ts
│       ├── verse.service.ts
│       └── deck.service.ts
├── shared/                  # Shared components
│   └── components/
│       └── navigation/
└── features/               # Feature modules
    ├── tracker/           # Bible tracker
    ├── flow/              # FLOW method
    ├── decks/             # Flashcards
    └── courses/           # Learning paths
```

### Key Design Patterns

#### 1. Standalone Components
```typescript
@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html'
})
```

#### 2. Service Layer Pattern
All API calls go through dedicated services:
```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/users';
  
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
}
```

#### 3. Reactive Programming
Uses RxJS for state management:
```typescript
currentUser$ = new BehaviorSubject<User | null>(null);
verses$ = this.verseService.getUserVerses(userId);
```

### Routing Strategy
- Lazy loading for feature modules
- Route guards for protected pages (to be implemented)
- Deep linking support for sharing

### API Integration
- Proxy configuration for development (`proxy.conf.json`)
- Environment-based API URLs
- Interceptors for error handling (to be implemented)

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI (async Python web framework)
- **Language**: Python 3.11
- **Database**: PostgreSQL with psycopg2
- **API Docs**: Auto-generated OpenAPI/Swagger
- **External APIs**: API.Bible, ESV API

### Project Structure
```
backend/
├── main.py                 # Application entry point
├── config.py              # Configuration management
├── database.py            # Database connection
├── db_pool.py            # Connection pooling
├── routers/              # API endpoints
│   ├── users.py          # User management
│   ├── user_verses.py    # Verse tracking
│   ├── decks.py          # Flashcard decks
│   ├── courses.py        # Course system
│   ├── atlas.py          # Biblical journeys
│   └── feature_requests.py
└── services/             # External services
    ├── api_bible.py      # API.Bible integration
    └── esv_api.py        # ESV API integration
```

### Key Design Patterns

#### 1. Router Pattern
Modular endpoint organization:
```python
router = APIRouter()

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: DatabaseConnection = Depends(get_db)):
    # Implementation
```

#### 2. Dependency Injection
Database connections via FastAPI's DI:
```python
def get_db():
    return DatabaseConnection(db_pool.db_pool)

async def endpoint(db: DatabaseConnection = Depends(get_db)):
    # Use db connection
```

#### 3. Service Layer
External API calls abstracted:
```python
class APIBibleService:
    def get_verse_text(self, verse_code: str) -> str:
        # API interaction logic
```

### Database Connection Management
- Connection pooling with configurable size
- Context managers for automatic cleanup
- Transaction support with rollback

### API Design Principles
- RESTful resource naming
- Consistent response formats
- Proper HTTP status codes
- Comprehensive error messages

## Database Architecture

### Design Principles
1. **Normalization**: 3NF for data integrity
2. **Performance**: Strategic denormalization where needed
3. **Scalability**: Indexes on common query patterns
4. **Integrity**: Foreign key constraints

### Key Design Decisions

#### Verse Reference System
- Verses use numeric codes: `{book_id}-{chapter}-{verse}`
- Enables efficient queries and sorting
- Human-readable while being machine-friendly

#### Flexible Card System
- Cards can contain single or multiple verses
- Verse order preserved in `card_verses` table
- Supports various memorization styles

#### Progress Tracking
- Separate tables for practice count and confidence
- Enables different tracking algorithms
- Historical data preservation

### Performance Optimizations
1. **Indexes**: On foreign keys and common WHERE clauses
2. **Batch Operations**: For verse imports and updates
3. **Connection Pooling**: Reuse database connections
4. **Prepared Statements**: Prevent SQL injection

## External Integrations

### API.Bible Integration
```
Client → Backend → API.Bible → Backend → Client
         ↓                      ↑
         Cache ← ← ← ← ← ← ← ← ↓
```

**Features**:
- Batch verse fetching
- Smart caching strategy
- Rate limit handling
- Multiple translation support

### ESV API Integration
- User-specific tokens
- In-memory caching with limits
- Rate limit tracking
- Fallback to API.Bible

## Security Considerations

### Current Implementation
1. **CORS Configuration**: Restricted to frontend URL
2. **SQL Injection Prevention**: Parameterized queries
3. **Environment Variables**: Sensitive data isolation
4. **API Key Management**: User-specific for ESV

### Future Enhancements
1. **Authentication**: JWT-based auth system
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Per-user API limits
4. **Encryption**: Sensitive data at rest

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: Static files on CDN
- **Backend**: Multiple FastAPI instances
- **Database**: Read replicas for queries

### Vertical Scaling
- **Database**: Larger instance for more connections
- **Caching**: Redis for session and API cache
- **Background Jobs**: Celery for async tasks

### Performance Monitoring
- API response time tracking
- Database query analysis
- Frontend performance metrics
- Error rate monitoring

## Development Workflow

### Local Development
```
Docker Compose
├── PostgreSQL (port 5432)
├── Backend (port 8000)
└── Frontend (port 4200)
```

### Code Organization
1. **Feature-based structure**: Related code together
2. **Shared components**: Reusable UI elements
3. **Service layer**: Business logic separation
4. **Type safety**: TypeScript interfaces

### Testing Strategy
- **Unit Tests**: Component and service logic
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user flows
- **Performance Tests**: Load testing

## Deployment Architecture

### Container Strategy
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["80:80"]
    
  backend:
    build: ./backend
    ports: ["8000:8000"]
    
  db:
    image: postgres:16
    volumes: ["pgdata:/var/lib/postgresql/data"]
```

### Environment Management
- Development: Docker Compose
- Staging: Kubernetes manifests
- Production: Managed services

### CI/CD Pipeline
1. **Build**: Docker images
2. **Test**: Automated test suite
3. **Deploy**: Container orchestration
4. **Monitor**: Health checks

## Future Architecture Considerations

### Microservices
- Extract verse fetching service
- Separate authentication service
- Independent scaling

### Event-Driven
- Message queue for background tasks
- WebSocket for real-time features
- Event sourcing for audit trail

### Machine Learning
- Spaced repetition algorithm
- Personalized difficulty adjustment
- Usage pattern analysis

### Mobile Applications
- React Native for cross-platform
- Offline-first architecture
- Sync engine for data

## Monitoring and Observability

### Logging
- Structured JSON logs
- Log aggregation service
- Error tracking integration

### Metrics
- API latency percentiles
- Database connection pool
- Cache hit rates
- User engagement

### Tracing
- Distributed request tracing
- Performance bottleneck identification
- User journey analysis