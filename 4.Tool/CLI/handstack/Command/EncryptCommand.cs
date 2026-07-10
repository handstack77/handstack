using System;
using System.Collections.Generic;
using System.CommandLine;
using System.IO;
using System.Net;

using handstack.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Serilog;

using Sqids;

namespace handstack
{
    internal static class EncryptCommand
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

            var subCommandEncrypt = new Command("encrypt", "지정된 매개변수로 값 인코딩을 수행합니다") {
                optionFormat, optionKey, optionValue, optionOptions
            };

            // handstack encrypt --format=base64 --value="helloworld"
            // handstack encrypt --format=connectionstring --value="[connection string]"
            subCommandEncrypt.SetAction((parseResult) =>
            {
                var format = parseResult.GetValue(optionFormat).ToStringSafe();
                var key = parseResult.GetValue(optionKey).ToStringSafe();
                var value = parseResult.GetValue(optionValue);
                var options = parseResult.GetValue(optionOptions).ToStringSafe();

                switch (format)
                {
                    case "base64":
                        if (string.IsNullOrWhiteSpace(options) == true)
                        {
                            options = "string";
                        }

                        if (options == "string")
                        {
                            Log.Information($"{value?.EncodeBase64()}");
                        }
                        else if (options == "file")
                        {
                            var inputFilePath = value.ToStringSafe();
                            var fileInfo = new FileInfo(inputFilePath);
                            if (fileInfo.Exists == false)
                            {
                                Log.Information($"'{inputFilePath}' 파일 확인이 필요합니다");
                                return;
                            }

                            var outputFilePath = PathExtensions.Join(fileInfo.DirectoryName!, fileInfo.Name + ".txt");
                            var fileBytes = File.ReadAllBytes(inputFilePath);
                            var base64String = Convert.ToBase64String(fileBytes);
                            File.WriteAllText(outputFilePath, base64String);
                            Log.Information(outputFilePath);
                        }
                        else
                        {
                            Log.Information($"'{options}' 지원하지 않는 옵션입니다. string, file 을 입력하세요.");
                        }
                        break;
                    case "suid":
                        ISequentialIdGenerator sequentialIdGenerator = new SequentialIdGenerator();
                        var count = int.TryParse(options, out var parsedCount) == true && parsedCount > 0 ? parsedCount : 1;
                        var list = new List<string>();
                        for (var i = 0; i < count; i++)
                        {
                            switch (value)
                            {
                                case "N":
                                    list.Add(sequentialIdGenerator.NewId().ToString("N"));
                                    break;
                                case "D":
                                    list.Add(sequentialIdGenerator.NewId().ToString("D"));
                                    break;
                                case "B":
                                    list.Add(sequentialIdGenerator.NewId().ToString("B"));
                                    break;
                                case "P":
                                    list.Add(sequentialIdGenerator.NewId().ToString("P"));
                                    break;
                                case "X":
                                    list.Add(sequentialIdGenerator.NewId().ToString("X"));
                                    break;
                                default:
                                    list.Add(sequentialIdGenerator.NewId().ToString());
                                    break;
                            }
                        }

                        Log.Information(string.Join(Environment.NewLine, list));
                        break;
                    case "sqids":
                        key = string.IsNullOrWhiteSpace(key) == true ? "abcdefghijklmnopqrstuvwxyz1234567890" : key;
                        var sqids = new SqidsEncoder<int>(new()
                        {
                            Alphabet = key,
                            MinLength = 8,
                        });

                        try
                        {
                            var splitNumbers = value.ToStringSafe().Split(',');
                            var numbers = Array.ConvertAll(splitNumbers, int.Parse);

                            Log.Information($"{sqids.Encode(numbers)}");
                        }
                        catch
                        {
                            Log.Information($"{sqids.Encode(0)}");
                        }
                        break;
                    case "aes256":
                        if (string.IsNullOrWhiteSpace(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().SubstringSafe(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').SubstringSafe(0, 32);
                        Log.Information($"key={key}, value={value.ToStringSafe().EncryptAES(key)}");
                        break;
                    case "syn":
                        if (string.IsNullOrWhiteSpace(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().SubstringSafe(6);
                        }

                        Log.Information($"key={key}, value={SynCryptoHelper.Encrypt(value.ToStringSafe(), key)}");
                        break;
                    case "sha256":
                        Log.Information($"{value.ToStringSafe().ToSHA256()}");
                        break;
                    case "connectionstring":
                        if (string.IsNullOrWhiteSpace(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().SubstringSafe(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').SubstringSafe(0, 32);

                        var encrypt = $"{value.ToStringSafe().EncryptAES(key)}.{key.EncodeBase64()}.{Dns.GetHostName().EncodeBase64()}";
                        Log.Information($"{encrypt}.{encrypt.ToSHA256()}");
                        break;
                }
            });

            rootCommand.Add(subCommandEncrypt);
        }
    }
}
