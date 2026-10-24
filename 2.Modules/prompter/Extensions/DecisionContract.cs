using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

using HtmlAgilityPack;

using Newtonsoft.Json.Linq;

using prompter.Entity;

namespace prompter.Extensions
{
    // XML 판단 계약을 읽고 질문 기준과 모델 응답의 유효성을 검사합니다.
    public static class DecisionContract
    {
        // Ollama 클라우드의 이미지 개수 제한에 맞춘 계약당 최대 이미지 수입니다.
        public const int MaxImages = 4;

        public static PromptDecision? Parse(HtmlNode statement, PromptMap map)
        {
            var nodes = statement.SelectNodes("decision");
            if (nodes == null)
            {
                return null;
            }

            if (nodes.Count != 1)
            {
                throw new InvalidDataException("판단 계약(decision)은 실행 구문(statement)마다 하나만 선언해야 합니다.");
            }

            if (statement.SelectNodes("message|tools|body|headers|authorization") != null)
            {
                throw new InvalidDataException("판단 계약(decision)은 메시지(message), 도구(tools), 본문(body), 헤더(headers), 인증(authorization) 요소와 함께 사용할 수 없습니다.");
            }

            // 판단 계약의 미디어는 이미지만 허용하며 모든 질문이 공유합니다.
            if (map.MediaVariables.Count > MaxImages || map.MediaVariables.Any(p => p.Type != "Image") == true)
            {
                throw new InvalidDataException($"판단 계약(decision)의 미디어(media)는 이미지(Image) 형식만 최대 {MaxImages}개까지 선언할 수 있습니다.");
            }

            if (map.Timeout < 0 || map.Timeout > 300)
            {
                throw new InvalidDataException("판단 계약의 제한 시간(timeout)은 0(기본 30초) 또는 1~300초여야 합니다.");
            }

            var state = nodes[0].GetAttributeValue("state", "");
            if (state.StartsWith('@') == false || state.Length < 2
                || map.InputVariables.Count(p => string.Equals(PromptMapper.NormalizeParameterName(p.Name), state[1..], StringComparison.OrdinalIgnoreCase)) != 1)
            {
                throw new InvalidDataException("판단 입력(state)은 선언된 매개변수(param)를 @이름 형식으로 참조해야 합니다.");
            }

            // XML 로더가 인코딩한 CDATA 내용을 복원하고 중복된 질문 이름을 거부합니다.
            var questions = JObject.Parse(HtmlEntity.DeEntitize(nodes[0].InnerText), new JsonLoadSettings
            {
                DuplicatePropertyNameHandling = DuplicatePropertyNameHandling.Error
            });
            ValidateQuestions(questions);

            return new PromptDecision(state[1..], questions);
        }

        public static void ValidateQuestions(JObject questions)
        {
            if (questions.Count is < 1 or > 64)
            {
                Invalid("questions_count");
            }

            foreach (var property in questions.Properties())
            {
                if (Regex.IsMatch(property.Name, "^[A-Za-z0-9_.-]{1,100}$", RegexOptions.CultureInvariant, TimeSpan.FromSeconds(1)) == false)
                {
                    Invalid("question_name");
                }

                if (property.Value is not JObject question)
                {
                    throw new InvalidDataException("[decision_invalid_question] 각 질문은 JSON 객체여야 합니다.");
                }

                if (question["instructions"]?.Type != JTokenType.String || string.IsNullOrWhiteSpace((string?)question["instructions"]) == true)
                {
                    Invalid("instructions");
                }

                var type = (string?)question["type"];
                var criteria = question["criteria"];
                if (type == "choice")
                {
                    if (criteria is not JObject choices || choices.Count is < 2 or > 26
                        || choices.Properties().Any(p => string.IsNullOrWhiteSpace(p.Name) == true || IsText(p.Value) == false) == true)
                    {
                        Invalid("choice_criteria");
                    }
                }
                else if (type == "score")
                {
                    if (criteria is not JArray levels || levels.Count is < 2 or > 10 || levels.Any(p => IsText(p) == false) == true)
                    {
                        Invalid("score_criteria");
                    }
                }
                else if (type == "noul")
                {
                    if (criteria != null && (criteria is not JObject binary || binary.Count != 2 || IsText(binary["true"]) == false || IsText(binary["false"]) == false))
                    {
                        Invalid("noul_criteria");
                    }
                }
                else
                {
                    Invalid("question_type");
                }
            }
        }

        public static void ValidateResponse(JObject response, JObject questions)
        {
            if (response["answers"] is not JObject answers || answers.Count != questions.Count)
            {
                throw new InvalidDataException("[decision_invalid_response] 응답의 답변 목록은 질문 수와 일치하는 JSON 객체여야 합니다.");
            }

            foreach (var property in questions.Properties())
            {
                var question = (JObject)property.Value;
                if (answers[property.Name] is not JObject answer || (string?)answer["type"] != (string?)question["type"])
                {
                    throw new InvalidDataException("[decision_invalid_response] 질문에 해당하는 답변이 없거나 답변 유형이 일치하지 않습니다.");
                }

                var type = (string?)question["type"];
                if (type == "noul")
                {
                    // 확률형 답변은 참일 확률만 검사하며 별도의 확신도를 요구하지 않습니다.
                    Unit(answer["noul"]);
                    continue;
                }

                Unit(answer["confidence"]);
                var keys = type == "choice" ? ((JObject)question["criteria"]!).Properties().Select(p => p.Name).ToArray()
                    : Enumerable.Range(0, ((JArray)question["criteria"]!).Count).Select(i => i.ToString()).ToArray();
                if (answer["probabilities"] is not JObject probabilities || probabilities.Count != keys.Length || keys.Any(k => probabilities[k] == null) == true)
                {
                    throw new InvalidDataException("[decision_invalid_response] 답변의 확률 분포는 계약에 선언된 모든 선택지 또는 점수 단계를 포함해야 합니다.");
                }

                var values = keys.Select(k => Unit(probabilities[k])).ToArray();
                // 응답의 반올림 오차를 허용하면서 전체 확률의 합을 검사합니다.
                if (Math.Abs(values.Sum() - 1) > 0.015)
                {
                    Invalid("response");
                }

                if (type == "choice")
                {
                    var choice = (string?)answer["choice"];
                    if (choice == null || keys.Contains(choice) == false || Unit(probabilities[choice]) + 0.001 < values.Max())
                    {
                        Invalid("response");
                    }
                }
                else
                {
                    var score = Number(answer["score"]);
                    // 점수는 단계별 확률에 해당 단계의 값을 곱한 가중합과 일치해야 합니다.
                    if (score < 0 || score > keys.Length - 1 || Math.Abs(score - values.Select((p, i) => p * i).Sum()) > 0.025)
                    {
                        Invalid("response");
                    }

                    if (answer["legend"] is not JObject legend || legend.Count != keys.Length || keys.Any(k => IsText(legend[k]) == false) == true)
                    {
                        Invalid("response");
                    }
                }
            }
        }

        private static bool IsText(JToken? value)
        {
            return value?.Type == JTokenType.String && string.IsNullOrWhiteSpace((string?)value) == false;
        }

        private static double Number(JToken? token)
        {
            if (token == null || token.Type is not (JTokenType.Float or JTokenType.Integer))
            {
                throw new InvalidDataException("[decision_invalid_response] 판단 응답의 수치는 정수 또는 실수여야 합니다.");
            }

            var value = token.Value<double>();
            if (double.IsFinite(value) == false)
            {
                Invalid("response");
            }

            return value;
        }

        private static double Unit(JToken? token)
        {
            var value = Number(token);
            if (value < 0 || value > 1)
            {
                Invalid("response");
            }

            return value;
        }

        private static void Invalid(string code)
        {
            // 호출 측에서 식별할 수 있도록 오류 코드를 유지하고 한국어 설명을 덧붙입니다.
            var message = code switch
            {
                "questions_count" => "판단 질문은 1~64개여야 합니다.",
                "question_name" => "질문 이름은 영문, 숫자, 밑줄, 마침표, 하이픈으로 구성된 1~100자 문자열이어야 합니다.",
                "instructions" => "질문의 지시문(instructions)은 비어 있지 않은 문자열이어야 합니다.",
                "choice_criteria" => "선택형 질문(choice)은 이름과 설명이 비어 있지 않은 선택지를 2~26개 지정해야 합니다.",
                "score_criteria" => "점수형 질문(score)은 비어 있지 않은 단계별 설명을 2~10개 지정해야 합니다.",
                "noul_criteria" => "확률형 질문(noul)의 판단 기준은 생략하거나 참(true)과 거짓(false)의 설명을 함께 지정해야 합니다.",
                "question_type" => "지원하지 않는 질문 유형입니다. choice, score, noul 중 하나를 지정하세요.",
                "response" => "판단 응답의 값이나 형식이 계약과 일치하지 않습니다.",
                _ => "판단 계약의 값이나 형식이 올바르지 않습니다."
            };

            throw new InvalidDataException($"[decision_invalid_{code}] {message}");
        }
    }
}
