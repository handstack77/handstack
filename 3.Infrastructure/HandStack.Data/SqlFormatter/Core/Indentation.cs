using System;
using System.Collections.Generic;

namespace HandStack.Data.SqlFormatter.Core
{
    internal sealed class Indentation
    {
        private enum IndentationType
        {
            TopLevel,
            BlockLevel
        }

        private readonly Stack<IndentationType> indentationTypes = new();
        private readonly TextIndentation indentation;

        public Indentation(TextIndentation indentation)
        {
            this.indentation = indentation;
        }

        internal string GetIndent()
        {
            return indentation switch
            {
                TextIndentation.TwoSpaces => new string(' ', 2 * indentationTypes.Count),
                TextIndentation.FourSpaces => new string(' ', 4 * indentationTypes.Count),
                TextIndentation.OneTab => new string('\t', 1 * indentationTypes.Count),
                _ => throw new NotSupportedException(),
            };
        }

        internal void IncreaseTopLevel()
        {
            indentationTypes.Push(IndentationType.TopLevel);
        }

        internal void IncreaseBlockLevel()
        {
            indentationTypes.Push(IndentationType.BlockLevel);
        }

        internal void DecreaseTopLevel()
        {
            if (indentationTypes.TryPeek(out IndentationType type) && type == IndentationType.TopLevel)
            {
                indentationTypes.Pop();
            }
        }

        internal void DecreaseBlockLevel()
        {
            while (indentationTypes.Count > 0)
            {
                IndentationType type = indentationTypes.Pop();
                if (type != IndentationType.TopLevel)
                {
                    break;
                }
            }
        }

        internal void ResetIndentation()
        {
            indentationTypes.Clear();
        }
    }
}
