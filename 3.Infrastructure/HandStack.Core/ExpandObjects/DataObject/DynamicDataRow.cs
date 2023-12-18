using System;
using System.Data;
using System.Dynamic;

namespace HandStack.Core.ExpandObjects.DataObject
{
    /// <code>
    /// DataTable table = new DataTable();
    /// table.Columns.Add("FirstName", typeof(string));
    /// table.Columns.Add("LastName", typeof(string));
    /// table.Columns.Add("DateOfBirth", typeof(DateTime));
    /// 
    /// dynamic row = table.NewRow().AsDynamic();
    /// row.FirstName = "John";
    /// row.LastName = "Doe";
    /// row.DateOfBirth = new DateTime(1981, 9, 12);
    /// table.Rows.Add(row.DataRow);
    /// 
    /// // Add more rows...
    /// // ...
    /// 
    /// var bornInThe20thCentury = from r in table.AsEnumerable()
    ///                             let dr = r.AsDynamic()
    ///                             where dr.DateOfBirth.Year > 1900
    ///                             && dr.DateOfBirth.Year <= 2000
    ///                             select new { dr.LastName, dr.FirstName };
    /// 
    /// foreach (var item in bornInThe20thCentury)
    /// {
    ///     Console.WriteLine("{0} {1}", item.FirstName, item.LastName);
    /// }
    /// </code>
    public class DynamicDataRow : DynamicObject
    {
        private DataRow dataRow;

        public DynamicDataRow(DataRow dataRow)
        {
            if (dataRow == null)
            {
                throw new ArgumentNullException("DataRow 매개변수 확인 필요");
            }

            this.dataRow = dataRow;
        }

        public DataRow DataRow
        {
            get { return dataRow; }
        }

        public override bool TryGetMember(GetMemberBinder binder, out object? result)
        {
            result = null;
            if (dataRow.Table.Columns.Contains(binder.Name))
            {
                result = dataRow[binder.Name];
                return true;
            }
            return false;
        }

        public override bool TrySetMember(SetMemberBinder binder, object? value)
        {
            if (dataRow.Table.Columns.Contains(binder.Name))
            {
                dataRow[binder.Name] = value;
                return true;
            }
            return false;
        }
    }
}
