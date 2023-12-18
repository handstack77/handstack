using System.Collections.Specialized;
using System.Text.RegularExpressions;

namespace HandStack.Web.Common
{
    public class Arguments
    {
        private StringDictionary parameters;

        /// <code>
        /// -size=100 /height:'400' -param1 "Nice stuff !" --debug
        /// </code>
        public Arguments(string[] Args)
        {
            parameters = new StringDictionary();
            Regex spliter = new Regex(@"^-{1,2}|^/|=|:", RegexOptions.IgnoreCase | RegexOptions.Compiled);
            Regex remover = new Regex(@"^['""]?(.*?)['""]?$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

            string? parameter = null;
            string[] Parts;

            foreach (string Txt in Args)
            {
                Parts = spliter.Split(Txt, 3);

                switch (Parts.Length)
                {
                    case 1:
                        if (parameter != null)
                        {
                            if (parameters.ContainsKey(parameter) == false)
                            {
                                Parts[0] = remover.Replace(Parts[0], "$1");
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
                            Parts[2] = remover.Replace(Parts[2], "$1");
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
