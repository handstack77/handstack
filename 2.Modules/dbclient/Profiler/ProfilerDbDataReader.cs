using System;
using System.Collections;
using System.Data;
using System.Data.Common;

namespace dbclient.Profiler
{
    public class ProfilerDbDataReader : DbDataReader
    {
        public readonly DbDataReader WrappedDataReader;
        private readonly IAdoNetProfiler profiler;
        private int records;

        public override int Depth => WrappedDataReader.Depth;

        public override int FieldCount => WrappedDataReader.FieldCount;

        public override bool HasRows => WrappedDataReader.HasRows;

        public override bool IsClosed => WrappedDataReader.IsClosed;

        public override int RecordsAffected => WrappedDataReader.RecordsAffected;

        public override object this[string name] => WrappedDataReader[name];

        public override object this[int ordinal] => WrappedDataReader[ordinal];

        internal ProfilerDbDataReader(DbDataReader reader, IAdoNetProfiler profiler)
        {
            if (reader == null)
            {
                throw new ArgumentNullException(nameof(reader));
            }

            WrappedDataReader = reader;
            this.profiler = profiler;
        }

        public override void Close()
        {
            WrappedDataReader.Close();
        }

        public override bool GetBoolean(int ordinal)
        {
            return WrappedDataReader.GetBoolean(ordinal);
        }

        public override byte GetByte(int ordinal)
        {
            return WrappedDataReader.GetByte(ordinal);
        }

        public override long GetBytes(int ordinal, long dataOffset, byte[]? buffer, int bufferOffset, int length)
        {
            return WrappedDataReader.GetBytes(ordinal, dataOffset, buffer, bufferOffset, length);
        }

        public override char GetChar(int ordinal)
        {
            return WrappedDataReader.GetChar(ordinal);
        }

        public override long GetChars(int ordinal, long dataOffset, char[]? buffer, int bufferOffset, int length)
        {
            return WrappedDataReader.GetChars(ordinal, dataOffset, buffer, bufferOffset, length);
        }

        public override string GetDataTypeName(int ordinal)
        {
            return WrappedDataReader.GetDataTypeName(ordinal);
        }

        public override DateTime GetDateTime(int ordinal)
        {
            return WrappedDataReader.GetDateTime(ordinal);
        }

        public override decimal GetDecimal(int ordinal)
        {
            return WrappedDataReader.GetDecimal(ordinal);
        }

        public override double GetDouble(int ordinal)
        {
            return WrappedDataReader.GetDouble(ordinal);
        }

        public override IEnumerator GetEnumerator()
        {
            return WrappedDataReader.GetEnumerator();
        }

        public override Type GetFieldType(int ordinal)
        {
            return WrappedDataReader.GetFieldType(ordinal);
        }

        public override float GetFloat(int ordinal)
        {
            return WrappedDataReader.GetFloat(ordinal);
        }

        public override Guid GetGuid(int ordinal)
        {
            return WrappedDataReader.GetGuid(ordinal);
        }

        public override short GetInt16(int ordinal)
        {
            return WrappedDataReader.GetInt16(ordinal);
        }

        public override int GetInt32(int ordinal)
        {
            return WrappedDataReader.GetInt32(ordinal);
        }

        public override long GetInt64(int ordinal)
        {
            return WrappedDataReader.GetInt64(ordinal);
        }

        public override string GetName(int ordinal)
        {
            return WrappedDataReader.GetName(ordinal);
        }

        public override int GetOrdinal(string name)
        {
            return WrappedDataReader.GetOrdinal(name);
        }

        public override DataTable? GetSchemaTable()
        {
            return WrappedDataReader.GetSchemaTable();
        }

        public override string GetString(int ordinal)
        {
            return WrappedDataReader.GetString(ordinal);
        }

        public override object GetValue(int ordinal)
        {
            return WrappedDataReader.GetValue(ordinal);
        }

        public override int GetValues(object[] values)
        {
            return WrappedDataReader.GetValues(values);
        }

        public override bool IsDBNull(int ordinal)
        {
            return WrappedDataReader.IsDBNull(ordinal);
        }

        public override bool NextResult()
        {
            return WrappedDataReader.NextResult();
        }

        public override bool Read()
        {
            var result = WrappedDataReader.Read();

            if (result)
            {
                records++;
            }

            return result;
        }

        protected override void Dispose(bool disposing)
        {
            profiler.OnReaderFinish(this, records);

            if (disposing)
            {
                WrappedDataReader.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
