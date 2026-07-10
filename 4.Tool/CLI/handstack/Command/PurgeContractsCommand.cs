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
    internal static class PurgeContractsCommand
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
            #region purgecontracts

            // purgecontracts --ack=%HANDSTACK_HOME%/app/ack.exe --directory=C:/projects/myapp/contracts
            var subCommandPurgeContracts = new Command("purgecontracts", "모듈의 Contracts를 사용하도록 ack 프로그램의 contracts 내 중복 파일을 삭제합니다") {
                optionAckFile, optionDirectory
            };

            subCommandPurgeContracts.SetAction((parseResult) =>
            {
                var ackFile = parseResult.GetValue(optionAckFile);
                var directory = parseResult.GetValue(optionDirectory);

                if (ackFile != null && ackFile.Exists == true && directory != null && directory.Exists == true)
                {
                    var appBasePath = ackFile.DirectoryName.ToStringSafe();
                    var ackHomePath = (ackFile.Directory?.Parent?.FullName.Replace("\\", "/")).ToStringSafe();
                    var targetContractDir = PathExtensions.Combine(ackHomePath, "contracts");
                    var baseDir = directory.FullName.Replace("\\", "/");

                    try
                    {
                        string[] subDirs = { "dbclient", "transact", "wwwroot", "repository", "function" };
                        foreach (var subDir in subDirs)
                        {
                            var dirPath = PathExtensions.Combine(baseDir, subDir);
                            if (Directory.Exists(dirPath))
                            {
                                var files = Directory.GetFiles(dirPath, "*", SearchOption.AllDirectories);
                                foreach (var baseFile in files)
                                {
                                    var targetFile = baseFile.Replace(baseDir, targetContractDir);
                                    if (File.Exists(targetFile) == true)
                                    {
                                        File.Delete(targetFile);
                                        Log.Information($"{targetFile} contract 파일 삭제");
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, $"purgecontracts 오류");
                    }
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인 또는 settings:{directory?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
                }
            });

            rootCommand.Add(subCommandPurgeContracts);

            #endregion

        }
    }
}
