using System;
using System.CommandLine;
using System.IO;

using HandStack.Core.ExtensionMethod;

using Serilog;

namespace handstack
{
    internal static class StartLogCommand
    {
        public static void Register(RootCommand rootCommand, HandstackCommandContext context)
        {
            var optionAckFile = context.OptionAckFile;
            var optionArguments = context.OptionArguments;
            var optionAppSettingFile = context.OptionAppSettingFile;

            // startlog --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=ack.localhost.json
            var subCommandStartLog = new Command("startlog", "ack 프로그램을 시작하기 위한 명령어 로그를 출력합니다") {
                optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStartLog.SetAction((parseResult) =>
            {
                var ackFile = parseResult.GetValue(optionAckFile);
                var arguments = parseResult.GetValue(optionArguments);
                var settings = parseResult.GetValue(optionAppSettingFile);

                if (ackFile != null && ackFile.Exists == true)
                {
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
                    var ackFileName = ackFile.Name == "ack.dll" ? "dotnet" : ackFilePath;
                    arguments = ackFile.Name == "ack.dll" ? $"ack.dll {arguments}" : arguments.ToStringSafe();

                    Log.Information($"{ackFileName} {arguments.ToStringSafe()}".Trim());
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
                }
            });

            rootCommand.Add(subCommandStartLog);
        }
    }
}
