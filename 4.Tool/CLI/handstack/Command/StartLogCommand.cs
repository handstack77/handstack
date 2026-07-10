using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.RegularExpressions;

using handstack.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Microsoft.Extensions.FileProviders;

using Newtonsoft.Json.Linq;

using Serilog;

using Sqids;

namespace handstack
{
    internal static class StartLogCommand
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
            #region startlog

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

            #endregion

        }
    }
}
