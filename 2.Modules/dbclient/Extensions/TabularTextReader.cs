using System;
using System.Collections.Generic;
using System.IO;

namespace dbclient.Extensions
{
    /// <code>
    /// var tests = new string[] {
    /// 	// tab
    /// 	"A\tB\tC \r\n1\t2\t 3\r\n\r\n5\t\t\n\"6\"\t \"7\"\"\" \t\"\"\"\"",
    /// 	// custom 3-symobls
    /// 	"A%%% \"B\"%%%C\n 1%%%2%%%3 \n5%%%6%%6%%%7%\n",
    /// 	// no trim
    /// 	"A,B,C\n1 , 2  ,3 \n  4,5, 6\n \"7\",\"\"8 ,\"9\"",
    /// 	"A,B,C",
    /// 	"A,B,C\n1,2,3"
    /// };
    /// var testDelims = new[] { "\t", "%%%", ",", ",", "," };
    /// var testTrimFields = new[] { true, true, false, true, true };
    /// var testBufSize = new[] { 1024, 1024, 1024, 5, 5};
    /// var expected = new string[] {
    /// 	"1|2|3|#5|||#6|7\"|\"|#",
    /// 	"1|2|3|#5|6%%6|7%|#",
    /// 	"1 | 2  |3 |#  4|5| 6|# \"7\"|\"\"8 |9|#",
    /// 	"",
    /// 	"1|2|3|#"
    /// };
    /// for (int i=0; i < tests.Length; i++) {
    /// 	var csvRdr = new CsvReader(
    /// 		new StreamReader(new MemoryStream(System.Text.Encoding.UTF8.GetBytes(tests[i]))),
    /// 		testDelims[i]);
    /// 	csvRdr.TrimFields = testTrimFields[i];
    /// 	csvRdr.BufferSize = testBufSize[i];
    /// 
    /// 	var sb = new StringBuilder();
    /// 	csvRdr.Read(); // skip header row
    /// 	while (csvRdr.Read()) {
    /// 		sb.Append(csvRdr[0] + "|");
    /// 		sb.Append(csvRdr[1] + "|");
    /// 		sb.Append(csvRdr[2] + "|");
    /// 		sb.Append("#");
    /// 	}
    /// 	Assert.Equal(expected[i], sb.ToString());
    /// }
    /// </code>
    public class TabularTextReader
    {
        public string Delimiter { get; private set; }
        int delimLength;
        public int BufferSize { get; set; } = 8192;
        public bool TrimFields { get; set; } = true;

        TextReader rdr;

        public TabularTextReader(TextReader rdr) : this(rdr, ",")
        {
        }

        public TabularTextReader(TextReader rdr, string delimiter)
        {
            this.rdr = rdr;
            Delimiter = delimiter;
            delimLength = delimiter.Length;

            if (delimLength == 0)
                throw new ArgumentException("Delimiter cannot be empty.");
        }

        char[] buffer = Array.Empty<char>();
        int bufferLength;
        int bufferLoadThreshold;
        int lineStartPos = 0;
        int actualBufferLen = 0;
        List<Field> fields = new List<Field>();
        int fieldsCount = 0;
        int linesRead = 0;

        private int ReadBlockAndCheckEof(char[] buffer, int start, int len, ref bool eof)
        {
            if (len == 0)
                return 0;
            var read = rdr.ReadBlock(buffer, start, len);
            if (read < len)
                eof = true;
            return read;
        }

        private bool FillBuffer()
        {
            var eof = false;
            var toRead = bufferLength - actualBufferLen;
            if (toRead >= bufferLoadThreshold)
            {
                int freeStart = (lineStartPos + actualBufferLen) % buffer.Length;
                if (freeStart >= lineStartPos)
                {
                    actualBufferLen += ReadBlockAndCheckEof(buffer, freeStart, buffer.Length - freeStart, ref eof);
                    if (lineStartPos > 0)
                        actualBufferLen += ReadBlockAndCheckEof(buffer, 0, lineStartPos, ref eof);
                }
                else
                {
                    actualBufferLen += ReadBlockAndCheckEof(buffer, freeStart, toRead, ref eof);
                }
            }
            return eof;
        }

        private string GetLineTooLongMsg()
        {
            return String.Format("CSV line #{1} length exceedes buffer size ({0})", BufferSize, linesRead);
        }

        private int ReadQuotedFieldToEnd(int start, int maxPos, bool eof, ref int escapedQuotesCount)
        {
            int pos = start;
            int chIdx;
            char ch;
            for (; pos < maxPos; pos++)
            {
                chIdx = pos < bufferLength ? pos : pos % bufferLength;
                ch = buffer[chIdx];
                if (ch == '\"')
                {
                    bool hasNextCh = (pos + 1) < maxPos;
                    if (hasNextCh && buffer[(pos + 1) % bufferLength] == '\"')
                    {
                        pos++;
                        escapedQuotesCount++;
                    }
                    else
                    {
                        return pos;
                    }
                }
            }
            if (eof)
            {
                return pos - 1;
            }
            throw new InvalidDataException(GetLineTooLongMsg());
        }

        private bool ReadDelimTail(int start, int maxPos, ref int end)
        {
            int pos;
            int idx;
            int offset = 1;
            for (; offset < delimLength; offset++)
            {
                pos = start + offset;
                idx = pos < bufferLength ? pos : pos % bufferLength;
                if (pos >= maxPos || buffer[idx] != Delimiter[offset])
                    return false;
            }
            end = start + offset - 1;
            return true;
        }

        private Field GetOrAddField(int startIdx)
        {
            fieldsCount++;
            while (fieldsCount > fields.Count)
                fields.Add(new Field());
            var f = fields[fieldsCount - 1];
            f.Reset(startIdx);
            return f;
        }

        public int FieldsCount
        {
            get
            {
                return fieldsCount;
            }
        }

        public string? this[int idx]
        {
            get
            {
                if (idx < fieldsCount)
                {
                    var f = fields[idx];
                    return fields[idx].GetValue(buffer);
                }
                return null;
            }
        }

        public int GetValueLength(int idx)
        {
            if (idx < fieldsCount)
            {
                var f = fields[idx];
                return f.Quoted ? f.Length - f.EscapedQuotesCount : f.Length;
            }
            return -1;
        }

        public void ProcessValueInBuffer(int idx, Action<char[], int, int> handler)
        {
            if (idx < fieldsCount)
            {
                var f = fields[idx];
                if ((f.Quoted && f.EscapedQuotesCount > 0) || f.End >= bufferLength)
                {
                    var chArr = f.GetValue(buffer).ToCharArray();
                    handler(chArr, 0, chArr.Length);
                }
                else if (f.Quoted)
                {
                    handler(buffer, f.Start + 1, f.Length - 2);
                }
                else
                {
                    handler(buffer, f.Start, f.Length);
                }
            }
        }

        public bool Read()
        {
            if (fields == null)
            {
                fields = new List<Field>();
                fieldsCount = 0;
            }
            if (buffer == null)
            {
                bufferLoadThreshold = Math.Min(BufferSize, 8192);
                bufferLength = BufferSize + bufferLoadThreshold;
                buffer = new char[bufferLength];
                lineStartPos = 0;
                actualBufferLen = 0;
            }

            var eof = FillBuffer();

            fieldsCount = 0;
            if (actualBufferLen <= 0)
            {
                return false;
            }
            linesRead++;

            int maxPos = lineStartPos + actualBufferLen;
            int charPos = lineStartPos;

            var currentField = GetOrAddField(charPos);
            bool ignoreQuote = false;
            char delimFirstChar = Delimiter[0];
            bool trimFields = TrimFields;

            int charBufIdx;
            char ch;
            for (; charPos < maxPos; charPos++)
            {
                charBufIdx = charPos < bufferLength ? charPos : charPos % bufferLength;
                ch = buffer[charBufIdx];
                switch (ch)
                {
                    case '\"':
                        if (ignoreQuote)
                        {
                            currentField.End = charPos;
                        }
                        else if (currentField.Quoted || currentField.Length > 0)
                        {
                            currentField.End = charPos;
                            currentField.Quoted = false;
                            ignoreQuote = true;
                        }
                        else
                        {
                            var endQuotePos = ReadQuotedFieldToEnd(charPos + 1, maxPos, eof, ref currentField.EscapedQuotesCount);
                            currentField.Start = charPos;
                            currentField.End = endQuotePos;
                            currentField.Quoted = true;
                            charPos = endQuotePos;
                        }
                        break;
                    case '\r':
                        if ((charPos + 1) < maxPos && buffer[(charPos + 1) % bufferLength] == '\n')
                        {
                            charPos++;
                        }
                        charPos++;
                        goto LineEnded;
                    case '\n':
                        charPos++;
                        goto LineEnded;
                    default:
                        if (ch == delimFirstChar && (delimLength == 1 || ReadDelimTail(charPos, maxPos, ref charPos)))
                        {
                            currentField = GetOrAddField(charPos + 1);
                            ignoreQuote = false;
                            continue;
                        }
                        if (ch == ' ' && trimFields)
                        {
                            continue;
                        }

                        if (currentField.Length == 0)
                        {
                            currentField.Start = charPos;
                        }

                        if (currentField.Quoted)
                        {
                            currentField.Quoted = false;
                            ignoreQuote = true;
                        }
                        currentField.End = charPos;
                        break;
                }

            }
            if (!eof)
            {
                throw new InvalidDataException(GetLineTooLongMsg());
            }
LineEnded:
            actualBufferLen -= charPos - lineStartPos;
            lineStartPos = charPos % bufferLength;

            if (fieldsCount == 1 && fields[0].Length == 0)
            {
                return Read();
            }

            return true;
        }

        internal sealed class Field
        {
            internal int Start;
            internal int End;
            internal int Length
            {
                get { return End - Start + 1; }
            }
            internal bool Quoted;
            internal int EscapedQuotesCount;
            string? cachedValue = null;

            internal Field()
            {
            }

            internal Field Reset(int start)
            {
                Start = start;
                End = start - 1;
                Quoted = false;
                EscapedQuotesCount = 0;
                cachedValue = null;
                return this;
            }

            internal string GetValue(char[] buf)
            {
                if (cachedValue == null)
                {
                    cachedValue = GetValueInternal(buf);
                }
                return cachedValue;
            }

            string GetValueInternal(char[] buf)
            {
                if (Quoted)
                {
                    var s = Start + 1;
                    var lenWithoutQuotes = Length - 2;
                    var val = lenWithoutQuotes > 0 ? GetString(buf, s, lenWithoutQuotes) : String.Empty;
                    if (EscapedQuotesCount > 0)
                        val = val.Replace("\"\"", "\"");
                    return val;
                }
                var len = Length;
                return len > 0 ? GetString(buf, Start, len) : String.Empty;
            }

            private string GetString(char[] buf, int start, int len)
            {
                var bufLen = buf.Length;
                start = start < bufLen ? start : start % bufLen;
                var endIdx = start + len - 1;
                if (endIdx >= bufLen)
                {
                    var prefixLen = buf.Length - start;
                    var prefix = new string(buf, start, prefixLen);
                    var suffix = new string(buf, 0, len - prefixLen);
                    return prefix + suffix;
                }
                return new string(buf, start, len);
            }
        }
    }
}
