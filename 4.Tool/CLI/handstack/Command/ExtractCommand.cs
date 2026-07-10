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
    internal static class ExtractCommand
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
            #region extract

            var subCommandExtract = new Command("extract", "지정된 ZIP 파일의 모든 파일을 파일 시스템의 디렉터리에 추출합니다") {
                optionFile, optionDirectory, optionOptions
            };

            // handstack extract --file=C:/tmp/handstack.zip --directory=C:/tmp/handstack
            subCommandExtract.SetAction((parseResult) =>
            {
                var file = parseResult.GetValue(optionFile);
                var directory = parseResult.GetValue(optionDirectory);
                var options = parseResult.GetValue(optionOptions).ToStringSafe();

                try
                {
                    if (file != null && file.Exists == true && directory != null)
                    {
                        if (directory.Exists == true && options.ToBoolean() == true)
                        {
                            directory.Delete(true);
                        }

                        Program.ExtractZipToDirectoryWithProgress(file.FullName.Replace("\\", "/"), directory.FullName.Replace("\\", "/"));
                    }
                    else
                    {
                        Log.Information($"directory:{directory?.FullName.Replace("\\", "/")}, file:{file?.FullName.Replace("\\", "/")} 확인이 필요합니다");
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, $"extract 오류");
                }
            });

            rootCommand.Add(subCommandExtract);

            #endregion

        }
    }
}
