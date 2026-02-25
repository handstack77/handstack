using System;
using System.Data;
using System.IO;

using HandStack.Core.Helpers;

namespace HandStack.Core.ExtensionMethod
{
    public static class DataSetExtensions
    {
        public static void SaveSchema(this DataSet @this, string schemaPath)
        {
            var fileInfo = new FileInfo(schemaPath);
            if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
            {
                fileInfo.Directory?.Create();
            }

            @this.WriteXmlSchema(schemaPath);
        }

        public static void SaveFile(this DataSet @this, string filePath)
        {
            var fileInfo = new FileInfo(filePath);
            if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
            {
                fileInfo.Directory?.Create();
            }

            @this.WriteXml(filePath, XmlWriteMode.WriteSchema);
        }

        public static void LoadSchema(this DataSet @this, string schemaPath)
        {
            var fileInfo = new FileInfo(schemaPath);
            if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
            {
                fileInfo.Directory?.Create();
            }

            @this.ReadXmlSchema(schemaPath);
        }

        public static void LoadFile(this DataSet @this, string filePath)
        {
            var fileInfo = new FileInfo(filePath);
            if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
            {
                fileInfo.Directory?.Create();
            }

            @this.ReadXml(filePath);
        }

        public static void BuildExceptionData(this DataSet @this, string error = "N", string level = "Information", string message = "", string? typeMember = "", string? stackTrace = "")
        {
            @this.Tables.Clear();

            var builder = new DataTableHelper("ExceptionData");
            builder.AddColumn("Error", typeof(string));
            builder.AddColumn("Level", typeof(string));
            builder.AddColumn("Message", typeof(string));
            builder.AddColumn("StackTrace", typeof(string));
            builder.AddColumn("TypeMember", typeof(string));

            if (!string.IsNullOrWhiteSpace(error))
            {
                builder.NewRow();
                builder.SetValue(0, "Error", error);
                builder.SetValue(0, "Level", level);
                builder.SetValue(0, "Message", message);
                builder.SetValue(0, "StackTrace", stackTrace.ToStringSafe());
                builder.SetValue(0, "TypeMember", typeMember.ToStringSafe());
            }

            using var table = builder.GetDataTable();
            @this.Tables.Add(table);
        }

        public static void BuildExceptionData(this DataSet @this, Exception exception, string? typeMember = "")
        {
            @this.Tables.Clear();

            var builder = new DataTableHelper("ExceptionData");
            builder.AddColumn("Error", typeof(string));
            builder.AddColumn("Level", typeof(string));
            builder.AddColumn("Message", typeof(string));
            builder.AddColumn("StackTrace", typeof(string));
            builder.AddColumn("TypeMember", typeof(string));

            builder.NewRow();
            builder.SetValue(0, "Error", "Y");
            builder.SetValue(0, "Level", "Error");
            builder.SetValue(0, "Message", exception.Message);
            builder.SetValue(0, "StackTrace", exception.StackTrace.ToStringSafe());
            builder.SetValue(0, "TypeMember", $"{exception.GetType().ToStringSafe()}, typeMember: {typeMember}");

            using var table = builder.GetDataTable();
            @this.Tables.Add(table);
        }
    }
}

