USE Wapp2DB;
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM dbo.TaskInvitations
        WHERE InvitedUserId IS NULL
          AND NULLIF(LTRIM(RTRIM(InvitedEmail)), N'') IS NULL
    )
    BEGIN
        THROW 50001, 'TaskInvitations contains invitations without a target.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.TaskInvitations
        WHERE Status = N'pending'
          AND InvitedUserId IS NOT NULL
        GROUP BY TaskId, InvitedUserId
        HAVING COUNT(*) > 1
    )
    BEGIN
        THROW 50002, 'Duplicate pending task invitations exist.', 1;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_TaskInvitations_Task_User_Pending'
          AND object_id = OBJECT_ID(N'dbo.TaskInvitations')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_TaskInvitations_Task_User_Pending
            ON dbo.TaskInvitations (TaskId, InvitedUserId)
            WHERE Status = N'pending'
              AND InvitedUserId IS NOT NULL;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TaskInvitations_User_Status_CreatedAt'
          AND object_id = OBJECT_ID(N'dbo.TaskInvitations')
    )
    BEGIN
        CREATE INDEX IX_TaskInvitations_User_Status_CreatedAt
            ON dbo.TaskInvitations (InvitedUserId, Status, CreatedAt DESC)
            INCLUDE (TaskId, InvitedEmail, InvitedByUserId, RespondedAt);
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TaskAccess_User_CreatedAt'
          AND object_id = OBJECT_ID(N'dbo.TaskAccess')
    )
    BEGIN
        CREATE INDEX IX_TaskAccess_User_CreatedAt
            ON dbo.TaskAccess (UserId, CreatedAt DESC)
            INCLUDE (TaskId, CanEdit);
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_TaskInvitations_Target'
          AND parent_object_id = OBJECT_ID(N'dbo.TaskInvitations')
    )
    BEGIN
        ALTER TABLE dbo.TaskInvitations WITH CHECK
            ADD CONSTRAINT CK_TaskInvitations_Target
            CHECK (
                InvitedUserId IS NOT NULL
                OR NULLIF(LTRIM(RTRIM(InvitedEmail)), N'') IS NOT NULL
            );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO
