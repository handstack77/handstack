using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.Reflection;

namespace HandStack.Web.Common
{
    public static class ColorManagement
    {
        private static List<Color?> webColors = new List<Color?>();

        public static Color HexColorTransform(string hexColor)
        {
            if (IsValidHex(hexColor) == false)
            {
                hexColor = "#000000";
            }

            if (hexColor.IndexOf('#') != -1)
            {
                hexColor = hexColor.Replace("#", "");
            }

            int red = 0;
            int green = 0;
            int blue = 0;

            if (hexColor.Length == 6)
            {
                red = int.Parse(hexColor.Substring(0, 2), NumberStyles.AllowHexSpecifier);
                green = int.Parse(hexColor.Substring(2, 2), NumberStyles.AllowHexSpecifier);
                blue = int.Parse(hexColor.Substring(4, 2), NumberStyles.AllowHexSpecifier);
            }
            else if (hexColor.Length == 3)
            {
                red = int.Parse(hexColor[0].ToString() + hexColor[0].ToString(), NumberStyles.AllowHexSpecifier);
                green = int.Parse(hexColor[1].ToString() + hexColor[1].ToString(), NumberStyles.AllowHexSpecifier);
                blue = int.Parse(hexColor[2].ToString() + hexColor[2].ToString(), NumberStyles.AllowHexSpecifier);
            }

            return Color.FromArgb(red, green, blue);
        }

        public static bool IsValidHex(string hexColor)
        {
            if (hexColor.StartsWith("#"))
            {
                return hexColor.Length == 7 || hexColor.Length == 4;
            }
            else
            {
                return hexColor.Length == 6 || hexColor.Length == 3;
            }
        }

        public static string ToHex(Color color)
        {
            return string.Concat("#", color.R.ToString("X2"), color.G.ToString("X2"), color.B.ToString("X2"));
        }

        public static Color GetNearestWebColor(string hexColor)
        {
            return GetNearestWebColor(HexColorTransform(hexColor));
        }

        public static Color GetNearestWebColor(Color inputColor)
        {
            webColors = GetWebColors();
            double inputRed = Convert.ToDouble(inputColor.R);
            double inputGreen = Convert.ToDouble(inputColor.G);
            double inputBlue = Convert.ToDouble(inputColor.B);
            double distance = 500.0;
            double temp;
            double testRed;
            double testGreen;
            double testBlue;
            Color nearestColor = Color.Empty;
            foreach (object? webColor in webColors)
            {
                if (webColor != null)
                {
                    Color color = (Color)webColor;
                    testRed = Math.Pow(Convert.ToDouble((color.R)) - inputRed, 2.0);
                    testGreen = Math.Pow(Convert.ToDouble((color.G)) - inputGreen, 2.0);
                    testBlue = Math.Pow(Convert.ToDouble((color.B)) - inputBlue, 2.0);
                    temp = Math.Sqrt(testBlue + testGreen + testRed);
                    if (temp < distance)
                    {
                        distance = temp;
                        nearestColor = (Color)webColor;
                    }
                }
            }

            return nearestColor;
        }

        private static List<Color?> GetWebColors()
        {
            Type color = (typeof(Color));
            PropertyInfo[] propertyInfos = color.GetProperties(BindingFlags.Public | BindingFlags.Static);
            List<Color?> colors = new List<Color?>();
            foreach (PropertyInfo pi in propertyInfos)
            {
                if (pi.PropertyType.Equals(typeof(Color)))
                {
                    Color? c = (Color?)pi.GetValue(typeof(Color), null);
                    if (c != null)
                    {
                        colors.Add(c);
                    }
                }
            }
            return colors;
        }
    }
}
