# QueryZen : TypeScript SQL Query Builder

![npm](https://img.shields.io/npm/v/@devscast/queryzen?style=flat-square)
![npm](https://img.shields.io/npm/dt/@devscast/queryzen?style=flat-square)
[![Lint](https://github.com/devscast/queryzen-ts/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/devscast/queryzen-ts/actions/workflows/lint.yml)
[![Tests](https://github.com/devscast/queryzen-ts/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/devscast/queryzen-ts/actions/workflows/test.yml)
![GitHub](https://img.shields.io/github/license/devscast/queryzen-ts?style=flat-square)

---

## Overview
While several SQL query builders (including ORM-based ones) already exist in the TypeScript ecosystem, many of them require a live database connection and a data retrieval layer to function. This approach is often ideal for greenfield applications but can become a constraint when integrating into legacy systems or during incremental migrations.

This library is designed with a single responsibility: to generate MySQL queries as plain SQL strings in a predictable, testable, and fully programmatic manner—without requiring a database connection or execution context. Query generation is its only concern; data retrieval, execution, and schema validation are left to the user.

## Motivation
The goal is to simplify and encourage safe query reuse—especially in contexts where introducing a full ORM or runtime dependency is overkill or impractical.

Projects like [sql-bricks](https://www.npmjs.com/package/sql-bricks) and [mysql-bricks](https://www.npmjs.com/package/mysql-bricks) previously served this purpose well, but they are now unmaintained. This library aims to serve as a modern, actively supported alternative, while following the same core principle: build composable SQL statements as strings.

> ⚠️ Note: This library does not provide schema-aware features or type safety tied to your database structure. It focuses solely on SQL string generation.

## Use Case
This tool is particularly useful for:

1. Migrating legacy full-text SQL queries to a more robust and maintainable structure.
2. Writing testable query builders decoupled from database runtime.
3. Generating reusable query fragments across a large codebase.

## Installation

This library is a partial port of the Doctrine DBAL QueryBuilder and offers a nearly identical API. 
The core query builder is fully implemented, and for documentation and advanced usage patterns, you can refer to the official Doctrine DBAL guide: https://www.doctrine-project.org/projects/doctrine-dbal/en/4.2/reference/query-builder.html.

```bash
npm install @devscast/queryzen
```

### Example Usage

#### 1. Building a dynamic user search query with optional filters
```typescript
import { QueryBuilder } from '@devscast/queryzen';

interface UserFilters {
    username?: string;
    minAge?: number;
    isActive?: boolean;
}

function buildUserSearchQuery(filters: UserFilters) {
    const qb = new QueryBuilder()
        .select('u.id', 'u.username', 'u.email', 'u.created_at')
        .from('users', 'u');

    if (filters.username) {
        qb.andWhere('u.username LIKE :username');
        qb.setParameter('username', `%${filters.username}%`);
    }

    if (filters.minAge !== undefined) {
        qb.andWhere('u.age >= :minAge');
        qb.setParameter('minAge', filters.minAge);
    }

    if (filters.isActive !== undefined) {
        qb.andWhere('u.is_active = :isActive');
        qb.setParameter('isActive', filters.isActive);
    }

    qb.orderBy('u.created_at', 'DESC');

    return qb.toString();
}

```

#### 2. Fetching posts with authors and optional category filtering
```typescript
import { QueryBuilder } from '@devscast/queryzen';

interface PostFilters {
  categoryId?: number;
  isPublished?: boolean;
  authorName?: string;
}

function buildPostListQuery(filters: PostFilters) {
  const qb = new QueryBuilder()
    .select(
      'p.id',
      'p.title',
      'p.slug',
      'p.created_at',
      'a.id AS author_id',
      'a.name AS author_name',
      'c.name AS category_name'
    )
    .from('posts', 'p')
    .innerJoin('p', 'author', 'a', 'p.author_id = a.id')
    .leftJoin('p', 'category', 'c', 'p.category_id = c.id');

  if (filters.isPublished !== undefined) {
    qb.andWhere('p.is_published = :isPublished');
    qb.setParameter('isPublished', filters.isPublished);
  }

  if (filters.categoryId !== undefined) {
    qb.andWhere('p.category_id = :categoryId');
    qb.setParameter('categoryId', filters.categoryId);
  }

  if (filters.authorName) {
    qb.andWhere('a.name LIKE :authorName');
    qb.setParameter('authorName', `%${filters.authorName}%`);
  }

  qb.orderBy('p.created_at', 'DESC');

  return qb.toString();
}
```

#### 3. Using CTEs to fetch active users with their latest login
```typescript
import { QueryBuilder } from '@devscast/queryzen';

function buildActiveUsersWithLastLoginQuery() {
  // Step 1: Define the CTE for latest logins per user
  const lastLoginCTE = new QueryBuilder()
    .select('l.user_id', 'MAX(l.logged_in_at) AS last_login_at')
    .from('logins', 'l')
    .groupBy('l.user_id');

  // Step 2: Main query using the CTE
  const qb = new QueryBuilder()
    .with('last_login', lastLoginCTE)
    .select('u.id', 'u.name', 'u.email', 'll.last_login_at')
    .from('users', 'u')
    .innerJoin('u', 'last_login', 'll', 'll.user_id = u.id')
    .where('u.is_active = true')
    .orderBy('ll.last_login_at', 'DESC');

  return qb.toString();
}
```

### Security Notice: SQL Injection

We **highly recommend using prepared statements** with parameter binding to prevent SQL injection vulnerabilities. This library supports both named and positional parameters via `.setParameter()` and `.setParameters()`, and you can retrieve all parameters using `.getParameters()` to pass them safely to your database driver.

> ⚠️ Important: While the query builder performs basic SQL identifier escaping by default (e.g., table and column names), this is not sufficient to prevent SQL injection if you interpolate raw values into your query strings. It is your responsibility to ensure that values are always bound through parameters.

Always validate and sanitize inputs appropriately, especially when integrating with raw database drivers or legacy systems.

## Contributors

<a href="https://github.com/devscast/queryzen-tz/graphs/contributors" title="show all contributors">
  <img src="https://contrib.rocks/image?repo=devscast/queryzen-ts" alt="contributors"/>
</a>
