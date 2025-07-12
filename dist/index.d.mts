declare enum ParameterType {
    NULL = "NULL",
    INTEGER = "INTEGER",
    STRING = "STRING",
    LARGE_OBJECT = "LARGE_OBJECT",
    BOOLEAN = "BOOLEAN",
    BINARY = "BINARY",
    ASCII = "ASCII"
}

declare enum ArrayParameterType {
    INTEGER = "INTEGER",
    STRING = "STRING",
    ASCII = "ASCII",
    BINARY = "BINARY"
}
declare namespace ArrayParameterType {
    /**
     * Maps ArrayParameterType to corresponding ParameterType.
     */
    function toElementParameterType(type: ArrayParameterType): ParameterType;
}

declare enum ConflictResolutionMode {
    ORDINARY = 0,
    SKIP_LOCKED = 1
}
declare class ForUpdate {
    readonly conflictResolutionMode: ConflictResolutionMode;
    constructor(conflictResolutionMode: ConflictResolutionMode);
}

declare class Limit {
    readonly maxResults: number | null;
    readonly firstResult: number;
    constructor(maxResults: number | null, firstResult?: number);
    isDefined(): boolean;
    getMaxResults(): number | null;
    getFirstResult(): number;
}

declare class SelectQuery {
    readonly distinct: boolean;
    readonly columns: string[];
    readonly from: string[];
    readonly where: string | null;
    readonly groupBy: string[];
    readonly having: string | null;
    readonly orderBy: string[];
    readonly limit: Limit;
    readonly forUpdate: ForUpdate | null;
    constructor(distinct: boolean, columns: string[], from: string[], where: string | null, groupBy: string[], having: string | null, orderBy: string[], limit: Limit, forUpdate: ForUpdate | null);
}

interface SelectSQLBuilder {
    buildSQL(query: SelectQuery): string;
}

declare enum UnionType {
    ALL = 0,
    DISTINCT = 1
}

declare class Union {
    readonly query: QueryBuilder | string;
    readonly type: UnionType | null;
    constructor(query: QueryBuilder | string, type?: UnionType | null);
}

declare class UnionQuery {
    readonly unionParts: Union[];
    readonly orderBy: string[];
    readonly limit: Limit;
    constructor(unionParts: Union[], orderBy: string[], limit: Limit);
}

interface UnionSQLBuilder {
    buildSQL(query: UnionQuery): string;
}

declare class CommonTableExpression {
    readonly name: string;
    readonly query: string | QueryBuilder;
    readonly columns: string[] | null;
    constructor(name: string, query: string | QueryBuilder, columns: string[] | null);
}

declare class WithSQLBuilder {
    buildSQL(firstExpression: CommonTableExpression, ...otherExpressions: CommonTableExpression[]): string;
}

declare abstract class AbstractPlatform {
    /**
     * Quotes a single identifier (no dot chain separation).
     */
    quoteSingleIdentifier(str: string): string;
    /**
     * Adds a driver-specific LIMIT clause to the query.
     */
    modifyLimitQuery(query: string, limit: number | null, offset?: number): string;
    /**
     * Adds a platform-specific LIMIT clause to the query.
     */
    protected doModifyLimitQuery(query: string, limit: number | null, offset: number): string;
    /**
     * Quotes a literal string.
     * This method is NOT meant to fix SQL injections!
     * It is only meant to escape this platform's string literal
     * quote character inside the given literal string.
     */
    quoteStringLiteral(str: string): string;
    getUnionSelectPartSQL(subQuery: string): string;
    /**
     * Returns the `UNION ALL` keyword.
     */
    getUnionAllSQL(): string;
    /**
     * Returns the compatible `UNION DISTINCT` keyword.
     */
    getUnionDistinctSQL(): string;
    createSelectSQLBuilder(): SelectSQLBuilder;
    createUnionSQLBuilder(): UnionSQLBuilder;
    createWithSQLBuilder(): WithSQLBuilder;
}

declare class CompositeExpression {
    private readonly type;
    static readonly TYPE_AND = "AND";
    static readonly TYPE_OR = "OR";
    private readonly parts;
    constructor(type: "AND" | "OR", part: CompositeExpression | string, ...rest: (CompositeExpression | string)[]);
    static and(part: CompositeExpression | string, ...parts: (CompositeExpression | string)[]): CompositeExpression;
    static or(part: CompositeExpression | string, ...parts: (CompositeExpression | string)[]): CompositeExpression;
    with(part: CompositeExpression | string, ...parts: (CompositeExpression | string)[]): CompositeExpression;
    getType(): "AND" | "OR";
    count(): number;
    toString(): string;
}

declare class ExpressionBuilder {
    static readonly EQ = "=";
    static readonly NEQ = "<>";
    static readonly LT = "<";
    static readonly LTE = "<=";
    static readonly GT = ">";
    static readonly GTE = ">=";
    and(expr: string | CompositeExpression, ...rest: (string | CompositeExpression)[]): CompositeExpression;
    or(expr: string | CompositeExpression, ...rest: (string | CompositeExpression)[]): CompositeExpression;
    comparison(x: string, operator: string, y: string): string;
    eq(x: string, y: string): string;
    neq(x: string, y: string): string;
    lt(x: string, y: string): string;
    lte(x: string, y: string): string;
    gt(x: string, y: string): string;
    gte(x: string, y: string): string;
    isNull(x: string): string;
    isNotNull(x: string): string;
    like(expr: string, pattern: string, escapeChar?: string): string;
    notLike(expr: string, pattern: string, escapeChar?: string): string;
    in(x: string, y: string | string[]): string;
    notIn(x: string, y: string | string[]): string;
}

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
declare class QueryBuilder {
    private readonly platform;
    private sql;
    private params;
    private types;
    private type;
    private boundCounter;
    private firstResult;
    private maxResults;
    private table;
    private unionParts;
    private commonTableExpressions;
    private _select;
    private _distinct;
    private _from;
    private _join;
    private _set;
    private _where;
    private _groupBy;
    private _having;
    private _orderBy;
    private _forUpdate;
    private _values;
    constructor(platform?: AbstractPlatform);
    /**
     * Gets an ExpressionBuilder used for object-oriented construction of query expressions.
     * This producer method is intended for convenient inline usage.
     *
     * For more complex expression construction, consider storing the expression
     * builder object in a local variable.
     */
    expr(): ExpressionBuilder;
    /**
     * Gets the complete SQL string formed by the current specifications of this QueryBuilder.
     */
    getSQL(): string;
    /**
     * Sets a query parameter for the query being constructed.
     */
    setParameter(key: string | number, value: any, type?: ParamType): this;
    /**
     * Sets a query parameter for the query being constructed.
     */
    setParameters(params: Record<string | number, any>, types?: Record<string | number, ParamType>): this;
    /**
     * Gets all defined query parameters for the query being constructed indexed by parameter index or name.
     */
    getParameters(): Record<string | number, any>;
    /**
     * Gets a (previously set) query parameter of the query being constructed.
     */
    getParameter(key: string | number): any;
    /**
     * Gets all defined query parameter types for the query being constructed indexed by parameter index or name.
     */
    getParameterTypes(): Record<string | number, ParamType>;
    /**
     * Gets a (previously set) query parameter type of the query being constructed.
     */
    getParameterType(key: string | number): ParamType;
    /**
     * Sets the position of the first result to retrieve (the "offset").
     */
    setFirstResult(firstResult: number): this;
    /**
     * Gets the position of the first result the query object was set to retrieve (the "offset").
     */
    getFirstResult(): number;
    /**
     * Sets the maximum number of results to retrieve (the "limit").
     */
    setMaxResults(maxResults: number | null): this;
    /**
     * Gets the maximum number of results the query object was set to retrieve (the "limit").
     * Returns NULL if all results will be returned.
     */
    getMaxResults(): number | null;
    /**
     * Locks the queried rows for a subsequent update.
     */
    forUpdate(mode?: ConflictResolutionMode): this;
    /**
     * Specifies union parts to be used to build a UNION query.
     * Replaces any previously specified parts.
     */
    union(part: string | QueryBuilder): this;
    /**
     * Add parts to be used to build a UNION query.
     */
    addUnion(part: string | QueryBuilder, type?: UnionType): this;
    /**
     * Add a Common Table Expression to be used for a select query.
     */
    with(name: string, part: string | QueryBuilder, columns?: string[] | null): this;
    /**
     * Specifies an item that is to be returned in the query result.
     * Replaces any previously specified selections, if any.
     */
    select(...expressions: string[]): this;
    /**
     * Adds or removes DISTINCT to/from the query.
     */
    distinct(distinct?: boolean): this;
    /**
     * Adds an item that is to be returned in the query result.
     */
    addSelect(expression: string, ...expressions: string[]): this;
    /**
     * Turns the query being built into a bulk delete query that ranges over
     * a certain table.
     */
    delete(table: string): this;
    /**
     * Turns the query being built into a bulk update query that ranges over
     * a certain table
     */
    update(table: string): this;
    /**
     * Turns the query being built into an insert query that inserts into
     * a certain table
     */
    insert(table: string): this;
    /**
     * Creates and adds a query root corresponding to the table identified by the
     * given alias, forming a cartesian product with any existing query roots.
     */
    from(table: string, alias?: string | null): this;
    /**
     * Creates and adds a join to the query.
     */
    join(fromAlias: string, join: string, alias: string, condition?: string | null): this;
    /**
     * Creates and adds a join to the query.
     */
    innerJoin(fromAlias: string, join: string, alias: string, condition?: string | null): this;
    /**
     * Creates and adds a left join to the query.
     */
    leftJoin(fromAlias: string, join: string, alias: string, condition?: string | null): this;
    /**
     * Creates and adds a right join to the query.
     */
    rightJoin(fromAlias: string, join: string, alias: string, condition?: string | null): this;
    /**
     * Sets a new value for a column in a bulk update query.
     */
    set(key: string, value: string): this;
    /**
     * Specifies one or more restrictions to the query result.
     * Replaces any previously specified restrictions, if any.
     */
    where(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this;
    /**
     * Adds one or more restrictions to the query results, forming a logical
     * conjunction with any previously specified restrictions.
     */
    andWhere(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this;
    /**
     * Adds one or more restrictions to the query results, forming a logical
     * disjunction with any previously specified restrictions.
     */
    orWhere(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this;
    /**
     * Specifies one or more grouping expressions over the results of the query.
     * Replaces any previously specified groupings, if any.
     */
    groupBy(expression: string, ...expressions: string[]): this;
    /**
     * Adds one or more grouping expressions to the query.
     */
    addGroupBy(expression: string, ...expressions: string[]): this;
    /**
     * Sets a value for a column in an insert query.
     */
    setValue(column: string, value: string): this;
    /**
     * Specifies values for an insert query indexed by column names.
     * Replaces any previous values, if any.
     */
    values(values: Record<string, any>): this;
    /**
     * Specifies a restriction over the groups of the query.
     * Replaces any previous having restrictions, if any.
     */
    having(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this;
    /**
     * Adds a restriction over the groups of the query, forming a logical
     * conjunction with any existing having restrictions.
     */
    andHaving(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this;
    /**
     * Adds a restriction over the groups of the query, forming a logical
     * disjunction with any existing having restrictions.
     */
    orHaving(predicate: string | CompositeExpression, ...predicates: (string | CompositeExpression)[]): this;
    /**
     * Creates a CompositeExpression from one or more predicates combined by the AND logic.
     */
    private createPredicate;
    /**
     * Appends the given predicates combined by the given type of logic to the current predicate.
     */
    private appendToPredicate;
    /**
     * Specifies an ordering for the query results.
     * Replaces any previously specified orderings, if any.
     */
    orderBy(sort: string, order?: string): this;
    /**
     * Adds an ordering to the query results.
     */
    addOrderBy(sort: string, order?: string): this;
    /**
     * Resets the WHERE conditions for the query.
     */
    resetWhere(): this;
    /**
     * Resets the grouping for the query.
     */
    resetGroupBy(): this;
    /**
     * Resets the HAVING conditions for the query.
     */
    resetHaving(): this;
    /**
     * Resets the ordering for the query.
     */
    resetOrderBy(): this;
    private getSQLForSelect;
    private getFromClauses;
    private verifyAllAliasesAreKnown;
    private getSQLForInsert;
    private getSQLForDelete;
    private getSQLForUpdate;
    private getSQLForUnion;
    /**
     * Gets a string representation of this QueryBuilder which corresponds to
     * the final SQL query being constructed.
     */
    toString(): string;
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
    createNamedParameter(value: any, type?: ParamType, placeHolder?: string | null): string;
    /**
     * Creates a new positional parameter and bind the given value to it.
     *
     * Attention: If you are using positional parameters with the query builder you have
     * to be very careful to bind all parameters in the order they appear in the SQL
     * statement , otherwise they get bound in the wrong order which can lead to serious
     * bugs in your code.
     */
    createPositionalParameter(value: any, type?: ParamType): string;
    private getSQLForJoins;
}

export { QueryBuilder };
