using System;
using System.Data.SqlTypes;
using System.Security;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

namespace HandStack.Web.Extensions
{
    public static class SequentialGuidExtensions
    {
        private static ReadOnlySpan<byte> ToGuidMap => [13, 12, 11, 10, 15, 14, 9, 8, 6, 7, 4, 5, 0, 1, 2, 3];
        private static ReadOnlySpan<byte> ToSqlGuidMap => [12, 13, 14, 15, 10, 11, 8, 9, 7, 6, 3, 2, 1, 0, 5, 4];

        private static DateTime ToDateTime(this long ticks) => new(ticks, DateTimeKind.Utc);

        public static DateTime? ToDateTime(this Guid guid)
        {
            var ticks = guid.ToTicks();
            if (ticks.IsDateTime())
            {
                return ticks.ToDateTime();
            }

            ticks = new SqlGuid(guid).ToGuid().ToTicks();
            return ticks.IsDateTime() ? ticks.ToDateTime() : default(DateTime?);
        }

        public static DateTime? ToDateTime(this SqlGuid sqlGuid) => sqlGuid.ToGuid().ToDateTime();

        public static Guid ToGuid(this SqlGuid sqlGuid)
        {
            if (sqlGuid.IsNull)
            {
                return Guid.Empty;
            }

            var bytes = sqlGuid.ToByteArray();
            if (bytes == null)
            {
                return Guid.Empty;
            }

            var mappedBytes = new byte[16];
            var map = ToGuidMap;
            for (var i = 0; i < mappedBytes.Length; i++)
            {
                mappedBytes[i] = bytes[map[i]];
            }

            return new(mappedBytes);
        }

        public static SqlGuid ToSqlGuid(this Guid guid)
        {
            var bytes = guid.ToByteArray();
            var mappedBytes = new byte[16];
            var map = ToSqlGuidMap;
            for (var i = 0; i < mappedBytes.Length; i++)
            {
                mappedBytes[i] = bytes[map[i]];
            }

            return new(mappedBytes);
        }

        internal static bool IsDateTime(this long ticks) => ticks <= DateTime.UtcNow.Ticks && ticks >= DateTime.UnixEpoch.Ticks;

        private static long ToTicks(this Guid guid)
        {
            var bytes = guid.ToByteArray();
            return
                ((long)bytes[3] << 56) +
                ((long)bytes[2] << 48) +
                ((long)bytes[1] << 40) +
                ((long)bytes[0] << 32) +
                ((long)bytes[5] << 24) +
                (bytes[4] << 16) +
                (bytes[7] << 8) +
                bytes[6];
        }
    }

    public sealed class SequentialGuidGenerator : SequentialGuidGeneratorBase<SequentialGuidGenerator>
    {
        private SequentialGuidGenerator() { }
    }

    public abstract class SequentialGuidGeneratorBase<T> where T : SequentialGuidGeneratorBase<T>
    {
        private static readonly Lazy<T> Lazy = new(static () => (T)Activator.CreateInstance(typeof(T), nonPublic: true)!);

        private readonly byte[] _machinePid;
        private int _increment;

        protected SequentialGuidGeneratorBase()
        {
            _increment = new Random().Next(500000);
            _machinePid = new byte[5];
            using var algorithm = MD5.Create();
            var hash = algorithm.ComputeHash(Encoding.UTF8.GetBytes(Environment.MachineName));
            hash.AsSpan(0, 3).CopyTo(_machinePid);

            try
            {
                var pid = Environment.ProcessId;
                _machinePid[3] = (byte)(pid >> 8);
                _machinePid[4] = (byte)pid;
            }
            catch (SecurityException)
            {
            }
        }

        public static T Instance => Lazy.Value;

        public Guid NewGuid() => NewGuid(DateTime.UtcNow.Ticks);

        public Guid NewGuid(DateTime timestamp)
        {
            var ticks = timestamp.Kind switch
            {
                DateTimeKind.Utc => timestamp.Ticks,
                DateTimeKind.Local => timestamp.ToUniversalTime().Ticks,
                _ => throw new ArgumentException("DateTimeKind.Unspecified 지원되지 않음", nameof(timestamp))
            };

            if (!ticks.IsDateTime())
            {
                throw new ArgumentException("타임스탬프는 1970년 1월 1일 UTC와 지금 사이여야 합니다", nameof(timestamp));
            }

            return NewGuid(ticks);
        }

        internal virtual Guid NewGuid(long timestamp)
        {
            var increment = Interlocked.Increment(ref _increment) & 0x00ffffff;
            var tail = new byte[8];
            _machinePid.AsSpan().CopyTo(tail);
            tail[5] = (byte)(increment >> 16);
            tail[6] = (byte)(increment >> 8);
            tail[7] = (byte)increment;

            return new Guid(
                (int)(timestamp >> 32),
                (short)(timestamp >> 16),
                (short)timestamp,
                tail
            );
        }
    }

    public sealed class SequentialSqlGuidGenerator : SequentialGuidGeneratorBase<SequentialSqlGuidGenerator>
    {
        private SequentialSqlGuidGenerator() { }

        internal override Guid NewGuid(long timestamp) =>
            base.NewGuid(timestamp).ToSqlGuid().Value;

        public SqlGuid NewSqlGuid() => new(NewGuid());

        public SqlGuid NewSqlGuid(DateTime timestamp) => new(NewGuid(timestamp));
    }

    public interface ISequentialIdGenerator
    {
        Guid NewId();
    }

    public class SequentialIdGenerator : ISequentialIdGenerator
    {
        public Guid NewId() => SequentialGuidGenerator.Instance.NewGuid();
    }
}
