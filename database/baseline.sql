SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @baselineId nvarchar(150) = N'00000000_000_baseline';

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.SchemaMigrations (
            MigrationId nvarchar(150) NOT NULL,
            AppliedAt datetime2(7) NOT NULL
                CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT PK_SchemaMigrations
                PRIMARY KEY CLUSTERED (MigrationId)
        );
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE MigrationId = @baselineId
    )
    BEGIN
        COMMIT TRANSACTION;
        PRINT N'Database baseline is already applied.';
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM sys.tables table_object
        INNER JOIN sys.schemas schema_object
            ON schema_object.schema_id = table_object.schema_id
        WHERE schema_object.name = N'dbo'
          AND table_object.name IN (
              N'Users',
              N'UserProfiles',
              N'Roles',
              N'UserRoles',
              N'Tasks',
              N'TaskInvitations',
              N'TaskAccess',
              N'Notifications'
          )
    )
    BEGIN
        THROW 51000, 'The baseline requires a database without existing Wapp2 tables.', 1;
    END;

    CREATE TABLE dbo.Users (
        Id int IDENTITY(1, 1) NOT NULL,
        Email varchar(255) NOT NULL,
        PasswordHash varchar(255) NOT NULL,
        CreatedAt datetime2(7) NOT NULL
            CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Users_Email UNIQUE NONCLUSTERED (Email)
    );

    CREATE TABLE dbo.UserProfiles (
        UserId int NOT NULL,
        FirstName varchar(100) NULL,
        LastName varchar(100) NULL,
        AvatarUrl varchar(max) NULL,
        Bio varchar(max) NULL,
        CONSTRAINT PK_UserProfiles PRIMARY KEY CLUSTERED (UserId),
        CONSTRAINT FK_UserProfiles_Users
            FOREIGN KEY (UserId) REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );

    CREATE TABLE dbo.Roles (
        Id int IDENTITY(1, 1) NOT NULL,
        Name varchar(50) NOT NULL,
        CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Roles_Name UNIQUE NONCLUSTERED (Name)
    );

    CREATE TABLE dbo.UserRoles (
        UserId int NOT NULL,
        RoleId int NOT NULL,
        CONSTRAINT PK_UserRoles PRIMARY KEY CLUSTERED (UserId, RoleId),
        CONSTRAINT FK_UserRoles_Users
            FOREIGN KEY (UserId) REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
        CONSTRAINT FK_UserRoles_Roles
            FOREIGN KEY (RoleId) REFERENCES dbo.Roles (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );

    CREATE TABLE dbo.Tasks (
        Id int IDENTITY(1, 1) NOT NULL,
        Title nvarchar(150) NOT NULL,
        Category varchar(50) NOT NULL,
        Description varchar(max) NULL,
        OwnerUserId int NULL,
        DueDate datetime2(7) NULL,
        IsCompleted bit NOT NULL
            CONSTRAINT DF_Tasks_IsCompleted DEFAULT ((0)),
        Priority nvarchar(20) NULL,
        Status nvarchar(20) NOT NULL
            CONSTRAINT DF_Tasks_Status DEFAULT (N'pending'),
        CreatedAt datetime2(7) NOT NULL
            CONSTRAINT DF_Tasks_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt datetime2(7) NULL,
        CONSTRAINT PK_Tasks PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Tasks_Users_OwnerUserId
            FOREIGN KEY (OwnerUserId) REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );

    CREATE TABLE dbo.TaskInvitations (
        Id int IDENTITY(1, 1) NOT NULL,
        TaskId int NOT NULL,
        InvitedUserId int NULL,
        InvitedEmail nvarchar(256) NULL,
        InvitedByUserId int NOT NULL,
        Status nvarchar(20) NOT NULL
            CONSTRAINT DF_TaskInvitations_Status DEFAULT (N'pending'),
        CreatedAt datetime2(7) NOT NULL
            CONSTRAINT DF_TaskInvitations_CreatedAt DEFAULT (SYSUTCDATETIME()),
        RespondedAt datetime2(7) NULL,
        RejectionReason nvarchar(500) NULL,
        CONSTRAINT PK_TaskInvitations PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT CK_TaskInvitations_Status
            CHECK (Status IN (N'pending', N'accepted', N'rejected')),
        CONSTRAINT CK_TaskInvitations_RejectionReason
            CHECK (
                (
                    Status = N'rejected'
                    AND RejectionReason IS NOT NULL
                    AND LEN(LTRIM(RTRIM(RejectionReason))) BETWEEN 1 AND 500
                )
                OR (
                    Status <> N'rejected'
                    AND RejectionReason IS NULL
                )
            ),
        CONSTRAINT FK_TaskInvitations_Tasks
            FOREIGN KEY (TaskId) REFERENCES dbo.Tasks (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
        CONSTRAINT FK_TaskInvitations_InvitedUser
            FOREIGN KEY (InvitedUserId) REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
        CONSTRAINT FK_TaskInvitations_InvitedByUser
            FOREIGN KEY (InvitedByUserId) REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );

    CREATE TABLE dbo.TaskAccess (
        Id int IDENTITY(1, 1) NOT NULL,
        TaskId int NOT NULL,
        UserId int NOT NULL,
        CanEdit bit NOT NULL
            CONSTRAINT DF_TaskAccess_CanEdit DEFAULT ((0)),
        CreatedAt datetime2(7) NOT NULL
            CONSTRAINT DF_TaskAccess_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_TaskAccess PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_TaskAccess_Task_User UNIQUE NONCLUSTERED (TaskId, UserId),
        CONSTRAINT FK_TaskAccess_Tasks
            FOREIGN KEY (TaskId) REFERENCES dbo.Tasks (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
        CONSTRAINT FK_TaskAccess_Users
            FOREIGN KEY (UserId) REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );

    CREATE TABLE dbo.Notifications (
        Id int IDENTITY(1, 1) NOT NULL,
        UserId int NOT NULL,
        Title nvarchar(150) NOT NULL,
        Message nvarchar(1000) NOT NULL,
        IsRead bit NOT NULL
            CONSTRAINT DF_Notifications_IsRead DEFAULT ((0)),
        CreatedAt datetime2(7) NOT NULL
            CONSTRAINT DF_Notifications_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Notifications_Users
            FOREIGN KEY (UserId) REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );

    INSERT INTO dbo.Roles (Name)
    VALUES (N'User'), (N'Admin'), (N'SuperAdmin');

    INSERT INTO dbo.SchemaMigrations (MigrationId)
    VALUES (@baselineId);

    COMMIT TRANSACTION;
    PRINT N'Database baseline applied successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO
