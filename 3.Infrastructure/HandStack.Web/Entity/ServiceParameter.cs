using System;
using System.Text;

using HandStack.Web.Extensions;

namespace HandStack.Web.Entity
{
    public record ServiceParameter
    {
        public ServiceParameter()
        {
            string id = "";
            Crc32 crc32 = new Crc32();
            byte[] computeHash = crc32.ComputeHash(Encoding.Default.GetBytes(Guid.NewGuid().ToString("N")));
            foreach (byte b in computeHash)
            {
                id += b.ToString("x2").ToLower();
            }

            prop = id;
        }

        public ServiceParameter(string prop, object? val)
        {
            this.prop = prop;
            this.val = val;
        }

        public string prop;
        public object? val;
    }
}
