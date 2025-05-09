using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace HandStack.Data.SqlFormatter.Core
{
    internal abstract class Formatter
    {
        private static readonly Regex WhitespacesRegex = new(@"\s+$", RegexOptions.Compiled, RegexFactory.DefaultMatchTimeout);
        private static readonly Regex CommentWhitespacesRegex = new(@"\n[ \t]*", RegexOptions.Compiled, RegexFactory.DefaultMatchTimeout);

        private readonly InlineBlock inlineBlock = new();
        private readonly StringBuilder queryBuilder = new();

        private Indentation? indentation = null;
        private SqlFormatterOptions options;
        private Params? parameters = null;
        private IReadOnlyList<Token>? tokens = null;
        protected Token? previousReservedToken = null;
        private int index;

        internal string Format(string query)
        {
            return Format(query, new SqlFormatterOptions(indentation: TextIndentation.TwoSpaces, uppercase: false));
        }

        internal string Format(string query, SqlFormatterOptions options)
        {
            this.options = options;
            indentation = new Indentation(options.Indentation);
            parameters = new Params(options.PlaceholderParameters);

            tokens = GetTokenizer().Tokenize(query);
            SetFormattedQueryFromTokens(query.AsSpan());
            return queryBuilder.ToString().Trim();
        }

        protected abstract Tokenizer GetTokenizer();

        protected virtual Token TokenOverride(Token token, ReadOnlySpan<char> querySpan)
        {
            return token;
        }

        protected Token? TokenLookBehind(int n = 1)
        {
            return tokens?.ElementAtOrDefault(index - n);
        }

        protected Token? TokenLookAhead(int n = 1)
        {
            if (tokens is null || tokens!.Count <= index + n)
            {
                return null;
            }
            return tokens![index + n];
        }

        private void SetFormattedQueryFromTokens(ReadOnlySpan<char> querySpan)
        {
            queryBuilder.Clear();

            for (var i = 0; i < tokens!.Count; i++)
            {
                index = i;

                var token = TokenOverride(tokens[i], querySpan);
                switch (token.Type)
                {
                    case TokenType.LineComment:
                        FormatLineComment(token, querySpan);
                        break;
                    case TokenType.BlockComment:
                        FormatBlockComment(token, querySpan);
                        break;
                    case TokenType.ReservedTopLevel:
                        FormatTopLevelReservedWord(token, querySpan);
                        previousReservedToken = token;
                        break;
                    case TokenType.ReservedTopLevelNoIndent:
                        FormatTopLevelReservedWordNoIndent(token, querySpan);
                        previousReservedToken = token;
                        break;
                    case TokenType.ReservedNewLine:
                        FormatNewlineReservedWord(token, querySpan);
                        previousReservedToken = token;
                        break;
                    case TokenType.Reserved:
                        FormatWithSpaces(token, querySpan);
                        previousReservedToken = token;
                        break;
                    case TokenType.OpenParen:
                        FormatOpeningParentheses(token, querySpan);
                        break;
                    case TokenType.CloseParen:
                        FormatClosingParentheses(token, querySpan);
                        break;
                    case TokenType.PlaceHolder:
                        FormatPlaceholder(token, querySpan);
                        break;
                    default:
                        switch (token.Length)
                        {
                            case 1 when querySpan[token.Index] == ',':
                                FormatComma(token, querySpan);
                                break;
                            case 1 when querySpan[token.Index] == ':':
                                FormatWithSpaceAfter(token, querySpan);
                                break;
                            case 1 when querySpan[token.Index] == '.':
                                FormatWithoutSpaces(token, querySpan);
                                break;
                            case 1 when querySpan[token.Index] == ';':
                                FormatQuerySeparator(token, querySpan);
                                break;
                            default:
                                FormatWithSpaces(token, querySpan);
                                break;
                        }
                        break;
                }
            }
        }

        private void FormatLineComment(Token token, ReadOnlySpan<char> querySpan)
        {
            queryBuilder.Append(Show(querySpan.Slice(token), token.Type));
            AddNewLine();
        }

        private void FormatBlockComment(Token token, ReadOnlySpan<char> querySpan)
        {
            AddNewLine();
            queryBuilder.Append(IndentComment(querySpan.Slice(token)));
            AddNewLine();
        }

        private string IndentComment(ReadOnlySpan<char> comment)
        {
            return CommentWhitespacesRegex.Replace(comment.ToString(), $"\n{indentation!.GetIndent()} ");
        }

        private void FormatTopLevelReservedWordNoIndent(Token token, ReadOnlySpan<char> querySpan)
        {
            indentation!.DecreaseTopLevel();

            AddNewLine();

            queryBuilder.Append(EqualizeWhitespace(Show(querySpan.Slice(token), token.Type)));

            AddNewLine();
        }

        private void FormatTopLevelReservedWord(Token token, ReadOnlySpan<char> querySpan)
        {
            indentation!.DecreaseTopLevel();

            AddNewLine();

            indentation.IncreaseTopLevel();

            queryBuilder.Append(EqualizeWhitespace(Show(querySpan.Slice(token), token.Type)));

            AddNewLine();
        }

        private void FormatNewlineReservedWord(Token token, ReadOnlySpan<char> querySpan)
        {
            if (token.IsAnd(querySpan.Slice(token)))
            {
                var t = TokenLookBehind(2);

                if (t != null && t.Value.IsBetween(querySpan.Slice(t.Value)))
                {
                    FormatWithSpaces(token, querySpan);
                    return;
                }
            }
            AddNewLine();

            queryBuilder.Append(EqualizeWhitespace(Show(querySpan.Slice(token), token.Type)));

            queryBuilder.Append(' ');
        }

        private string EqualizeWhitespace(string input)
        {
            return WhitespacesRegex.Replace(input, " ");
        }

        private void FormatOpeningParentheses(Token token, ReadOnlySpan<char> querySpan)
        {
            if (token.PrecedingWitespaceLength == 0)
            {
                var behindToken = TokenLookBehind();

                if (behindToken is not { Type: TokenType.OpenParen or TokenType.LineComment or TokenType.Operator })
                {
                    queryBuilder.TrimSpaceEnd();
                }
            }
            queryBuilder.Append(Show(querySpan.Slice(token), token.Type));

            inlineBlock.BeginIfPossible(tokens!, index, querySpan.Slice(token));

            if (!inlineBlock.IsActive())
            {
                indentation!.IncreaseBlockLevel();
                AddNewLine();
            }
        }

        private void FormatClosingParentheses(Token token, ReadOnlySpan<char> querySpan)
        {
            if (inlineBlock.IsActive())
            {
                inlineBlock.End();
                FormatWithSpaceAfter(token, querySpan);
            }
            else
            {
                indentation!.DecreaseBlockLevel();
                AddNewLine();
                FormatWithSpaces(token, querySpan);
            }
        }

        private void FormatPlaceholder(Token token, ReadOnlySpan<char> querySpan)
        {
            string? value = null;
            var valueSpan = querySpan.Slice(token);
            if (valueSpan.Length != 0)
            {
                value = parameters!.Get(valueSpan.Slice(0, 1).ToString());
            }

            queryBuilder.Append(value ?? querySpan.Slice(token).ToString());

            queryBuilder.Append(' ');
        }

        private void FormatComma(Token token, ReadOnlySpan<char> querySpan)
        {
            FormatWithSpaceAfter(token, querySpan);

            if (inlineBlock.IsActive())
            {
                return;
            }
            else if (previousReservedToken is not null
                && previousReservedToken.Value.IsLimit(querySpan.Slice(previousReservedToken.Value)))
            {
                return;
            }

            AddNewLine();

        }

        private void FormatWithSpaceAfter(Token token, ReadOnlySpan<char> querySpan)
        {
            queryBuilder.TrimSpaceEnd();
            queryBuilder.Append(Show(querySpan.Slice(token), token.Type));
            queryBuilder.Append(' ');
        }

        private void FormatWithoutSpaces(Token token, ReadOnlySpan<char> querySpan)
        {
            queryBuilder.TrimSpaceEnd();
            queryBuilder.Append(Show(querySpan.Slice(token), token.Type));
        }

        private void FormatWithSpaces(Token token, ReadOnlySpan<char> querySpan)
        {
            queryBuilder.Append(Show(querySpan.Slice(token), token.Type));
            queryBuilder.Append(' ');
        }

        private void FormatQuerySeparator(Token token, ReadOnlySpan<char> querySpan)
        {
            indentation!.ResetIndentation();

            queryBuilder.TrimSpaceEnd();
            queryBuilder.Append(Show(querySpan.Slice(token), token.Type));

            var times = options.LinesBetweenQueries;

            while (times != 0)
            {
                queryBuilder.AppendLine();
                times--;
            }
        }

        private string Show(ReadOnlySpan<char> value, TokenType tokenType)
        {
            if (options.Uppercase
                && (tokenType == TokenType.Reserved
                || tokenType == TokenType.ReservedTopLevel
                || tokenType == TokenType.ReservedTopLevelNoIndent
                || tokenType == TokenType.ReservedNewLine
                || tokenType == TokenType.OpenParen
                || tokenType == TokenType.CloseParen))
            {
                return value.ToString();
            }
            else
            {
                return value.ToString();
            }
        }

        private void AddNewLine()
        {
            queryBuilder.TrimSpaceEnd();

            if (queryBuilder.Length != 0 && queryBuilder[queryBuilder.Length - 1] != '\n')
            {
                queryBuilder.AppendLine();
            }

            queryBuilder.Append(indentation!.GetIndent());
        }
    }
}
