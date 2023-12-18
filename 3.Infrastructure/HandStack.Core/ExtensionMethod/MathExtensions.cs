using System;

namespace HandStack.Core.ExtensionMethod
{
    /// <code>
    /// Console.WriteLine("{0}", (3.3m).RoundUp() == 4m);
    /// Console.WriteLine("{0}", (-3.3m).RoundUp() == -4m);
    /// Console.WriteLine("{0}", (3.7m).RoundDown() == 3m);
    /// Console.WriteLine("{0}", (-3.7m).RoundDown() == -3m);
    /// Console.WriteLine("{0}", (3.5m).Round() == 4m);
    /// Console.WriteLine("{0}", (-3.5m).Round() == -4m);
    /// Console.WriteLine("{0}", (3.1m).Round() == 3m);
    /// Console.WriteLine("{0}", (-3.1m).Round() == -3m);
    /// Console.WriteLine("{0}", (3.7m).Integer() == 3);
    /// Console.WriteLine("{0}", (-3.7m).Integer() == -3);
    /// Console.WriteLine("{0}", (3.7m).Fix() == 3m);
    /// Console.WriteLine("{0}", (-3.7m).Fix() == -4m);
    /// Console.WriteLine("{0}", (3.7m).RoundDownFix() == 3m);
    /// Console.WriteLine("{0}", (-3.7m).RoundDownFix() == -4m);
    /// Console.WriteLine("{0}", (3.1m).RoundDownFix() == 3m);
    /// Console.WriteLine("{0}", (-3.1m).RoundDownFix() == -4m);
    /// Console.WriteLine("{0}", (3.1m).RoundUpFix() == 4m);
    /// Console.WriteLine("{0}", (-3.7m).RoundUpFix() == -3m);
    /// Console.WriteLine("{0}", (3.5m).RoundFix() == 4m);
    /// Console.WriteLine("{0}", (-3.5m).RoundFix() == -3m);
    /// Console.WriteLine("{0}", (123.456m).RoundTo(0) == 123.00m);
    /// Console.WriteLine("{0}", (123.456m).RoundTo(2) == 123.46m);
    /// Console.WriteLine("{0}", (123456m).RoundTo(-3) == 123000m);
    /// Console.WriteLine("{0}", (3.3d).RoundUp() == 4d);
    /// Console.WriteLine("{0}", (-3.3d).RoundUp() == -4d);
    /// Console.WriteLine("{0}", (3.7d).RoundDown() == 3d);
    /// Console.WriteLine("{0}", (-3.7d).RoundDown() == -3d);
    /// Console.WriteLine("{0}", (3.5d).Round() == 4d);
    /// Console.WriteLine("{0}", (-3.5d).Round() == -4d);
    /// Console.WriteLine("{0}", (3.1d).Round() == 3d);
    /// Console.WriteLine("{0}", (-3.1d).Round() == -3d);
    /// Console.WriteLine("{0}", (3.7d).Integer() == 3);
    /// Console.WriteLine("{0}", (-3.7d).Integer() == -3);
    /// Console.WriteLine("{0}", (3.7d).Fix() == 3d);
    /// Console.WriteLine("{0}", (-3.7d).Fix() == -4d);
    /// Console.WriteLine("{0}", (3.7d).RoundDownFix() == 3d);
    /// Console.WriteLine("{0}", (-3.7d).RoundDownFix() == -4d);
    /// Console.WriteLine("{0}", (3.1d).RoundDownFix() == 3d);
    /// Console.WriteLine("{0}", (-3.1d).RoundDownFix() == -4d);
    /// Console.WriteLine("{0}", (3.1d).RoundUpFix() == 4d);
    /// Console.WriteLine("{0}", (-3.7d).RoundUpFix() == -3d);
    /// Console.WriteLine("{0}", (3.5d).RoundFix() == 4d);
    /// Console.WriteLine("{0}", (-3.5d).RoundFix() == -3d);
    /// Console.WriteLine("{0}", (123.456d).RoundTo(0) == 123.00d);
    /// Console.WriteLine("{0}", (123.456d).RoundTo(2) == 123.46d);
    /// Console.WriteLine("{0}", (123456d).RoundTo(-3) == 123000d);
    /// </code>
    public static class MathExtensions
    {
        public static int Sign(this decimal @this)
        {
            return Math.Sign(@this);
        }

        public static int Sign(this double @this)
        {
            return Math.Sign(@this);
        }

        public static int Integer(this decimal @this)
        {
            return (int)Math.Truncate(@this);
        }

        public static int Integer(this double @this)
        {
            return (int)Math.Truncate(@this);
        }

        public static decimal Fraction(this decimal @this)
        {
            return @this - Math.Truncate(@this);
        }

        public static double Fraction(this double @this)
        {
            return @this - Math.Truncate(@this);
        }

        public static decimal RoundUp(this decimal @this)
        {
            return Integer(@this) + Sign(Fraction(@this));
        }

        public static double RoundUp(this double @this)
        {
            return Integer(@this) + Sign(Fraction(@this));
        }

        public static decimal RoundDown(this decimal @this)
        {
            return Integer(@this);
        }

        public static double RoundDown(this double @this)
        {
            return Integer(@this);
        }

        public static decimal Round(this decimal @this)
        {
            return Integer(@this) + Integer(Fraction(@this) * 2m);
        }

        public static double Round(this double @this)
        {
            return Integer(@this) + Integer(Fraction(@this) * 2d);
        }

        public static decimal Fix(this decimal @this)
        {
            if (@this >= 0m || Fraction(@this) == 0m)
            {
                return Integer(@this);
            }
            else
            {
                return Integer(@this) - 1;
            }
        }

        public static double Fix(this double @this)
        {
            if (@this >= 0d || Fraction(@this) == 0d)
            {
                return Integer(@this);
            }
            else
            {
                return Integer(@this) - 1;
            }
        }

        public static decimal RoundDownFix(this decimal @this)
        {
            return Fix(@this);
        }

        public static double RoundDownFix(this double @this)
        {
            return Fix(@this);
        }

        public static int Absolute(this int @this)
        {
            return Math.Abs(@this);
        }

        public static decimal RoundUpFix(this decimal @this)
        {
            return Fix(@this) + Absolute(Sign(Fraction(@this)));
        }

        public static double RoundUpFix(this double @this)
        {
            return Fix(@this) + Absolute(Sign(Fraction(@this)));
        }

        public static decimal RoundFix(this decimal @this)
        {
            return Fix(@this + 0.5m);
        }

        public static double RoundFix(this double @this)
        {
            return Fix(@this + 0.5d);
        }

        public static decimal RoundTo(this decimal @this, int d)
        {
            decimal n = (decimal)Math.Pow(10, d);
            @this *= n;
            return (Integer(@this) + Integer(Fraction(@this) * 2m)) / n;
        }

        public static double RoundTo(this double @this, int d)
        {
            double n = Math.Pow(10, d);
            @this *= n;
            return (Integer(@this) + Integer(Fraction(@this) * 2d)) / n;
        }
    }
}
