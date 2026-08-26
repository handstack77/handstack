using System;
using System.Collections.Generic;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace prompter.Extensions
{
    public static class PromptLogSanitizer
    {
        public static string SerializeRequest(DynamicRequest request)
        {
            var token = JObject.FromObject(request);
            var dynamicObjects = token["DynamicObjects"] as JArray;
            if (dynamicObjects != null && request.DynamicObjects != null)
            {
                for (var i = 0; i < request.DynamicObjects.Count && i < dynamicObjects.Count; i++)
                {
                    if (dynamicObjects[i] is JObject queryToken)
                    {
                        RedactMedia(queryToken, request.DynamicObjects[i]);
                    }
                }
            }

            return token.ToString(Formatting.None);
        }

        public static string SerializeQueryObject(QueryObject queryObject)
        {
            var token = JObject.FromObject(queryObject);
            RedactMedia(token, queryObject);
            return token.ToString(Formatting.None);
        }

        private static void RedactMedia(JObject queryToken, QueryObject queryObject)
        {
            if (string.IsNullOrWhiteSpace(queryObject.QueryID) == true || queryObject.Parameters == null)
            {
                return;
            }

            var promptMap = PromptMapper.GetPromptMap(queryObject.QueryID);
            if (promptMap == null || promptMap.MediaVariables.Count == 0)
            {
                return;
            }

            var mediaVariables = new Dictionary<string, Entity.PromptMediaVariable>(StringComparer.OrdinalIgnoreCase);
            foreach (var mediaVariable in promptMap.MediaVariables)
            {
                mediaVariables[PromptMapper.NormalizeParameterName(mediaVariable.Name)] = mediaVariable;
            }

            var parameters = queryToken["Parameters"] as JArray;
            if (parameters == null)
            {
                return;
            }

            for (var i = 0; i < queryObject.Parameters.Count && i < parameters.Count; i++)
            {
                var source = queryObject.Parameters[i];
                var parameterName = PromptMapper.NormalizeParameterName(source.ParameterName);
                if (mediaVariables.TryGetValue(parameterName, out var mediaVariable) == false
                    || parameters[i] is not JObject parameterToken)
                {
                    continue;
                }

                var base64Length = source.Value.ToStringSafe().Length;
                parameterToken["Value"] = $"[media:{mediaVariable.Type};base64-length:{base64Length}]";
            }
        }
    }
}
