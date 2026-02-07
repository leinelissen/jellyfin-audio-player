# SQLite Integration Plan for Jellyfin Audio Player

## Overview
This plan outlines the implementation of SQLite database integration for the Jellyfin Audio Player to enable offline data storage, caching, and improved data management. We'll be using Drizzle ORM with @op-engineering/op-sqlite for React Native.

## Key Requirements
- **Start from scratch**: No existing SQLite code, implementing fresh
- **Live queries**: Use Gist as a shim for live query functionality
- **Driver organization**: Organize drivers under `store/sources/{jellyfin, emby}`
- **Enum handling**: Hardcode enum values in the schema
- **Data denormalization**: Denormalize JSON shapes for better performance
- **Pagination**: Rename pagination parameters to match SQLite conventions
- **Error handling**: Implement retry logic (5 attempts before failing)
- **Dependencies**: Add `drizzle-kit` and `@op-engineering/op-sqlite`

## Dependencies to Add
1. `@op-engineering/op-sqlite` - SQLite driver for React Native
2. `drizzle-orm` - TypeScript ORM
3. `drizzle-kit` - Drizzle schema management tools

# Subagent Work Breakdown

## Task 1: Install Dependencies and Setup
**Description**: Install required SQLite and Drizzle ORM packages
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- package.json

**Details**:
- Install `@op-engineering/op-sqlite`
- Install `drizzle-orm`
- Install `drizzle-kit` (dev dependency)
- Verify installation with `pnpm install`

## Task 2: Create Database Schema
**Description**: Define Drizzle schema for music library entities
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/store/database/schema.ts (new)
- src/store/database/enums.ts (new)

**Details**:
- Define tables for: albums, artists, tracks, playlists, playlist_tracks
- Hardcode enum values (e.g., MediaType, ItemType)
- Denormalize JSON shapes for performance
- Include proper indexes for queries
- Add timestamps (created_at, updated_at)

## Task 3: Setup Database Connection
**Description**: Initialize SQLite database with op-sqlite driver
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/store/database/connection.ts (new)
- src/store/database/index.ts (new)

**Details**:
- Initialize op-sqlite database
- Setup Drizzle with the connection
- Export database instance
- Add error handling with retry logic (5 attempts)
- Implement connection pooling if needed

## Task 4: Create Live Query Shim
**Description**: Implement Gist-based live query functionality
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/store/database/live-query.ts (new)
- src/store/database/hooks.ts (new)

**Details**:
- Create wrapper around Gist for live queries
- Implement React hooks for live queries
- Add subscription management
- Handle query invalidation

## Task 5: Create Data Source Drivers
**Description**: Organize API drivers for Jellyfin and Emby
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/store/sources/jellyfin/driver.ts (new)
- src/store/sources/jellyfin/types.ts (new)
- src/store/sources/jellyfin/sync.ts (new)
- src/store/sources/emby/driver.ts (new)
- src/store/sources/emby/types.ts (new)
- src/store/sources/emby/sync.ts (new)
- src/store/sources/index.ts (new)

**Details**:
- Create base driver interface
- Implement Jellyfin-specific driver
- Implement Emby-specific driver (if needed)
- Add sync logic to populate SQLite from API
- Rename pagination parameters (StartIndex → offset, Limit → limit)
- Implement error handling with retry logic

## Task 6: Create Database Repository Layer
**Description**: Create repository pattern for database operations
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/store/database/repositories/albums.ts (new)
- src/store/database/repositories/artists.ts (new)
- src/store/database/repositories/tracks.ts (new)
- src/store/database/repositories/playlists.ts (new)
- src/store/database/repositories/index.ts (new)

**Details**:
- Create CRUD operations for each entity
- Add query methods with proper filters
- Implement pagination helpers
- Add error handling

## Task 7: Integrate with Redux Store
**Description**: Connect database to existing Redux architecture
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/store/music/actions.ts (modify)
- src/store/music/types.ts (modify)
- src/store/music/selectors.ts (modify)
- src/store/index.ts (modify)

**Details**:
- Add database initialization to store setup
- Create actions for database operations
- Update selectors to use database queries
- Maintain backward compatibility

## Task 8: Add Database Migrations
**Description**: Setup migration system with drizzle-kit
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- drizzle.config.ts (new)
- src/store/database/migrations/ (new directory)

**Details**:
- Configure drizzle-kit
- Create initial migration
- Add migration runner
- Document migration process

## Task 9: Extend Onboarding
**Description**: Add database initialization to onboarding flow
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/screens/Onboarding/index.tsx (modify)

**Details**:
- Add database initialization step
- Show progress during initial sync
- Handle errors gracefully
- Add skip option for advanced users

## Task 10: Add Tests
**Description**: Create tests for database functionality
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- src/store/database/__tests__/connection.test.ts (new)
- src/store/database/__tests__/repositories.test.ts (new)
- src/store/database/__tests__/live-query.test.ts (new)
- src/store/sources/__tests__/jellyfin.test.ts (new)

**Details**:
- Test database connection
- Test CRUD operations
- Test live queries
- Test error handling and retries
- Test data synchronization

## Task 11: Documentation
**Description**: Document the SQLite integration
**Owner**: Subagent - General Purpose
**Status**: Pending
**Files**:
- docs/database.md (new)
- README.md (modify)

**Details**:
- Document database schema
- Explain synchronization process
- Add troubleshooting guide
- Update main README with database info

---

# Progress Tracker

## Summary
- **Total Tasks**: 11
- **Completed**: 0
- **In Progress**: 0
- **Pending**: 11
- **Blocked**: 0

## Task Status

### ✅ Completed Tasks
_None yet_

### 🔄 In Progress
_None yet_

### ⏳ Pending Tasks
1. [ ] Task 1: Install Dependencies and Setup
2. [ ] Task 2: Create Database Schema
3. [ ] Task 3: Setup Database Connection
4. [ ] Task 4: Create Live Query Shim
5. [ ] Task 5: Create Data Source Drivers
6. [ ] Task 6: Create Database Repository Layer
7. [ ] Task 7: Integrate with Redux Store
8. [ ] Task 8: Add Database Migrations
9. [ ] Task 9: Extend Onboarding
10. [ ] Task 10: Add Tests
11. [ ] Task 11: Documentation

### 🚫 Blocked Tasks
_None_

---

## Notes
- This is a comprehensive greenfield implementation
- All code will be written from scratch
- Focus on clean architecture and maintainability
- Ensure proper error handling throughout
- Keep Redux integration minimal to avoid breaking existing functionality
