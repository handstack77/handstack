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
    internal static class SynUsageCommand
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
            #region synusage

            // synusage --directory="%HANDSTACK_HOME%\modules\wwwroot\wwwroot\view" --value=uicontrols > result.csv
            var subCommandSynUsage = new Command("synusage", "특정 디렉토리 내에 있는 코드에서 많이 사용되는 syn 코드를 스캔합니다.") {
                optionDirectory, optionValue
            };

            subCommandSynUsage.SetAction((parseResult) =>
            {
                var directory = parseResult.GetValue(optionDirectory);
                var value = parseResult.GetValue(optionValue)?.ToStringSafe();

                Dictionary<string, List<string>> scanTargets = new Dictionary<string, List<string>>
                {
                    ["functions"] = new List<string>
                    {
                        "syn\\.\\$b\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$m\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$d\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$c\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$k\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$v\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$l\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$w\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$r\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$n\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$p\\.[a-zA-Z0-9_]+",
                        "\\$date\\.[a-zA-Z0-9_]+",
                        "\\$array\\.[a-zA-Z0-9_]+",
                        "\\$string\\.[a-zA-Z0-9_]+",
                        "\\$number\\.[a-zA-Z0-9_]+",
                        "\\$object\\.[a-zA-Z0-9_]+"
                    },
                    ["uicontrols"] = new List<string>
                    {
                        "syn\\.uicontrols\\.\\$checkbox\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$codepicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$colorpicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$contextmenu\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$data\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$dateperiodpicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$datepicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$multiselect\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$select\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$element\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$fileclient\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$list\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$guide\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$htmleditor\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$organization\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$radio\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$sourceeditor\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$textarea\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$textbox\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$button\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$tree\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$grid\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$auigrid\\.[a-zA-Z0-9_]+"
                    }
                };

                string? targetDir = directory?.FullName;
                string scanType = value == null ? "functions" : value;
                if (targetDir == null || directory == null || directory.Exists == false)
                {
                    Log.Error("사용법: dotnet run \"<대상_디렉토리>\" [스캔_타입] > result.csv");
                    Log.Error("스캔 타입: 'functions' (기본값) 또는 'uicontrols'");
                    Environment.Exit(1);
                    return;
                }

                if (!scanTargets.TryGetValue(scanType, out var patternsToUse))
                {
                    string availableTypes = string.Join("' 또는 '", scanTargets.Keys);
                    Log.Error($"오류: 유효하지 않은 스캔 타입입니다. '{availableTypes}' 중에서 선택해주세요.");
                    Environment.Exit(1);
                    return;
                }

                string combinedPattern = $"({string.Join("|", patternsToUse)})";
                Regex synRegex = new Regex(combinedPattern, RegexOptions.Compiled);
                string baseDir = Path.GetFullPath(targetDir);

                Dictionary<string, List<string>> ScanDirectory(string currentDir, string baseDir, Regex synRegex)
                {
                    var results = new Dictionary<string, List<string>>();
                    var searchOption = SearchOption.AllDirectories;

                    try
                    {
                        var files = Directory.EnumerateFiles(currentDir, "*.*", searchOption)
                                             .Where(file => file.EndsWith(".js") || file.EndsWith(".html"));

                        foreach (var fullPath in files)
                        {
                            try
                            {
                                string content = File.ReadAllText(fullPath, Encoding.UTF8);
                                var matches = synRegex.Matches(content);

                                foreach (Match match in matches)
                                {
                                    string funcName = match.Value;
                                    string relPath = Path.GetRelativePath(baseDir, fullPath);

                                    if (!results.ContainsKey(funcName))
                                    {
                                        results[funcName] = new List<string>();
                                    }
                                    results[funcName].Add(relPath);
                                }
                            }
                            catch (Exception ex)
                            {
                                Log.Error($"파일을 읽는 중 오류 발생: {fullPath} - {ex.Message}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Log.Error($"디렉토리 스캔 중 오류 발생: {currentDir} - {ex.Message}");
                    }

                    return results;
                }

                List<SummaryEntry> Summarize(Dictionary<string, List<string>> result)
                {
                    return result
                        .Select(kvp => new SummaryEntry
                        {
                            Function = kvp.Key,
                            TotalCount = kvp.Value.Count
                        })
                        .OrderByDescending(entry => entry.TotalCount)
                        .ToList();
                }

                var result = ScanDirectory(baseDir, baseDir, synRegex);
                var summary = Summarize(result);

                Console.OutputEncoding = Encoding.UTF8;
                Console.WriteLine("이름,사용횟수");
                foreach (var row in summary)
                {
                    Console.WriteLine($"{row.Function},{row.TotalCount}");
                }
            });

            rootCommand.Add(subCommandSynUsage);

            #endregion

        }
    }
}
