using System;
using System.Collections.Generic;

namespace HandStack.Data.SqlFormatter.Core
{
    internal sealed class InlineBlock
    {
        private const int InlineMaxLength = 50;

        private int level = 0;

        internal void BeginIfPossible(IReadOnlyList<Token> tokens, int index, ReadOnlySpan<char> valueSpan)
        {
            if (level == 0 && IsInlineBlock(tokens, index, valueSpan))
            {
                level = 1;
            }
            else if (level > 0)
            {
                level++;
            }
            else
            {
                level = 0;
            }
        }

        internal void End()
        {
            level--;
        }

        internal bool IsActive()
        {
            return level > 0;
        }

        private bool IsInlineBlock(IReadOnlyList<Token> tokens, int index, ReadOnlySpan<char> valueSpan)
        {
            int length = 0;
            int level = 0;

            for (int i = index; i < tokens.Count; i++)
            {
                Token token = tokens[i];
                length += token.Length;

                if (length > InlineMaxLength)
                {
                    return false;
                }

                if (token.Type == TokenType.OpenParen)
                {
                    level++;
                }
                else if (token.Type == TokenType.CloseParen)
                {
                    level--;
                    if (level == 0)
                    {
                        return true;
                    }
                }

                if (IsForbiddenToken(token, valueSpan))
                {
                    return false;
                }
            }
            return false;
        }

        private bool IsForbiddenToken(Token token, ReadOnlySpan<char> valueSpan)
        {
            return
                token.Type == TokenType.ReservedTopLevel
                || token.Type == TokenType.ReservedNewLine
                // || token.Type == TokenType.LineComment
                || token.Type == TokenType.BlockComment
                || (token.Length == 1 && valueSpan[0] == ';');
        }
    }
}
