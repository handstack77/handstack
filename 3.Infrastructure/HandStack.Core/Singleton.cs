namespace HandStack.Core
{
    public class Singleton<T> : SingletonBase<T> where T : new()
    {
        static Singleton()
        {
            createInstanceDelegate = DefaultCreateInstance;
        }

        private static T DefaultCreateInstance()
        {
            return new T();
        }

        public static T Instance
        {
            get
            {
                return SingletonInstance;
            }
            set
            {
                SingletonInstance = value;
            }
        }
    }
}
