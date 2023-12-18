using System.Data;

namespace dbclient.Enumeration
{
    /// <summary>
    /// SqlDbType http://msdn.microsoft.com/ko-kr/library/system.data.sqldbtype.aspx
    /// OracleDbType https://docs.oracle.com/html/B28089_01/OracleDbTypeEnumerationType.htm#i1017320
    /// MySqlDbType https://dev.mysql.com/doc/dev/connector-net/8.0/api/data_api/MySql.Data.MySqlClient.MySqlDbType.html
    /// NpgsqlDbType https://www.npgsql.org/doc/api/NpgsqlTypes.NpgsqlDbType.html
    /// SQLiteDbType https://docs.microsoft.com/ko-kr/dotnet/standard/data/sqlite/types
    /// </summary>
    public enum DatabaseType
    {
        Binary,
        Boolean,
        Byte,
        Char,
        Date,
        Time,
        DateTime,
        Decimal,
        Double,
        Object,
        Single,
        Float,
        Int64,
        Int32,
        Int16,
        Long,
        NChar,
        NClob,
        NText,
        NVarChar,
        Currency,
        Text,
        Timestamp,
        Guid,
        VarBinary,
        VarChar,
        Xml,
        NotSupported
    }

    public static class DatabaseTypeExtensions
    {
        public static DbType ToDbType(this DatabaseType DataType)
        {
            switch (DataType)
            {
                case DatabaseType.Binary:
                    return DbType.Binary;
                case DatabaseType.Boolean:
                    return DbType.Boolean;
                case DatabaseType.Byte:
                    return DbType.Byte;
                case DatabaseType.Char:
                    return DbType.AnsiStringFixedLength;
                case DatabaseType.Date:
                    return DbType.Date;
                case DatabaseType.Time:
                    return DbType.Time;
                case DatabaseType.DateTime:
                    return DbType.DateTime;
                case DatabaseType.Decimal:
                    return DbType.Decimal;
                case DatabaseType.Float:
                    return DbType.Single;
                case DatabaseType.Int64:
                    return DbType.Int64;
                case DatabaseType.Int32:
                    return DbType.Int32;
                case DatabaseType.Int16:
                    return DbType.Int16;
                case DatabaseType.NChar:
                    return DbType.StringFixedLength;
                case DatabaseType.NText:
                    return DbType.String;
                case DatabaseType.NVarChar:
                    return DbType.String;
                case DatabaseType.Object:
                    return DbType.Object;
                case DatabaseType.Single:
                    return DbType.Single;
                case DatabaseType.Currency:
                    return DbType.Currency;
                case DatabaseType.Text:
                    return DbType.AnsiString;
                case DatabaseType.Timestamp:
                    return DbType.Time;
                case DatabaseType.Guid:
                    return DbType.Guid;
                case DatabaseType.VarBinary:
                    return DbType.Binary;
                case DatabaseType.VarChar:
                    return DbType.String;
                default:
                    return DbType.String;
            }
        }
    }

    public enum Database_DbType
    {
        AnsiString = 0,
        Binary = 1,
        Byte = 2,
        Boolean = 3,
        Currency = 4,
        Date = 5,
        DateTime = 6,
        Decimal = 7,
        Double = 8,
        Guid = 9,
        Int16 = 10,
        Int32 = 11,
        Int64 = 12,
        Object = 13,
        SByte = 14,
        Single = 15,
        String = 16,
        Time = 17,
        UInt16 = 18,
        UInt32 = 19,
        UInt64 = 20,
        VarNumeric = 21,
        AnsiStringFixedLength = 22,
        StringFixedLength = 23,
        Xml = 25,
        DateTime2 = 26,
        DateTimeOffset = 27
    }

    public enum Database_OracleDbType
    {
        BFile = 101,
        Blob = 102,
        Byte = 103,
        Char = 104,
        Clob = 105,
        Date = 106,
        Decimal = 107,
        Double = 108,
        Long = 109,
        LongRaw = 110,
        Int16 = 111,
        Int32 = 112,
        Int64 = 113,
        IntervalDS = 114,
        IntervalYM = 115,
        NClob = 116,
        NChar = 117,
        NVarchar2 = 119,
        Raw = 120,
        RefCursor = 121,
        Single = 122,
        TimeStamp = 123,
        TimeStampLTZ = 124,
        TimeStampTZ = 125,
        Varchar2 = 126,
        XmlType = 127,
        BinaryDouble = 132,
        BinaryFloat = 133,
        Boolean = 134
    }

    public enum Database_MySqlDbType
    {
        Decimal = 0,
        Byte = 1,
        Int16 = 2,
        Int32 = 3,
        Float = 4,
        Double = 5,
        Timestamp = 7,
        Int64 = 8,
        Int24 = 9,
        Date = 10,
        Time = 11,
        DateTime = 12,
        Datetime = 12,
        Year = 13,
        Newdate = 14,
        VarString = 15,
        Bit = 16,
        JSON = 245,
        NewDecimal = 246,
        Enum = 247,
        Set = 248,
        TinyBlob = 249,
        MediumBlob = 250,
        LongBlob = 251,
        Blob = 252,
        VarChar = 253,
        String = 254,
        Geometry = 255,
        UByte = 501,
        UInt16 = 502,
        UInt32 = 503,
        UInt64 = 508,
        UInt24 = 509,
        Binary = 600,
        VarBinary = 601,
        TinyText = 749,
        MediumText = 750,
        LongText = 751,
        Text = 752,
        Guid = 800
    }

    public enum Database_NpgsqlDbType
    {
        Array = int.MinValue,
        Bigint = 1,
        Boolean = 2,
        Box = 3,
        Bytea = 4,
        Circle = 5,
        Char = 6,
        Date = 7,
        Double = 8,
        Integer = 9,
        Line = 10,
        LSeg = 11,
        Money = 12,
        Numeric = 13,
        Path = 14,
        Point = 15,
        Polygon = 16,
        Real = 17,
        Smallint = 18,
        Text = 19,
        Time = 20,
        Timestamp = 21,
        Varchar = 22,
        Refcursor = 23,
        Inet = 24,
        Bit = 25,
        TimestampTZ = 26,
        TimestampTz = 26,
        Uuid = 27,
        Xml = 28,
        Oidvector = 29,
        Interval = 30,
        TimeTZ = 31,
        TimeTz = 31,
        Name = 32,
        Abstime = 33,
        MacAddr = 34,
        Json = 35,
        Jsonb = 36,
        Hstore = 37,
        InternalChar = 38,
        Varbit = 39,
        Unknown = 40,
        Oid = 41,
        Xid = 42,
        Cid = 43,
        Cidr = 44,
        TsVector = 45,
        TsQuery = 46,
        Regtype = 49,
        Geometry = 50,
        Citext = 51,
        Int2Vector = 52,
        Tid = 53,
        MacAddr8 = 54,
        Geography = 55,
        Regconfig = 56,
        Range = 1073741824
    }

    public enum Database_SQLiteType
    {
        AnsiString = 0,
        Binary = 1,
        Byte = 2,
        Boolean = 3,
        Currency = 4,
        Date = 5,
        DateTime = 6,
        Decimal = 7,
        Double = 8,
        Guid = 9,
        Int16 = 10,
        Int32 = 11,
        Int64 = 12,
        Object = 13,
        SByte = 14,
        Single = 15,
        String = 16,
        Time = 17,
        UInt16 = 18,
        UInt32 = 19,
        UInt64 = 20,
        VarNumeric = 21,
        AnsiStringFixedLength = 22,
        StringFixedLength = 23,
        Xml = 25,
        DateTime2 = 26,
        DateTimeOffset = 27
    }

    public enum Database_OleDbType
    {
        Empty = 0,
        SmallInt = 2,
        Integer = 3,
        Single = 4,
        Double = 5,
        Currency = 6,
        Date = 7,
        BSTR = 8,
        IDispatch = 9,
        Error = 10,
        Boolean = 11,
        Variant = 12,
        IUnknown = 13,
        Decimal = 14,
        TinyInt = 16,
        UnsignedTinyInt = 17,
        UnsignedSmallInt = 18,
        UnsignedInt = 19,
        BigInt = 20,
        UnsignedBigInt = 21,
        Filetime = 64,
        Guid = 72,
        Binary = 128,
        Char = 129,
        WChar = 130,
        Numeric = 131,
        DBDate = 133,
        DBTime = 134,
        DBTimeStamp = 135,
        PropVariant = 138,
        VarNumeric = 139,
        VarChar = 200,
        LongVarChar = 201,
        VarWChar = 202,
        LongVarWChar = 203,
        VarBinary = 204,
        LongVarBinary = 205
    }

    public enum Database_SqlDbType
    {
        BigInt = 0,
        Binary = 1,
        Bit = 2,
        Char = 3,
        DateTime = 4,
        Decimal = 5,
        Float = 6,
        Image = 7,
        Int = 8,
        Money = 9,
        NChar = 10,
        NText = 11,
        NVarChar = 12,
        Real = 13,
        UniqueIdentifier = 14,
        SmallDateTime = 15,
        SmallInt = 16,
        SmallMoney = 17,
        Text = 18,
        Timestamp = 19,
        TinyInt = 20,
        VarBinary = 21,
        VarChar = 22,
        Variant = 23,
        Xml = 25,
        Udt = 29,
        Structured = 30,
        Date = 31,
        Time = 32,
        DateTime2 = 33,
        DateTimeOffset = 34
    }
}
