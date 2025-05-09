﻿using System;
using System.Text;

using HandStack.Data.Enumeration;
using HandStack.Data.SqlFormatter.Core;
using HandStack.Data.SqlFormatter.Languages;

namespace HandStack.Data.SqlFormatter
{
    internal static class SqlFormatterHelper
    {
        // string? result = SqlFormatterHelper.Format(text, SqlLanguageMode.Value, new SqlFormatterOptions(IndentationMode.Value, uppercase: true, linesBetweenQueries: 2));
        internal static string Format(string sql, SqlLanguage language, SqlFormatterOptions options)
        {
            if (string.IsNullOrEmpty(sql))
            {
                return string.Empty;
            }

            Formatter formatter = language switch
            {
                SqlLanguage.Sql => new StandardSqlFormatter(),
                SqlLanguage.Tsql => new TSqlFormatter(),
                SqlLanguage.Spark => new SparkSqlFormatter(),
                SqlLanguage.RedShift => new RedshiftFormatter(),
                SqlLanguage.PostgreSql => new PostgreSqlFormatter(),
                SqlLanguage.PlSql => new PlSqlFormatter(),
                SqlLanguage.N1ql => new N1qlFormatter(),
                SqlLanguage.MySql => new MySqlFormatter(),
                SqlLanguage.MariaDb => new MariaDbFormatter(),
                SqlLanguage.Db2 => new Db2Formatter(),
                _ => throw new NotSupportedException(),
            };

            return formatter.Format(sql, options);
        }

        internal static ReadOnlySpan<char> Slice(this ReadOnlySpan<char> span, Token token)
        {
            return span.Slice(token.Index, token.Length);
        }

        internal static void TrimSpaceEnd(this StringBuilder sb)
        {
            if (sb is null)
            {
                return;
            }

            var lastIndex = sb.Length - 1;
            var i = lastIndex;

            for (; i >= 0; i--)
            {
                if (sb[i] != ' ')
                {
                    break;
                }
            }
            var newLen = sb.Length - (lastIndex - i);

            sb.Length = newLen < 0 ? 0 : newLen;
        }
    }
}
