using System;
using System.CommandLine;
using System.IO.Compression;

using HandStack.Core.ExtensionMethod;

using Serilog;

namespace handstack
{
    internal static class CreateCommand
    {
        public static void Register(RootCommand rootCommand, HandstackCommandContext context)
        {
            var optionAckFile = context.OptionAckFile;
            var optionArguments = context.OptionArguments;
            var optionPort = context.OptionPort;
            var optionProcessID = context.OptionProcessID;
            var optionFormat = context.OptionFormat;
            var optionKey = context.OptionKey;
            var optionValue = context.OptionValue;
            var optionAppSettingFile = context.OptionAppSettingFile;
            var optionDirectory = context.OptionDirectory;
            var optionFile = context.OptionFile;
            var optionFind = context.OptionFind;
            var optionReplace = context.OptionReplace;
            var optionReplaceExpressions = context.OptionReplaceExpressions;
            var optionOptions = context.OptionOptions;
         
            var subCommandCreate = new Command("create", "modules, webapp 템플릿 ZIP 파일을 기반으로 프로젝트를 생성합니다") {
                optionFile, optionDirectory, optionFind, optionReplace, optionValue
            };

            // handstack create --file=C:/tmp/handstack.zip --directory=C:/tmp/handstack --find=handstack --replace=myprojectname
            subCommandCreate.SetAction((parseResult) =>
            {
                var file = parseResult.GetValue(optionFile);
                var directory = parseResult.GetValue(optionDirectory);
                var find = parseResult.GetValue(optionFind).ToStringSafe();
                var replace = parseResult.GetValue(optionReplace).ToStringSafe();
                var ignored = parseResult.GetValue(optionValue).ToStringSafe();
                string[] ignoredDirectoryNames = Array.Empty<string>();

                if (file != null && file.Exists == true && directory != null && directory.Exists == false)
                {
                    var targetDirectoryPath = directory.FullName.Replace("\\", "/");
                    ZipFile.ExtractToDirectory(file.FullName.Replace("\\", "/"), targetDirectoryPath, true);

                    if (string.IsNullOrWhiteSpace(ignored) == false)
                    {
                        ignoredDirectoryNames = ignored.SplitComma().ToArray();
                    }

                    if (string.IsNullOrEmpty(find) == false && string.IsNullOrEmpty(replace) == false)
                    {
                        try
                        {
                            var findText = find;
                            var replaceText = replace;

                            Program.ReplaceInFiles(targetDirectoryPath, findText, replaceText, deleteVsUserSettingsDirectory: true);

                            Program.ReplaceInFileNames(targetDirectoryPath, findText, replaceText, deleteVsUserSettingsDirectory: true);

                            Program.ReplaceInDirectoryNames(targetDirectoryPath, findText, replaceText, deleteVsUserSettingsDirectory: true);
                        }
                        catch (Exception exception)
                        {
                            Log.Information(exception.Message);
                            Environment.Exit(-1);
                        }
                    }
                }
                else
                {
                    Log.Information($"file:{file?.FullName.Replace("\\", "/")}, directory:{directory?.FullName.Replace("\\", "/")} 확인이 필요합니다");
                }
            });

            rootCommand.Add(subCommandCreate);
        }
    }
}
