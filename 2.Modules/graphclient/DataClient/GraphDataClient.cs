using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

using graphclient.Encapsulation;
using graphclient.Entity;
using graphclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Neo4j.Driver;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace graphclient.DataClient
{
    public class GraphDataClient : IGraphDataClient
    {
        private readonly Serilog.ILogger logger;
        private readonly GraphClientLoggerClient loggerClient;

        public GraphDataClient(Serilog.ILogger logger, GraphClientLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        public Task ExecuteJsonAsync(DynamicRequest request, DynamicResponse response)
        {
            return ExecuteAsync(request, response, GraphExecutionMode.Json);
        }

        public Task ExecuteScalarAsync(DynamicRequest request, DynamicResponse response)
        {
            return ExecuteAsync(request, response, GraphExecutionMode.Scalar);
        }

        public Task ExecuteNonQueryAsync(DynamicRequest request, DynamicResponse response)
        {
            return ExecuteAsync(request, response, GraphExecutionMode.NonQuery);
        }

        public Task ExecuteSchemeOnlyAsync(DynamicRequest request, DynamicResponse response)
        {
            return ExecuteAsync(request, response, GraphExecutionMode.SchemeOnly);
        }

        public Task ExecuteCodeHelpAsync(DynamicRequest request, DynamicResponse response)
        {
            return ExecuteAsync(request, response, GraphExecutionMode.CodeHelp);
        }

        public Task ExecuteSqlTextAsync(DynamicRequest request, DynamicResponse response)
        {
            response.ExceptionText = "ReturnType SQLText는 graphclient에서 지원하지 않습니다.";
            response.Acknowledge = AcknowledgeType.Failure;
            return Task.CompletedTask;
        }

        public Task ExecuteXmlAsync(DynamicRequest request, DynamicResponse response)
        {
            response.ExceptionText = "ReturnType Xml은 graphclient에서 지원하지 않습니다.";
            response.Acknowledge = AcknowledgeType.Failure;
            return Task.CompletedTask;
        }

        public void Dispose()
        {
        }

        private async Task ExecuteAsync(DynamicRequest request, DynamicResponse response, GraphExecutionMode executionMode)
        {
            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    response.Acknowledge = AcknowledgeType.Failure;
                    return;
                }

                var plans = BuildExecutionPlans(request, response);
                if (plans.Count == 0 || string.IsNullOrWhiteSpace(response.ExceptionText) == false)
                {
                    response.Acknowledge = AcknowledgeType.Failure;
                    return;
                }

                if (request.IsTransaction == true && plans.Select(item => item.DataSourceKey).Distinct(StringComparer.OrdinalIgnoreCase).Count() > 1)
                {
                    response.ExceptionText = "graphclient 트랜잭션은 단일 GraphDataSource만 지원합니다.";
                    response.Acknowledge = AcknowledgeType.Failure;
                    return;
                }

                if (request.IsTransaction == true)
                {
                    await ExecuteWithTransactionAsync(request, response, executionMode, plans);
                }
                else
                {
                    await ExecuteWithoutTransactionAsync(request, response, executionMode, plans);
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                response.Acknowledge = AcknowledgeType.Failure;
            }
        }

        private List<GraphQueryPlan> BuildExecutionPlans(DynamicRequest request, DynamicResponse response)
        {
            var result = new List<GraphQueryPlan>();
            foreach (var queryObject in request.DynamicObjects)
            {
                if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                {
                    queryObject.TenantID = tenantID;
                }

                var statementMap = GraphMapper.GetStatementMap(queryObject.QueryID);
                if (statementMap == null)
                {
                    response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 그래프 계약 정보 필요";
                    return result;
                }

                var dataSourceMap = GraphMapper.GetDataSourceMap(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);
                if (dataSourceMap == null)
                {
                    response.ExceptionText = $"DataSourceID - {statementMap.DataSourceID}에 대한 그래프 원본 정보 필요";
                    return result;
                }

                result.Add(new GraphQueryPlan(queryObject, statementMap, dataSourceMap));
            }

            return result;
        }

        private async Task ExecuteWithTransactionAsync(DynamicRequest request, DynamicResponse response, GraphExecutionMode executionMode, List<GraphQueryPlan> plans)
        {
            var firstPlan = plans[0];
            await using var driver = CreateDriver(firstPlan.DataSource);
            await using var session = CreateSession(driver, firstPlan.DataSource);
            await using var transaction = await session.BeginTransactionAsync(AccessMode.Write, builder => builder.WithTimeout(TimeSpan.FromSeconds(GetTransactionTimeout(plans))));

            try
            {
                var context = new GraphExecutionContext(request, response, executionMode);
                foreach (var plan in plans)
                {
                    if (ApplyBaseFieldMappings(plan, context, out var errorMessage) == false)
                    {
                        response.ExceptionText = errorMessage;
                        response.Acknowledge = AcknowledgeType.Failure;
                        await transaction.RollbackAsync();
                        return;
                    }

                    var queryResult = await ExecuteQueryAsync(transaction, plan);
                    if (ApplyQueryResult(plan, context, queryResult, response) == false)
                    {
                        response.Acknowledge = AcknowledgeType.Failure;
                        await transaction.RollbackAsync();
                        return;
                    }
                }

                await transaction.CommitAsync();
                FinalizeResponse(context, response);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task ExecuteWithoutTransactionAsync(DynamicRequest request, DynamicResponse response, GraphExecutionMode executionMode, List<GraphQueryPlan> plans)
        {
            var context = new GraphExecutionContext(request, response, executionMode);
            var runners = new Dictionary<string, GraphSessionContext>(StringComparer.OrdinalIgnoreCase);

            try
            {
                foreach (var plan in plans)
                {
                    if (ApplyBaseFieldMappings(plan, context, out var errorMessage) == false)
                    {
                        response.ExceptionText = errorMessage;
                        response.Acknowledge = AcknowledgeType.Failure;
                        return;
                    }

                    if (runners.TryGetValue(plan.DataSourceKey, out var sessionContext) == false)
                    {
                        var driver = CreateDriver(plan.DataSource);
                        var session = CreateSession(driver, plan.DataSource);
                        sessionContext = new GraphSessionContext(driver, session);
                        runners.Add(plan.DataSourceKey, sessionContext);
                    }

                    var queryResult = await ExecuteQueryAsync(sessionContext.Session, plan);
                    if (ApplyQueryResult(plan, context, queryResult, response) == false)
                    {
                        response.Acknowledge = AcknowledgeType.Failure;
                        return;
                    }
                }

                FinalizeResponse(context, response);
            }
            finally
            {
                foreach (var sessionContext in runners.Values)
                {
                    await sessionContext.DisposeAsync();
                }
            }
        }

        private bool ApplyBaseFieldMappings(GraphQueryPlan plan, GraphExecutionContext context, out string errorMessage)
        {
            errorMessage = string.Empty;
            if (plan.QueryObject.BaseFieldMappings == null || plan.QueryObject.BaseFieldMappings.Count == 0)
            {
                return true;
            }

            foreach (var baseFieldMapping in plan.QueryObject.BaseFieldMappings)
            {
                var baseSequence = string.IsNullOrWhiteSpace(baseFieldMapping.BaseSequence) ? plan.StatementMap.Seq - 1 : baseFieldMapping.BaseSequence.ParseInt(0);
                if (context.LastRows.TryGetValue(baseSequence, out var row) == false)
                {
                    errorMessage = $"BaseFieldMappings - QueryID: '{plan.QueryObject.QueryID}', Sequence: '{baseSequence}'에 대한 매핑 정보 필요";
                    return false;
                }

                if (row.TryGetValue(baseFieldMapping.SourceFieldID, out var value) == false)
                {
                    errorMessage = $"BaseFieldMappings - QueryID: '{plan.QueryObject.QueryID}', SourceFieldID '{baseFieldMapping.SourceFieldID}' 확인 필요";
                    return false;
                }

                var parameter = plan.QueryObject.Parameters.FirstOrDefault(item => item.ParameterName == baseFieldMapping.TargetFieldID);
                if (parameter == null)
                {
                    plan.QueryObject.Parameters.Add(new DynamicParameter()
                    {
                        ParameterName = baseFieldMapping.TargetFieldID,
                        Value = value
                    });
                }
                else
                {
                    parameter.Value = value;
                }
            }

            return true;
        }

        private bool ApplyQueryResult(GraphQueryPlan plan, GraphExecutionContext context, GraphQueryResult queryResult, DynamicResponse response)
        {
            if (queryResult.LastRow != null)
            {
                context.LastRows[plan.StatementMap.Seq] = queryResult.LastRow;
            }
            else
            {
                context.LastRows[plan.StatementMap.Seq] = new Dictionary<string, object?>();
            }

            switch (context.ExecutionMode)
            {
                case GraphExecutionMode.Json:
                    AppendJsonResult(plan, context, queryResult);
                    break;
                case GraphExecutionMode.Scalar:
                    response.ResultObject = queryResult.Rows.Count > 0 && queryResult.ColumnKeys.Count > 0
                        ? queryResult.Rows[0][queryResult.ColumnKeys[0]]
                        : queryResult.RowsAffected;
                    break;
                case GraphExecutionMode.NonQuery:
                    context.RowsAffected += queryResult.RowsAffected;
                    response.ResultInteger = context.RowsAffected;
                    response.ResultObject = context.RowsAffected;
                    response.RowsAffected = context.RowsAffected;
                    break;
                case GraphExecutionMode.SchemeOnly:
                    AppendSchemaResult(plan, context, queryResult);
                    break;
                case GraphExecutionMode.CodeHelp:
                    response.ResultJson = BuildResponseCodeObject(plan, queryResult);
                    break;
                default:
                    response.ExceptionText = "지원하지 않는 graphclient 실행 모드입니다.";
                    return false;
            }

            return true;
        }

        private void FinalizeResponse(GraphExecutionContext context, DynamicResponse response)
        {
            if (context.ExecutionMode == GraphExecutionMode.Json)
            {
                if (context.AdditionalTable.Columns.Count > 0)
                {
                    context.MergeDatas.Add(GridJson.ToJsonObject("AdditionalData", context.AdditionalTable));
                }

                response.ResultMeta = context.MergeMetaDatas;
                response.ResultJson = context.MergeDatas;
                response.ResultObject = context.MergeDatas;
            }
            else if (context.ExecutionMode == GraphExecutionMode.SchemeOnly)
            {
                response.ResultJson = context.MergeDatas;
            }

            response.Acknowledge = AcknowledgeType.Success;
        }

        private void AppendJsonResult(GraphQueryPlan plan, GraphExecutionContext context, GraphQueryResult queryResult)
        {
            if (plan.QueryObject.IgnoreResult == true)
            {
                context.OutputIndex++;
                return;
            }

            var jsonObjectType = ResolveJsonObjectType(plan.QueryObject, context.OutputIndex);
            var fieldName = GetResultFieldName(jsonObjectType, context.OutputIndex);
            if (jsonObjectType == JsonObjectType.AdditionJson)
            {
                if (context.AdditionalTable.Columns.Count == 0)
                {
                    context.AdditionalTable = queryResult.Table.Clone();
                }

                foreach (DataRow row in queryResult.Table.Rows)
                {
                    context.AdditionalTable.ImportRow(row);
                }
            }
            else
            {
                context.MergeMetaDatas.Add(queryResult.Table.BuildMeta());
                context.MergeDatas.Add(jsonObjectType switch
                {
                    JsonObjectType.FormJson => FormJson.ToJsonObject(fieldName, queryResult.Table),
                    JsonObjectType.jqGridJson => jqGridJson.ToJsonObject(fieldName, queryResult.Table),
                    JsonObjectType.GridJson => GridJson.ToJsonObject(fieldName, queryResult.Table),
                    JsonObjectType.ChartJson => ChartGridJson.ToJsonObject(fieldName, queryResult.Table),
                    JsonObjectType.DataSetJson => DataTableJson.ToJsonObject(fieldName, queryResult.Table),
                    _ => GridJson.ToJsonObject(fieldName, queryResult.Table)
                });
            }

            context.OutputIndex++;
        }

        private void AppendSchemaResult(GraphQueryPlan plan, GraphExecutionContext context, GraphQueryResult queryResult)
        {
            if (plan.QueryObject.IgnoreResult == true)
            {
                context.OutputIndex++;
                return;
            }

            var jsonObjectType = ResolveJsonObjectType(plan.QueryObject, context.OutputIndex);
            var fieldName = GetResultFieldName(jsonObjectType, context.OutputIndex);
            context.MergeDatas.Add(new
            {
                ID = fieldName,
                Value = queryResult.Table.GetDbColumns()
            });
            context.OutputIndex++;
        }

        private static ResponseCodeObject BuildResponseCodeObject(GraphQueryPlan plan, GraphQueryResult queryResult)
        {
            var table = queryResult.Table;
            var responseCodeObject = new ResponseCodeObject()
            {
                Comment = plan.StatementMap.Comment,
                CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                CodeColumnID = table.Columns.Count > 0 ? table.Columns[0].ColumnName : "",
                ValueColumnID = table.Columns.Count > 1 ? table.Columns[1].ColumnName : table.Columns.Count > 0 ? table.Columns[0].ColumnName : "",
                DataSource = table
            };

            foreach (DataColumn column in table.Columns)
            {
                responseCodeObject.Scheme.Add(new Scheme()
                {
                    ColumnID = column.ColumnName,
                    ColumnText = column.ColumnName,
                    ColumnType = JsonExtensions.ToMetaDataType(column.DataType.Name),
                    HiddenYN = false
                });
            }

            return responseCodeObject;
        }

        private async Task<GraphQueryResult> ExecuteQueryAsync(IAsyncQueryRunner queryRunner, GraphQueryPlan plan)
        {
            var parameters = BuildParameters(plan.QueryObject.Parameters);
            IResultCursor cursor;

            if (queryRunner is IAsyncSession session)
            {
                cursor = await session.RunAsync(
                    plan.StatementMap.Cypher,
                    parameters,
                    builder => builder.WithTimeout(TimeSpan.FromSeconds(GetStatementTimeout(plan.StatementMap))));
            }
            else
            {
                cursor = await queryRunner.RunAsync(plan.StatementMap.Cypher, parameters);
            }

            var keys = await cursor.KeysAsync();
            var records = await cursor.ToListAsync();
            var summary = await cursor.ConsumeAsync();
            var rows = records.Select(record => keys.ToDictionary(key => key, key => ConvertGraphValue(record[key]))).ToList();
            var table = ToDataTable(keys, rows);

            return new GraphQueryResult()
            {
                ColumnKeys = keys,
                Rows = rows,
                Table = table,
                LastRow = rows.Count > 0 ? rows[^1] : null,
                RowsAffected = CalculateRowsAffected(summary)
            };
        }

        private static Dictionary<string, object?> BuildParameters(List<DynamicParameter> parameters)
        {
            var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var parameter in parameters)
            {
                if (string.IsNullOrWhiteSpace(parameter.ParameterName))
                {
                    continue;
                }

                var parameterName = NormalizeParameterName(parameter.ParameterName);
                if (string.IsNullOrWhiteSpace(parameterName))
                {
                    continue;
                }

                result[parameterName] = NormalizeParameterValue(parameter.Value);
            }

            return result;
        }

        private static object NormalizeParameterValue(object? value)
        {
            if (value == null)
            {
                return null!;
            }

            if (value is JValue jValue)
            {
                return jValue.Value!;
            }

            if (value is JObject jObject)
            {
                return jObject.Properties().ToDictionary(property => property.Name, property => NormalizeParameterValue(property.Value));
            }

            if (value is JArray jArray)
            {
                return jArray.Select(NormalizeParameterValue).ToList();
            }

            return value;
        }

        private static string NormalizeParameterName(string parameterName)
        {
            var result = parameterName.Trim();
            if (result.StartsWith("${", StringComparison.Ordinal) || result.StartsWith("#{", StringComparison.Ordinal))
            {
                result = result.Substring(2, result.Length - 3);
            }

            if (result.StartsWith("$", StringComparison.Ordinal)
                || result.StartsWith("@", StringComparison.Ordinal)
                || result.StartsWith("#", StringComparison.Ordinal))
            {
                result = result.Substring(1);
            }

            return result.Trim();
        }

        private static JsonObjectType ResolveJsonObjectType(QueryObject queryObject, int outputIndex)
        {
            if (queryObject.JsonObjects != null && queryObject.JsonObjects.Count > outputIndex)
            {
                return queryObject.JsonObjects[outputIndex];
            }

            return queryObject.JsonObject;
        }

        private static string GetResultFieldName(JsonObjectType jsonObjectType, int index)
        {
            return jsonObjectType switch
            {
                JsonObjectType.FormJson => $"FormData{index}",
                JsonObjectType.jqGridJson => $"jqGridData{index}",
                JsonObjectType.GridJson => $"GridData{index}",
                JsonObjectType.ChartJson => $"ChartData{index}",
                JsonObjectType.DataSetJson => $"DataSetData{index}",
                JsonObjectType.AdditionJson => "AdditionalData",
                _ => $"GridData{index}"
            };
        }

        private static IDriver CreateDriver(GraphDataSourceMap dataSource)
        {
            ValidateDataSource(dataSource);
            return string.IsNullOrWhiteSpace(dataSource.UserName) && string.IsNullOrWhiteSpace(dataSource.Password)
                ? GraphDatabase.Driver(dataSource.ConnectionString)
                : GraphDatabase.Driver(dataSource.ConnectionString, AuthTokens.Basic(dataSource.UserName, dataSource.Password));
        }

        private static IAsyncSession CreateSession(IDriver driver, GraphDataSourceMap dataSource)
        {
            return driver.AsyncSession(builder =>
            {
                builder.WithDefaultAccessMode(AccessMode.Write);
                if (dataSource.GraphProvider.Equals("Neo4j", StringComparison.OrdinalIgnoreCase) == true
                    && string.IsNullOrWhiteSpace(dataSource.Database) == false)
                {
                    builder.WithDatabase(dataSource.Database);
                }
            });
        }

        private static void ValidateDataSource(GraphDataSourceMap dataSource)
        {
            if (Uri.TryCreate(dataSource.ConnectionString, UriKind.Absolute, out var connectionUri) == false)
            {
                throw new InvalidOperationException($"GraphDataSource '{dataSource.DataSourceID}' ConnectionString 형식 확인 필요");
            }

            if (connectionUri.Scheme.Equals("bolt", StringComparison.OrdinalIgnoreCase) == false
                && connectionUri.Scheme.Equals("neo4j", StringComparison.OrdinalIgnoreCase) == false)
            {
                throw new InvalidOperationException($"GraphDataSource '{dataSource.DataSourceID}'는 bolt:// 또는 neo4j:// URI만 지원합니다.");
            }

            if (dataSource.GraphProvider.Equals("Neo4j", StringComparison.OrdinalIgnoreCase) == false
                && dataSource.GraphProvider.Equals("Memgraph", StringComparison.OrdinalIgnoreCase) == false)
            {
                throw new InvalidOperationException($"GraphProvider '{dataSource.GraphProvider}'는 지원하지 않습니다.");
            }
        }

        private static int GetStatementTimeout(GraphStatementMap statementMap)
        {
            return statementMap.Timeout <= 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout;
        }

        private static int GetTransactionTimeout(List<GraphQueryPlan> plans)
        {
            return Math.Max(ModuleConfiguration.DefaultCommandTimeout, plans.Max(item => GetStatementTimeout(item.StatementMap)));
        }

        private static int CalculateRowsAffected(IResultSummary summary)
        {
            var counters = summary.Counters;
            return counters.NodesCreated
                + counters.NodesDeleted
                + counters.RelationshipsCreated
                + counters.RelationshipsDeleted
                + counters.PropertiesSet
                + counters.LabelsAdded
                + counters.LabelsRemoved
                + counters.IndexesAdded
                + counters.IndexesRemoved
                + counters.ConstraintsAdded
                + counters.ConstraintsRemoved
                + counters.SystemUpdates;
        }

        private static object? ConvertGraphValue(object? value)
        {
            if (value == null)
            {
                return null;
            }

            if (value is INode node)
            {
                return new Dictionary<string, object?>()
                {
                    ["elementId"] = node.ElementId,
                    ["labels"] = node.Labels.ToList(),
                    ["properties"] = node.Properties.ToDictionary(item => item.Key, item => ConvertGraphValue(item.Value))
                };
            }

            if (value is IRelationship relationship)
            {
                return new Dictionary<string, object?>()
                {
                    ["elementId"] = relationship.ElementId,
                    ["type"] = relationship.Type,
                    ["startNodeElementId"] = relationship.StartNodeElementId,
                    ["endNodeElementId"] = relationship.EndNodeElementId,
                    ["properties"] = relationship.Properties.ToDictionary(item => item.Key, item => ConvertGraphValue(item.Value))
                };
            }

            if (value is IPath path)
            {
                return new Dictionary<string, object?>()
                {
                    ["start"] = ConvertGraphValue(path.Start),
                    ["end"] = ConvertGraphValue(path.End),
                    ["nodes"] = path.Nodes.Select(ConvertGraphValue).ToList(),
                    ["relationships"] = path.Relationships.Select(ConvertGraphValue).ToList()
                };
            }

            if (value is IDictionary<string, object?> nullableDictionary)
            {
                return nullableDictionary.ToDictionary(item => item.Key, item => ConvertGraphValue(item.Value));
            }

            if (value is IDictionary<string, object> dictionary)
            {
                return dictionary.ToDictionary(item => item.Key, item => ConvertGraphValue(item.Value));
            }

            if (value is byte[] bytes)
            {
                return Convert.ToBase64String(bytes);
            }

            if (value is IEnumerable<object?> enumerable && value is not string)
            {
                return enumerable.Select(ConvertGraphValue).ToList();
            }

            var valueNamespace = value.GetType().Namespace;
            return valueNamespace != null && valueNamespace.StartsWith("Neo4j.Driver", StringComparison.Ordinal)
                ? value.ToString()
                : value;
        }

        private static DataTable ToDataTable(IReadOnlyList<string> keys, List<Dictionary<string, object?>> rows)
        {
            var dataTable = new DataTable("GraphResult");
            foreach (var key in keys)
            {
                dataTable.Columns.Add(key, InferColumnType(key, rows));
            }

            foreach (var row in rows)
            {
                var dataRow = dataTable.NewRow();
                foreach (var key in keys)
                {
                    dataRow[key] = row.TryGetValue(key, out var value) ? value ?? DBNull.Value : DBNull.Value;
                }
                dataTable.Rows.Add(dataRow);
            }

            return dataTable;
        }

        private static Type InferColumnType(string key, List<Dictionary<string, object?>> rows)
        {
            foreach (var row in rows)
            {
                if (row.TryGetValue(key, out var value) == true && value != null)
                {
                    var valueType = value.GetType();
                    if (valueType.IsPrimitive
                        || valueType == typeof(string)
                        || valueType == typeof(decimal)
                        || valueType == typeof(DateTime)
                        || valueType == typeof(DateTimeOffset)
                        || valueType == typeof(TimeSpan)
                        || valueType == typeof(Guid))
                    {
                        return valueType;
                    }

                    return typeof(object);
                }
            }

            return typeof(string);
        }
    }

    internal enum GraphExecutionMode
    {
        Json,
        Scalar,
        NonQuery,
        SchemeOnly,
        CodeHelp
    }

    internal sealed record GraphQueryPlan(QueryObject QueryObject, GraphStatementMap StatementMap, GraphDataSourceMap DataSource)
    {
        public string DataSourceKey => $"{DataSource.ApplicationID}|{DataSource.DataSourceID}|{DataSource.GraphProvider}|{DataSource.ConnectionString}|{DataSource.Database}";
    }

    internal sealed class GraphQueryResult
    {
        public IReadOnlyList<string> ColumnKeys { get; set; } = Array.Empty<string>();

        public List<Dictionary<string, object?>> Rows { get; set; } = new();

        public Dictionary<string, object?>? LastRow { get; set; }

        public DataTable Table { get; set; } = new DataTable();

        public int RowsAffected { get; set; }
    }

    internal sealed class GraphExecutionContext
    {
        public GraphExecutionContext(DynamicRequest request, DynamicResponse response, GraphExecutionMode executionMode)
        {
            Request = request;
            Response = response;
            ExecutionMode = executionMode;
        }

        public DynamicRequest Request { get; }

        public DynamicResponse Response { get; }

        public GraphExecutionMode ExecutionMode { get; }

        public int OutputIndex { get; set; }

        public int RowsAffected { get; set; }

        public List<string> MergeMetaDatas { get; } = new();

        public List<object> MergeDatas { get; } = new();

        public Dictionary<int, Dictionary<string, object?>> LastRows { get; } = new();

        public DataTable AdditionalTable { get; set; } = new DataTable("AdditionalData");
    }

    internal sealed class GraphSessionContext : IAsyncDisposable
    {
        public GraphSessionContext(IDriver driver, IAsyncSession session)
        {
            Driver = driver;
            Session = session;
        }

        public IDriver Driver { get; }

        public IAsyncSession Session { get; }

        public async ValueTask DisposeAsync()
        {
            await Session.DisposeAsync();
            await Driver.DisposeAsync();
        }
    }
}
