using System.CommandLine;
using System.IO;

namespace handstack
{
    internal sealed class HandstackCommandContext
    {
        public required Option<FileInfo?> OptionAckFile { get; init; }
        public required Option<string?> OptionArguments { get; init; }
        public required Option<int?> OptionPort { get; init; }
        public required Option<int?> OptionProcessID { get; init; }
        public required Option<string?> OptionFormat { get; init; }
        public required Option<string?> OptionKey { get; init; }
        public required Option<string?> OptionValue { get; init; }
        public required Option<FileInfo?> OptionAppSettingFile { get; init; }
        public required Option<DirectoryInfo?> OptionDirectory { get; init; }
        public required Option<FileInfo?> OptionFile { get; init; }
        public required Option<string?> OptionFind { get; init; }
        public required Option<string?> OptionReplace { get; init; }
        public required Option<string[]> OptionReplaceExpressions { get; init; }
        public required Option<string?> OptionOptions { get; init; }
    }
}
