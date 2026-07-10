using System;
using System.CommandLine;
using System.Diagnostics;
using System.IO;

using HandStack.Core.ExtensionMethod;

using Serilog;

namespace handstack
{
    internal static class StartCommand
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

            // start --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=ack.localhost.json
            var subCommandStart = new Command("start", "ack 프로그램을 시작합니다") {
                optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStart.SetAction((parseResult) =>
            {
                var ackFile = parseResult.GetValue(optionAckFile);
                var arguments = parseResult.GetValue(optionArguments);
                var settings = parseResult.GetValue(optionAppSettingFile);

                if (ackFile != null && ackFile.Exists == true)
                {
                    var targetBasePath = ackFile.DirectoryName.ToStringSafe();
                    if (settings != null && settings.Exists == true)
                    {
                        var settingFilePath = settings.FullName.Replace("\\", "/");
                        try
                        {
                            var settingText = File.ReadAllText(settingFilePath);
                            var key = settingText.ToSHA256().SubstringSafe(0, 32);
                            arguments = $"{arguments}{(string.IsNullOrWhiteSpace(arguments) == true ? "" : " ")}--key={key} --appsettings={settingText.EncryptAES(key)}";
                        }
                        catch (Exception exception)
                        {
                            Log.Error(exception, $"settingFilePath: {settingFilePath} 확인 필요");
                        }
                    }

                    var ackFilePath = ackFile.FullName.Replace("\\", "/");
                    var process = new Process();
                    process.StartInfo = new ProcessStartInfo
                    {
                        FileName = ackFile.Name == "ack.dll" ? "dotnet" : ackFilePath,
                        Arguments = ackFile.Name == "ack.dll" ? $"ack.dll {arguments}".Trim() : arguments.ToStringSafe(),
                        WorkingDirectory = Path.GetDirectoryName(ackFilePath),
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    process.Start();
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
                }
            });

            rootCommand.Add(subCommandStart);
        }
    }
}
