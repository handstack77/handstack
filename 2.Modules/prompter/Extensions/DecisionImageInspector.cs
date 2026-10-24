using System;
using System.Buffers.Binary;
using System.IO;
using System.Text;

namespace prompter.Extensions
{
    // 판단 API로 보낼 이미지의 실제 형식과 크기를 호출 전에 확인합니다.
    public static class DecisionImageInspector
    {
        public readonly record struct ImageInfo(string Format, int Width, int Height, bool Animated);

        public static ImageInfo Inspect(byte[] data)
        {
            ArgumentNullException.ThrowIfNull(data);

            if (data.Length >= 24 && data.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }) == true)
            {
                return InspectPng(data);
            }

            if (data.Length >= 4 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF)
            {
                return InspectJpeg(data);
            }

            // WebP는 크기를 읽지 않고 컨테이너 표식만 확인합니다.
            if (data.Length >= 12 && Encoding.ASCII.GetString(data, 0, 4) == "RIFF" && Encoding.ASCII.GetString(data, 8, 4) == "WEBP")
            {
                return new ImageInfo("webp", 0, 0, false);
            }

            throw new InvalidDataException("지원하지 않는 이미지 형식입니다.");
        }

        public static string ToMimeType(string format)
        {
            return format switch
            {
                "png" => "image/png",
                "jpg" => "image/jpeg",
                "webp" => "image/webp",
                _ => ""
            };
        }

        private static ImageInfo InspectPng(byte[] data)
        {
            if (Encoding.ASCII.GetString(data, 12, 4) != "IHDR")
            {
                throw new InvalidDataException("PNG 헤더가 올바르지 않습니다.");
            }

            var width = BinaryPrimitives.ReadUInt32BigEndian(data.AsSpan(16, 4));
            var height = BinaryPrimitives.ReadUInt32BigEndian(data.AsSpan(20, 4));
            if (width == 0 || height == 0 || width > int.MaxValue || height > int.MaxValue)
            {
                throw new InvalidDataException("PNG 크기가 올바르지 않습니다.");
            }

            // 첫 IDAT 앞에 acTL 청크가 있으면 애니메이션 PNG입니다.
            var animated = false;
            var position = 8;
            while (position + 8 <= data.Length)
            {
                var length = BinaryPrimitives.ReadUInt32BigEndian(data.AsSpan(position, 4));
                var type = Encoding.ASCII.GetString(data, position + 4, 4);
                if (type == "acTL")
                {
                    animated = true;
                    break;
                }

                if (type == "IDAT" || length > data.Length)
                {
                    break;
                }

                position += 12 + (int)length;
            }

            return new ImageInfo("png", (int)width, (int)height, animated);
        }

        private static ImageInfo InspectJpeg(byte[] data)
        {
            var position = 2;
            while (position + 4 <= data.Length)
            {
                if (data[position] != 0xFF)
                {
                    break;
                }

                var marker = data[position + 1];
                if (marker == 0xFF)
                {
                    position++;
                    continue;
                }

                // 길이 필드가 없는 표식입니다.
                if (marker == 0x01 || marker is >= 0xD0 and <= 0xD8)
                {
                    position += 2;
                    continue;
                }

                if (marker is 0xD9 or 0xDA)
                {
                    break;
                }

                var length = BinaryPrimitives.ReadUInt16BigEndian(data.AsSpan(position + 2, 2));
                var isFrame = marker is >= 0xC0 and <= 0xCF && marker is not (0xC4 or 0xC8 or 0xCC);
                if (isFrame == true)
                {
                    if (position + 9 > data.Length)
                    {
                        break;
                    }

                    var height = BinaryPrimitives.ReadUInt16BigEndian(data.AsSpan(position + 5, 2));
                    var width = BinaryPrimitives.ReadUInt16BigEndian(data.AsSpan(position + 7, 2));
                    if (width == 0 || height == 0)
                    {
                        break;
                    }

                    return new ImageInfo("jpg", width, height, false);
                }

                position += 2 + length;
            }

            throw new InvalidDataException("JPEG 헤더가 올바르지 않습니다.");
        }
    }
}
