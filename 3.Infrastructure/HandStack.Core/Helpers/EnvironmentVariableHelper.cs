using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace HandStack.Core.Helpers
{
    /// <summary>
    /// 설정 파일의 경로 값에 포함된 환경변수 표기(%NAME%, $NAME, ${NAME})를 치환한다.
    /// </summary>
    public static partial class EnvironmentVariableHelper
    {
        /// <summary>
        /// 문자열 안의 %NAME%, ${NAME}, $NAME 표기를 환경변수 값으로 한 번에 치환한다.
        /// 값이 없거나 비어 있는 변수는 원문 표기를 그대로 두고 변수명을 <paramref name="unresolvedNames"/>에 추가한다.
        /// </summary>
        /// <param name="value">치환할 문자열</param>
        /// <param name="unresolvedNames">치환하지 못한 변수명을 수집할 컬렉션. null이면 수집하지 않는다.</param>
        public static string Expand(string? value, ICollection<string>? unresolvedNames = null)
        {
            if (string.IsNullOrEmpty(value) == true)
            {
                return "";
            }

            return VariableRegex().Replace(value, match =>
            {
                var variableName = match.Groups["name"].Value;
                var variableValue = Environment.GetEnvironmentVariable(variableName);
                if (string.IsNullOrEmpty(variableValue) == true)
                {
                    if (unresolvedNames != null && unresolvedNames.Contains(variableName) == false)
                    {
                        unresolvedNames.Add(variableName);
                    }

                    return match.Value;
                }

                return variableValue;
            });
        }

        // %NAME%은 ProgramFiles(x86)처럼 괄호가 들어간 이름을 허용하되 경로 구분자와 공백이 든 구간(예: "50%/a/%")은 변수로 보지 않는다.
        [GeneratedRegex(@"%(?<name>[^%\s\\/:*?""<>|]+)%|\$\{(?<name>[A-Za-z_][A-Za-z0-9_]*)\}|\$(?<name>[A-Za-z_][A-Za-z0-9_]*)")]
        private static partial Regex VariableRegex();
    }
}
