using System.IO;

namespace dbclient.Extensions
{
    /// <code>
    /// var strWr = new StringWriter();
    /// var csvWriter = new CsvWriter(strWr);
    /// csvWriter.WriteField("AAA");
    /// csvWriter.WriteField("A\"AA");
    /// csvWriter.WriteField(" AAA ");
    /// csvWriter.WriteField("Something, again");
    /// csvWriter.WriteField("Something\nonce more");
    /// csvWriter.NextRecord();
    /// csvWriter.WriteField("Just one value");
    /// csvWriter.NextRecord();
    /// 
    /// var expected = "AAA,\"A\"\"AA\",\" AAA \",\"Something, again\",\"Something\nonce more\"\r\nJust one value\r\n";
    /// Assert.Equal(expected, strWr.ToString());
    /// </code>
    public class TabularTextWriter
    {
        public string Delimiter { get; private set; }

        public string QuoteString
        {
            get
            {
                return quoteString;
            }
            set
            {
                quoteString = value;
                doubleQuoteString = value + value;
            }
        }

        public bool QuoteAllFields { get; set; } = false;

        public bool Trim { get; set; } = false;

        char[] quoteRequiredChars;
        bool checkDelimForQuote = false;
        string quoteString = "\"";
        string doubleQuoteString = "\"\"";
        TextWriter wr;

        public TabularTextWriter(TextWriter wr) : this(wr, ",") { }

        public TabularTextWriter(TextWriter wr, string delimiter)
        {
            this.wr = wr;
            Delimiter = delimiter;
            checkDelimForQuote = delimiter.Length > 1;
            quoteRequiredChars = checkDelimForQuote ? new[] { '\r', '\n' } : new[] { '\r', '\n', delimiter[0] };
        }

        int recordFieldCount = 0;

        public void WriteField(string field)
        {
            var shouldQuote = QuoteAllFields;

            field = field ?? string.Empty;

            if (field.Length > 0 && Trim)
            {
                field = field.Trim();
            }

            if (field.Length > 0)
            {
                if (shouldQuote
                    || field.Contains(quoteString)
                    || field[0] == ' '
                    || field[field.Length - 1] == ' '
                    || field.IndexOfAny(quoteRequiredChars) > -1
                    || (checkDelimForQuote && field.Contains(Delimiter))
                )
                {
                    shouldQuote = true;
                }
            }

            if (shouldQuote && field.Length > 0)
            {
                field = field.Replace(quoteString, doubleQuoteString);
            }

            if (shouldQuote)
            {
                field = quoteString + field + quoteString;
            }
            if (recordFieldCount > 0)
            {
                wr.Write(Delimiter);
            }
            if (field.Length > 0)
                wr.Write(field);
            recordFieldCount++;
        }

        public void NextRecord()
        {
            wr.WriteLine();
            recordFieldCount = 0;
        }
    }
}
