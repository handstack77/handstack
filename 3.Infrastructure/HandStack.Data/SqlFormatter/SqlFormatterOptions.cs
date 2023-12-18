using System.Collections.Generic;

namespace HandStack.Data.SqlFormatter
{
    internal struct SqlFormatterOptions
    {
        public TextIndentation Indentation { get; }

        public bool Uppercase { get; }

        public int LinesBetweenQueries { get; }

        public IReadOnlyDictionary<string, string>? PlaceholderParameters { get; }

        public SqlFormatterOptions(TextIndentation indentation, bool uppercase, int linesBetweenQueries = 1, IReadOnlyDictionary<string, string>? placeholderParameters = null)
        {
            Indentation = indentation;
            Uppercase = uppercase;
            LinesBetweenQueries = linesBetweenQueries;
            PlaceholderParameters = placeholderParameters;
        }
    }
}
