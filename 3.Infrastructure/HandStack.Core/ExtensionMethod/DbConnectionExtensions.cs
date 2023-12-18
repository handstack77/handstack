using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;

namespace HandStack.Core.ExtensionMethod
{
    public static class DbConnectionExtensions
    {
        public static bool IsConnectionOpen(this DbConnection @this)
        {
            return @this.State == ConnectionState.Open;
        }

        public static bool IsConnectionOpen(this IDbConnection @this)
        {
            return @this.State == ConnectionState.Open;
        }

        public static void EnsureOpen(this DbConnection @this)
        {
            if (@this.State == ConnectionState.Closed)
            {
                @this.Open();
            }
        }

        public static void EnsureOpen(this IDbConnection @this)
        {
            if (@this.State == ConnectionState.Closed)
            {
                @this.Open();
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction) where T : new()
        {
            using (DbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, Action<DbCommand> commandFactory) where T : new()
        {
            using (DbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText, DbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText, CommandType commandType, DbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, commandType, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText, DbParameter[]? parameters) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText, DbParameter[]? parameters, DbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, parameters, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType, IDbTransaction? transaction) where T : new()
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    foreach (var item in parameters)
                    {
                        command.Parameters.Add(item);
                    }
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, Action<IDbCommand> commandFactory) where T : new()
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText, IDbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText, CommandType commandType, IDbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, null, commandType, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters, IDbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(commandText, parameters, commandType, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction) where T : new()
        {
            using (DbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this DbConnection @this, Action<DbCommand> commandFactory) where T : new()
        {
            using (DbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText, DbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, commandType, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText, CommandType commandType, DbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, commandType, transaction);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText, DbParameter[]? parameters) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, parameters, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText, DbParameter[]? parameters, DbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, parameters, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, parameters, commandType, null);
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType, IDbTransaction? transaction) where T : new()
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    foreach (var item in parameters)
                    {
                        command.Parameters.Add(item);
                    }
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, Action<IDbCommand> commandFactory) where T : new()
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText, IDbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, commandType, null);
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText, CommandType commandType, IDbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, null, commandType, transaction);
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, parameters, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters, IDbTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, parameters, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(commandText, parameters, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction)
        {
            using (DbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, Action<DbCommand> commandFactory)
        {
            using (DbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText)
        {
            return @this.ExecuteExpandoObject(commandText, null, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText, DbTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(commandText, null, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(commandText, null, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText, CommandType commandType, DbTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(commandText, null, commandType, transaction);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText, DbParameter[]? parameters)
        {
            return @this.ExecuteExpandoObject(commandText, parameters, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText, DbParameter[]? parameters, DbTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(commandText, parameters, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(commandText, parameters, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType, IDbTransaction? transaction)
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    foreach (var item in parameters)
                    {
                        command.Parameters.Add(item);
                    }
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, Action<IDbCommand> commandFactory)
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText)
        {
            return @this.ExecuteExpandoObject(commandText, null, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText, IDbTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(commandText, null, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(commandText, null, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText, CommandType commandType, IDbTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(commandText, null, commandType, transaction);
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText, IDataParameter[]? parameters)
        {
            return @this.ExecuteExpandoObject(commandText, parameters, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText, IDataParameter[]? parameters, IDbTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(commandText, parameters, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(commandText, parameters, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction)
        {
            using (DbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, Action<DbCommand> commandFactory)
        {
            using (DbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText)
        {
            return @this.ExecuteExpandoObjects(commandText, null, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText, DbTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(commandText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(commandText, null, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText, CommandType commandType, DbTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(commandText, null, commandType, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText, DbParameter[]? parameters)
        {
            return @this.ExecuteExpandoObjects(commandText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText, DbParameter[]? parameters, DbTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(commandText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string commandText, DbParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(commandText, parameters, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType, IDbTransaction? transaction)
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                command.CommandText = commandText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    foreach (var item in parameters)
                    {
                        command.Parameters.Add(item);
                    }
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, Action<IDbCommand> commandFactory)
        {
            using (IDbCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText)
        {
            return @this.ExecuteExpandoObjects(commandText, null, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText, IDbTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(commandText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(commandText, null, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText, CommandType commandType, IDbTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(commandText, null, commandType, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText, IDataParameter[]? parameters)
        {
            return @this.ExecuteExpandoObjects(commandText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText, IDataParameter[]? parameters, IDbTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(commandText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this IDbConnection @this, string commandText, IDataParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(commandText, parameters, commandType, null);
        }
    }
}
