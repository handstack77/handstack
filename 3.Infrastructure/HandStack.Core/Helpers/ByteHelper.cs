using System;
using System.Globalization;

namespace HandStack.Core.Helpers
{
    public struct ByteSize : IComparable<ByteSize>, IEquatable<ByteSize>
    {
        public static readonly ByteSize MinValue = FromBits(0);
        public static readonly ByteSize MaxValue = FromBits(long.MaxValue);

        public const long BitsInByte = 8;
        public const long BytesInKiloByte = 1024;
        public const long BytesInMegaByte = 1048576;
        public const long BytesInGigaByte = 1073741824;
        public const long BytesInTeraByte = 1099511627776;
        public const long BytesInPetaByte = 1125899906842624;

        public const string BitSymbol = "b";
        public const string ByteSymbol = "B";
        public const string KiloByteSymbol = "KB";
        public const string MegaByteSymbol = "MB";
        public const string GigaByteSymbol = "GB";
        public const string TeraByteSymbol = "TB";
        public const string PetaByteSymbol = "PB";

        public long Bits { get; private set; }
        public double Bytes { get; private set; }
        public double KiloBytes => Bytes / BytesInKiloByte;
        public double MegaBytes => Bytes / BytesInMegaByte;
        public double GigaBytes => Bytes / BytesInGigaByte;
        public double TeraBytes => Bytes / BytesInTeraByte;
        public double PetaBytes => Bytes / BytesInPetaByte;

        public string LargestWholeNumberSymbol
        {
            get
            {
                if (Math.Abs(PetaBytes) >= 1)
                    return PetaByteSymbol;

                if (Math.Abs(TeraBytes) >= 1)
                    return TeraByteSymbol;

                if (Math.Abs(GigaBytes) >= 1)
                    return GigaByteSymbol;

                if (Math.Abs(MegaBytes) >= 1)
                    return MegaByteSymbol;

                if (Math.Abs(KiloBytes) >= 1)
                    return KiloByteSymbol;

                if (Math.Abs(Bytes) >= 1)
                    return ByteSymbol;

                return BitSymbol;
            }
        }

        public double LargestWholeNumberValue
        {
            get
            {
                if (Math.Abs(PetaBytes) >= 1)
                    return PetaBytes;

                if (Math.Abs(TeraBytes) >= 1)
                    return TeraBytes;

                if (Math.Abs(GigaBytes) >= 1)
                    return GigaBytes;

                if (Math.Abs(MegaBytes) >= 1)
                    return MegaBytes;

                if (Math.Abs(KiloBytes) >= 1)
                    return KiloBytes;

                if (Math.Abs(Bytes) >= 1)
                    return Bytes;

                return Bits;
            }
        }

        public ByteSize(double byteSize)
            : this()
        {
            Bits = (long)Math.Ceiling(byteSize * BitsInByte);

            Bytes = byteSize;
        }

        public static ByteSize FromBits(long value)
        {
            return new ByteSize(value / (double)BitsInByte);
        }

        public static ByteSize FromBytes(double value)
        {
            return new ByteSize(value);
        }

        public static ByteSize FromKiloBytes(double value)
        {
            return new ByteSize(value * BytesInKiloByte);
        }

        public static ByteSize FromMegaBytes(double value)
        {
            return new ByteSize(value * BytesInMegaByte);
        }

        public static ByteSize FromGigaBytes(double value)
        {
            return new ByteSize(value * BytesInGigaByte);
        }

        public static ByteSize FromTeraBytes(double value)
        {
            return new ByteSize(value * BytesInTeraByte);
        }

        public static ByteSize FromPetaBytes(double value)
        {
            return new ByteSize(value * BytesInPetaByte);
        }

        public override string ToString()
        {
            return ToString("0.##", CultureInfo.CurrentCulture);
        }

        public string ToString(string format)
        {
            return ToString(format, CultureInfo.CurrentCulture);
        }

        public string ToString(string format, IFormatProvider provider)
        {
            if (format.Contains("#") == false && format.Contains("0") == false)
            {
                format = "0.## " + format;
            }

            if (provider == null)
            {
                provider = CultureInfo.CurrentCulture;
            }

            Func<string, bool> has = value => format.IndexOf(value, StringComparison.CurrentCultureIgnoreCase) != -1;
            Func<double, string> output = n => n.ToString(format, provider);

            string result = "";
            if (has("PB") == true)
            {
                result = output(PetaBytes);
            }
            else if (has("TB") == true)
            {
                result = output(TeraBytes);
            }
            else if (has("GB") == true)
            {
                result = output(GigaBytes);
            }
            else if (has("MB") == true)
            {
                result = output(MegaBytes);
            }
            else if (has("KB") == true)
            {
                result = output(KiloBytes);
            }
            else if (format.IndexOf(ByteSymbol) != -1)
            {
                result = output(Bytes);
            }
            else if (format.IndexOf(BitSymbol) != -1)
            {
                result = output(Bits);
            }
            else
            {
                result = string.Format("{0} {1}", LargestWholeNumberValue.ToString(format, provider), LargestWholeNumberSymbol);
            }

            return result;
        }

        public override bool Equals(object? value)
        {
            if (value == null)
            {
                return false;
            }

            ByteSize other;
            if (value is ByteSize)
            {
                other = (ByteSize)value;
            }
            else
            {
                return false;
            }

            return Equals(other);
        }

        public bool Equals(ByteSize value)
        {
            return Bits == value.Bits;
        }

        public override int GetHashCode()
        {
            return Bits.GetHashCode();
        }

        public int CompareTo(ByteSize other)
        {
            return Bits.CompareTo(other.Bits);
        }

        public ByteSize Add(ByteSize bs)
        {
            return new ByteSize(Bytes + bs.Bytes);
        }

        public ByteSize AddBits(long value)
        {
            return this + FromBits(value);
        }

        public ByteSize AddBytes(double value)
        {
            return this + FromBytes(value);
        }

        public ByteSize AddKiloBytes(double value)
        {
            return this + FromKiloBytes(value);
        }

        public ByteSize AddMegaBytes(double value)
        {
            return this + FromMegaBytes(value);
        }

        public ByteSize AddGigaBytes(double value)
        {
            return this + FromGigaBytes(value);
        }

        public ByteSize AddTeraBytes(double value)
        {
            return this + FromTeraBytes(value);
        }

        public ByteSize AddPetaBytes(double value)
        {
            return this + FromPetaBytes(value);
        }

        public ByteSize Subtract(ByteSize bs)
        {
            return new ByteSize(Bytes - bs.Bytes);
        }

        public static ByteSize operator +(ByteSize b1, ByteSize b2)
        {
            return new ByteSize(b1.Bytes + b2.Bytes);
        }

        public static ByteSize operator ++(ByteSize b)
        {
            return new ByteSize(b.Bytes + 1);
        }

        public static ByteSize operator -(ByteSize b)
        {
            return new ByteSize(-b.Bytes);
        }

        public static ByteSize operator -(ByteSize b1, ByteSize b2)
        {
            return new ByteSize(b1.Bytes - b2.Bytes);
        }

        public static ByteSize operator --(ByteSize b)
        {
            return new ByteSize(b.Bytes - 1);
        }

        public static bool operator ==(ByteSize b1, ByteSize b2)
        {
            return b1.Bits == b2.Bits;
        }

        public static bool operator !=(ByteSize b1, ByteSize b2)
        {
            return b1.Bits != b2.Bits;
        }

        public static bool operator <(ByteSize b1, ByteSize b2)
        {
            return b1.Bits < b2.Bits;
        }

        public static bool operator <=(ByteSize b1, ByteSize b2)
        {
            return b1.Bits <= b2.Bits;
        }

        public static bool operator >(ByteSize b1, ByteSize b2)
        {
            return b1.Bits > b2.Bits;
        }

        public static bool operator >=(ByteSize b1, ByteSize b2)
        {
            return b1.Bits >= b2.Bits;
        }

        public static ByteSize Parse(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentNullException("value", "String is null or whitespace");

            value = value.TrimStart();

            var num = 0;
            var found = false;

            var decimalSeparator = Convert.ToChar(NumberFormatInfo.CurrentInfo.NumberDecimalSeparator);
            var groupSeparator = Convert.ToChar(NumberFormatInfo.CurrentInfo.NumberGroupSeparator);

            for (num = 0; num < value.Length; num++)
                if (!(char.IsDigit(value[num]) || value[num] == decimalSeparator || value[num] == groupSeparator))
                {
                    found = true;
                    break;
                }

            if (found == false)
                throw new FormatException($"No byte indicator found in value '{value}'.");

            int lastNumber = num;

            string numberPart = value.Substring(0, lastNumber).Trim();
            string sizePart = value.Substring(lastNumber, value.Length - lastNumber).Trim();

            double number;
            if (!double.TryParse(numberPart, NumberStyles.Float | NumberStyles.AllowThousands, NumberFormatInfo.CurrentInfo, out number))
                throw new FormatException($"No number found in value '{value}'.");

            switch (sizePart)
            {
                case "b":
                    if (number % 1 != 0)
                        throw new FormatException($"Can't have partial bits for value '{value}'.");

                    return FromBits((long)number);

                case "B":
                    return FromBytes(number);

                case "KB":
                case "kB":
                case "kb":
                    return FromKiloBytes(number);

                case "MB":
                case "mB":
                case "mb":
                    return FromMegaBytes(number);

                case "GB":
                case "gB":
                case "gb":
                    return FromGigaBytes(number);

                case "TB":
                case "tB":
                case "tb":
                    return FromTeraBytes(number);

                case "PB":
                case "pB":
                case "pb":
                    return FromPetaBytes(number);

                default:
                    throw new FormatException($"Bytes of magnitude '{sizePart}' is not supported.");
            }
        }

        public static bool TryParse(string value, out ByteSize result)
        {
            try
            {
                result = Parse(value);
                return true;
            }
            catch
            {
                result = new ByteSize();
                return false;
            }
        }
    }
}
