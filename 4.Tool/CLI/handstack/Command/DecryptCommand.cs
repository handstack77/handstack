using System;
using System.CommandLine;
using System.Net;

using handstack.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Serilog;

using Sqids;

namespace handstack
{
    internal static class DecryptCommand
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

            var subCommandDecrypt = new Command("decrypt", "지정된 매개변수로 값 디코딩을 수행합니다") {
                optionFormat, optionKey, optionValue
            };

            // handstack decrypt --format=base64 --value="YmxhYmxhIGhlbGxvIHdvcmxk"
            subCommandDecrypt.SetAction((parseResult) =>
            {
                var format = parseResult.GetValue(optionFormat).ToStringSafe();
                var key = parseResult.GetValue(optionKey).ToStringSafe();
                var value = parseResult.GetValue(optionValue);

                switch (format)
                {
                    case "base64":
                        Log.Information($"{value?.DecodeBase64()}");
                        break;
                    case "suid":
                        if (Guid.TryParse(value.ToStringSafe(), out var guid) == true)
                        {
                            Log.Information($"{guid.ToDateTime()}");
                        }
                        else
                        {
                            Log.Information("");
                        }
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
                            Log.Information($"{string.Join(",", sqids.Decode(value))}");
                        }
                        catch
                        {
                            Log.Information("");
                        }
                        break;
                    case "aes256":
                        if (string.IsNullOrWhiteSpace(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().SubstringSafe(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').SubstringSafe(0, 32);
                        Log.Information($"{value.ToStringSafe().DecryptAES(key)}");
                        break;
                    case "syn":
                        if (string.IsNullOrWhiteSpace(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().SubstringSafe(6);
                        }

                        Log.Information($"{SynCryptoHelper.Decrypt(value.ToStringSafe(), key)}");
                        break;
                    case "sha256":
                        Log.Information($"{key == value.ToStringSafe().ToSHA256()}");
                        break;
                    case "connectionstring":
                        var values = value.ToStringSafe().SplitAndTrim('.');
                        if (values.Count < 4)
                        {
                            Log.Information($"인코딩 값 확인 필요");
                            break;
                        }

                        var encrypt = values[0];
                        var decryptKey = values[1];
                        var hostName = values[2].DecodeBase64();
                        var hash = values[3];

                        if (hostName == Dns.GetHostName() && $"{encrypt}.{decryptKey}.{values[2]}".ToSHA256() == hash)
                        {
                            decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').SubstringSafe(0, 32);
                            Log.Information($"{encrypt.DecryptAES(decryptKey)}");
                        }
                        else
                        {
                            Log.Information($"인코딩 값 확인 필요");
                        }
                        break;
                }
            });

            rootCommand.Add(subCommandDecrypt);
        }
    }
}
