using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

using HandStack.Web.MessageContract.Contract;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using HandStack.Core.ExtensionMethod;

namespace transact.Extensions
{
    public class DataMapItemValidator
    {
        private static readonly Regex FormDataPattern = new(@"^FormData\d+$", RegexOptions.Compiled);
        private static readonly Regex GridDataPattern = new(@"^GridData\d+$", RegexOptions.Compiled);
        public class ValidationResult
        {
            public bool IsValid { get; set; }
            public List<string> Errors { get; set; } = [];
        }

        public static ValidationResult ValidateDataMapItems(List<DataMapItem> items, string expressionRules)
        {
            var result = new ValidationResult { IsValid = true };
            if (items == null || items.Count == 0)
            {
                result.IsValid = false;
                result.Errors.Add("DataMapItem 리스트가 null이거나 비어있습니다.");
                return result;
            }
            foreach (var item in items)
            {
                if (ValidateFieldIDPattern(item.FieldID) == false)
                {
                    result.IsValid = false;
                    result.Errors.Add($"잘못된 FieldID 패턴: {item.FieldID}");
                }
                var jsonValidation = ValidateJsonValue(item);
                if (jsonValidation.isValid == false)
                {
                    result.IsValid = false;
                    result.Errors.Add(jsonValidation.error);
                }
            }
            if (result.IsValid && !string.IsNullOrWhiteSpace(expressionRules))
            {
                var rules = expressionRules.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var rule in rules)
                {
                    try
                    {
                        int ruleIndex = rule.IndexOf('|');
                        if (ruleIndex == -1)
                        {
                            throw new FormatException($"규칙 형식이 잘못되었습니다. '조건, 오류 메시지' 형식이어야 합니다: {rule}");
                        }
                        string condition = rule.SubstringSafe(0, ruleIndex).Trim();
                        string errorMessage = rule.SubstringSafe(ruleIndex + 1).Trim();
                        errorMessage = errorMessage.Trim('\'', '"');
                        var evaluationResult = EvaluateExpression(items, condition);
                        if (evaluationResult is bool boolResult && !boolResult)
                        {
                            result.IsValid = false;
                            result.Errors.Add($"규칙 위반: {errorMessage}");
                        }
                    }
                    catch (Exception ex)
                    {
                        result.IsValid = false;
                        result.Errors.Add($"규칙 '{rule}' 평가 오류: {ex.Message}");
                    }
                }
            }
            return result;
        }

        private static bool ValidateFieldIDPattern(string fieldId)
        {
            if (string.IsNullOrWhiteSpace(fieldId)) return false;
            return FormDataPattern.IsMatch(fieldId) || GridDataPattern.IsMatch(fieldId);
        }

        private static (bool isValid, string error) ValidateJsonValue(DataMapItem item)
        {
            if (item.Value == null) return (true, string.Empty);
            try
            {
                JToken parsedToken = item.Value is string jsonStr ? JToken.Parse(jsonStr) : JToken.FromObject(item.Value);
                if (FormDataPattern.IsMatch(item.FieldID) && parsedToken.Type != JTokenType.Object)
                {
                    return (false, $"{item.FieldID}의 Value는 JObject 타입이어야 합니다.");
                }
                if (GridDataPattern.IsMatch(item.FieldID) && parsedToken.Type != JTokenType.Array)
                {
                    return (false, $"{item.FieldID}의 Value는 JArray 타입이어야 합니다.");
                }
            }
            catch (JsonException ex)
            {
                return (false, $"{item.FieldID}의 JSON 파싱 오류: {ex.Message}");
            }
            return (true, string.Empty);
        }

        private static object? EvaluateExpression(List<DataMapItem> items, string expression)
        {
            var parameters = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["null"] = null
            };

            foreach (var item in items)
            {
                if (item.Value != null)
                {
                    parameters[item.FieldID] = JToken.FromObject(item.Value);
                }
            }

            return new ExpressionEvaluator(expression, parameters).Evaluate() ?? false;
        }

        private sealed class ExpressionEvaluator
        {
            private readonly string expression;
            private readonly Dictionary<string, object?> parameters;
            private int position;

            public ExpressionEvaluator(string expression, Dictionary<string, object?> parameters)
            {
                this.expression = expression;
                this.parameters = parameters;
            }

            public object? Evaluate()
            {
                var result = ParseOr();
                SkipWhiteSpace();
                if (position < expression.Length)
                {
                    throw new FormatException($"예상하지 못한 토큰입니다: '{expression[position]}'");
                }

                return result;
            }

            private object? ParseOr()
            {
                var left = ParseAnd();
                while (true)
                {
                    if (MatchKeyword("or") || Match("||"))
                    {
                        var right = ParseAnd();
                        left = ToBoolean(left) || ToBoolean(right);
                        continue;
                    }

                    return left;
                }
            }

            private object? ParseAnd()
            {
                var left = ParseEquality();
                while (true)
                {
                    if (MatchKeyword("and") || Match("&&"))
                    {
                        var right = ParseEquality();
                        left = ToBoolean(left) && ToBoolean(right);
                        continue;
                    }

                    return left;
                }
            }

            private object? ParseEquality()
            {
                var left = ParseRelational();
                while (true)
                {
                    if (Match("=="))
                    {
                        var right = ParseRelational();
                        left = AreEqual(left, right);
                        continue;
                    }

                    if (Match("!="))
                    {
                        var right = ParseRelational();
                        left = !AreEqual(left, right);
                        continue;
                    }

                    return left;
                }
            }

            private object? ParseRelational()
            {
                var left = ParseAdditive();
                while (true)
                {
                    if (Match(">="))
                    {
                        var right = ParseAdditive();
                        left = Compare(left, right) >= 0;
                        continue;
                    }

                    if (Match("<="))
                    {
                        var right = ParseAdditive();
                        left = Compare(left, right) <= 0;
                        continue;
                    }

                    if (Match(">"))
                    {
                        var right = ParseAdditive();
                        left = Compare(left, right) > 0;
                        continue;
                    }

                    if (Match("<"))
                    {
                        var right = ParseAdditive();
                        left = Compare(left, right) < 0;
                        continue;
                    }

                    return left;
                }
            }

            private object? ParseAdditive()
            {
                var left = ParseMultiplicative();
                while (true)
                {
                    if (Match("+"))
                    {
                        var right = ParseMultiplicative();
                        if (TryConvertDecimal(left, out var leftNumber) && TryConvertDecimal(right, out var rightNumber))
                        {
                            left = leftNumber + rightNumber;
                        }
                        else
                        {
                            left = $"{left}{right}";
                        }
                        continue;
                    }

                    if (Match("-"))
                    {
                        var right = ParseMultiplicative();
                        left = ToDecimal(left) - ToDecimal(right);
                        continue;
                    }

                    return left;
                }
            }

            private object? ParseMultiplicative()
            {
                var left = ParseUnary();
                while (true)
                {
                    if (Match("*"))
                    {
                        var right = ParseUnary();
                        left = ToDecimal(left) * ToDecimal(right);
                        continue;
                    }

                    if (Match("/"))
                    {
                        var right = ParseUnary();
                        left = ToDecimal(left) / ToDecimal(right);
                        continue;
                    }

                    if (Match("%"))
                    {
                        var right = ParseUnary();
                        left = ToDecimal(left) % ToDecimal(right);
                        continue;
                    }

                    return left;
                }
            }

            private object? ParseUnary()
            {
                if (MatchKeyword("not") || Match("!"))
                {
                    return !ToBoolean(ParseUnary());
                }

                if (Match("-"))
                {
                    return -ToDecimal(ParseUnary());
                }

                return ParsePrimary();
            }

            private object? ParsePrimary()
            {
                SkipWhiteSpace();
                if (Match("("))
                {
                    var result = ParseOr();
                    Expect(")");
                    return result;
                }

                if (Peek() == '\'' || Peek() == '"')
                {
                    return ParseString();
                }

                if (Peek() == '[')
                {
                    return ParseParameter();
                }

                if (char.IsDigit(Peek()) || Peek() == '.')
                {
                    return ParseNumber();
                }

                if (char.IsLetter(Peek()) || Peek() == '_')
                {
                    var identifier = ParseIdentifier();
                    if (string.Equals(identifier, "true", StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    if (string.Equals(identifier, "false", StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }

                    if (string.Equals(identifier, "null", StringComparison.OrdinalIgnoreCase))
                    {
                        return null;
                    }

                    SkipWhiteSpace();
                    if (Match("("))
                    {
                        var arguments = ParseArguments();
                        return EvaluateFunction(identifier, arguments);
                    }

                    if (parameters.TryGetValue(identifier, out var value))
                    {
                        return value;
                    }

                    throw new FormatException($"알 수 없는 식별자입니다: {identifier}");
                }

                throw new FormatException($"표현식을 해석할 수 없습니다: {expression.Substring(position)}");
            }

            private List<object?> ParseArguments()
            {
                var arguments = new List<object?>();
                SkipWhiteSpace();
                if (Match(")"))
                {
                    return arguments;
                }

                while (true)
                {
                    arguments.Add(ParseOr());
                    SkipWhiteSpace();
                    if (Match(")"))
                    {
                        return arguments;
                    }

                    Expect(",");
                }
            }

            private object? EvaluateFunction(string name, List<object?> arguments)
            {
                switch (name)
                {
                    case "Count":
                        if (arguments.Count == 1 && arguments[0] is JArray jArray)
                        {
                            return jArray.Count;
                        }
                        break;
                    case "HasProperty":
                        if (arguments.Count == 2 && arguments[0] is JObject jObject)
                        {
                            var propName = arguments[1]?.ToString();
                            if (!string.IsNullOrWhiteSpace(propName))
                            {
                                return jObject.ContainsKey(propName);
                            }
                        }
                        break;
                    case "GetProperty":
                        if (arguments.Count == 2 && arguments[0] is JObject jObj)
                        {
                            var propName = arguments[1]?.ToString();
                            if (!string.IsNullOrWhiteSpace(propName) && jObj.TryGetValue(propName, out var token) == true)
                            {
                                return ConvertJTokenToPrimitive(token);
                            }

                            return null;
                        }
                        break;
                    case "GetElement":
                        if (arguments.Count == 2)
                        {
                            if (arguments[0] is JArray jArr)
                            {
                                var index = Convert.ToInt32(arguments[1]);
                                if (index >= 0 && index < jArr.Count)
                                {
                                    return jArr[index];
                                }

                                return null;
                            }
                        }
                        break;
                    case "Sum":
                        if (arguments.Count == 2 && arguments[0] is JArray arrForSum)
                        {
                            var propToSum = arguments[1]?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToSum))
                            {
                                return SumValues(arrForSum, propToSum);
                            }
                        }
                        break;
                    case "Average":
                        if (arguments.Count == 2 && arguments[0] is JArray arrForAvg)
                        {
                            var propToAvg = arguments[1]?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToAvg))
                            {
                                return AverageValues(arrForAvg, propToAvg);
                            }
                        }
                        break;
                    case "Min":
                        if (arguments.Count == 2 && arguments[0] is JArray arrForMin)
                        {
                            var propToMin = arguments[1]?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToMin))
                            {
                                return MinValues(arrForMin, propToMin);
                            }
                        }
                        break;
                    case "Max":
                        if (arguments.Count == 2 && arguments[0] is JArray arrForMax)
                        {
                            var propToMax = arguments[1]?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToMax))
                            {
                                return MaxValues(arrForMax, propToMax);
                            }
                        }
                        break;
                    case "GroupBy":
                        if (arguments.Count == 2 && arguments[0] is JArray arrToGroup)
                        {
                            var propToGroup = arguments[1]?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToGroup))
                            {
                                var grouped = arrToGroup.Children<JObject>()
                                    .GroupBy(jo => jo.TryGetValue(propToGroup, StringComparison.OrdinalIgnoreCase, out var token) ? token.ToString() : "null_key")
                                    .ToDictionary(g => g.Key, g => new JArray(g));
                                return JObject.FromObject(grouped);
                            }
                        }
                        break;
                }

                throw new FormatException($"지원하지 않는 함수이거나 인수가 올바르지 않습니다: {name}");
            }

            private object? ParseParameter()
            {
                Expect("[");
                var start = position;
                while (position < expression.Length && expression[position] != ']')
                {
                    position++;
                }

                if (position >= expression.Length)
                {
                    throw new FormatException("파라미터 닫힘 괄호가 없습니다.");
                }

                var name = expression.Substring(start, position - start).Trim();
                position++;
                return parameters.TryGetValue(name, out var value) ? value : null;
            }

            private string ParseIdentifier()
            {
                SkipWhiteSpace();
                var start = position;
                while (position < expression.Length && (char.IsLetterOrDigit(expression[position]) || expression[position] == '_'))
                {
                    position++;
                }

                return expression.Substring(start, position - start);
            }

            private string ParseString()
            {
                var quote = Peek();
                position++;
                var chars = new List<char>();
                while (position < expression.Length)
                {
                    var current = expression[position++];
                    if (current == '\\' && position < expression.Length)
                    {
                        chars.Add(expression[position++]);
                        continue;
                    }

                    if (current == quote)
                    {
                        return new string(chars.ToArray());
                    }

                    chars.Add(current);
                }

                throw new FormatException("문자열 닫힘 따옴표가 없습니다.");
            }

            private decimal ParseNumber()
            {
                SkipWhiteSpace();
                var start = position;
                var hasDecimalPoint = false;
                while (position < expression.Length)
                {
                    var current = expression[position];
                    if (char.IsDigit(current))
                    {
                        position++;
                        continue;
                    }

                    if (current == '.' && hasDecimalPoint == false)
                    {
                        hasDecimalPoint = true;
                        position++;
                        continue;
                    }

                    break;
                }

                var numberText = expression.Substring(start, position - start);
                if (!decimal.TryParse(numberText, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
                {
                    throw new FormatException($"숫자 형식이 잘못되었습니다: {numberText}");
                }

                return value;
            }

            private bool MatchKeyword(string keyword)
            {
                SkipWhiteSpace();
                if (position + keyword.Length > expression.Length)
                {
                    return false;
                }

                if (!string.Equals(expression.Substring(position, keyword.Length), keyword, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                var end = position + keyword.Length;
                if (end < expression.Length && (char.IsLetterOrDigit(expression[end]) || expression[end] == '_'))
                {
                    return false;
                }

                position = end;
                return true;
            }

            private bool Match(string value)
            {
                SkipWhiteSpace();
                if (!expression.Substring(position).StartsWith(value, StringComparison.Ordinal))
                {
                    return false;
                }

                position += value.Length;
                return true;
            }

            private void Expect(string value)
            {
                if (!Match(value))
                {
                    throw new FormatException($"'{value}' 토큰이 필요합니다.");
                }
            }

            private char Peek()
            {
                SkipWhiteSpace();
                return position < expression.Length ? expression[position] : '\0';
            }

            private void SkipWhiteSpace()
            {
                while (position < expression.Length && char.IsWhiteSpace(expression[position]))
                {
                    position++;
                }
            }

            private static bool ToBoolean(object? value)
            {
                value = ConvertJTokenToPrimitive(value);
                return value switch
                {
                    bool boolValue => boolValue,
                    null => false,
                    string stringValue => bool.TryParse(stringValue, out var boolValue) ? boolValue : !string.IsNullOrWhiteSpace(stringValue),
                    _ when TryConvertDecimal(value, out var number) => number != 0,
                    _ => true
                };
            }

            private static decimal ToDecimal(object? value)
            {
                if (TryConvertDecimal(value, out var number))
                {
                    return number;
                }

                throw new FormatException($"숫자로 변환할 수 없습니다: {value}");
            }

            private static bool TryConvertDecimal(object? value, out decimal number)
            {
                value = ConvertJTokenToPrimitive(value);
                switch (value)
                {
                    case decimal decimalValue:
                        number = decimalValue;
                        return true;
                    case int intValue:
                        number = intValue;
                        return true;
                    case long longValue:
                        number = longValue;
                        return true;
                    case double doubleValue:
                        number = Convert.ToDecimal(doubleValue);
                        return true;
                    case float floatValue:
                        number = Convert.ToDecimal(floatValue);
                        return true;
                    case string stringValue:
                        return decimal.TryParse(stringValue, NumberStyles.Number, CultureInfo.InvariantCulture, out number);
                    default:
                        number = 0m;
                        return false;
                }
            }

            private static bool AreEqual(object? left, object? right)
            {
                left = ConvertJTokenToPrimitive(left);
                right = ConvertJTokenToPrimitive(right);
                if (left == null || right == null)
                {
                    return left == null && right == null;
                }

                if (TryConvertDecimal(left, out var leftNumber) && TryConvertDecimal(right, out var rightNumber))
                {
                    return leftNumber == rightNumber;
                }

                if (left is bool || right is bool)
                {
                    return ToBoolean(left) == ToBoolean(right);
                }

                return string.Equals(left.ToString(), right.ToString(), StringComparison.Ordinal);
            }

            private static int Compare(object? left, object? right)
            {
                left = ConvertJTokenToPrimitive(left);
                right = ConvertJTokenToPrimitive(right);
                if (TryConvertDecimal(left, out var leftNumber) && TryConvertDecimal(right, out var rightNumber))
                {
                    return leftNumber.CompareTo(rightNumber);
                }

                return string.Compare(left?.ToString(), right?.ToString(), StringComparison.Ordinal);
            }
        }

        private static object? ConvertJTokenToPrimitive(object? token)
        {
            if (token is JValue jValue)
            {
                if (jValue.Type == JTokenType.Integer || jValue.Type == JTokenType.Float)
                {
                    return jValue.ToObject<decimal>();
                }
                return jValue.Value;
            }
            return token;
        }

        private static decimal SumValues(JArray source, string propertyName)
        {
            var sum = 0m;
            foreach (var item in source.Children<JObject>())
            {
                if (TryGetDecimalValue(item, propertyName, out var value))
                {
                    sum += value;
                }
            }

            return sum;
        }

        private static decimal AverageValues(JArray source, string propertyName)
        {
            var sum = 0m;
            var count = 0;
            foreach (var item in source.Children<JObject>())
            {
                if (TryGetDecimalValue(item, propertyName, out var value))
                {
                    sum += value;
                    count++;
                }
            }

            return count == 0 ? 0m : sum / count;
        }

        private static decimal MinValues(JArray source, string propertyName)
        {
            var hasValue = false;
            var min = 0m;
            foreach (var item in source.Children<JObject>())
            {
                if (TryGetDecimalValue(item, propertyName, out var value))
                {
                    if (hasValue == false || value < min)
                    {
                        min = value;
                        hasValue = true;
                    }
                }
            }

            return hasValue ? min : 0m;
        }

        private static decimal MaxValues(JArray source, string propertyName)
        {
            var hasValue = false;
            var max = 0m;
            foreach (var item in source.Children<JObject>())
            {
                if (TryGetDecimalValue(item, propertyName, out var value))
                {
                    if (hasValue == false || value > max)
                    {
                        max = value;
                        hasValue = true;
                    }
                }
            }

            return hasValue ? max : 0m;
        }

        private static bool TryGetDecimalValue(JObject source, string propertyName, out decimal value)
        {
            value = 0m;
            if (!source.TryGetValue(propertyName, StringComparison.OrdinalIgnoreCase, out var token))
            {
                return false;
            }

            if (token.Type != JTokenType.Float && token.Type != JTokenType.Integer)
            {
                return false;
            }

            value = token.Value<decimal>();
            return true;
        }

        public static void ValidateAssertRules()
        {
            // 성공 케이스
            var successResponse = new
            {
                ResultJson = @"[
                    { ""id"": ""FormData0"", ""value"": { ""userName"": ""홍길동"", ""age"": 30 } },
                    { ""id"": ""GridData1"", ""value"": [ { ""itemName"": ""상품A"", ""price"": 1000 } ] }
                ]"
            };

            // 실패 케이스 1 (age != 30)
            var failureResponse1 = new
            {
                ResultJson = @"[
                    { ""id"": ""FormData0"", ""value"": { ""userName"": ""홍길동"", ""age"": 25 } },
                    { ""id"": ""GridData1"", ""value"": [ { ""itemName"": ""상품A"" } ] }
                ]"
            };

            // 실패 케이스 2 (blabla 필드 존재)
            var failureResponse2 = new
            {
                ResultJson = @"[
                    { ""id"": ""FormData0"", ""value"": { ""userName"": ""홍길동"", ""blabla"": 25, ""age"": 30 } },
                    { ""id"": ""GridData1"", ""value"": [ { ""itemName"": ""상품A"" } ] }
                ]"
            };

            // GridData 실패 케이스 (필드 누락)
            var gridFailureResponse_FieldMissing = new
            {
                ResultJson = @"[
                    { ""id"": ""FormData0"", ""value"": { ""userName"": ""홍길동"", ""age"": 30 } },
                    { ""id"": ""GridData1"", ""value"": [ { ""itemCode"": ""CODE001"" } ] }
                ]"
            };

            // GridData 실패 케이스 (필드 값 불일치)
            var gridFailureResponse_ValueMismatch = new
            {
                ResultJson = @"[
                    { ""id"": ""FormData0"", ""value"": { ""userName"": ""홍길동"", ""age"": 30 } },
                    { ""id"": ""GridData1"", ""value"": [ { ""itemName"": ""상품B"", ""price"": 2000 } ] }
                ]"
            };

            // 집계 및 그룹화 테스트를 위한 데이터
            var aggregationResponse = new
            {
                ResultJson = @"[
                    { ""id"": ""FormData0"", ""value"": { ""userName"": ""관리자"" } },
                    { ""id"": ""GridData2"", ""value"": [ 
                        { ""category"": ""전자제품"", ""product"": ""노트북"", ""quantity"": 2, ""price"": 1200000 },
                        { ""category"": ""도서"", ""product"": ""C# 교과서"", ""quantity"": 5, ""price"": 32000 },
                        { ""category"": ""전자제품"", ""product"": ""모니터"", ""quantity"": 3, ""price"": 450000 },
                        { ""category"": ""사무용품"", ""product"": ""A4용지"", ""quantity"": 10, ""price"": 6000 },
                        { ""category"": ""도서"", ""product"": ""알고리즘"", ""quantity"": 3, ""price"": 28000 }
                    ]}
                ]"
            };

            Console.WriteLine("--- 성공 케이스 검증 ---");
            var combinedRules = string.Join(";", new[]
{
                "HasProperty([FormData0], 'userName') == true | 'FormData0에는 userName 필드가 필수입니다.'",
                "Count([GridData1]) > 0 | 'GridData1은 최소 1개 이상의 항목이 있어야 합니다.'",
                "Count([GridData1]) <= 100 | 'GridData1의 항목은 최대 100개까지 허용됩니다.'"
            });

            var successOutputs = JsonConvert.DeserializeObject<List<DataMapItem>>(successResponse.ResultJson)!;
            var successResult = ValidateDataMapItems(successOutputs, combinedRules);
            PrintResult(successResult);

            Console.WriteLine("\n--- 실패 케이스 1: 나이 불일치 ---");
            var failureOutputs1 = JsonConvert.DeserializeObject<List<DataMapItem>>(failureResponse1.ResultJson)!;
            var failureResult1 = ValidateDataMapItems(failureOutputs1, "GetProperty([FormData0], 'age') == 30 | '나이는 30세여야 합니다.'");
            PrintResult(failureResult1);

            Console.WriteLine("\n--- 실패 케이스 2: blabla 필드 존재 여부 ---");
            var failureOutputs2 = JsonConvert.DeserializeObject<List<DataMapItem>>(failureResponse2.ResultJson)!;
            var failureResult2 = ValidateDataMapItems(failureOutputs2, "HasProperty([FormData0], 'blabla') == true | 'blabla 필드가 존재해야 합니다.'");
            PrintResult(failureResult2);

            Console.WriteLine("\n--- 실패 케이스 2: age 필드 값 검증 ---");
            var failureOutputs3 = JsonConvert.DeserializeObject<List<DataMapItem>>(failureResponse2.ResultJson)!;
            var failureResult3 = ValidateDataMapItems(failureOutputs3, "GetProperty([FormData0], 'age') == 30 | '나이는 30세여야 합니다.'");
            PrintResult(failureResult3);

            Console.WriteLine("\n--- GridData1 실패 케이스: itemName 필드 누락 ---");
            var gridFailureOutputs1 = JsonConvert.DeserializeObject<List<DataMapItem>>(gridFailureResponse_FieldMissing.ResultJson)!;
            var gridFailureResult1 = ValidateDataMapItems(gridFailureOutputs1, "HasProperty(GetElement([GridData1], 0), 'itemName') == true | 'GridData1의 첫 번째 항목에 itemName 필드는 필수입니다.'");
            PrintResult(gridFailureResult1);

            Console.WriteLine("\n--- GridData1 실패 케이스: itemName 필드 값 불일치 ---");
            var gridFailureOutputs2 = JsonConvert.DeserializeObject<List<DataMapItem>>(gridFailureResponse_ValueMismatch.ResultJson)!;
            var gridFailureResult2 = ValidateDataMapItems(gridFailureOutputs2, "GetProperty(GetElement([GridData1], 0), 'itemName') == '상품A' | 'GridData1의 첫 번째 항목 이름은 \\'상품A\\'여야 합니다.'");
            PrintResult(gridFailureResult2);

            Console.WriteLine("\n--- GridData1 성공 케이스: price 필드 값 검증 ---");
            var gridSuccessOutputs = JsonConvert.DeserializeObject<List<DataMapItem>>(successResponse.ResultJson)!;
            var gridSuccessResult = ValidateDataMapItems(gridSuccessOutputs, "GetProperty(GetElement([GridData1], 0), 'price') == 1000 | 'GridData1의 첫 번째 항목 가격은 1000이어야 합니다.'");
            PrintResult(gridSuccessResult);

            Console.WriteLine("\n--- 집계/그룹화 테스트 ---");
            var aggOutputs = JsonConvert.DeserializeObject<List<DataMapItem>>(aggregationResponse.ResultJson)!;

            // Sum 테스트
            var sumRule = "Sum([GridData2], 'price') > 3000000 | '총 가격 합계는 3,000,000원을 초과해야 합니다.'";
            var sumResult = ValidateDataMapItems(aggOutputs, sumRule);
            Console.WriteLine("\n--- 총 가격 합계 검증 (실패 케이스) ---");
            PrintResult(sumResult);

            // Average 테스트
            var avgRule = "Average([GridData2], 'quantity') > 4 | '평균 수량은 4개를 초과해야 합니다.'";
            var avgResult = ValidateDataMapItems(aggOutputs, avgRule);
            Console.WriteLine("\n--- 평균 수량 검증 (성공 케이스) ---");
            PrintResult(avgResult);

            // Min/Max 테스트
            var minMaxRule = "Min([GridData2], 'price') >= 6000 and Max([GridData2], 'price') <= 1200000  | '가격은 6,000원 이상, 1,200,000원 이하여야 합니다.'";
            var minMaxResult = ValidateDataMapItems(aggOutputs, minMaxRule);
            Console.WriteLine("\n--- 최소/최대 가격 검증 (성공 케이스) ---");
            PrintResult(minMaxResult);

            // GroupBy & Count 테스트
            var groupByCountRule = "Count(GetProperty(GroupBy([GridData2], 'category'), '전자제품')) == 2 | '전자제품 카테고리 항목은 2개여야 합니다.'";
            var groupByCountResult = ValidateDataMapItems(aggOutputs, groupByCountRule);
            Console.WriteLine("\n--- GroupBy 후 카운트 검증 (성공 케이스) ---");
            PrintResult(groupByCountResult);

            // GroupBy & Sum 테스트
            var groupBySumRule = "Sum(GetProperty(GroupBy([GridData2], 'category'), '도서'), 'price') > 100000 | '도서 카테고리의 가격 합계는 100,000원을 초과해야 합니다.'";
            var groupBySumResult = ValidateDataMapItems(aggOutputs, groupBySumRule);
            Console.WriteLine("\n--- GroupBy 후 합계 검증 (실패 케이스) ---");
            PrintResult(groupBySumResult);
        }

        private static void PrintResult(ValidationResult result)
        {
            Console.WriteLine($"검증 결과: {(result.IsValid ? "성공" : "실패")}");
            if (!result.IsValid)
            {
                foreach (var error in result.Errors) Console.WriteLine($"  - 오류: {error}");
            }
        }
    }
}


