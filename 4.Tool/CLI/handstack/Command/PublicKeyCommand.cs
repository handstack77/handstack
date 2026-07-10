using System;
using System.CommandLine;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;

namespace handstack
{
    internal static class PublicKeyCommand
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

            // publickey --file="C:\projects\MyLib\bin\Release\net10.0\MyLib.dll"
            var subCommandPublicKey = new Command("publickey", "지정한 .NET(.NET Core/5+/Framework) 관리형 DLL의 강력한 이름(Strong Name) 서명에 사용된 공개 키를 출력합니다.") {
                optionFile, optionValue
            };

            subCommandPublicKey.SetAction((parseResult) =>
            {
                var ddlFile = parseResult.GetValue(optionFile);

                string? ddlFilePath = ddlFile?.FullName;
                if (string.IsNullOrWhiteSpace(ddlFilePath) == true || File.Exists(ddlFilePath) == false)
                {
                    Console.Error.WriteLine($"관리형 DLL 파일을 찾을 수 없습니다: {ddlFilePath}");
                }

                try
                {
                    var asmName = AssemblyName.GetAssemblyName(ddlFilePath!);

                    var publicKey = asmName.GetPublicKey() ?? Array.Empty<byte>();
                    var publicKeyToken = asmName.GetPublicKeyToken() ?? Array.Empty<byte>();

                    Console.WriteLine($"어셈블리 파일 경로: {ddlFilePath}");
                    Console.WriteLine($"어셈블리 이름: {asmName.Name}");
                    Console.WriteLine($"어셈블리 버전: {asmName.Version}");
                    Console.WriteLine();

                    if (publicKey.Length == 0)
                    {
                        Console.WriteLine("강력한 이름 서명: 아니오 (공개 키 없음)");
                    }
                    else
                    {
                        Console.WriteLine("강력한 이름 서명: 예");
                        Console.WriteLine("공개 키 (Hex):");
                        Console.WriteLine(Program.ToHex(publicKey));
                        Console.WriteLine();
                        Console.WriteLine("공개 키 (Base64):");
                        Console.WriteLine(Convert.ToBase64String(publicKey));

                        using (SHA256 sha256 = SHA256.Create())
                        {
                            byte[] hash = sha256.ComputeHash(publicKey);
                            Console.WriteLine();
                            Console.WriteLine("공개 키 (SHA256):");
                            Console.WriteLine(Program.ToHex(hash).ToLowerInvariant());
                        }

                        Console.WriteLine();
                        Console.WriteLine("공개 키 (Token):");
                        Console.WriteLine(publicKeyToken.Length == 0 ? "(없음)" : Program.ToHex(publicKeyToken).ToLowerInvariant());
                    }
                }
                catch (BadImageFormatException)
                {
                    Console.Error.WriteLine(".NET 어셈블리가 아닙니다(네이티브 DLL 또는 손상된 파일).");
                }
                catch (FileLoadException ex)
                {
                    Console.Error.WriteLine("어셈블리 메타데이터를 읽을 수 없습니다: " + ex.Message);
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("예기치 않은 오류: " + ex.Message);
                }
            });

            rootCommand.Add(subCommandPublicKey);
        }
    }
}
