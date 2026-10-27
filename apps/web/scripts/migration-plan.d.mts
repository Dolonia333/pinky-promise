export declare function migrationName(path: string): string;
export declare function isMigrationFile(path: string): boolean;
export declare function pendingMigrations(
  paths: readonly string[],
  applied: readonly string[],
): Array<{ name: string; path: string }>;
