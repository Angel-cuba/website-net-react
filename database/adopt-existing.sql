SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @baselineId nvarchar(150) = N'00000000_000_baseline';

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    PRINT N'This database already tracks schema migrations.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT required_table.TableName
        FROM (VALUES
            (N'Users'),
            (N'UserProfiles'),
            (N'Roles'),
            (N'UserRoles'),
            (N'Tasks'),
            (N'TaskInvitations'),
            (N'TaskAccess'),
            (N'Notifications')
        ) required_table (TableName)
        WHERE OBJECT_ID(N'dbo.' + required_table.TableName, N'U') IS NULL
    )
    BEGIN
        THROW 51040, 'The existing database is missing one or more Wapp2 baseline tables.', 1;
    END;

    EXEC(N'
        CREATE TABLE dbo.SchemaMigrations (
            MigrationId nvarchar(150) NOT NULL,
            AppliedAt datetime2(7) NOT NULL
                CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT PK_SchemaMigrations
                PRIMARY KEY CLUSTERED (MigrationId)
        );
    ');

    EXEC sys.sp_executesql
        N'INSERT INTO dbo.SchemaMigrations (MigrationId) VALUES (@migrationId);',
        N'@migrationId nvarchar(150)',
        @migrationId = @baselineId;

    COMMIT TRANSACTION;
    PRINT N'Existing Wapp2 database adopted successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO
