"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  QueryBuilder: () => QueryBuilder
});
module.exports = __toCommonJS(index_exports);

// src/platforms/exception/not-supported.ts
var NotSupported = class _NotSupported extends Error {
  constructor(method) {
    super(`Operation "${method}" is not supported by platform.`);
    this.name = "NotSupported";
    Object.setPrototypeOf(this, _NotSupported.prototype);
  }
  static new(method) {
    return new _NotSupported(method);
  }
};

// src/query/for-update.ts
var ForUpdate = class {
  constructor(conflictResolutionMode) {
    this.conflictResolutionMode = conflictResolutionMode;
  }
};

// src/sql/builder/default-select-sql-builder.ts
var DefaultSelectSQLBuilder = class {
  constructor(platform, forUpdateSQL, skipLockedSQL) {
    this.platform = platform;
    this.forUpdateSQL = forUpdateSQL;
    this.skipLockedSQL = skipLockedSQL;
  }
  buildSQL(query) {
    const parts = ["SELECT"];
    if (query.distinct) {
      parts.push("DISTINCT");
    }
    parts.push(query.columns.join(", "));
    const from = query.from;
    if (from.length > 0) {
      parts.push("FROM " + from.join(", "));
    }
    const where = query.where;
    if (where !== null) {
      parts.push("WHERE " + where);
    }
    const groupBy = query.groupBy;
    if (groupBy.length > 0) {
      parts.push("GROUP BY " + groupBy.join(", "));
    }
    const having = query.having;
    if (having !== null) {
      parts.push("HAVING " + having);
    }
    const orderBy = query.orderBy;
    if (orderBy.length > 0) {
      parts.push("ORDER BY " + orderBy.join(", "));
    }
    let sql = parts.join(" ");
    const limit = query.limit;
    if (limit.isDefined()) {
      sql = this.platform.modifyLimitQuery(sql, limit.getMaxResults(), limit.getFirstResult());
    }
    const forUpdate = query.forUpdate;
    if (forUpdate !== null) {
      if (this.forUpdateSQL === null) {
        throw NotSupported.new("FOR UPDATE");
      }
      sql += " " + this.forUpdateSQL;
      if (forUpdate.conflictResolutionMode === 1 /* SKIP_LOCKED */) {
        if (this.skipLockedSQL === null) {
          throw NotSupported.new("SKIP LOCKED");
        }
        sql += " " + this.skipLockedSQL;
      }
    }
    return sql;
  }
};

// src/sql/builder/default-union-sql-builder.ts
var DefaultUnionSQLBuilder = class {
  constructor(platform) {
    this.platform = platform;
  }
  buildSQL(query) {
    const parts = [];
    for (const union of query.unionParts) {
      if (union.type !== null) {
        parts.push(union.type === 0 /* ALL */ ? this.platform.getUnionAllSQL() : this.platform.getUnionDistinctSQL());
      }
      parts.push(this.platform.getUnionSelectPartSQL(String(union.query)));
    }
    const orderBy = query.orderBy;
    if (orderBy.length > 0) {
      parts.push("ORDER BY " + orderBy.join(", "));
    }
    let sql = parts.join(" ");
    const limit = query.limit;
    if (limit.isDefined()) {
      sql = this.platform.modifyLimitQuery(sql, limit.getMaxResults(), limit.getFirstResult());
    }
    return sql;
  }
};

// src/sql/builder/with-sql-builder.ts
var WithSQLBuilder = class {
  buildSQL(firstExpression, ...otherExpressions) {
    const cteParts = [];
    for (const part of [firstExpression, ...otherExpressions]) {
      const ctePart = [part.name];
      if (part.columns && part.columns.length > 0) {
        ctePart.push(` (${part.columns.join(", ")})`);
      }
      ctePart.push(` AS (${part.query})`);
      cteParts.push(ctePart.join(""));
    }
    return `WITH ${cteParts.join(", ")}`;
  }
};

// src/platforms/abstract-platform.ts
var AbstractPlatform = class {
  /**
   * Quotes a single identifier (no dot chain separation).
   */
  quoteSingleIdentifier(str) {
    return `"${str.replace(/"/g, `""`)}"`;
  }
  /**
   * Adds a driver-specific LIMIT clause to the query.
   */
  modifyLimitQuery(query, limit, offset = 0) {
    if (offset < 0) {
      throw new Error(`Offset must be a positive integer or zero, ${offset} given.`);
    }
    return this.doModifyLimitQuery(query, limit, offset);
  }
  /**
   * Adds a platform-specific LIMIT clause to the query.
   */
  doModifyLimitQuery(query, limit, offset) {
    if (limit !== null) {
      query += ` LIMIT ${limit}`;
    }
    if (offset > 0) {
      query += ` OFFSET ${offset}`;
    }
    return query;
  }
  /**
   * Quotes a literal string.
   * This method is NOT meant to fix SQL injections!
   * It is only meant to escape this platform's string literal
   * quote character inside the given literal string.
   */
  quoteStringLiteral(str) {
    return `'${str.replace(/'/g, `''`)}'`;
  }
  getUnionSelectPartSQL(subQuery) {
    return `(${subQuery})`;
  }
  /**
   * Returns the `UNION ALL` keyword.
   */
  getUnionAllSQL() {
    return "UNION ALL";
  }
  /**
   * Returns the compatible `UNION DISTINCT` keyword.
   */
  getUnionDistinctSQL() {
    return "UNION";
  }
  createSelectSQLBuilder() {
    return new DefaultSelectSQLBuilder(this, "FOR UPDATE", "SKIP LOCKED");
  }
  createUnionSQLBuilder() {
    return new DefaultUnionSQLBuilder(this);
  }
  createWithSQLBuilder() {
    return new WithSQLBuilder();
  }
};

// src/platforms/abstract-mysql-platform.ts
var AbstractMySQLPlatform = class extends AbstractPlatform {
  doModifyLimitQuery(query, limit, offset) {
    if (limit !== null) {
      query += ` LIMIT ${limit}`;
      if (offset > 0) {
        query += ` OFFSET ${offset}`;
      }
    } else if (offset > 0) {
      query += ` LIMIT 18446744073709551615 OFFSET ${offset}`;
    }
    return query;
  }
  quoteSingleIdentifier(str) {
    return "`" + str.replace(/`/g, "``") + "`";
  }
};

// src/platforms/mysql-platform.ts
var MySQLPlatform = class extends AbstractMySQLPlatform {
};

// src/query/query-exception.ts
var QueryException = class _QueryException extends Error {
  constructor(message) {
    super(message);
    this.name = "QueryException";
    Object.setPrototypeOf(this, _QueryException.prototype);
  }
};

// src/query/common-table-expression.ts
var CommonTableExpression = class {
  name;
  query;
  columns;
  constructor(name, query, columns) {
    if (columns !== null && columns.length === 0) {
      throw new QueryException(`Columns defined in CTE "${name}" should not be an empty array.`);
    }
    this.name = name;
    this.query = query;
    this.columns = columns;
  }
};

// src/query/expression/composite-expression.ts
var CompositeExpression = class _CompositeExpression {
  constructor(type, part, ...rest) {
    this.type = type;
    this.parts = [part, ...rest];
  }
  static TYPE_AND = "AND";
  static TYPE_OR = "OR";
  parts;
  static and(part, ...parts) {
    return new _CompositeExpression("AND", part, ...parts);
  }
  static or(part, ...parts) {
    return new _CompositeExpression("OR", part, ...parts);
  }
  with(part, ...parts) {
    const newParts = [...this.parts, part, ...parts].filter((p) => p !== void 0);
    if (newParts.length === 0) {
      throw new Error("CompositeExpression.with() requires at least one part");
    }
    const [first, ...restParts] = newParts;
    if (first === void 0) {
      throw new Error("CompositeExpression.with() requires at least one valid part");
    }
    return new _CompositeExpression(this.type, first, ...restParts);
  }
  getType() {
    return this.type;
  }
  count() {
    return this.parts.length;
  }
  toString() {
    if (this.parts.length === 1) {
      return String(this.parts[0]);
    }
    return `(${this.parts.map(String).join(`) ${this.type} (`)})`;
  }
};

// src/query/expression/expression-builder.ts
var ExpressionBuilder = class _ExpressionBuilder {
  static EQ = "=";
  static NEQ = "<>";
  static LT = "<";
  static LTE = "<=";
  static GT = ">";
  static GTE = ">=";
  and(expr, ...rest) {
    return CompositeExpression.and(expr, ...rest);
  }
  or(expr, ...rest) {
    return CompositeExpression.or(expr, ...rest);
  }
  comparison(x, operator, y) {
    return `${x} ${operator} ${y}`;
  }
  eq(x, y) {
    return this.comparison(x, _ExpressionBuilder.EQ, y);
  }
  neq(x, y) {
    return this.comparison(x, _ExpressionBuilder.NEQ, y);
  }
  lt(x, y) {
    return this.comparison(x, _ExpressionBuilder.LT, y);
  }
  lte(x, y) {
    return this.comparison(x, _ExpressionBuilder.LTE, y);
  }
  gt(x, y) {
    return this.comparison(x, _ExpressionBuilder.GT, y);
  }
  gte(x, y) {
    return this.comparison(x, _ExpressionBuilder.GTE, y);
  }
  isNull(x) {
    return `${x} IS NULL`;
  }
  isNotNull(x) {
    return `${x} IS NOT NULL`;
  }
  like(expr, pattern, escapeChar) {
    return this.comparison(expr, "LIKE", pattern) + (escapeChar ? ` ESCAPE ${escapeChar}` : "");
  }
  notLike(expr, pattern, escapeChar) {
    return this.comparison(expr, "NOT LIKE", pattern) + (escapeChar ? ` ESCAPE ${escapeChar}` : "");
  }
  in(x, y) {
    const values = Array.isArray(y) ? y : [y];
    return this.comparison(x, "IN", `(${values.join(", ")})`);
  }
  notIn(x, y) {
    const values = Array.isArray(y) ? y : [y];
    return this.comparison(x, "NOT IN", `(${values.join(", ")})`);
  }
};

// src/query/from.ts
var From = class {
  constructor(table, alias = null) {
    this.table = table;
    this.alias = alias;
  }
};

// src/query/join.ts
var Join = class _Join {
  constructor(type, table, alias, condition) {
    this.type = type;
    this.table = table;
    this.alias = alias;
    this.condition = condition;
  }
  static inner(table, alias, condition) {
    return new _Join("INNER", table, alias, condition);
  }
  static left(table, alias, condition) {
    return new _Join("LEFT", table, alias, condition);
  }
  static right(table, alias, condition) {
    return new _Join("RIGHT", table, alias, condition);
  }
};

// src/query/limit.ts
var Limit = class {
  constructor(maxResults, firstResult = 0) {
    this.maxResults = maxResults;
    this.firstResult = firstResult;
  }
  isDefined() {
    return this.maxResults !== null || this.firstResult !== 0;
  }
  getMaxResults() {
    return this.maxResults;
  }
  getFirstResult() {
    return this.firstResult;
  }
};

// src/query/select-query.ts
var SelectQuery = class {
  constructor(distinct, columns, from, where, groupBy, having, orderBy, limit, forUpdate) {
    this.distinct = distinct;
    this.columns = columns;
    this.from = from;
    this.where = where;
    this.groupBy = groupBy;
    this.having = having;
    this.orderBy = orderBy;
    this.limit = limit;
    this.forUpdate = forUpdate;
  }
};

// src/query/union.ts
var Union = class {
  constructor(query, type = null) {
    this.query = query;
    this.type = type;
  }
};

// src/query/union-query.ts
var UnionQuery = class {
  constructor(unionParts, orderBy, limit) {
    this.unionParts = unionParts;
    this.orderBy = orderBy;
    this.limit = limit;
  }
};

// src/query/query-builder.ts
var QueryBuilder = class {
  constructor(platform = new MySQLPlatform()) {
    this.platform = platform;
  }
  sql = null;
  params = [];
  types = {};
  type = 0 /* SELECT */;
  boundCounter = 0;
  firstResult = 0;
  maxResults = null;
  table = null;
  unionParts = [];
  commonTableExpressions = [];
  _select = [];
  _distinct = false;
  _from = [];
  _join = {};
  _set = [];
  _where = null;
  _groupBy = [];
  _having = null;
  _orderBy = [];
  _forUpdate = null;
  _values = {};
  /**
   * Gets an ExpressionBuilder used for object-oriented construction of query expressions.
   * This producer method is intended for convenient inline usage.
   *
   * For more complex expression construction, consider storing the expression
   * builder object in a local variable.
   */
  expr() {
    return new ExpressionBuilder();
  }
  /**
   * Gets the complete SQL string formed by the current specifications of this QueryBuilder.
   */
  getSQL() {
    if (this.sql !== null) return this.sql;
    switch (this.type) {
      case 1 /* INSERT */:
        return this.sql = this.getSQLForInsert();
      case 3 /* DELETE */:
        return this.sql = this.getSQLForDelete();
      case 2 /* UPDATE */:
        return this.sql = this.getSQLForUpdate();
      case 0 /* SELECT */:
        return this.sql = this.getSQLForSelect();
      case 4 /* UNION */:
        return this.sql = this.getSQLForUnion();
    }
  }
  /**
   * Sets a query parameter for the query being constructed.
   */
  setParameter(key, value, type = "STRING" /* STRING */) {
    this.params[key] = value;
    this.types[key] = type;
    return this;
  }
  /**
   * Sets a query parameter for the query being constructed.
   */
  setParameters(params, types = {}) {
    this.params = params;
    this.types = types;
    return this;
  }
  /**
   * Gets all defined query parameters for the query being constructed indexed by parameter index or name.
   */
  getParameters() {
    return this.params;
  }
  /**
   * Gets a (previously set) query parameter of the query being constructed.
   */
  getParameter(key) {
    return this.params[key] ?? null;
  }
  /**
   * Gets all defined query parameter types for the query being constructed indexed by parameter index or name.
   */
  getParameterTypes() {
    return this.types;
  }
  /**
   * Gets a (previously set) query parameter type of the query being constructed.
   */
  getParameterType(key) {
    return this.types[key] ?? "STRING" /* STRING */;
  }
  /**
   * Sets the position of the first result to retrieve (the "offset").
   */
  setFirstResult(firstResult) {
    this.firstResult = firstResult;
    this.sql = null;
    return this;
  }
  /**
   * Gets the position of the first result the query object was set to retrieve (the "offset").
   */
  getFirstResult() {
    return this.firstResult;
  }
  /**
   * Sets the maximum number of results to retrieve (the "limit").
   */
  setMaxResults(maxResults) {
    this.maxResults = maxResults;
    this.sql = null;
    return this;
  }
  /**
   * Gets the maximum number of results the query object was set to retrieve (the "limit").
   * Returns NULL if all results will be returned.
   */
  getMaxResults() {
    return this.maxResults;
  }
  /**
   * Locks the queried rows for a subsequent update.
   */
  forUpdate(mode = 0 /* ORDINARY */) {
    this._forUpdate = new ForUpdate(mode);
    this.sql = null;
    return this;
  }
  /**
   * Specifies union parts to be used to build a UNION query.
   * Replaces any previously specified parts.
   */
  union(part) {
    this.type = 4 /* UNION */;
    this.unionParts = [new Union(part)];
    this.sql = null;
    return this;
  }
  /**
   * Add parts to be used to build a UNION query.
   */
  addUnion(part, type = 1 /* DISTINCT */) {
    this.type = 4 /* UNION */;
    if (this.unionParts.length === 0) {
      throw new QueryException("No initial UNION part set, use union() to set one first.");
    }
    this.unionParts.push(new Union(part, type));
    this.sql = null;
    return this;
  }
  /**
   * Add a Common Table Expression to be used for a select query.
   */
  with(name, part, columns = null) {
    this.commonTableExpressions.push(new CommonTableExpression(name, part, columns));
    this.sql = null;
    return this;
  }
  /**
   * Specifies an item that is to be returned in the query result.
   * Replaces any previously specified selections, if any.
   */
  select(...expressions) {
    this.type = 0 /* SELECT */;
    this._select = expressions;
    this.sql = null;
    return this;
  }
  /**
   * Adds or removes DISTINCT to/from the query.
   */
  distinct(distinct = true) {
    this._distinct = distinct;
    this.sql = null;
    return this;
  }
  /**
   * Adds an item that is to be returned in the query result.
   */
  addSelect(expression, ...expressions) {
    this.type = 0 /* SELECT */;
    this._select.push(expression, ...expressions);
    this.sql = null;
    return this;
  }
  /**
   * Turns the query being built into a bulk delete query that ranges over
   * a certain table.
   */
  delete(table) {
    this.type = 3 /* DELETE */;
    this.table = table;
    this.sql = null;
    return this;
  }
  /**
   * Turns the query being built into a bulk update query that ranges over
   * a certain table
   */
  update(table) {
    this.type = 2 /* UPDATE */;
    this.table = table;
    this.sql = null;
    return this;
  }
  /**
   * Turns the query being built into an insert query that inserts into
   * a certain table
   */
  insert(table) {
    this.type = 1 /* INSERT */;
    this.table = table;
    this.sql = null;
    return this;
  }
  /**
   * Creates and adds a query root corresponding to the table identified by the
   * given alias, forming a cartesian product with any existing query roots.
   */
  from(table, alias = null) {
    this._from.push(new From(table, alias));
    this.sql = null;
    return this;
  }
  /**
   * Creates and adds a join to the query.
   */
  join(fromAlias, join, alias, condition = null) {
    return this.innerJoin(fromAlias, join, alias, condition);
  }
  /**
   * Creates and adds a join to the query.
   */
  innerJoin(fromAlias, join, alias, condition = null) {
    this._join[fromAlias] = this._join[fromAlias] ?? [];
    this._join[fromAlias].push(Join.inner(join, alias, condition));
    this.sql = null;
    return this;
  }
  /**
   * Creates and adds a left join to the query.
   */
  leftJoin(fromAlias, join, alias, condition = null) {
    this._join[fromAlias] = this._join[fromAlias] ?? [];
    this._join[fromAlias].push(Join.left(join, alias, condition));
    this.sql = null;
    return this;
  }
  /**
   * Creates and adds a right join to the query.
   */
  rightJoin(fromAlias, join, alias, condition = null) {
    this._join[fromAlias] = this._join[fromAlias] ?? [];
    this._join[fromAlias].push(Join.right(join, alias, condition));
    this.sql = null;
    return this;
  }
  /**
   * Sets a new value for a column in a bulk update query.
   */
  set(key, value) {
    this._set.push(`${key} = ${value}`);
    this.sql = null;
    return this;
  }
  /**
   * Specifies one or more restrictions to the query result.
   * Replaces any previously specified restrictions, if any.
   */
  where(predicate, ...predicates) {
    this._where = this.createPredicate(predicate, ...predicates);
    this.sql = null;
    return this;
  }
  /**
   * Adds one or more restrictions to the query results, forming a logical
   * conjunction with any previously specified restrictions.
   */
  andWhere(predicate, ...predicates) {
    this._where = this.appendToPredicate(this._where, CompositeExpression.TYPE_AND, predicate, ...predicates);
    this.sql = null;
    return this;
  }
  /**
   * Adds one or more restrictions to the query results, forming a logical
   * disjunction with any previously specified restrictions.
   */
  orWhere(predicate, ...predicates) {
    this._where = this.appendToPredicate(this._where, CompositeExpression.TYPE_OR, predicate, ...predicates);
    this.sql = null;
    return this;
  }
  /**
   * Specifies one or more grouping expressions over the results of the query.
   * Replaces any previously specified groupings, if any.
   */
  groupBy(expression, ...expressions) {
    this._groupBy = [expression, ...expressions];
    this.sql = null;
    return this;
  }
  /**
   * Adds one or more grouping expressions to the query.
   */
  addGroupBy(expression, ...expressions) {
    this._groupBy.push(expression, ...expressions);
    this.sql = null;
    return this;
  }
  /**
   * Sets a value for a column in an insert query.
   */
  setValue(column, value) {
    this._values[column] = value;
    return this;
  }
  /**
   * Specifies values for an insert query indexed by column names.
   * Replaces any previous values, if any.
   */
  values(values) {
    this._values = values;
    this.sql = null;
    return this;
  }
  /**
   * Specifies a restriction over the groups of the query.
   * Replaces any previous having restrictions, if any.
   */
  having(predicate, ...predicates) {
    this._having = this.createPredicate(predicate, ...predicates);
    this.sql = null;
    return this;
  }
  /**
   * Adds a restriction over the groups of the query, forming a logical
   * conjunction with any existing having restrictions.
   */
  andHaving(predicate, ...predicates) {
    this._having = this.appendToPredicate(this._having, CompositeExpression.TYPE_AND, predicate, ...predicates);
    this.sql = null;
    return this;
  }
  /**
   * Adds a restriction over the groups of the query, forming a logical
   * disjunction with any existing having restrictions.
   */
  orHaving(predicate, ...predicates) {
    this._having = this.appendToPredicate(this._having, CompositeExpression.TYPE_OR, predicate, ...predicates);
    this.sql = null;
    return this;
  }
  /**
   * Creates a CompositeExpression from one or more predicates combined by the AND logic.
   */
  createPredicate(predicate, ...predicates) {
    if (predicates.length === 0) {
      return predicate;
    }
    return new CompositeExpression("AND", predicate, ...predicates);
  }
  /**
   * Appends the given predicates combined by the given type of logic to the current predicate.
   */
  appendToPredicate(currentPredicate, type, ...predicates) {
    if (currentPredicate instanceof CompositeExpression && currentPredicate.getType() === type) {
      if (predicates.length === 0) {
        return currentPredicate;
      }
      const [head, ...rest] = predicates;
      if (head === void 0) {
        return currentPredicate;
      }
      return currentPredicate.with(head, ...rest.filter((p) => p !== void 0));
    }
    if (currentPredicate !== null) {
      predicates.unshift(currentPredicate);
    } else if (predicates.length === 1) {
      if (predicates[0] === void 0) {
        throw new Error("Predicate cannot be undefined");
      }
      return predicates[0];
    }
    const [first, ...others] = predicates;
    if (first === void 0) {
      throw new Error("Predicate cannot be undefined");
    }
    return new CompositeExpression(type, first, ...others.filter((p) => p !== void 0));
  }
  /**
   * Specifies an ordering for the query results.
   * Replaces any previously specified orderings, if any.
   */
  orderBy(sort, order) {
    const clause = order ? `${sort} ${order}` : sort;
    this._orderBy = [clause];
    this.sql = null;
    return this;
  }
  /**
   * Adds an ordering to the query results.
   */
  addOrderBy(sort, order) {
    const clause = order ? `${sort} ${order}` : sort;
    this._orderBy.push(clause);
    this.sql = null;
    return this;
  }
  /**
   * Resets the WHERE conditions for the query.
   */
  resetWhere() {
    this._where = null;
    this.sql = null;
    return this;
  }
  /**
   * Resets the grouping for the query.
   */
  resetGroupBy() {
    this._groupBy = [];
    this.sql = null;
    return this;
  }
  /**
   * Resets the HAVING conditions for the query.
   */
  resetHaving() {
    this._having = null;
    this.sql = null;
    return this;
  }
  /**
   * Resets the ordering for the query.
   */
  resetOrderBy() {
    this._orderBy = [];
    this.sql = null;
    return this;
  }
  getSQLForSelect() {
    if (this._select.length === 0) {
      throw new QueryException("No SELECT expressions given. Please use select() or addSelect().");
    }
    const selectParts = [];
    if (this.commonTableExpressions.length > 0 && this.platform) {
      const [expression, ...rest] = this.commonTableExpressions;
      if (!expression) {
        throw new Error("CommonTableExpression cannot be undefined");
      }
      selectParts.push(this.platform.createWithSQLBuilder().buildSQL(expression, ...rest.filter((e) => e !== void 0)));
    }
    if (this.platform) {
      selectParts.push(
        this.platform.createSelectSQLBuilder().buildSQL(
          new SelectQuery(
            this._distinct,
            this._select,
            this.getFromClauses(),
            this._where !== null ? this._where.toString() : null,
            this._groupBy,
            this._having !== null ? this._having.toString() : null,
            this._orderBy,
            new Limit(this.maxResults, this.firstResult),
            this._forUpdate
          )
        )
      );
    }
    return selectParts.join(" ");
  }
  getFromClauses() {
    const fromClauses = [];
    const knownAliases = /* @__PURE__ */ new Set();
    for (const from of this._from) {
      let tableSql;
      let tableReference;
      if (from.alias === null || from.alias === from.table) {
        tableSql = from.table;
        tableReference = from.table;
      } else {
        tableSql = `${from.table} ${from.alias}`;
        tableReference = from.alias;
      }
      knownAliases.add(tableReference);
      fromClauses.push(tableSql + this.getSQLForJoins(tableReference, knownAliases));
    }
    this.verifyAllAliasesAreKnown(knownAliases);
    return fromClauses;
  }
  verifyAllAliasesAreKnown(knownAliases) {
    for (const fromAlias in this._join) {
      if (!knownAliases.has(fromAlias)) {
        throw new QueryException(`Unknown alias: ${fromAlias}. Known aliases: ${Array.from(knownAliases).join(", ")}`);
      }
    }
  }
  getSQLForInsert() {
    return `INSERT INTO ${this.table} (${Object.keys(this._values).join(", ")}) VALUES(${Object.values(this._values).join(", ")})`;
  }
  getSQLForDelete() {
    let query = `DELETE FROM ${this.table}`;
    if (this._where !== null) {
      query += ` WHERE ${this._where}`;
    }
    return query;
  }
  getSQLForUpdate() {
    let query = `UPDATE ${this.table} SET ${this._set.join(", ")}`;
    if (this._where !== null) {
      query += ` WHERE ${this._where}`;
    }
    return query;
  }
  getSQLForUnion() {
    const countUnions = this.unionParts.length;
    if (countUnions < 2) {
      throw new QueryException(
        "Insufficient UNION parts given, need at least 2. Please use union() and addUnion() to set enough UNION parts."
      );
    }
    return this.platform.createUnionSQLBuilder().buildSQL(new UnionQuery(this.unionParts, this._orderBy, new Limit(this.maxResults, this.firstResult)));
  }
  /**
   * Gets a string representation of this QueryBuilder which corresponds to
   * the final SQL query being constructed.
   */
  toString() {
    return this.getSQL();
  }
  /**
   * Creates a new named parameter and bind the value $value to it.
   *
   * This method provides a shortcut for {@see Statement::bindValue()}
   * when using prepared statements.
   *
   * The parameter $value specifies the value that you want to bind. If
   * $placeholder is not provided createNamedParameter() will automatically
   * create a placeholder for you. An automatic placeholder will be of the
   * name ':dcValue1', ':dcValue2' etc.
   *
   * @link http://www.zetacomponents.org
   */
  createNamedParameter(value, type = "STRING" /* STRING */, placeHolder = null) {
    if (placeHolder === null) {
      this.boundCounter++;
      placeHolder = `:dcValue${this.boundCounter}`;
    }
    this.setParameter(placeHolder.substring(1), value, type);
    return placeHolder;
  }
  /**
   * Creates a new positional parameter and bind the given value to it.
   *
   * Attention: If you are using positional parameters with the query builder you have
   * to be very careful to bind all parameters in the order they appear in the SQL
   * statement , otherwise they get bound in the wrong order which can lead to serious
   * bugs in your code.
   */
  createPositionalParameter(value, type = "STRING" /* STRING */) {
    this.setParameter(this.boundCounter, value, type);
    this.boundCounter++;
    return "?";
  }
  getSQLForJoins(fromAlias, knownAliases) {
    let sql = "";
    if (!this._join[fromAlias]) {
      return sql;
    }
    for (const join of this._join[fromAlias]) {
      if (knownAliases.has(join.alias)) {
        throw new QueryException(`Non-unique alias: ${join.alias}`);
      }
      sql += ` ${join.type} JOIN ${join.table} ${join.alias}`;
      if (join.condition !== null) {
        sql += ` ON ${join.condition}`;
      }
      knownAliases.add(join.alias);
    }
    for (const join of this._join[fromAlias]) {
      sql += this.getSQLForJoins(join.alias, knownAliases);
    }
    return sql;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QueryBuilder
});
