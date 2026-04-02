using System;
using System.IO;
using System.Text.Json;

namespace launcher.Updates;

public static class VersionFileStore
{
    public const string DefaultVersion = "1.0.0";

    public static InstalledVersionInfo Ensure(string filePath, string? defaultVersion = null)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(filePath) ?? AppContext.BaseDirectory);
        if (File.Exists(filePath) == false)
        {
            var created = new InstalledVersionInfo
            {
                Version = NormalizeVersion(defaultVersion),
                UpdatedAt = DateTimeOffset.UtcNow
            };
            Save(filePath, created);
            return created;
        }

        try
        {
            var loaded = Load(filePath);
            var updated = false;
            if (string.IsNullOrWhiteSpace(loaded.Version) == true)
            {
                loaded.Version = NormalizeVersion(defaultVersion);
                updated = true;
            }

            if (loaded.UpdatedAt == default)
            {
                loaded.UpdatedAt = DateTimeOffset.UtcNow;
                updated = true;
            }

            if (updated == true)
            {
                Save(filePath, loaded);
            }

            return loaded;
        }
        catch (JsonException)
        {
            var recreated = new InstalledVersionInfo
            {
                Version = NormalizeVersion(defaultVersion),
                UpdatedAt = DateTimeOffset.UtcNow
            };
            Save(filePath, recreated);
            return recreated;
        }
    }

    public static InstalledVersionInfo Load(string filePath)
    {
        var json = File.ReadAllText(filePath);
        return JsonSerializer.Deserialize<InstalledVersionInfo>(json, UpdateJson.DefaultSerializerOptions)
            ?? throw new InvalidOperationException("version.json 역직렬화에 실패했습니다.");
    }

    public static void Save(string filePath, InstalledVersionInfo info)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(filePath) ?? AppContext.BaseDirectory);
        var json = JsonSerializer.Serialize(info, UpdateJson.DefaultSerializerOptions);
        File.WriteAllText(filePath, json + Environment.NewLine);
    }

    private static string NormalizeVersion(string? version)
    {
        return string.IsNullOrWhiteSpace(version) == true ? DefaultVersion : version.Trim();
    }
}
