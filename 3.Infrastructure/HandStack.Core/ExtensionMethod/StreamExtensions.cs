using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace HandStack.Core.ExtensionMethod
{
    public static class StreamExtensions
    {
        public static void CopyStream(this Stream @this, Stream destnationStream, int bufferSize)
        {
            byte[] buffer = new byte[bufferSize];
            int read;
            while ((read = @this.Read(buffer, 0, buffer.Length)) > 0)
            {
                destnationStream.Write(buffer, 0, read);
            }
        }

        public static void CopyStream(this Stream @this, Stream destnationStream, int bufferSize, bool append)
        {
            if (append == true)
            {
                destnationStream.Seek(0, SeekOrigin.End);
            }

            CopyStream(@this, destnationStream, bufferSize);
        }

        public static StreamReader GetReader(this Stream stream)
        {
            return stream.GetReader(Encoding.UTF8);
        }

        public static StreamReader GetReader(this Stream stream, Encoding encoding)
        {
            if (stream.CanRead == false)
            {
                throw new InvalidOperationException("Stream 객체가 CanRead를 지원하지 않음");
            }

            encoding = (encoding ?? Encoding.UTF8);
            return new StreamReader(stream, encoding);
        }

        public static StreamWriter GetWriter(this Stream stream)
        {
            return stream.GetWriter(Encoding.UTF8);
        }

        public static StreamWriter GetWriter(this Stream stream, Encoding encoding)
        {
            if (stream.CanWrite == false)
            {
                throw new InvalidOperationException("Stream 객체가 CanWrite을 지원하지 않음");
            }

            encoding = (encoding ?? Encoding.UTF8);
            return new StreamWriter(stream, encoding);
        }

        public static string ReadToEnd(this Stream stream)
        {
            return stream.ReadToEnd(Encoding.UTF8);
        }

        public static string ReadToEnd(this Stream stream, Encoding encoding)
        {
            using (var reader = stream.GetReader(encoding))
            {
                return reader.ReadToEnd();
            }
        }

        public static Stream SeekToBegin(this Stream stream)
        {
            if (stream.CanSeek == false)
            {
                throw new InvalidOperationException("Stream 객체가 CanSeek를 지원하지 않음");
            }

            stream.Seek(0, SeekOrigin.Begin);
            return stream;
        }

        public static Stream SeekToEnd(this Stream stream)
        {
            if (stream.CanSeek == false)
            {
                throw new InvalidOperationException("Stream 객체가 CanSeek를 지원하지 않음");
            }

            stream.Seek(0, SeekOrigin.End);
            return stream;
        }

        public static Stream CopyTo(this Stream stream, Stream destnationStream)
        {
            return CopyTo(stream, destnationStream, 4096);
        }

        public static Stream CopyTo(this Stream stream, Stream destnationStream, int bufferSize)
        {
            if (stream.CanRead == false)
            {
                throw new InvalidOperationException("Stream 객체가 CanRead를 지원하지 않음");
            }

            if (destnationStream.CanWrite == false)
            {
                throw new InvalidOperationException("Stream 객체가 CanSeek를 지원하지 않음");
            }

            var buffer = new byte[bufferSize];
            int bytesRead;

            while ((bytesRead = stream.Read(buffer, 0, bufferSize)) > 0)
            {
                destnationStream.Write(buffer, 0, bytesRead);
            }
            return stream;
        }

        public static MemoryStream CopyToMemory(this Stream stream)
        {
            var memoryStream = new MemoryStream((int)stream.Length);
            stream.CopyTo(memoryStream);
            return memoryStream;
        }

        public static byte[] ReadAllBytes(this Stream stream)
        {
            using (var memoryStream = stream.CopyToMemory())
            {
                return memoryStream.ToArray();
            }
        }

        public static byte[]? ReadFixedBuffersize(this Stream stream, int bufsize)
        {
            byte[]? buf = new byte[bufsize];
            int offset = 0, cnt;
            do
            {
                cnt = stream.Read(buf, offset, bufsize - offset);
                if (cnt == 0)
                {
                    return null;
                }

                offset += cnt;
            } while (offset < bufsize);

            return buf;
        }

        public static void Write(this Stream stream, byte[] bytes)
        {
            stream.Write(bytes, 0, bytes.Length);
        }

        public static byte[] ToByteArray(this Stream stream)
        {
            using (var ms = new MemoryStream())
            {
                stream.CopyTo(ms);
                return ms.ToArray();
            }
        }

        public static string ToMD5Hash(this Stream stream)
        {
            using (MD5 md5 = MD5.Create())
            {
                byte[] hashBytes = md5.ComputeHash(stream);
                var sb = new StringBuilder();
                foreach (byte bytes in hashBytes)
                {
                    sb.Append(bytes.ToString("X2"));
                }

                return sb.ToString();
            }
        }
    }
}
