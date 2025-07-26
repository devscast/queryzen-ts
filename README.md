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
> If you are looking for theses features please have a look at ["Cold" Kysely instances](https://kysely.dev/docs/recipes/splitting-query-building-and-execution)

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

const searchUserQuery = (filters: UserFilters): QueryBuilder => {
    const qb = new QueryBuilder()
        .select('u.id', 'u.username', 'u.email', 'u.created_at')
        .from('users', 'u');

    switch (true) {
      case filters.minAge !== undefined:
        qb.andWhere(`u.age >= ${qb.createNamedParameter(filters.minAge, 'minAge')}`);
        break;
      case filters.isActive !== undefined:
        qb.andWhere(`u.is_active = ${qb.createNamedParameter(filters.isActive, 'isActive')}`);
        break;
      case !!filters.username:
        qb.andWhere('u.username LIKE :username');
        qb.setParameter('username', `%${filters.username}%`);
        break;
    }

    qb.orderBy('u.created_at', 'DESC');

    return qb
}

const query = searchUserQuery({ username: 'john', isActive: true });

// query.toString() => "
    // SELECT u.id, u.username, u.email, u.created_at 
    // FROM `users` AS u 
    // WHERE u.username LIKE :username AND u.is_active = :isActive 
    // ORDER BY u.created_at DESC"
// { ...query.getParameters() } => { username: '%john%', isActive: true }
```

#### 2. Fetching posts with authors and optional category filtering
```typescript
import { QueryBuilder } from '@devscast/queryzen';

interface PostFilters {
  categoryId?: number;
  isPublished?: boolean;
  authorName?: string;
}

const postListQuery = (filters: PostFilters): QueryBuilder => {
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

  switch (true) {
    case filters.isPublished !== undefined:
      qb.andWhere(`p.is_published = ${qb.createNamedParameter(filters.isPublished, 'isPublished')}`);
      break;
    case filters.categoryId !== undefined:
      qb.andWhere(`p.category_id = ${qb.createNamedParameter(filters.categoryId, 'categoryId')}`);
      break;
    case !!filters.authorName:
      qb.andWhere(`a.name LIKE :authorName`);
      qb.setParameter('authorName', `%${filters.authorName}%`);
      break;
  }

  qb.orderBy('p.created_at', 'DESC');

  return qb;
}

const query = postListQuery({ isPublished: true });
```

#### 3. Using CTEs to fetch active users with their latest login
```typescript
import { QueryBuilder } from '@devscast/queryzen';

// Step 1: Define the CTE for latest logins per user
const lastLoginQuery = new QueryBuilder()
    .select('l.user_id', 'MAX(l.logged_in_at) AS last_login_at')
    .from('logins', 'l')
    .groupBy('l.user_id');

// Step 2: Main query using the CTE
const qb = new QueryBuilder()
    .with('last_login', lastLoginQuery)
    .select('u.id', 'u.name', 'u.email', 'll.last_login_at')
    .from('users', 'u')
    .innerJoin('u', 'last_login', 'll', 'll.user_id = u.id')
    .where('u.is_active = true')
    .orderBy('ll.last_login_at', 'DESC');
```

#### 4. Deleting users by status
```typescript
import { QueryBuilder } from '@devscast/queryzen';

const qb = new QueryBuilder();

qb.delete('users').where(`name = ${qb.createPositionalParameter('John Doe')}`);

// qb.toString() => "DELETE FROM `users` WHERE name = ?"
// qb.getParameters() => [ 'John Doe' ]
```

#### 5. Inserting a new user
```typescript
import { QueryBuilder } from '@devscast/queryzen';

const data = { name: 'John Doe', email: 'john.doe@test.com' }
const qb = new QueryBuilder()

// Specify columns to insert
qb
  .insert("users")
  .setValue("name", qb.createPositionalParameter(data.name))
  .setValue("email", qb.createPositionalParameter(data.email))

// Equivalent to: 
qb.insertWith('users', data)

// qb.toString() => "INSERT INTO `users` (name, email) VALUES (?, ?)"
// qb.getParameters() => [ 'John Doe', 'john.doe@test.com' ]
```

#### 6. Updating a user
```typescript
import { QueryBuilder } from '@devscast/queryzen';

const data = { name: 'Jane Doe', email: 'jane.doe@test.com' }
const qb = new QueryBuilder()

// Specify columns to update
qb
  .update("users")
  .set("name", qb.createPositionalParameter(data.name))
  .set("email", qb.createPositionalParameter(data.email))
  .where(`id = ${qb.createPositionalParameter(123)}`);

// Equivalent to:
qb.updateWith("users", data).where(`id = ${qb.createPositionalParameter(123)}`)

// qb.toString() => "UPDATE `users` SET name = ?, email = ? WHERE id = ?"
// qb.getParameters() => [ 'Jane Doe', 'jane.doe@test.com', 123]
```

### Security Notice: SQL Injection

We **highly recommend using prepared statements** with parameter binding to prevent SQL injection vulnerabilities. This library supports both named and positional parameters via `.setParameter()` and `.setParameters()`, and you can retrieve all parameters using `.getParameters()` to pass them safely to your database driver.

> ⚠️ Important: While the query builder performs basic SQL identifier escaping by default (e.g., table and column names), this is not sufficient to prevent SQL injection if you interpolate raw values into your query strings. It is your responsibility to ensure that values are always bound through parameters.

Always validate and sanitize inputs appropriately, especially when integrating with raw database drivers or legacy systems.

## Contributors

<a href="https://github.com/devscast/queryzen-tz/graphs/contributors" title="show all contributors">
  <img src="https://contrib.rocks/image?repo=devscast/queryzen-ts" alt="contributors"/>
</a>
