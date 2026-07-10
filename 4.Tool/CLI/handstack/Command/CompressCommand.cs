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
    internal static class CompressCommand
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
            #region compress

            var subCommandCompress = new Command("compress", "지정된 디렉터리에서 파일 및 디렉터리를 포함하는 Zip 파일을 만듭니다") {
                optionDirectory, optionFile, optionKey
            };

            // handstack compress --directory=C:/projects/handstack77/handstack/4.Tool/CLI/handstack/bin/Debug/net10.0/win-x64 --file=C:/tmp/handstack.zip
            subCommandCompress.SetAction((parseResult) =>
            {
                var directory = parseResult.GetValue(optionDirectory);
                var file = parseResult.GetValue(optionFile);
                var key = parseResult.GetValue(optionKey).ToStringSafe();

                try
                {
                    if (directory != null && directory.Parent != null && directory.Exists == true)
                    {
                        if (file != null && file.Exists == true)
                        {
                            file.Delete();
                        }

                        var zipFileName = (file?.FullName.Replace("\\", "/")).ToStringSafe();
                        if (file != null && file.Extension != ".zip")
                        {
                            zipFileName = $"{zipFileName}.zip";
                        }

                        if (string.IsNullOrWhiteSpace(zipFileName) == true)
                        {
                            zipFileName = PathExtensions.Combine(directory.Parent.FullName.Replace("\\", "/"), $"{directory.Name}.zip");
                        }

                        if (File.Exists(zipFileName) == true)
                        {
                            File.Delete(zipFileName);
                        }

                        Program.CreateZipFromDirectoryWithProgress(directory.FullName.Replace("\\", "/"), zipFileName);
                    }
                    else
                    {
                        Log.Information($"directory:{directory?.FullName.Replace("\\", "/")}, file:{file?.FullName.Replace("\\", "/")} 확인이 필요합니다");
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, $"compress 오류");
                }
            });

            rootCommand.Add(subCommandCompress);

            #endregion

        }
    }
}
