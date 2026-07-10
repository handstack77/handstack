using System.CommandLine;
using System.IO;

namespace handstack
{
    internal static class HandstackCommandRegistry
    {
        public static void Register(
            RootCommand rootCommand,
            Option<FileInfo?> optionAckFile,
            Option<string?> optionArguments,
            Option<int?> optionPort,
            Option<int?> optionProcessID,
            Option<string?> optionFormat,
            Option<string?> optionKey,
            Option<string?> optionValue,
            Option<FileInfo?> optionAppSettingFile,
            Option<DirectoryInfo?> optionDirectory,
            Option<FileInfo?> optionFile,
            Option<string?> optionFind,
            Option<string?> optionReplace,
            Option<string[]> optionReplaceExpressions,
            Option<string?> optionOptions)
        {
            var context = new HandstackCommandContext
            {
                OptionAckFile = optionAckFile,
                OptionArguments = optionArguments,
                OptionPort = optionPort,
                OptionProcessID = optionProcessID,
                OptionFormat = optionFormat,
                OptionKey = optionKey,
                OptionValue = optionValue,
                OptionAppSettingFile = optionAppSettingFile,
                OptionDirectory = optionDirectory,
                OptionFile = optionFile,
                OptionFind = optionFind,
                OptionReplace = optionReplace,
                OptionReplaceExpressions = optionReplaceExpressions,
                OptionOptions = optionOptions
            };

            ListCommand.Register(rootCommand, context);
            ConfigurationCommand.Register(rootCommand, context);
            PurgeContractsCommand.Register(rootCommand, context);
            EncryptContractsCommand.Register(rootCommand, context);
            StartLogCommand.Register(rootCommand, context);
            StartCommand.Register(rootCommand, context);
            StopCommand.Register(rootCommand, context);
            EncryptCommand.Register(rootCommand, context);
            DecryptCommand.Register(rootCommand, context);
            ContractPackCommand.Register(rootCommand, context);
            CompressCommand.Register(rootCommand, context);
            ExtractCommand.Register(rootCommand, context);
            CreateCommand.Register(rootCommand, context);
            ReplaceTextCommand.Register(rootCommand, context);
            TaskCommand.Register(rootCommand, context);
            SynUsageCommand.Register(rootCommand, context);
            PublicKeyCommand.Register(rootCommand, context);
        }
    }
}
