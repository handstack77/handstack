using System.Collections.Generic;
using System.Linq;

namespace HandStack.Core.ExtensionMethod
{
    public class PagingExtensions<T> : List<T>
    {
        public int TotalCount
        {
            get;
            set;
        }

        public int TotalPages
        {
            get;
            set;
        }

        public int PageIndex
        {
            get;
            set;
        }

        public int PageSize
        {
            get;
            set;
        }

        public bool IsPreviousPage
        {
            get
            {
                return (PageIndex > 0);
            }
        }

        public bool IsNextPage
        {
            get
            {
                return (PageIndex * PageSize) <= TotalCount;
            }
        }

        public PagingExtensions(IQueryable<T> dataSource, int index, int pageSize)
        {
            int dataCount = dataSource.Count();

            this.TotalCount = dataCount;
            this.TotalPages = dataCount / pageSize;

            if (dataCount % pageSize > 0)
            {
                TotalPages++;
            }

            this.PageSize = pageSize;
            this.PageIndex = index;
            this.AddRange(dataSource.Skip(index * pageSize).Take(pageSize).ToList());
        }

        public PagingExtensions(List<T> dataSource, int index, int pageSize)
        {

            int dataCount = dataSource.Count();

            this.TotalCount = dataCount;
            this.TotalPages = dataCount / pageSize;

            if (dataCount % pageSize > 0)
            {
                TotalPages++;
            }

            this.PageSize = pageSize;
            this.PageIndex = index;
            this.AddRange(dataSource.Skip(index * pageSize).Take(pageSize).ToList());
        }
    }

    public static class Pagination
    {
        public static PagingExtensions<T> ToPagedList<T>(this IQueryable<T> dataSource, int index, int pageSize)
        {
            return new PagingExtensions<T>(dataSource, index, pageSize);
        }

        public static PagingExtensions<T> ToPagedList<T>(this IQueryable<T> dataSource, int index)
        {
            return new PagingExtensions<T>(dataSource, index, 10);
        }
    }
}
