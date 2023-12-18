using System.IO;
using System.Text;

namespace HandStack.Core.ExtensionMethod
{
    public static class MemoryStreamExtensions
    {
        public static string GetAsString(this MemoryStream @this, Encoding encoding)
        {
            return encoding.GetString(@this.ToArray());
        }

        public static string GetAsString(this MemoryStream @this)
        {
            return GetAsString(@this, Encoding.Default);
        }

        public static void WriteString(this MemoryStream @this, string inputString, Encoding encoding)
        {
            byte[] buffer = encoding.GetBytes(inputString);
            @this.Write(buffer, 0, buffer.Length);
        }

        public static void WriteString(this MemoryStream @this, string inputString)
        {
            WriteString(@this, inputString, Encoding.Default);
        }
    }
}
