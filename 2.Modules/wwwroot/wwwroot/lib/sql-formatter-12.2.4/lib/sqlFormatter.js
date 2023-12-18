import * as allDialects from './allDialects.js';
import { createDialect } from './dialect.js';
import Formatter from './formatter/Formatter.js';
import { ConfigError, validateConfig } from './validateConfig.js';
const dialectNameMap = {
  bigquery: 'bigquery',
  db2: 'db2',
  hive: 'hive',
  mariadb: 'mariadb',
  mysql: 'mysql',
  n1ql: 'n1ql',
  plsql: 'plsql',
  postgresql: 'postgresql',
  redshift: 'redshift',
  spark: 'spark',
  sqlite: 'sqlite',
  sql: 'sql',
  trino: 'trino',
  transactsql: 'transactsql',
  tsql: 'transactsql',
  // alias for transactsq
  singlestoredb: 'singlestoredb',
  snowflake: 'snowflake'
};
export const supportedDialects = Object.keys(dialectNameMap);
const defaultOptions = {
  tabWidth: 2,
  useTabs: false,
  keywordCase: 'preserve',
  indentStyle: 'standard',
  logicalOperatorNewline: 'before',
  tabulateAlias: false,
  commaPosition: 'after',
  expressionWidth: 50,
  linesBetweenQueries: 1,
  denseOperators: false,
  newlineBeforeSemicolon: false
};
/**
 * Format whitespace in a query to make it easier to read.
 *
 * @param {string} query - input SQL query string
 * @param {FormatOptionsWithLanguage} cfg Configuration options (see docs in README)
 * @return {string} formatted query
 */

export const format = (query, cfg = {}) => {
  if (typeof cfg.language === 'string' && !supportedDialects.includes(cfg.language)) {
    throw new ConfigError(`Unsupported SQL dialect: ${cfg.language}`);
  }

  const canonicalDialectName = dialectNameMap[cfg.language || 'sql'];
  return formatDialect(query, { ...cfg,
    dialect: allDialects[canonicalDialectName]
  });
};
/**
 * Like the above format(), but language parameter is mandatory
 * and must be a Dialect object instead of a string.
 *
 * @param {string} query - input SQL query string
 * @param {FormatOptionsWithDialect} cfg Configuration options (see docs in README)
 * @return {string} formatted query
 */

export const formatDialect = (query, {
  dialect,
  ...cfg
}) => {
  if (typeof query !== 'string') {
    throw new Error('Invalid query argument. Expected string, instead got ' + typeof query);
  }

  const options = validateConfig({ ...defaultOptions,
    ...cfg
  });
  return new Formatter(createDialect(dialect), options).format(query);
};
//# sourceMappingURL=sqlFormatter.js.map