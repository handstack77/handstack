using System;
using System.Buffers.Binary;
using System.Security.Cryptography;

namespace HandStack.Core.Licensing.Validation
{
    /// <summary>
    /// Minimal Scrypt implementation (RFC 7914) for N=2^logN, r, p as used in the JavaScript code: N=16384, r=8, p=1.
    /// This implementation focuses on correctness for the given parameter sizes and is not heavily optimized.
    /// </summary>
    public static class Scrypt
    {
        public static byte[] DeriveKey(byte[] password, byte[] salt, int N, int r, int p, int dkLen)
        {
            if ((N & (N - 1)) != 0 || N <= 1) throw new ArgumentException("N must be > 1 and a power of 2");
            if (N > int.MaxValue / 128 / r) throw new ArgumentException("N too large");
            if (r > int.MaxValue / 128 / p) throw new ArgumentException("r too large");

            int Bsize = p * 128 * r;
            byte[] B = PBKDF2SHA256(password, salt, 1, Bsize);

            int blockLen = 128 * r;
            for (int i = 0; i < p; i++)
            {
                ROMix(B, i * blockLen, N, r);
            }

            return PBKDF2SHA256(password, B, 1, dkLen);
        }

        private static byte[] PBKDF2SHA256(byte[] password, byte[] salt, int iterations, int dkLen)
        {
            using var hmac = new HMACSHA256(password);
            int hashLen = hmac.HashSize / 8;
            int l = (int)Math.Ceiling(dkLen / (double)hashLen);
            int r = dkLen - (l - 1) * hashLen;

            byte[] DK = new byte[dkLen];
            Span<byte> block = stackalloc byte[salt.Length + 4];
            salt.CopyTo(block);
            for (int i = 1; i <= l; i++)
            {
                BinaryPrimitives.WriteInt32BigEndian(block[^4..], i);
                byte[] U = hmac.ComputeHash(block.ToArray());
                byte[] T = (byte[])U.Clone();

                for (int j = 2; j <= iterations; j++)
                {
                    U = hmac.ComputeHash(U);
                    for (int k = 0; k < hashLen; k++) T[k] ^= U[k];
                }

                int destOffset = (i - 1) * hashLen;
                int clen = (i == l) ? r : hashLen;
                Buffer.BlockCopy(T, 0, DK, destOffset, clen);
            }
            return DK;
        }

        private static void ROMix(byte[] B, int Bi, int N, int r)
        {
            int blockWords = 32 * r;
            uint[] X = new uint[blockWords];
            uint[] T = new uint[blockWords];
            uint[] V = new uint[blockWords * N];

            for (int i = 0; i < blockWords; i++)
            {
                X[i] = BinaryPrimitives.ReadUInt32LittleEndian(B.AsSpan(Bi + i * 4, 4));
            }

            for (int i = 0; i < N; i++)
            {
                Array.Copy(X, 0, V, i * blockWords, blockWords);
                BlockMix(X, T, r);
            }
            for (int i = 0; i < N; i++)
            {
                uint j = X[(2 * r - 1) * 16] & (uint)(N - 1);
                int vOff = (int)j * blockWords;
                for (int k = 0; k < blockWords; k++) X[k] ^= V[vOff + k];
                BlockMix(X, T, r);
            }

            for (int i = 0; i < blockWords; i++)
            {
                BinaryPrimitives.WriteUInt32LittleEndian(B.AsSpan(Bi + i * 4, 4), X[i]);
            }
        }

        private static void BlockMix(uint[] B, uint[] Y, int r)
        {
            uint[] X = new uint[16];
            int BOff = (2 * r - 1) * 16;
            Array.Copy(B, BOff, X, 0, 16);

            int outOff = 0;
            for (int i = 0; i < 2 * r; i++)
            {
                for (int j = 0; j < 16; j++) X[j] ^= B[i * 16 + j];
                Salsa208(X);
                Array.Copy(X, 0, Y, outOff, 16);
                outOff += 16;
            }

            for (int i = 0; i < r; i++)
                Array.Copy(Y, i * 32, B, i * 16, 16);
            for (int i = 0; i < r; i++)
                Array.Copy(Y, i * 32 + 16, B, (i + r) * 16, 16);
        }

        private static void Salsa208(uint[] B)
        {
            uint[] x = new uint[16];
            Array.Copy(B, x, 16);
            for (int i = 8; i > 0; i -= 2)
            {
                x[4] ^= RotL(x[0] + x[12], 7); x[8] ^= RotL(x[4] + x[0], 9); x[12] ^= RotL(x[8] + x[4], 13); x[0] ^= RotL(x[12] + x[8], 18);
                x[9] ^= RotL(x[5] + x[1], 7); x[13] ^= RotL(x[9] + x[5], 9); x[1] ^= RotL(x[13] + x[9], 13); x[5] ^= RotL(x[1] + x[13], 18);
                x[14] ^= RotL(x[10] + x[6], 7); x[2] ^= RotL(x[14] + x[10], 9); x[6] ^= RotL(x[2] + x[14], 13); x[10] ^= RotL(x[6] + x[2], 18);
                x[3] ^= RotL(x[15] + x[11], 7); x[7] ^= RotL(x[3] + x[15], 9); x[11] ^= RotL(x[7] + x[3], 13); x[15] ^= RotL(x[11] + x[7], 18);

                x[1] ^= RotL(x[0] + x[3], 7); x[2] ^= RotL(x[1] + x[0], 9); x[3] ^= RotL(x[2] + x[1], 13); x[0] ^= RotL(x[3] + x[2], 18);
                x[6] ^= RotL(x[5] + x[4], 7); x[7] ^= RotL(x[6] + x[5], 9); x[4] ^= RotL(x[7] + x[6], 13); x[5] ^= RotL(x[4] + x[7], 18);
                x[11] ^= RotL(x[10] + x[9], 7); x[8] ^= RotL(x[11] + x[10], 9); x[9] ^= RotL(x[8] + x[11], 13); x[10] ^= RotL(x[9] + x[8], 18);
                x[12] ^= RotL(x[15] + x[14], 7); x[13] ^= RotL(x[12] + x[15], 9); x[14] ^= RotL(x[13] + x[12], 13); x[15] ^= RotL(x[14] + x[13], 18);
            }
            for (int i = 0; i < 16; i++) B[i] += x[i];
        }

        private static uint RotL(uint v, int c) => (v << c) | (v >> (32 - c));
    }
}
