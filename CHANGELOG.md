# @devscast/queryzen

## 1.1.2

### Patch Changes

- bump deps

## 1.1.1

### Patch Changes

- fix: minify production dist

## 1.1.0

### Minor Changes

- Remove `QueryBuilder.upsert` method
- Add `QueryBuilder.insertWith`, `QueryBuilder.updateWith` method
- Add `DB2Platform`, `OraclePlatform`, `SQLServerPlatform` support
- Modify parameter `type` in QueryBuilder.createNamedParameter to be optional
- Refactor use of `UnknownAlias` and `NonUniqueAlias` exceptions instead of `QueryException`

## 1.0.5

### Patch Changes

- Add support for different placeholder types in `QueryBuilder.upsert` method

## 1.0.4

### Patch Changes

- Add `ParameterType`, `ArrayParameterType`, `UnionType`, `ConflictResolutionMode` to exports

## 1.0.3

### Patch Changes

- Add `QueryBuilder.upsert` method

## 1.0.2

### Patch Changes

- Fix automated release process

## 1.0.1

### Patch Changes

- Add project related documents

## 1.0.0

### Major Changes

- a3ea96e: initial release doctrine dbal query builder port for typescript
