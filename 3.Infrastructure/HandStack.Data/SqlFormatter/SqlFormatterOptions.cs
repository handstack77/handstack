using System.Collections.Generic;

namespace HandStack.Data.SqlFormatter
{
    internal struct SqlFormatterOptions(TextIndentation indentation, bool uppercase, int linesBetweenQueries = 1, IReadOnlyDictionary<string, string>? placeholderParameters = null)
    {
        public TextIndentation Indentation { get; } = indentation;

        public bool Uppercase { get; } = uppercase;

        public int LinesBetweenQueries { get; } = linesBetweenQueries;

        public IReadOnlyDictionary<string, string>? PlaceholderParameters { get; } = placeholderParameters;
    }
}
