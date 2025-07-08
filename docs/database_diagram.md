erDiagram
    USERS ||--o{ JOURNAL_ENTRIES : "possui"
    USERS ||--|| CHARACTERS : "possui"
    USERS ||--o{ QUESTS : "possui"
    USERS ||--o{ FOLDERS : "possui"
    FOLDERS ||--o{ JOURNAL_ENTRIES : "contém"
    JOURNAL_ENTRIES }o--o{ TAGS : "marcada com"

    USERS {
        string ID "PK, UUID"
        string Username "unique"
        string Email "unique"
        string HashedPassword
        datetime CreatedAt
        datetime UpdatedAt
        datetime DeletedAt
    }

    CHARACTERS {
        string ID "PK, UUID"
        string UserID "FK to USERS"
        string Name
        string Class "enum: Warrior, Mage, Rogue"
        int Level
        int XP
        string AvatarURL
        int AttributePoints
        int Strength
        int Defense
        int Vitality
        int Mana
    }

    JOURNAL_ENTRIES {
        string ID "PK, UUID"
        string UserID "FK to USERS"
        string FolderID "FK to FOLDERS (nullable)"
        string Title
        string Content "text"
        datetime CreatedAt
        datetime UpdatedAt
        datetime DeletedAt
    }

    QUESTS {
        string ID "PK, UUID"
        string UserID "FK to USERS"
        string Title
        string Description "text"
        string Status "enum: active, completed"
        string Difficulty "enum: easy, medium, hard"
        string Type "enum: main, side"
        int XPReward
        datetime CreatedAt
        datetime UpdatedAt
    }

    FOLDERS {
        string ID "PK, UUID"
        string UserID "FK to USERS"
        string Name
        string ParentFolderID "FK to self (nullable)"
        datetime CreatedAt
        datetime UpdatedAt
    }

    TAGS {
        string ID "PK, UUID"
        string Name "unique"
        datetime CreatedAt
        datetime UpdatedAt
    } 