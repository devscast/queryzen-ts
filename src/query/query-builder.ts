import { ArrayParameterType } from "@/array-parameter-type";
import { ParameterType } from "@/parameter-type";
import { AbstractPlatform } from "@/platforms/abstract-platform";
import { MySQLPlatform } from "@/platforms/mysql-platform";
import { CommonTableExpression } from "@/query/common-table-expression";
import { CompositeExpression } from "@/query/expression/composite-expression";
import { ExpressionBuilder } from "@/query/expression/expression-builder";
import { ConflictResolutionMode, ForUpdate } from "@/query/for-update";
import { From } from "@/query/from";
import { Join } from "@/query/join";
import { Limit } from "@/query/limit";
import { QueryException } from "@/query/query-exception";
import { QueryType } from "@/query/query-type";
import { SelectQuery } from "@/query/select-query";
import { Union } from "@/query/union";
import { UnionQuery } from "@/query/union-query";
import { UnionType } from "@/query/union-type";

type ParamType = string | ParameterType | ArrayParameterType;

/**
 * QueryBuilder class is responsible to dynamically create SQL queries.
 *
 * Important: Verify that every feature you use will work with your database vendor.
 * SQL Query Builder does not attempt to validate the generated SQL at all.
 *
 * The query builder does no validation whatsoever if certain features even work with the
 * underlying database vendor. Limit queries and joins are NOT applied to UPDATE and DELETE statements
 * even if some vendors such as MySQL support it.
 */
export class QueryBuilder {
  private sql: string | null = null;
  private params: Record<string | number, any> = [];
  private types: Record<string | number, any> = {};
  private type: QueryType = QueryType.SELECT;
  private boundCounter: number = 0;
  private firstResult: number = 0;
  private maxResults: number | null = null;
  private table: string | null = null;
  private unionParts: Union[] = [];
  private commonTableExpressions: CommonTableExpression[] = [];

  private _select: string[] = [];
  private _distinct: boolean = false;
  private _from: From[] = [];
  private _join: Record<string, Join[]> = {};
  private _set: string[] = [];
  private _where: string | CompositeExpression | null = null;
  private _groupBy: string[] = [];
  private _having: string | CompositeExpression | null = null;
  private _orderBy: string[] = [];
  private _forUpdate: ForUpdate | null = null;
  private _values: Record<string, any> = {};

  constructor(private readonly platform: AbstractPlatform = new MySQLPlatform()) {}

  /**
   * Gets an ExpressionBuilder used for object-oriented construction of query expressions.
   * This producer method is intended for convenient inline usage.
   *
   * For more complex expression construction, consider storing the expression
   * builder object in a local variable.
   */
  public expr(): ExpressionBuilder {
    return new ExpressionBuilder();
  }

  /**
   * Gets the complete SQL string formed by the current specifications of this QueryBuilder.
   */
  public getSQL(): string {
    if (this.sql !== null) return this.sql;

    switch (this.type) {
      case QueryType.INSERT:
        return (this.sql = this.getSQLForInsert());
      case QueryType.DELETE:
        return (this.sql = this.getSQLForDelete());
      case QueryType.UPDATE:
        return (this.sql = this.getSQLForUpdate());
      case QueryType.SELECT:
        return (this.sql = this.getSQLForSelect());
      case QueryType.UNION:
        return (this.sql = this.getSQLForUnion());
    }
  }

  /**
   * Sets a query parameter for the query being constructed.
   */
  public setParameter(key: string | number, value: any, type: ParamType = ParameterType.STRING): this {
    this.params[key] = value;
    this.types[key] = type;

    return this;
  }

  /**
   * Sets a query parameter for the query being constructed.
   */
  public setParameters(params: Record<string | number, any>, types: Record<string | number, ParamType> = {}): this {
    this.params = params;
    this.types = types;

    return this;
  }

  /**
   * Gets all defined query parameters for the query being constructed indexed by parameter index or name.
   */
  public getParameters(): Record<string | number, any> {
    return this.params;
  }

  /**
   * Gets a (previously set) query parameter of the query being constructed.
   */
  public getParameter(key: string | number): any {
    return this.params[key] ?? null;
  }

  /**
   * Gets all defined query parameter types for the query being constructed indexed by parameter index or name.
   */
  public getParameterTypes(): Record<string | number, ParamType> {
    return this.types;
  }

  /**
   * Gets a (previously set) query parameter type of the query being constructed.
   */
  public getParameterType(key: string | number): ParamType {
    return this.types[key] ?? ParameterType.STRING;
  }

  /**
   * Sets the position of the first result to retrieve (the "offset").
   */
  public setFirstResult(firstResult: number): this {
    this.firstResult = firstResult;
    this.sql = null;

    return this;
  }

  /**
   * Gets the position of the first result the query object was set to retrieve (the "offset").
   */
  public getFirstResult(): number {
    return this.firstResult;
  }

  /**
   * Sets the maximum number of results to retrieve (the "limit").
   */
  public setMaxResults(maxResults: number | null): this {
    this.maxResults = maxResults;
    this.sql = null;

    return this;
  }

  /**
   * Gets the maximum number of results the query object was set to retrieve (the "limit").
   * Returns NULL if all results will be returned.
   */
  public getMaxResults(): number | null {
    return this.maxResults;
  }

  /**
   * Locks the queried rows for a subsequent update.
   */
  public forUpdate(mode: ConflictResolutionMode = ConflictResolutionMode.ORDINARY): this {
    this._forUpdate = new ForUpdate(mode);
    this.sql = null;

    return this;
  }

  /**
   * Specifies union parts to be used to build a UNION query.
   * Replaces any previously specified parts.
   */
  public union(part: string | QueryBuilder): this {
    this.type = QueryType.UNION;
    this.unionParts = [new Union(part)];
    this.sql = null;

    return this;
  }

  /**
   * Add parts to be used to build a UNION query.
   */
  public addUnion(part: string | QueryBuilder, type: UnionType = UnionType.DISTINCT): this {
    this.type = QueryType.UNION;
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
  public with(name: string, part: string | QueryBuilder, columns: string[] | null = null): this {
    this.commonTableExpressions.push(new CommonTableExpression(name, part, columns));
    this.sql = null;

    return this;
  }

  /**
   * Specifies an item that is to be returned in the query result.
   * Replaces any previously specified selections, if any.
   */
  public select(...expressions: string[]): this {
    this.type = QueryType.SELECT;
    this._select = expressions;
    this.sql = null;

    return this;
  }

  /**
   * Adds or removes DISTINCT to/from the query.
   */
  public distinct(distinct = true): this {
    this._distinct = distinct;
    this.sql = null;

    return this;
  }

  /**
   * Adds an item that is to be returned in the query result.
   */
  public addSelect(expression: string, ...expressions: string[]): this {
    this.type = QueryType.SELECT;
    this._select.push(expression, ...expressions);
    this.sql = null;

    return this;
  }

  /**
   * Turns the query being built into a bulk delete query that ranges over
   * a certain table.
   */
  public delete(table: string): this {
    this.type = QueryType.DELETE;
    this.table = table;
    this.sql = null;

    return this;
  }

  /**
   * Turns the query being built into a bulk update query that ranges over
   * a certain table
   */
  public update(table: string): this {
    this.type = QueryType.UPDATE;
    this.table = table;
    this.sql = null;

    return this;
  }

  /**
   * Turns the query being built into an insert query that inserts into
   * a certain table
   */
  public insert(table: string): this {
    this.type = QueryType.INSERT;
    this.table = table;
    this.sql = null;

    return this;
  }

  /**
   * Creates and adds a query root corresponding to the table identified by the
   * given alias, forming a cartesian product with any existing query roots.
   */
  public from(table: string, alias: string | null = null): this {
    this._from.push(new From(table, alias));
    this.sql = null;

    return this;
  }

  /**
   * Creates and adds a join to the query.
   */
  public join(fromAlias: string, join: string, alias: string, condition: string | null = null): this {
    return this.innerJoin(fromAlias, join, alias, condition);
  }

  /**
   * Creates and adds a join to the query.
   */
  public innerJoin(fromAlias: string, join: string, alias: string, condition: string | null = null): this {
    this._join[fromAlias] = this._join[fromAlias] ?? [];
    this._join[fromAlias].push(Join.inner(join, alias, condition));
    this.sql = null;

    return this;
  }

  /**
   * Creates and adds a left join to the query.
   */
  public leftJoin(fromAlias: string, join: string, alias: string, condition: string | null = null): this {
    this._join[fromAlias] = this._join[fromAlias] ?? [];
    this._join[fromAlias].push(Join.left(join, alias, condition));
    this.sql = null;

    return this;
  }

  /**
   * Creates and adds a right join to the query.
   */
  public rightJoin(fromAlias: string, join: string, alias: string, condition: string | null = null): this {
    this._join[fromAlias] = this._join[fromAlias] ?? [];
    this._join[fromAlias].push(Join.right(join, alias, condition));
    this.sql = null;

    return this;
  }

  /**
   * Sets a new value for a column in a bulk update query.
   */
  public set(key: string, value: string): this {
    this._set.push(`${key} = ${value}`);
    this.sql = null;

    return this;
  }

  /**
   * Specifies one or more restrictions to the query result.
   * Replaces any previously specified restrictions, if any.
   */
  public where(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this {
    this._where = this.createPredicate(predicate, ...predicates);
    this.sql = null;

    return this;
  }

  /**
   * Adds one or more restrictions to the query results, forming a logical
   * conjunction with any previously specified restrictions.
   */
  public andWhere(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this {
    this._where = this.appendToPredicate(this._where, CompositeExpression.TYPE_AND, predicate, ...predicates);
    this.sql = null;

    return this;
  }

  /**
   * Adds one or more restrictions to the query results, forming a logical
   * disjunction with any previously specified restrictions.
   */
  public orWhere(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this {
    this._where = this.appendToPredicate(this._where, CompositeExpression.TYPE_OR, predicate, ...predicates);
    this.sql = null;

    return this;
  }

  /**
   * Specifies one or more grouping expressions over the results of the query.
   * Replaces any previously specified groupings, if any.
   */
  public groupBy(expression: string, ...expressions: string[]): this {
    this._groupBy = [expression, ...expressions];
    this.sql = null;

    return this;
  }

  /**
   * Adds one or more grouping expressions to the query.
   */
  public addGroupBy(expression: string, ...expressions: string[]): this {
    this._groupBy.push(expression, ...expressions);
    this.sql = null;

    return this;
  }

  /**
   * Sets a value for a column in an insert query.
   */
  public setValue(column: string, value: string): this {
    this._values[column] = value;
    return this;
  }

  /**
   * Specifies values for an insert query indexed by column names.
   * Replaces any previous values, if any.
   */
  public values(values: Record<string, any>): this {
    this._values = values;
    this.sql = null;
    return this;
  }

  /**
   * Specifies a restriction over the groups of the query.
   * Replaces any previous having restrictions, if any.
   */
  public having(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this {
    this._having = this.createPredicate(predicate, ...predicates);
    this.sql = null;
    return this;
  }

  /**
   * Adds a restriction over the groups of the query, forming a logical
   * conjunction with any existing having restrictions.
   */
  public andHaving(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this {
    this._having = this.appendToPredicate(this._having, CompositeExpression.TYPE_AND, predicate, ...predicates);
    this.sql = null;
    return this;
  }

  /**
   * Adds a restriction over the groups of the query, forming a logical
   * disjunction with any existing having restrictions.
   */
  public orHaving(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this {
    this._having = this.appendToPredicate(this._having, CompositeExpression.TYPE_OR, predicate, ...predicates);
    this.sql = null;
    return this;
  }

  /**
   * Creates a CompositeExpression from one or more predicates combined by the AND logic.
   */
  private createPredicate(
    predicate: string | CompositeExpression,
    ...predicates: (string | CompositeExpression)[]
  ): string | CompositeExpression {
    if (predicates.length === 0) {
      return predicate;
    }

    return new CompositeExpression("AND", predicate, ...predicates);
  }

  /**
   * Appends the given predicates combined by the given type of logic to the current predicate.
   */
  private appendToPredicate(
    currentPredicate: string | CompositeExpression | null,
    type: "AND" | "OR",
    ...predicates: (string | CompositeExpression)[]
  ): string | CompositeExpression {
    if (currentPredicate instanceof CompositeExpression && currentPredicate.getType() === type) {
      if (predicates.length === 0) {
        return currentPredicate;
      }
      const [head, ...rest] = predicates;
      if (head === undefined) {
        return currentPredicate;
      }
      return currentPredicate.with(head, ...rest.filter(p => p !== undefined));
    }

    if (currentPredicate !== null) {
      predicates.unshift(currentPredicate);
    } else if (predicates.length === 1) {
      if (predicates[0] === undefined) {
        throw new Error("Predicate cannot be undefined");
      }
      return predicates[0];
    }

    const [first, ...others] = predicates;
    if (first === undefined) {
      throw new Error("Predicate cannot be undefined");
    }
    return new CompositeExpression(type, first, ...others.filter(p => p !== undefined));
  }

  /**
   * Specifies an ordering for the query results.
   * Replaces any previously specified orderings, if any.
   */
  public orderBy(sort: string, order?: string): this {
    const clause = order ? `${sort} ${order}` : sort;
    this._orderBy = [clause];
    this.sql = null;

    return this;
  }

  /**
   * Adds an ordering to the query results.
   */
  public addOrderBy(sort: string, order?: string): this {
    const clause = order ? `${sort} ${order}` : sort;
    this._orderBy.push(clause);
    this.sql = null;

    return this;
  }

  /**
   * Resets the WHERE conditions for the query.
   */
  public resetWhere(): this {
    this._where = null;
    this.sql = null;

    return this;
  }

  /**
   * Resets the grouping for the query.
   */
  public resetGroupBy(): this {
    this._groupBy = [];
    this.sql = null;

    return this;
  }

  /**
   * Resets the HAVING conditions for the query.
   */
  public resetHaving(): this {
    this._having = null;
    this.sql = null;
    return this;
  }

  /**
   * Resets the ordering for the query.
   */
  public resetOrderBy(): this {
    this._orderBy = [];
    this.sql = null;
    return this;
  }

  private getSQLForSelect(): string {
    if (this._select.length === 0) {
      throw new QueryException("No SELECT expressions given. Please use select() or addSelect().");
    }

    const selectParts: string[] = [];
    if (this.commonTableExpressions.length > 0 && this.platform) {
      const [expression, ...rest] = this.commonTableExpressions;
      if (!expression) {
        throw new Error("CommonTableExpression cannot be undefined");
      }
      selectParts.push(this.platform.createWithSQLBuilder().buildSQL(expression, ...rest.filter(e => e !== undefined)));
    }

    if (this.platform) {
      selectParts.push(
        this.platform
          .createSelectSQLBuilder()
          .buildSQL(
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

  private getFromClauses(): string[] {
    const fromClauses: string[] = [];
    const knownAliases: Set<string> = new Set();

    for (const from of this._from) {
      let tableSql: string;
      let tableReference: string;

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

  private verifyAllAliasesAreKnown(knownAliases: Set<string>): void {
    for (const fromAlias in this._join) {
      if (!knownAliases.has(fromAlias)) {
        throw new QueryException(`Unknown alias: ${fromAlias}. Known aliases: ${Array.from(knownAliases).join(", ")}`);
      }
    }
  }

  private getSQLForInsert(): string {
    return `INSERT INTO ${this.table} (${Object.keys(this._values).join(", ")}) VALUES(${Object.values(this._values).join(", ")})`;
  }

  private getSQLForDelete(): string {
    let query = `DELETE FROM ${this.table}`;

    if (this._where !== null) {
      query += ` WHERE ${this._where}`;
    }

    return query;
  }

  private getSQLForUpdate(): string {
    let query = `UPDATE ${this.table} SET ${this._set.join(", ")}`;

    if (this._where !== null) {
      query += ` WHERE ${this._where}`;
    }

    return query;
  }

  private getSQLForUnion(): string {
    const countUnions = this.unionParts.length;
    if (countUnions < 2) {
      throw new QueryException(
        "Insufficient UNION parts given, need at least 2. " +
          "Please use union() and addUnion() to set enough UNION parts."
      );
    }

    return this.platform
      .createUnionSQLBuilder()
      .buildSQL(new UnionQuery(this.unionParts, this._orderBy, new Limit(this.maxResults, this.firstResult)));
  }

  /**
   * Gets a string representation of this QueryBuilder which corresponds to
   * the final SQL query being constructed.
   */
  public toString(): string {
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
  public createNamedParameter(
    value: any,
    type: ParamType = ParameterType.STRING,
    placeHolder: string | null = null
  ): string {
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
  public createPositionalParameter(value: any, type: ParamType = ParameterType.STRING): string {
    this.setParameter(this.boundCounter, value, type);
    this.boundCounter++;

    return "?";
  }

  private getSQLForJoins(fromAlias: string, knownAliases: Set<string>): string {
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
}
