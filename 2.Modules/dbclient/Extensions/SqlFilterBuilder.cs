using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

using Dapper;

using dbclient.Entity;
using dbclient.NativeParameters;

using HandStack.Data;
using HandStack.Web.MessageContract.DataObject;

using HtmlAgilityPack;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace dbclient.Extensions
{
    // 요청별로 생성한다. 캐시된 StatementMap이나 QueryObject에는 생성한 매개변수를 기록하지 않는다.
    internal sealed class SqlFilterBuilder
    {
        private static readonly HashSet<string> operators = ["eq", "ne", "lte", "gte", "startsWith", "endsWith", "contains"];
        private static readonly HashSet<DbType> types = [DbType.String, DbType.AnsiString, DbType.Int16, DbType.Int32, DbType.Int64,
            DbType.Decimal, DbType.Double, DbType.Single, DbType.Boolean, DbType.Date, DbType.DateTime, DbType.DateTime2, DbType.DateTimeOffset, DbType.Guid];
        private const string identifier = "(?:[A-Za-z_][A-Za-z0-9_]*|\\[(?:[^\\]\\r\\n]|\\]\\])+\\]|\"(?:[^\"\\r\\n]|\"\")+\"|`(?:[^`\\r\\n]|``)+`)";
        private static readonly Regex columnPattern = new("\\A(?<part>" + identifier + ")(?:\\.(?<part>" + identifier + "))*\\z", RegexOptions.CultureInvariant);
        private static readonly Regex localDatePattern = new(@"\A\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?)?\z", RegexOptions.CultureInvariant);
        private static readonly Regex offsetDatePattern = new(@"\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})\z", RegexOptions.CultureInvariant);

        private readonly DynamicParameters? target;
        private readonly DataProviders provider;
        private readonly string scope;
        private readonly HashSet<string> reservedNames;
        private readonly List<(string Name, SqlFilterParameter Value)> bindings = [];
        private int conditionCount;

        internal SqlFilterBuilder(StatementMap statement, QueryObject? query, object? dynamicParameters, DataProviders provider, string scope)
        {
            this.provider = provider;
            this.scope = scope;
            // NativeDataClient도 내부 Dapper 매개변수를 지원하므로 공급자별 enum 변환을 중복하지 않는다.
            target = dynamicParameters switch
            {
                DynamicParameters value => value,
                SqlServerDynamicParameters value => value.dynamicParameters,
                OracleDynamicParameters value => value.dynamicParameters,
                MySqlDynamicParameters value => value.dynamicParameters,
                NpgsqlDynamicParameters value => value.dynamicParameters,
                SQLiteDynamicParameters value => value.dynamicParameters,
                _ => null
            };
            reservedNames = new HashSet<string>(statement.DbParameters.Select(item => NormalizeName(item.Name)), StringComparer.OrdinalIgnoreCase);
            if (query != null)
            {
                reservedNames.UnionWith(query.Parameters.Select(item => NormalizeName(item.ParameterName)));
            }
            if (target != null)
            {
                reservedNames.UnionWith(target.ParameterNames.Select(NormalizeName));
            }
        }

        internal string Build(HtmlNode node, JObject parameters)
        {
            var parameterName = NormalizeName(Attribute(node, "parameter", "Filters"));
            if (string.IsNullOrWhiteSpace(parameterName))
            {
                throw Error("parameter 이름이 필요합니다.");
            }

            var matches = parameters.Properties().Where(item => NormalizeName(item.Name) == parameterName).ToList();
            if (matches.Count > 1)
            {
                throw Error($"{parameterName} 매개변수가 중복되었습니다.");
            }
            var input = matches.FirstOrDefault()?.Value;
            if (input == null || input.Type == JTokenType.Null || input.Type == JTokenType.Undefined)
            {
                return "";
            }
            if (input.Type != JTokenType.String)
            {
                throw Error($"{parameterName}에는 JSON 배열 문자열을 전달해야 합니다.");
            }
            var text = input.Value<string>();
            if (string.IsNullOrWhiteSpace(text))
            {
                return "";
            }

            JToken parsed;
            try
            {
                using var reader = new JsonTextReader(new StringReader(text)) { DateParseHandling = DateParseHandling.None, MaxDepth = 16 };
                parsed = JToken.Load(reader);
                if (reader.Read())
                {
                    throw Error($"{parameterName}에 하나의 JSON 배열만 전달해야 합니다.");
                }
            }
            catch (JsonException)
            {
                throw Error($"{parameterName}의 JSON 배열 형식이 올바르지 않습니다.");
            }
            if (parsed.Type == JTokenType.Null)
            {
                return "";
            }
            if (parsed is not JArray conditions)
            {
                throw Error($"{parameterName}에는 JSON 배열을 전달해야 합니다.");
            }
            if (conditions.Count == 0)
            {
                return "";
            }
            if (conditions.Count + conditionCount > 1000)
            {
                throw Error("필터 조건은 SQL당 최대 1000개입니다.");
            }
            conditionCount += conditions.Count;
            if (target == null)
            {
                throw Error("필터 SQL을 생성하려면 DB 매개변수 객체를 전달해야 합니다.");
            }

            var groupLogic = Logic(Attribute(node, "groupLogic", "AND"));
            var fields = ReadFields(node);
            var groups = new Dictionary<string, string>(StringComparer.Ordinal);
            var order = new List<string>();
            var selected = new HashSet<(string Group, string Key)>();

            foreach (var token in conditions)
            {
                if (token is not JObject condition)
                {
                    throw Error("각 필터 조건은 객체여야 합니다.");
                }
                var group = RequiredString(condition, "groupID");
                var operation = RequiredString(condition, "operator");
                var logic = Logic(RequiredString(condition, "logic"));
                if (!fields.TryGetValue(group, out var field))
                {
                    throw Error($"등록되지 않은 필터 그룹입니다: {group}");
                }
                if (!operators.Contains(operation) || !field.Operators.Contains(operation))
                {
                    throw Error($"필터 그룹 {group}에서 허용하지 않은 연산자입니다: {operation}");
                }
                var key = condition["key"];
                if (key is not JValue || key.Type is not (JTokenType.String or JTokenType.Integer or JTokenType.Float or JTokenType.Boolean))
                {
                    throw Error($"필터 그룹 {group}의 key에는 비교할 스칼라 값이 필요합니다.");
                }
                var operand = key.Type == JTokenType.String ? key.Value<string>()! : key.ToString(Formatting.None);
                if (!selected.Add((group, operand)))
                {
                    throw Error($"필터 그룹 {group}에 중복된 key가 있습니다.");
                }

                var value = ConvertValue(operand, field.Type, group);
                var comparison = operation switch
                {
                    "eq" => "=",
                    "ne" => "<>",
                    "lte" => "<=",
                    "gte" => ">=",
                    _ => "LIKE"
                };
                if (comparison == "LIKE")
                {
                    if (field.Type is not (DbType.String or DbType.AnsiString))
                    {
                        throw Error($"필터 그룹 {group}의 문자열 검색에는 String 또는 AnsiString 타입이 필요합니다.");
                    }
                    var escaped = operand.Replace("!", "!!").Replace("%", "!%").Replace("_", "!_");
                    if (provider == DataProviders.SqlServer)
                    {
                        escaped = escaped.Replace("[", "![");
                    }
                    value = operation switch
                    {
                        "startsWith" => escaped + "%",
                        "endsWith" => "%" + escaped,
                        _ => "%" + escaped + "%"
                    };
                }

                string expression;
                if (provider == DataProviders.Oracle && operand.Length == 0 && field.Type is DbType.String or DbType.AnsiString && comparison != "LIKE")
                {
                    // Oracle은 빈 문자열을 NULL로 저장한다. = :empty 조건은 참이 되지 않는다.
                    expression = operation switch
                    {
                        "eq" => field.Column + " IS NULL",
                        "ne" => field.Column + " IS NOT NULL",
                        _ => throw Error("Oracle의 빈 문자열에는 eq 또는 ne 비교만 사용할 수 있습니다.")
                    };
                }
                else
                {
                    // Oracle을 포함해 모든 공급자에서 유효한 영문 시작 이름을 사용한다.
                    var name = $"Filter_{scope}_{bindings.Count}";
                    if (!reservedNames.Add(name))
                    {
                        throw Error($"생성할 필터 매개변수 이름이 기존 매개변수와 충돌합니다: {name}");
                    }
                    if (provider == DataProviders.SqlServer && comparison == "LIKE" && value is string pattern &&
                        (field.Type == DbType.String ? pattern.Length > 4000 : System.Text.Encoding.UTF8.GetByteCount(pattern) > 8000))
                    {
                        throw Error("SQL Server의 LIKE 패턴은 Unicode 4000자 또는 ANSI UTF-8 8000바이트 범위여야 합니다.");
                    }
                    bindings.Add((name, new SqlFilterParameter(value, field.Type, provider, field.GuidFormat, field.BooleanFormat)));
                    var marker = provider == DataProviders.Oracle ? ":" : "@";
                    expression = $"{field.Column} {comparison} {marker}{name}" + (comparison == "LIKE" ? " ESCAPE '!'" : "");
                }
                if (groups.TryGetValue(group, out var previous))
                {
                    // 그룹 안에서는 선택 순서대로 결합한다. AND/OR 우선순위가 결과를 바꾸지 않도록 괄호를 둔다.
                    groups[group] = $"({previous} {logic} {expression})";
                }
                else
                {
                    groups.Add(group, expression);
                    order.Add(group);
                }
            }

            return " AND (" + string.Join(" " + groupLogic + " ", order.Select(group => "(" + groups[group] + ")")) + ") ";
        }

        internal void Bind()
        {
            foreach (var binding in bindings)
            {
                target!.Add(binding.Name, binding.Value);
            }
        }

        private Dictionary<string, FilterField> ReadFields(HtmlNode node)
        {
            var fields = new Dictionary<string, FilterField>(StringComparer.Ordinal);
            foreach (var child in node.ChildNodes.Where(item => item.NodeType == HtmlNodeType.Element))
            {
                if (child.Name != "field")
                {
                    throw Error("filters에는 field 요소만 선언할 수 있습니다.");
                }
                var group = Attribute(child, "groupID");
                var column = Attribute(child, "column");
                var typeName = Attribute(child, "type", "String");
                if (string.IsNullOrWhiteSpace(group) || !columnPattern.IsMatch(column))
                {
                    throw Error("field에는 groupID와 단일 컬럼 식별자가 필요합니다.");
                }
                if (!Enum.TryParse<DbType>(typeName, out var type) || !types.Contains(type) || type.ToString() != typeName)
                {
                    throw Error($"필터 그룹 {group}의 type이 지원되지 않습니다: {typeName}");
                }
                var allowed = Attribute(child, "operators", "eq").Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
                if (allowed.Length == 0 || allowed.Any(item => !operators.Contains(item)))
                {
                    throw Error($"필터 그룹 {group}의 operators가 올바르지 않습니다.");
                }
                var guidFormatName = Attribute(child, "guidFormat", "Default");
                if (!Enum.TryParse<FilterGuidFormat>(guidFormatName, out var guidFormat) || guidFormat.ToString() != guidFormatName ||
                    !Enum.IsDefined(guidFormat) || (type != DbType.Guid && guidFormat != FilterGuidFormat.Default))
                {
                    throw Error($"필터 그룹 {group}의 guidFormat이 올바르지 않습니다.");
                }
                var booleanFormatName = Attribute(child, "booleanFormat", "Default");
                if (!Enum.TryParse<FilterBooleanFormat>(booleanFormatName, out var booleanFormat) || booleanFormat.ToString() != booleanFormatName ||
                    !Enum.IsDefined(booleanFormat) || (type != DbType.Boolean && booleanFormat != FilterBooleanFormat.Default))
                {
                    throw Error($"필터 그룹 {group}의 booleanFormat이 올바르지 않습니다.");
                }
                if (!fields.TryAdd(group, new FilterField(FormatColumn(column), type, new HashSet<string>(allowed, StringComparer.Ordinal), guidFormat, booleanFormat)))
                {
                    throw Error($"필터 그룹 정의가 중복되었습니다: {group}");
                }
            }
            return fields;
        }

        private static object ConvertValue(string value, DbType type, string group)
        {
            try
            {
                var culture = CultureInfo.InvariantCulture;
                const NumberStyles number = NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint | NumberStyles.AllowExponent;
                return type switch
                {
                    DbType.String or DbType.AnsiString => value,
                    DbType.Int16 => short.Parse(value, NumberStyles.Integer, culture),
                    DbType.Int32 => int.Parse(value, NumberStyles.Integer, culture),
                    DbType.Int64 => long.Parse(value, NumberStyles.Integer, culture),
                    DbType.Decimal => decimal.Parse(value, number, culture),
                    DbType.Double => double.Parse(value, number, culture) is var d && double.IsFinite(d) ? d : throw new FormatException(),
                    DbType.Single => float.Parse(value, number, culture) is var f && float.IsFinite(f) ? f : throw new FormatException(),
                    DbType.Boolean => value switch { "1" => true, "0" => false, _ => bool.Parse(value) },
                    DbType.Guid => Guid.Parse(value),
                    DbType.Date => ParseLocalDate(value).Date,
                    DbType.DateTime or DbType.DateTime2 => ParseLocalDate(value),
                    DbType.DateTimeOffset => offsetDatePattern.IsMatch(value) ? DateTimeOffset.Parse(value, culture, DateTimeStyles.None).ToUniversalTime() : throw new FormatException(),
                    _ => throw new FormatException()
                };
            }
            catch (Exception exception) when (exception is FormatException or OverflowException)
            {
                throw Error($"필터 그룹 {group}의 key를 {type} 타입으로 변환할 수 없습니다.");
            }
        }

        private static DateTime ParseLocalDate(string value)
        {
            if (!localDatePattern.IsMatch(value)) throw new FormatException();
            return DateTime.SpecifyKind(DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.None), DateTimeKind.Unspecified);
        }

        private string FormatColumn(string column)
        {
            return string.Join(".", columnPattern.Match(column).Groups["part"].Captures.Select(part =>
            {
                var text = part.Value;
                var quoted = text[0] is '[' or '"' or '`';
                if (!quoted && !(provider == DataProviders.Oracle && text[0] == '_')) return text;
                var name = quoted ? text[1..^1].Replace(text[^1].ToString() + text[^1], text[^1].ToString()) : text;
                return provider switch
                {
                    DataProviders.SqlServer => "[" + name.Replace("]", "]]") + "]",
                    DataProviders.MySQL => "`" + name.Replace("`", "``") + "`",
                    _ => "\"" + name.Replace("\"", "\"\"") + "\""
                };
            }));
        }

        private static string NormalizeName(string name) => name.TrimStart('@', ':', '#');

        private static string Attribute(HtmlNode node, string name, string fallback = "") => HtmlEntity.DeEntitize(DatabaseMapper.GetAttributeValue(node, name, fallback));

        private static string RequiredString(JObject item, string name)
        {
            if (item[name]?.Type != JTokenType.String || string.IsNullOrWhiteSpace(item[name]!.Value<string>()))
            {
                throw Error($"필터 조건에 {name} 문자열이 필요합니다.");
            }
            return item[name]!.Value<string>()!;
        }

        private static string Logic(string value) => value is "AND" or "OR" ? value : throw Error("logic과 groupLogic에는 AND 또는 OR만 사용할 수 있습니다.");

        private static InvalidOperationException Error(string message) => new("filters: " + message);

        private sealed record FilterField(string Column, DbType Type, HashSet<string> Operators, FilterGuidFormat GuidFormat, FilterBooleanFormat BooleanFormat);
    }
}
