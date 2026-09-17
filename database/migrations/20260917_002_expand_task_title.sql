SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @migrationId nvarchar(150) = N'20260917_002_expand_task_title';

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
BEGIN
    THROW 51001, 'SchemaMigrations is missing. Apply database/baseline.sql first.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM dbo.SchemaMigrations
    WHERE MigrationId = @migrationId
)
BEGIN
    PRINT N'Migration 20260917_002_expand_task_title is already applied.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Tasks', N'U') IS NULL
    BEGIN
        THROW 51002, 'Tasks table is missing.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.Tasks
        WHERE LEN(Title) > 150
    )
    BEGIN
        THROW 51003, 'Tasks contains titles longer than 150 characters.', 1;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns column_object
        INNER JOIN sys.types type_object
            ON type_object.user_type_id = column_object.user_type_id
        WHERE column_object.object_id = OBJECT_ID(N'dbo.Tasks')
          AND column_object.name = N'Title'
          AND type_object.name = N'nvarchar'
          AND column_object.max_length = 300
          AND column_object.is_nullable = 0
    )
    BEGIN
        ALTER TABLE dbo.Tasks
            ALTER COLUMN Title nvarchar(150) NOT NULL;
    END;

    INSERT INTO dbo.SchemaMigrations (MigrationId)
    VALUES (@migrationId);

    COMMIT TRANSACTION;
    PRINT N'Migration 20260917_002_expand_task_title applied successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO
