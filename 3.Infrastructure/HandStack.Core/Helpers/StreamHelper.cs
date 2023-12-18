using System;
using System.IO;
using System.Text;

namespace HandStack.Core.Helpers
{
    public class StreamHelper
    {
        private Stream ioStream;

        public StreamHelper(Stream ioStream)
        {
            this.ioStream = ioStream;
        }

        public string ReadString()
        {
            int len = 0;
            len = ioStream.ReadByte() * 256;
            len += ioStream.ReadByte();
            byte[] inBuffer = new byte[len];
            ioStream.Read(inBuffer, 0, len);

            return Encoding.UTF8.GetString(inBuffer);
        }

        public int WriteString(string outString)
        {
            byte[] outBuffer = Encoding.UTF8.GetBytes(outString);
            int len = outBuffer.Length;
            if (len > UInt16.MaxValue)
            {
                len = (int)UInt16.MaxValue;
            }
            ioStream.WriteByte((byte)(len / 256));
            ioStream.WriteByte((byte)(len & 255));
            ioStream.Write(outBuffer, 0, len);
            ioStream.Flush();

            return outBuffer.Length + 2;
        }
    }
}
