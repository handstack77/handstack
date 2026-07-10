using System;
using System.CommandLine;

using HandStack.Core.ExtensionMethod;

using Serilog;

namespace handstack
{
    internal static class ReplaceTextCommand
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

            var subCommandReplaceText = new Command("replacetext", "텍스트 파일의 특정 문자열을 치환합니다") {
                optionFile, optionFind, optionReplaceExpressions
            };

            // handstack replacetext --file=C:/tmp/handstack.txt --find=handstack --replace=myprojectname
            // handstack replacetext --file=C:/tmp/handstack.txt --replace handstack=myprojectname --replace old=new
            subCommandReplaceText.SetAction((parseResult) =>
            {
                var file = parseResult.GetValue(optionFile);
                var find = parseResult.GetValue(optionFind).ToStringSafe();
                var replaceExpressions = parseResult.GetValue(optionReplaceExpressions) ?? Array.Empty<string>();

                if (file != null && file.Exists == true)
                {
                    var replaceMappings = Program.BindReplaceMappings(find, replaceExpressions);
                    if (replaceMappings.Count > 0)
                    {
                        try
                        {
                            foreach (var replaceMapping in replaceMappings)
                            {
                                Program.ReplaceInFile(file, replaceMapping.Key, replaceMapping.Value);
                            }
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
                    Log.Information($"file:{file?.FullName.Replace("\\", "/")} 확인이 필요합니다");
                }
            });

            rootCommand.Add(subCommandReplaceText);
        }
    }
}
