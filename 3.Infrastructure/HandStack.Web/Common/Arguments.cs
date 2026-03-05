using System.Collections.Specialized;
using System.Text.RegularExpressions;

namespace HandStack.Web.Common
{
    public class Arguments
    {
        private static readonly Regex Spliter = new Regex(@"^-{1,2}|^/|=|:", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex Remover = new Regex(@"^['""]?(.*?)['""]?$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private StringDictionary parameters;

        /// <code>
        /// -size=100 /height:'400' -param1 "Nice stuff !" --debug
        /// </code>
        public Arguments(string[] Args)
        {
            parameters = new StringDictionary();

            string? parameter = null;
            string[] Parts;

            foreach (var Txt in Args)
            {
                Parts = Spliter.Split(Txt, 3);

                switch (Parts.Length)
                {
                    case 1:
                        if (parameter != null)
                        {
                            if (parameters.ContainsKey(parameter) == false)
                            {
                                Parts[0] = Remover.Replace(Parts[0], "$1");
                                parameters.Add(parameter, Parts[0]);
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
                        parameter = Parts[1];
                        break;
                    case 3:
                        if (parameter != null)
                        {
                            if (parameters.ContainsKey(parameter) == false)
                            {
                                parameters.Add(parameter, "true");
                            }
                        }

                        parameter = Parts[1];
                        if (parameters.ContainsKey(parameter) == false)
                        {
                            Parts[2] = Remover.Replace(Parts[2], "$1");
                            parameters.Add(parameter, Parts[2]);
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
                return (parameters[Param]);
            }
        }
    }
}
