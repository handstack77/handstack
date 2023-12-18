using System;

namespace HandStack.Core
{
    public abstract class SingletonBase<T>
    {
        private static readonly object lockObject = new object();
        private static T? singletonInstance;
        public delegate T CreateInstanceDelegate();
        protected static CreateInstanceDelegate? createInstanceDelegate;

        protected static T SingletonInstance
        {
            get
            {
                if (singletonInstance == null)
                {
                    lock (lockObject)
                    {
                        if (singletonInstance == null)
                        {
                            if (createInstanceDelegate == null)
                            {
                                throw new Exception("기본 생성자 필요");
                            }

                            singletonInstance = createInstanceDelegate();
                        }
                    }
                }

                return singletonInstance;
            }
            set
            {
                singletonInstance = value;
            }
        }
    }
}
