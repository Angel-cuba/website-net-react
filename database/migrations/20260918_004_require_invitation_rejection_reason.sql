SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @migrationId nvarchar(150) = N'20260918_004_require_invitation_rejection_reason';

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
BEGIN
    THROW 51001, 'SchemaMigrations is missing. Apply or adopt the database baseline first.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM dbo.SchemaMigrations
    WHERE MigrationId = @migrationId
)
BEGIN
    PRINT N'Migration 20260918_004_require_invitation_rejection_reason is already applied.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dbo.TaskInvitations', N'RejectionReason') IS NULL
    BEGIN
        THROW 51004, 'TaskInvitations.RejectionReason is missing. Apply migration 003 first.', 1;
    END;

    EXEC(N'
        UPDATE dbo.TaskInvitations
        SET RejectionReason = N''No reason was provided.''
        WHERE Status = N''rejected''
          AND NULLIF(LTRIM(RTRIM(RejectionReason)), N'''') IS NULL;

        UPDATE dbo.TaskInvitations
        SET RejectionReason = NULL
        WHERE Status <> N''rejected''
          AND RejectionReason IS NOT NULL;
    ');

    IF OBJECT_ID(N'dbo.CK_TaskInvitations_RejectionReason', N'C') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.TaskInvitations
            DROP CONSTRAINT CK_TaskInvitations_RejectionReason;
    END;

    EXEC(N'
        ALTER TABLE dbo.TaskInvitations WITH CHECK
            ADD CONSTRAINT CK_TaskInvitations_RejectionReason
            CHECK (
                (
                    Status = N''rejected''
                    AND RejectionReason IS NOT NULL
                    AND LEN(LTRIM(RTRIM(RejectionReason))) BETWEEN 1 AND 500
                )
                OR (
                    Status <> N''rejected''
                    AND RejectionReason IS NULL
                )
            );
    ');

    INSERT INTO dbo.SchemaMigrations (MigrationId)
    VALUES (@migrationId);

    COMMIT TRANSACTION;
    PRINT N'Migration 20260918_004_require_invitation_rejection_reason applied successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO
