namespace HandStack.Data.SqlFormatter.Core
{
    internal struct Token(int index, int length, TokenType type, int precedingWitespaceLength = 0)
    {
        internal readonly int Index { get; } = index;
        internal readonly int Length { get; } = length;
        internal int PrecedingWitespaceLength { get; set; } = precedingWitespaceLength;
        internal readonly TokenType Type { get; } = type;
    }
}
