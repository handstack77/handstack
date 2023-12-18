using System.Collections.Specialized;
using System.Text.RegularExpressions;

namespace HandStack.Core.Helpers
{
    /// <example>
    /// 	<code>
    /// // {-,/,--}param{ ,=,:}((",')value(",'))
    /// // -size=100 /height:'400' -param1 "Nice stuff !" --debug
    /// // -param1 value1 --param2 /param3:"Test-:-work" /param4=happy -param5 '--=nice=--'
    /// ArgumentHelper arguments = new ArgumentHelper(Args);
    ///
    /// if(arguments["param1"] != null) {
    ///     Console.WriteLine("Param1 value: " + arguments["param1"]);
    /// }
    /// else {
    ///     Console.WriteLine("Param1 not defined !");
    /// }
    /// 	</code>
    /// </example>
    public class ArgumentHelper
    {
        private StringDictionary parameters = new StringDictionary();

        public ArgumentHelper(string[] args)
        {
            Regex spliter = new Regex(@"^-{1,2}|^/|=|:", RegexOptions.IgnoreCase | RegexOptions.Compiled);
            Regex remover = new Regex(@"^['""]?(.*?)['""]?$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

            string? parameter = null;
            string[] tokens;

            foreach (string arg in args)
            {
                tokens = spliter.Split(arg, 3);

                switch (tokens.Length)
                {
                    case 1:
                        if (parameter != null)
                        {
                            if (parameters.ContainsKey(parameter) == false)
                            {
                                tokens[0] = remover.Replace(tokens[0], "$1");

                                parameters.Add(parameter, tokens[0]);
                            }
                            parameter = null;
                        }
                        break;
                    case 2:
                        if (parameter != null)
                        {
                            if (parameters.ContainsKey(parameter) == false)
                            {
                                parameters.Add(parameter, "true");
                            }
                        }
                        parameter = tokens[1];
                        break;
                    case 3:
                        if (parameter != null)
                        {
                            if (parameters.ContainsKey(parameter) == false)
                            {
                                parameters.Add(parameter, "true");
                            }
                        }

                        parameter = tokens[1];

                        if (parameters.ContainsKey(parameter) == false)
                        {
                            tokens[2] = remover.Replace(tokens[2], "$1");
                            parameters.Add(parameter, tokens[2]);
                        }

                        parameter = null;
                        break;
                }
            }

            if (parameter != null)
            {
                if (parameters.ContainsKey(parameter) == false)
                {
                    parameters.Add(parameter, "true");
                }
            }
        }

        public string? this[string Param]
        {
            get
            {
                return parameters[Param];
            }
        }
    }
}
