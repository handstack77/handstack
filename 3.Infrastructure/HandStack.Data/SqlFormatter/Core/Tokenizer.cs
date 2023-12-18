using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace HandStack.Data.SqlFormatter.Core
{
    internal class Tokenizer
    {
        private static readonly Regex NumberRegex = new(@"^((-\s*)?[0-9]+(\.[0-9]+)?([eE]-?[0-9]+(\.[0-9]+)?)?|0x[0-9a-fA-F]+|0b[01]+)\b", RegexOptions.Compiled, RegexFactory.DefaultMatchTimeout);
        private static readonly Regex BlockCommentRegex = new(@"^(\/\*(.*?)*?(?:\*\/|$))", RegexOptions.Singleline | RegexOptions.Compiled, RegexFactory.DefaultMatchTimeout);

        private readonly Regex operatorRegex;
        private readonly Regex lineCommentRegex;
        private readonly Regex reservedTopLevelRegex;
        private readonly Regex reservedTopLevelNoIndentRegex;
        private readonly Regex reservedNewLineRegex;
        private readonly Regex reservedPlainRegex;
        private readonly Regex wordRegex;
        private readonly Regex stringRegex;
        private readonly Regex openParenRegex;
        private readonly Regex closeParenRegex;
        private readonly Regex? indexedPlaceholderRegex;
        private readonly Regex? indentNamedPlaceholderRegex;

        public Tokenizer(
            string[] reservedWords,
            string[] reservedTopLevelWords,
            string[] reservedNewlineWords,
            string[] reservedTopLevelWordsNoIndent,
            string[] stringTypes,
            string[] openParens,
            string[] closeParens,
            char[] indexedPlaceholderTypes,
            char[] namedPlaceholderTypes,
            string[] lineCommentTypes,
            string[] specialWordChars,
            string[]? operators = null)
        {
            var operatorsParam = new List<string> { "<>", "<=", ">=" };
            if (operators is not null)
            {
                operatorsParam.AddRange(operators);
            }
            operatorRegex = RegexFactory.CreateOperatorRegex(operatorsParam);

            lineCommentRegex = RegexFactory.CreateLineCommentRegex(lineCommentTypes);
            reservedTopLevelRegex = RegexFactory.CreateReservedWordRegex(reservedTopLevelWords);
            reservedTopLevelNoIndentRegex = RegexFactory.CreateReservedWordRegex(reservedTopLevelWordsNoIndent);
            reservedNewLineRegex = RegexFactory.CreateReservedWordRegex(reservedNewlineWords);
            reservedPlainRegex = RegexFactory.CreateReservedWordRegex(reservedWords);
            wordRegex = RegexFactory.CreateWordRegex(specialWordChars);
            stringRegex = RegexFactory.CreateStringRegex(stringTypes);
            openParenRegex = RegexFactory.CreateParenRegex(openParens);
            closeParenRegex = RegexFactory.CreateParenRegex(closeParens);
            indexedPlaceholderRegex = RegexFactory.CreatePlaceholderRegex(indexedPlaceholderTypes, "[0-9]*");
            indentNamedPlaceholderRegex = RegexFactory.CreatePlaceholderRegex(namedPlaceholderTypes, "[a-zA-Z0-9._$]+");
        }

        internal IReadOnlyList<Token> Tokenize(string input)
        {
            var tokens = new List<Token>();
            Token? token = null;
            int pointerIndex = 0;

            while (pointerIndex != input.Length)
            {
                int precedingWitespaceLenght = GetPrecedingWitespaceLenght(input, pointerIndex);

                pointerIndex += precedingWitespaceLenght;

                if (pointerIndex != input.Length)
                {
                    token = GetNextToken(input, pointerIndex, previousToken: token);

                    if (token is not null)
                    {
                        Token t = token.Value;
                        pointerIndex += t.Length;
                        t.PrecedingWitespaceLength = precedingWitespaceLenght;
                        tokens.Add(t);
                    }
                }
            }

            return tokens;
        }

        private int GetPrecedingWitespaceLenght(string input, int pointerIndex)
        {
            int i = 0;
            int len = input.Length - pointerIndex;
            for (; i < len; i++)
            {
                if (!char.IsWhiteSpace(input[i + pointerIndex]))
                {
                    break;
                }
            }
            return i;
        }

        private Token? GetNextToken(string input, int pointerIndex, Token? previousToken)
        {
            return GetCommentToken(input, pointerIndex)
                ?? GetStringToken(input, pointerIndex)
                ?? GetOpenParenToken(input, pointerIndex)
                ?? GetCloseParenToken(input, pointerIndex)
                ?? GetPlaceholderToken(input, pointerIndex)
                ?? GetNumberToken(input, pointerIndex)
                ?? GetReservedWordToken(input, pointerIndex, previousToken)
                ?? GetWordToken(input, pointerIndex)
                ?? GetOperatorToken(input, pointerIndex);
        }

        private Token? GetCommentToken(string input, int pointerIndex)
        {
            return GetLineCommentToken(input, pointerIndex)
                ?? GetBlockCommentToken(input, pointerIndex);
        }

        private Token? GetLineCommentToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.LineComment, lineCommentRegex);
        }

        private Token? GetBlockCommentToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.BlockComment, BlockCommentRegex);
        }

        private Token? GetStringToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.String, stringRegex);
        }

        private Token? GetOpenParenToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.OpenParen, openParenRegex);
        }

        private Token? GetCloseParenToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.CloseParen, closeParenRegex);
        }

        private Token? GetPlaceholderToken(string input, int pointerIndex)
        {
            return GetIdentNamedPlaceholderToken(input, pointerIndex)
                ?? GetIndexedPlaceholderToken(input, pointerIndex);
        }

        private Token? GetIdentNamedPlaceholderToken(string input, int pointerIndex)
        {
            return GetPlaceholderTokenWithKey(input, pointerIndex, indentNamedPlaceholderRegex);
        }

        private Token? GetIndexedPlaceholderToken(string input, int pointerIndex)
        {
            return GetPlaceholderTokenWithKey(input, pointerIndex, indexedPlaceholderRegex);
        }

        private Token? GetPlaceholderTokenWithKey(string input, int pointerIndex, Regex? regex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.PlaceHolder, regex);
        }

        private Token? GetNumberToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.Number, NumberRegex);
        }

        private Token? GetWordToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.Word, wordRegex);
        }

        private Token? GetOperatorToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.Operator, operatorRegex);
        }

        private Token? GetReservedWordToken(string input, int pointerIndex, Token? previousToken)
        {
            if (previousToken is not null
                && previousToken.Value.Length == 1
                && input[previousToken.Value.Index] == '.')
            {
                return null;
            }

            return GetTopLevelReservedToken(input, pointerIndex)
                ?? GetNewlineReservedToken(input, pointerIndex)
                ?? GetTopLevelReservedTokenNoIndent(input, pointerIndex)
                ?? GetPlainReservedToken(input, pointerIndex);
        }

        private Token? GetTopLevelReservedToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.ReservedTopLevel, reservedTopLevelRegex);
        }

        private Token? GetNewlineReservedToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.ReservedNewLine, reservedNewLineRegex);
        }

        private Token? GetTopLevelReservedTokenNoIndent(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.ReservedTopLevelNoIndent, reservedTopLevelNoIndentRegex);
        }

        private Token? GetPlainReservedToken(string input, int pointerIndex)
        {
            return GetTokenOnFirstMatch(input, pointerIndex, TokenType.Reserved, reservedPlainRegex);
        }

        private Token? GetTokenOnFirstMatch(string input, int pointerIndex, TokenType type, Regex? regex)
        {
            if (regex is null)
            {
                return null;
            }

            Match match = regex.Match(input, pointerIndex, input.Length - pointerIndex);

            return match.Success ? new Token(pointerIndex, match.Length, type) : null;
        }
    }
}
