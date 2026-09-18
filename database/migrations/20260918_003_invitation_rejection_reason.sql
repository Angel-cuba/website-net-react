SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @migrationId nvarchar(150) = N'20260918_003_invitation_rejection_reason';

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
    PRINT N'Migration 20260918_003_invitation_rejection_reason is already applied.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.TaskInvitations', N'U') IS NULL
    BEGIN
        THROW 51002, 'TaskInvitations table is missing.', 1;
    END;

    IF COL_LENGTH(N'dbo.TaskInvitations', N'RejectionReason') IS NULL
    BEGIN
        ALTER TABLE dbo.TaskInvitations
            ADD RejectionReason nvarchar(500) NULL;
    END;

    IF OBJECT_ID(N'dbo.CK_TaskInvitations_RejectionReason', N'C') IS NULL
    BEGIN
        EXEC(N'
            ALTER TABLE dbo.TaskInvitations WITH CHECK
                ADD CONSTRAINT CK_TaskInvitations_RejectionReason
                CHECK (
                    RejectionReason IS NULL
                    OR (
                        Status = N''rejected''
                        AND LEN(LTRIM(RTRIM(RejectionReason))) BETWEEN 1 AND 500
                    )
                );
        ');
    END;

    INSERT INTO dbo.SchemaMigrations (MigrationId)
    VALUES (@migrationId);

    COMMIT TRANSACTION;
    PRINT N'Migration 20260918_003_invitation_rejection_reason applied successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO
