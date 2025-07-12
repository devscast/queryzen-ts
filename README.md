# QueryZen : TypeScript Query Builder

![npm](https://img.shields.io/npm/v/@devscast/queryzen?style=flat-square)
![npm](https://img.shields.io/npm/dt/@devscast/queryzen?style=flat-square)
![Lint](https://github.com/devscast/queryzen-ts/actions/workflows/lint.yml/badge.svg)
![Test](https://github.com/devscast/queryzen-ts/actions/workflows/test.yml/badge.svg)
![GitHub](https://img.shields.io/github/license/devscast/queryzen-ts?style=flat-square)

> [!NOTE]  
> Work in progress : intended for internal use only, not yet ready for production use.

A TypeScript library for building SQL queries in a fluent, composable, and type-safe way.
Highly inspired by doctrine/dbal (QueryBuilder abstraction only).

This is a partial port, focusing on the query builder API and not a full DBAL implementation.
Features :

- Fluent API for building SQL queries (SELECT, INSERT, UPDATE, DELETE, UNION, CTE, etc.)
- Named and positional parameters with type support
- Expression builder for complex WHERE/HAVING clauses
- Support for joins, grouping, ordering, and more
- Inspired by the proven Doctrine DBAL QueryBuilder

## Installation

```bash
npm install @devscast/queryzen
```

## Usage

```typescript
import { QueryBuilder } from '@devscast/queryzen';

const qb = new QueryBuilder();
qb.select('u.id')
    .from('users', 'u')
    .where('u.nickname = :username')
    .andWhere('u.age > :age')
    .setParameter('username', 'john_doe')
    .setParameter('age', 18)
```

## Contributors

<a href="https://github.com/devscast/queryzen-tz/graphs/contributors" title="show all contributors">
  <img src="https://contrib.rocks/image?repo=devscast/queryzen-ts" alt="contributors"/>
</a>
