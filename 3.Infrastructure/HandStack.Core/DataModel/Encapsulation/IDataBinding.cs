using System.Data;

namespace HandStack.Core.DataModel
{
    public interface IDataBinding
    {
        dynamic BindingData(IDataReader dataReader);
    }
}
