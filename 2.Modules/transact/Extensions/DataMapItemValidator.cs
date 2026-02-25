using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

using HandStack.Web.MessageContract.Contract;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Expression = NCalc.Expression;

namespace transact.Extensions
{
    public class DataMapItemValidator
    {
        private static readonly Regex FormDataPattern = new Regex(@"^FormData\d+$");
        private static readonly Regex GridDataPattern = new Regex(@"^GridData\d+$");
        public class ValidationResult
        {
            public bool IsValid { get; set; }
            public List<string> Errors { get; set; } = new List<string>();
        }

        public static ValidationResult ValidateDataMapItems(List<DataMapItem> items, string expressionRules)
        {
            var result = new ValidationResult { IsValid = true };
            if (items == null || !items.Any())
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
                        string condition = rule.Substring(0, ruleIndex).Trim();
                        string errorMessage = rule.Substring(ruleIndex + 1).Trim();
                        errorMessage = errorMessage.Trim('\'', '"');
                        var evaluationResult = EvaluateWithNCalc(items, condition);
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

        private static object EvaluateWithNCalc(List<DataMapItem> items, string expression)
        {
            var expr = new Expression(expression);
            expr.Parameters["null"] = null;
            foreach (var item in items)
            {
                if (item.Value != null)
                {
                    expr.Parameters[item.FieldID] = JToken.FromObject(item.Value);
                }
            }
            expr.EvaluateFunction += (name, args) =>
            {
                switch (name)
                {
                    case "Count":
                        if (args.Parameters.Length == 1 && args.Parameters[0].Evaluate() is JArray jArray)
                        {
                            args.Result = jArray.Count;
                        }
                        break;
                    case "HasProperty":
                        if (args.Parameters.Length == 2 && args.Parameters[0].Evaluate() is JObject jObject)
                        {
                            var propName = args.Parameters[1].Evaluate()?.ToString();
                            if (!string.IsNullOrWhiteSpace(propName))
                            {
                                args.Result = jObject.ContainsKey(propName);
                            }
                        }
                        break;
                    case "GetProperty":
                        if (args.Parameters.Length == 2 && args.Parameters[0].Evaluate() is JObject jObj)
                        {
                            var propName = args.Parameters[1].Evaluate()?.ToString();
                            if (!string.IsNullOrWhiteSpace(propName) && jObj.TryGetValue(propName, out var token) == true)
                            {
                                args.Result = ConvertJTokenToPrimitive(token);
                            }
                            else
                            {
                                args.Result = null;
                            }
                        }
                        break;
                    case "GetElement":
                        if (args.Parameters.Length == 2)
                        {
                            if (args.Parameters[0].Evaluate() is JArray jArr)
                            {
                                var index = Convert.ToInt32(args.Parameters[1].Evaluate());
                                if (index >= 0 && index < jArr.Count)
                                {
                                    args.Result = jArr[index];
                                }
                                else
                                {
                                    args.Result = null;
                                }
                            }
                        }
                        break;
                    case "Sum":
                        if (args.Parameters.Length == 2 && args.Parameters[0].Evaluate() is JArray arrForSum)
                        {
                            var propToSum = args.Parameters[1].Evaluate()?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToSum))
                            {
                                args.Result = arrForSum.Children<JObject>()
                                    .Select(jo => jo.TryGetValue(propToSum, StringComparison.OrdinalIgnoreCase, out var token) ? token : null)
                                    .Where(t => t != null && (t.Type == JTokenType.Float || t.Type == JTokenType.Integer))
                                    .Sum(t => t!.Value<decimal>());
                            }
                        }
                        break;
                    case "Average":
                        if (args.Parameters.Length == 2 && args.Parameters[0].Evaluate() is JArray arrForAvg)
                        {
                            var propToAvg = args.Parameters[1].Evaluate()?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToAvg))
                            {
                                var values = arrForAvg.Children<JObject>()
                                    .Select(jo => jo.TryGetValue(propToAvg, StringComparison.OrdinalIgnoreCase, out var token) ? token : null)
                                    .Where(t => t != null && (t.Type == JTokenType.Float || t.Type == JTokenType.Integer))
                                    .Select(t => t!.Value<decimal>())
                                    .ToList();
                                args.Result = values.Any() ? values.Average() : 0m;
                            }
                        }
                        break;
                    case "Min":
                        if (args.Parameters.Length == 2 && args.Parameters[0].Evaluate() is JArray arrForMin)
                        {
                            var propToMin = args.Parameters[1].Evaluate()?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToMin))
                            {
                                var values = arrForMin.Children<JObject>()
                                    .Select(jo => jo.TryGetValue(propToMin, StringComparison.OrdinalIgnoreCase, out var token) ? token : null)
                                    .Where(t => t != null && (t.Type == JTokenType.Float || t.Type == JTokenType.Integer))
                                    .Select(t => t!.Value<decimal>())
                                    .ToList();
                                args.Result = values.Any() ? values.Min() : 0m;
                            }
                        }
                        break;
                    case "Max":
                        if (args.Parameters.Length == 2 && args.Parameters[0].Evaluate() is JArray arrForMax)
                        {
                            var propToMax = args.Parameters[1].Evaluate()?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToMax))
                            {
                                var values = arrForMax.Children<JObject>()
                                    .Select(jo => jo.TryGetValue(propToMax, StringComparison.OrdinalIgnoreCase, out var token) ? token : null)
                                    .Where(t => t != null && (t.Type == JTokenType.Float || t.Type == JTokenType.Integer))
                                    .Select(t => t!.Value<decimal>())
                                    .ToList();
                                args.Result = values.Any() ? values.Max() : 0m;
                            }
                        }
                        break;
                    case "GroupBy":
                        if (args.Parameters.Length == 2 && args.Parameters[0].Evaluate() is JArray arrToGroup)
                        {
                            var propToGroup = args.Parameters[1].Evaluate()?.ToString();
                            if (!string.IsNullOrWhiteSpace(propToGroup))
                            {
                                var grouped = arrToGroup.Children<JObject>()
                                    .GroupBy(jo => jo.TryGetValue(propToGroup, StringComparison.OrdinalIgnoreCase, out var token) ? token.ToString() : "null_key")
                                    .ToDictionary(g => g.Key, g => new JArray(g));
                                args.Result = JObject.FromObject(grouped);
                            }
                        }
                        break;
                }
            };
            var evalResult = expr.Evaluate();
            return evalResult ?? false;
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

