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
    internal static class EncryptContractsCommand
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
            #region encryptcontracts

            // encryptcontracts --file=%HANDSTACK_HOME%/modules/myapp/myapp.dll --directory=C:/projects/myapp/contracts
            var subCommandEncryptContracts = new Command("encryptcontracts", "모듈의 Contracts 디렉토리 내 파일들을 지정 규칙에 따라 암호화 합니다") {
                optionFile, optionDirectory
            };

            subCommandEncryptContracts.SetAction((parseResult) =>
            {
                var ddlFile = parseResult.GetValue(optionFile);
                var directory = parseResult.GetValue(optionDirectory);

                if (ddlFile != null && ddlFile.Exists == true && directory != null && directory.Exists == true)
                {
                    string? ddlFilePath = ddlFile?.FullName;
                    var contractPath = directory.FullName.Replace("\\", "/");
                    if (File.Exists(ddlFilePath) == false || Directory.Exists(contractPath) == false)
                    {
                        Log.Error($"관리형 DLL 파일 '{ddlFilePath}' 을 찾을 수 없거나 Contracts 디렉토리 경로 '{contractPath}'가 없습니다.");
                        Environment.Exit(1);
                    }

                    string assemblyKey = string.Empty;
                    string assemblyToken = string.Empty;
                    try
                    {
                        var asmName = AssemblyName.GetAssemblyName(ddlFilePath);

                        var publicKey = asmName.GetPublicKey() ?? Array.Empty<byte>();
                        var publicKeyToken = asmName.GetPublicKeyToken() ?? Array.Empty<byte>();

                        if (publicKey.Length == 0)
                        {
                            Log.Information("지정한 어셈블리 파일에 강력한 이름 서명이 필요합니다.");
                        }
                        else
                        {
                            Log.Information($"어셈블리 파일 경로: {ddlFilePath}");
                            Log.Information($"어셈블리 이름: {asmName.Name}");
                            Log.Information($"어셈블리 버전: {asmName.Version}");

                            using (SHA256 sha256 = SHA256.Create())
                            {
                                byte[] hash = sha256.ComputeHash(publicKey);
                                assemblyKey = Program.ToHex(hash).ToLowerInvariant();
                                Console.WriteLine();
                                Log.Information($"공개 키 (SHA256): {assemblyKey}");
                            }

                            assemblyToken = Program.ToHex(publicKeyToken).ToLowerInvariant();
                            Log.Information($"공개 키 (Token): {assemblyToken}");
                            Console.WriteLine();

                            try
                            {
                                var processor = new CryptoProcessor(assemblyKey.NormalizeKey(), assemblyToken);
                                var report = processor.Process(contractPath);

                                Log.Information($"dbclient xml: 암호화 {report.DbClientEncrypted}");
                                Log.Information($"transact json: 암호화 {report.TransactEncrypted}");
                                Log.Information($"function featureMeta: 암호화 {report.FunctionMetaEncrypted}");
                            }
                            catch (Exception exception)
                            {
                                Console.Error.WriteLine(exception.Message);
                                Console.Error.WriteLine(exception.StackTrace);
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, $"예기치 않은 오류");
                    }
                }
                else
                {
                    Log.Information($"ddlFile:{ddlFile?.FullName.Replace("\\", "/")} 파일 확인 또는 contractPath:{directory?.FullName.Replace("\\", "/")} 디렉토리 확인이 필요합니다");
                }
            });

            rootCommand.Add(subCommandEncryptContracts);

            #endregion

        }
    }
}
