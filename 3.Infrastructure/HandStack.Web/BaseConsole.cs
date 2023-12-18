using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Message;

using Microsoft.Extensions.CommandLineUtils;

using Newtonsoft.Json;

namespace HandStack.Web
{
    public class BaseConsole
    {
        protected DynamicRequest? ConsoleRequest;
        private bool isMainExecute = false;
        private CommandLineApplication app = new CommandLineApplication();

        protected string HelpText
        {
            get
            {
                return app.ExtendedHelpText;
            }
            set
            {
                app.ExtendedHelpText = value;
            }
        }

        protected string Description
        {
            get
            {
                return app.Description;
            }
            set
            {
                app.Description = value;
            }
        }

        public BaseConsole()
        {
            var entryAssembly = Assembly.GetEntryAssembly();
            if (entryAssembly == null)
            {
                throw new ApplicationException("GetEntryAssembly 호출 오류");
            }

            app.Name = entryAssembly.GetName().Name;
            app.HelpOption("-?|-h|--help");
            app.ExtendedHelpText = "ExitCode가 0인 정상 표준 출력 결과는 DataSet 또는 DynamicResponse JSON" + Environment.NewLine + Environment.NewLine;
            app.VersionOption("-v|--version", () =>
            {
                return string.Format("{0}", entryAssembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion);
            });

            var param = app.Option("-p|--param <value>", "b (base64 [기본값]), p (plain)", CommandOptionType.SingleValue);
            var format = app.Option("-f|--format <value>", "입력 값 포맷 JSON: j [기본값], 텍스트: t, 파일 f", CommandOptionType.SingleValue);
            var key = app.Option("-k|--key <value>", "실행 컨텍스트 식별키", CommandOptionType.SingleValue);

            app.Command("ECHO00", (command) =>
            {
                CommandOption bypass = command.Option("-r|--return <value>", "입력값 반환 매개변수", CommandOptionType.SingleValue);

                command.OnExecute(() =>
                {
                    string requestID = key.HasValue() == true ? key.Value() : "ECHO00-" + DateTime.Now.ToString("yyyyMMddHHmmssffffff");
                    DynamicResponse response = new DynamicResponse();
                    response.CorrelationID = requestID;

                    try
                    {
                        response.ResultObject = $"ServerDate: {DateTime.Now.ToString()}, ReturnValue: {bypass.Value()}, Description: {app.Description}";
                        Console.Out.WriteLine(JsonConvert.SerializeObject(response));
                    }
                    catch (Exception exception)
                    {
                        Console.Error.WriteLine(exception);
                    }

                    return 0;
                });
            });

            var argument = app.Argument("argument", "DynamicRequest JSON");

            app.OnExecute(() =>
            {
                isMainExecute = true;

                if (param.HasValue() == false || param.HasValue() == false)
                {
                    return 1;
                }
                else
                {
                    string json = "";
                    bool isBase64Text = param.Value().Trim().ToLower() == "b";
                    bool isDataFormat = format.Value().Trim().ToLower() == "1";

                    try
                    {
                        if (isDataFormat == true)
                        {
                            json = argument.Value;
                        }
                        else
                        {
                            if (File.Exists(argument.Value) == true)
                            {
                                json = File.ReadAllText(argument.Value);
                            }
                            else
                            {
                                Console.Error.WriteLine($"{argument.Value} JSON 데이터 파일 없음");
                                return -1;
                            }
                        }

                        if (isBase64Text == true)
                        {
                            json = argument.Value.DecodeBase64();
                        }

                        ConsoleRequest = JsonConvert.DeserializeObject<DynamicRequest>(json);
                    }
                    catch (Exception exception)
                    {
                        Console.Error.WriteLine($"isPlainText: {isBase64Text}, argument: {argument}, exception: {exception.Message}");
                        return -1;
                    }
                }

                return 0;
            });
        }

        protected void AddCommand(string name, string commandUsage, Action<CommandLineApplication> configuration, bool throwOnUnexpectedArg = true)
        {
            if (string.IsNullOrEmpty(commandUsage) == false)
            {
                HelpText = HelpText + commandUsage + Environment.NewLine;
            }

            var cli = app.Command(name, configuration, throwOnUnexpectedArg);

            cli.Option("-p|--param <value>", "b (base64 [기본값]), p (plain)", CommandOptionType.SingleValue);
            cli.Option("-f|--format <value>", "입력 값 포맷 JSON: j [기본값], 텍스트: t, 파일 f", CommandOptionType.SingleValue);
            cli.Option("-k|--key <value>", "실행 컨텍스트 식별키", CommandOptionType.SingleValue);
            cli.Argument("argument", "f:JSON, t:PlainText, f:{key}.input");
        }

        protected int ExecCommand(string[] args)
        {
            int exitCode = -1;
            try
            {
                List<string> cleanArguments = new List<string>();

                foreach (string arg in args)
                {
                    if (string.IsNullOrEmpty(arg) == false && arg.IndexOf("-debug") == -1 && arg.IndexOf("-delay") == -1)
                    {
                        cleanArguments.Add(arg);
                    }
                }

                exitCode = app.Execute(cleanArguments.ToArray());
            }
            catch (CommandParsingException ex)
            {
                Console.Error.WriteLine($"CommandParsingException: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Exception: {0}", ex.Message);
            }

            return exitCode;
        }

        protected int ExecDynamic(string[] args, Func<dynamic?, int> invoke)
        {
            int exitCode = -1;
            try
            {
                exitCode = app.Execute(args);
                if (isMainExecute == true && exitCode == 0)
                {
                    exitCode = invoke(ConsoleRequest);
                }
                else if (isMainExecute == true && exitCode == 1)
                {
                    exitCode = invoke(args);
                }
            }
            catch (CommandParsingException ex)
            {
                Console.Error.WriteLine($"CommandParsingException: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Exception: {0}", ex.Message);
            }

            return exitCode;
        }

        protected object? ParameterValue(List<DynamicParameter> parameters, string parameterName)
        {
            object? result = null;
            foreach (DynamicParameter item in parameters)
            {
                if (item.ParameterName == parameterName)
                {
                    result = item.Value;
                    break;
                }
            }

            return result;
        }
    }
}
