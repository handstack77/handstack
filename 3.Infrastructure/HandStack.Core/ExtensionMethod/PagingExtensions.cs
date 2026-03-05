using System;
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
                return PageIndex > 0;
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
            var dataCount = dataSource.Count();

            this.TotalCount = dataCount;
            this.TotalPages = pageSize <= 0 ? 0 : (dataCount + pageSize - 1) / pageSize;
            this.PageSize = pageSize;
            this.PageIndex = index;
            this.AddRange(dataSource.Skip(Math.Max(index, 0) * pageSize).Take(pageSize));
        }

        public PagingExtensions(List<T> dataSource, int index, int pageSize)
        {
            var dataCount = dataSource.Count;

            this.TotalCount = dataCount;
            this.TotalPages = pageSize <= 0 ? 0 : (dataCount + pageSize - 1) / pageSize;
            this.PageSize = pageSize;
            this.PageIndex = index;

            var startIndex = pageSize <= 0 ? 0 : Math.Clamp(index * pageSize, 0, dataCount);
            var count = pageSize <= 0 ? 0 : Math.Min(pageSize, dataCount - startIndex);
            if (count > 0)
            {
                this.AddRange(dataSource.GetRange(startIndex, count));
            }
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
