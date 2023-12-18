using System.IO;
using System.Text;

namespace HandStack.Core.Helpers
{
    public class StringStream : Stream
    {
        private readonly MemoryStream memoryStream;

        public override bool CanRead => memoryStream.CanRead;

        public override bool CanSeek => memoryStream.CanSeek;

        public override bool CanWrite => memoryStream.CanWrite;

        public override long Length => memoryStream.Length;

        public override long Position
        {
            get => memoryStream.Position;
            set => memoryStream.Position = value;
        }

        public StringStream(string text)
        {
            memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(text));
        }

        public StringStream()
        {
            memoryStream = new MemoryStream();
        }

        public StringStream(int capacity)
        {
            memoryStream = new MemoryStream(capacity);
        }

        public override void Flush()
        {
            memoryStream.Flush();
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            return memoryStream.Read(buffer, offset, count);
        }

        public override long Seek(long offset, SeekOrigin origin)
        {
            return memoryStream.Seek(offset, origin);
        }

        public override void SetLength(long value)
        {
            memoryStream.SetLength(value);
        }

        public override void Write(byte[] buffer, int offset, int count)
        {
            memoryStream.Write(buffer, offset, count);
        }

        public override string ToString()
        {
            return Encoding.UTF8.GetString(memoryStream.GetBuffer(), 0, (int)memoryStream.Length);
        }

        public override int ReadByte()
        {
            return memoryStream.ReadByte();
        }

        public override void WriteByte(byte value)
        {
            memoryStream.WriteByte(value);
        }
    }
}
