using System.IO;
using System.Text;

namespace HandStack.Core.ExtensionMethod
{
    public static class MemoryStreamExtensions
    {
        public static string GetAsString(this MemoryStream @this, Encoding encoding)
        {
            if (@this.GetType() == typeof(MemoryStream) && @this.TryGetBuffer(out var buffer))
            {
                return encoding.GetString(buffer.Array!, buffer.Offset, buffer.Count);
            }

            return encoding.GetString(@this.ToArray());
        }

        public static string GetAsString(this MemoryStream @this)
        {
            return GetAsString(@this, Encoding.Default);
        }

        public static void WriteString(this MemoryStream @this, string inputString, Encoding encoding)
        {
            var buffer = encoding.GetBytes(inputString);
            @this.Write(buffer, 0, buffer.Length);
        }

        public static void WriteString(this MemoryStream @this, string inputString)
        {
            WriteString(@this, inputString, Encoding.Default);
        }
    }
}
