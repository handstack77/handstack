using System;
using System.IO;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Xml;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Serilog;

namespace handstack.Extensions
{
    public sealed class CryptoProcessor
    {
        private readonly string key;
        private readonly string token;
        public CryptoProcessor(string key, string token)
        {
            this.key = key;
            this.token = token;
        }

        public ProcessingReport Process(string root)
        {
            var report = new ProcessingReport();

            // dbclient: XML
            var dbclientRoot = PathExtensions.Combine(root, "dbclient");
            if (Directory.Exists(dbclientRoot))
            {
                foreach (var xmlPath in Directory.EnumerateFiles(dbclientRoot, "*.xml", SearchOption.AllDirectories))
                {
                    try
                    {
                        var result = EncryptProcessor.DbClientProcess(xmlPath, key, token);
                        if (result == ProcessResult.Encrypted) report.DbClientEncrypted++;
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"[dbclient][ERR] {xmlPath}: {ex.Message}");
                    }
                }
            }

            // transact: JSON
            var transactRoot = PathExtensions.Combine(root, "transact");
            if (Directory.Exists(transactRoot))
            {
                foreach (var jsonPath in Directory.EnumerateFiles(transactRoot, "*.json", SearchOption.AllDirectories))
                {
                    try
                    {
                        var result = EncryptProcessor.TransactProcess(jsonPath, key, token);
                        if (result == ProcessResult.Encrypted) report.TransactEncrypted++;
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"[transact][ERR] {jsonPath}: {ex.Message}");
                    }
                }
            }

            // function: JSON
            var functionRoot = PathExtensions.Combine(root, "function");
            if (Directory.Exists(functionRoot))
            {
                foreach (var metaPath in Directory.EnumerateFiles(functionRoot, "featureMeta.json", SearchOption.AllDirectories))
                {
                    try
                    {
                        var result = EncryptProcessor.FunctionProcess(metaPath, key, token);
                        if (result == ProcessResult.Encrypted) report.FunctionMetaEncrypted++;
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"[function-meta][ERR] {metaPath}: {ex.Message}");
                    }
                }
            }

            return report;
        }
    }

    public static class EncryptProcessor
    {
        public static ProcessResult TransactProcess(string jsonPath, string key, string token)
        {
            var text = File.ReadAllText(jsonPath);
            JsonNode? root;
            try
            {
                root = JsonNode.Parse(text);
            }
            catch
            {
                return ProcessResult.Skipped;
            }

            if (root is not JsonObject rootNode)
            {
                return ProcessResult.Skipped;
            }

            var hasEncrypt = rootNode.TryGetPropertyValue("EncryptServices", out var encryptNode) && encryptNode is JsonValue;
            var servicesNode = rootNode["Services"];

            if (hasEncrypt == false)
            {
                if (servicesNode is JsonArray servicesArr && servicesArr.Count > 0)
                {
                    var servicesRaw = servicesArr.ToJsonString(new JsonSerializerOptions { WriteIndented = false, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
                    var cipher = LZStringHelper.CompressToUint8Array(servicesRaw).EncryptAES(key);

                    rootNode["SignatureKey"] = token;
                    rootNode["EncryptServices"] = cipher;
                    rootNode["Services"] = new JsonArray();

                    var options = new JsonSerializerOptions { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
                    File.WriteAllText(jsonPath, rootNode.ToJsonString(options));

                    Log.Information($"[transact][ENC] {jsonPath}");
                    return ProcessResult.Encrypted;
                }
            }

            return ProcessResult.Skipped;
        }


        public static ProcessResult FunctionProcess(string metaPath, string key, string token)
        {
            var text = File.ReadAllText(metaPath);
            JsonNode? root;
            try
            {
                root = JsonNode.Parse(text);
            }
            catch
            {
                return ProcessResult.Skipped;
            }

            if (root is not JsonObject rootNode)
                return ProcessResult.Skipped;

            if (rootNode.TryGetPropertyValue("Header", out var headerNode) == false || headerNode is not JsonObject header)
                return ProcessResult.Skipped;

            var hasEncrypt = header.TryGetPropertyValue("EncryptCommands", out var encryptNode) && encryptNode is JsonValue;
            var commandsNode = rootNode["Commands"];

            if (!hasEncrypt)
            {
                if (commandsNode is JsonArray commandsArr && commandsArr.Count > 0)
                {
                    var commandsRaw = commandsArr.ToJsonString(new JsonSerializerOptions { WriteIndented = false, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
                    var cipher = LZStringHelper.CompressToUint8Array(commandsRaw).EncryptAES(key);

                    header["SignatureKey"] = token;
                    header["EncryptCommands"] = cipher;
                    rootNode["Commands"] = new JsonArray();

                    var options = new JsonSerializerOptions { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
                    File.WriteAllText(metaPath, rootNode.ToJsonString(options));

                    Log.Information($"[function-meta][ENC] {metaPath}");
                    return ProcessResult.Encrypted;
                }
            }

            return ProcessResult.Skipped;
        }

        public static ProcessResult DbClientProcess(string xmlPath, string key, string token)
        {
            string ContractNs = "contract.xsd";
            var xml = new XmlDocument { PreserveWhitespace = false };
            xml.Load(xmlPath);

            var nsMgr = new XmlNamespaceManager(xml.NameTable);
            nsMgr.AddNamespace("c", ContractNs);

            var header = xml.SelectSingleNode("/c:mapper/c:header", nsMgr) as XmlElement;
            var commands = xml.SelectSingleNode("/c:mapper/c:commands", nsMgr) as XmlElement;

            if (header == null || commands == null)
            {
                return ProcessResult.Skipped;
            }

            var encryptNode = header.SelectSingleNode("c:encryptcommands", nsMgr) as XmlElement;

            if (encryptNode == null)
            {
                var inner = commands.InnerXml?.Trim() ?? string.Empty;
                if (string.IsNullOrWhiteSpace(inner))
                {
                    return ProcessResult.Skipped;
                }

                var cipher = LZStringHelper.CompressToUint8Array(inner).EncryptAES(key);

                var tokenEl = xml.CreateElement("signaturekey", ContractNs);
                tokenEl.InnerText = token;
                header.AppendChild(tokenEl);

                var encEl = xml.CreateElement("encryptcommands", ContractNs);
                encEl.InnerText = cipher;
                header.AppendChild(encEl);

                commands.InnerXml = string.Empty;

                var settings = new XmlWriterSettings
                {
                    Indent = true,
                    OmitXmlDeclaration = false,
                    NewLineChars = Environment.NewLine,
                    NewLineHandling = NewLineHandling.Replace
                };
                using var writer = XmlWriter.Create(xmlPath, settings);
                xml.Save(writer);

                Log.Information($"[dbclient][ENC] {xmlPath}");
                return ProcessResult.Encrypted;
            }

            return ProcessResult.Skipped;
        }
    }

    public enum ProcessResult
    {
        Skipped = 0,
        Encrypted = 1
    }

    public sealed class ProcessingReport
    {
        public int DbClientEncrypted { get; set; }
        public int TransactEncrypted { get; set; }
        public int FunctionMetaEncrypted { get; set; }
    }
}
