# Backend Class Design for Gamified Journal (Go)

## 1. Introduction

*   **Purpose**: This document outlines the class and object structure for the Go-based backend of the gamified journal application.
*   **Project Overview**: A journal application that incorporates gamification elements to encourage user engagement and consistency.
*   **Goal**: To define a clear, object-oriented plan for the backend, facilitating a smooth transition from the existing Python implementation to Go, and enabling effective development by a separate team.

## 2. Core Application Classes

*This section will define the primary entities of the journal application itself.*

*   **Example Class: `User`**
    *   Attributes:
        *   `ID` (e.g., UUID, int)
        *   `Username` (string)
        *   `Email` (string)
        *   `HashedPassword` (string)
        *   `CreatedAt` (timestamp)
        *   `UpdatedAt` (timestamp)
    *   Methods:
        *   `Create()`
        *   `UpdateProfile()`
        *   `ChangePassword()`
        *   `Authenticate()`
        *   `GetEntries()`

*   **Example Class: `JournalEntry`**
    *   Attributes:
        *   `ID` (e.g., UUID, int)
        *   `UserID` (foreign key to User)
        *   `Title` (string)
        *   `Content` (text/string)
        *   `Mood` (string, enum: Happy, Sad, Neutral, etc.)
        *   `CreatedAt` (timestamp)
        *   `UpdatedAt` (timestamp)
        *   `Tags` (slice of `Tag` objects or IDs)
    *   Methods:
        *   `Create()`
        *   `Update()`
        *   `Delete()`
        *   `AddTag()`
        *   `RemoveTag()`

*   **Example Class: `Tag`**
    *   Attributes:
        *   `ID` (e.g., UUID, int)
        *   `Name` (string, unique)
        *   `UserID` (foreign key to User, if tags are user-specific, or global)
    *   Methods:
        *   `Create()`
        *   `GetEntriesByTag()`

## 3. Gamification System Classes

*This section will detail the classes responsible for the gamification aspects of the application.*

*   **Example Class: `Achievement`**
    *   Attributes:
        *   `ID` (string, e.g., "first_entry", "7_day_streak")
        *   `Name` (string, e.g., "First Journal Entry!", "Consistent Writer")
        *   `Description` (string)
        *   `IconURL` (string, optional)
        *   `Points` (int, awarded upon unlocking)
        *   `Criteria` (string or structured object defining unlock conditions)
    *   Methods:
        *   `IsUnlockedForUser(userID)`
        *   `UnlockForUser(userID)`

*   **Example Class: `UserProgress` (or `UserProfileGamification`)**
    *   Attributes:
        *   `UserID` (foreign key to User)
        *   `Points` (int, total)
        *   `Level` (int)
        *   `UnlockedAchievements` (slice of `Achievement` IDs or objects)
        *   `CurrentStreaks` (map of streak_type: count, e.g., {"daily_writing": 5})
    *   Methods:
        *   `AddPoints(amount)`
        *   `LevelUpCheck()`
        *   `GrantAchievement(achievementID)`
        *   `UpdateStreak(streakType)`
        *   `ResetStreak(streakType)`

*   **Example Class: `Quest` / `Challenge`**
    *   Attributes:
        *   `ID` (string)
        *   `Title` (string)
        *   `Description` (string)
        *   `Tasks` (slice of `Task` objects)
        *   `Reward` (e.g., points, badge_id)
        *   `IsRecurring` (bool)
        *   `ExpiryDate` (timestamp, optional)
    *   Methods:
        *   `IsCompletedBy(userID)`
        *   `AwardRewardTo(userID)`

## 4. Relationships Between Classes

*Describes how the defined classes interact.*

*   `User` **has many** `JournalEntry` objects.
*   `User` **has one** `UserProgress` object.
*   `JournalEntry` **can have many** `Tag` objects (Many-to-Many if tags are global, or One-to-Many from `JournalEntry` to a `UserTag` joining table if tags are user-specific but reusable).
*   `UserProgress` **has many** `Achievement` objects (representing unlocked achievements).
*   `Quest` **consists of many** `Task` (A `Task` class might be needed: `Description`, `TargetValue`, `CurrentValue`).
*   `Achievement` definitions are global, but their unlock status is tracked per user (likely in `UserProgress`).

## 5. Data Models & Persistence (Brief Overview)

*   **General Approach**: Structs in Go will map to database tables/collections.
*   **Database Choice**: (To be decided - e.g., PostgreSQL, MongoDB). This choice will influence ORM/driver selection.
*   **User**: `users` table.
*   **JournalEntry**: `journal_entries` table with a foreign key to `users`.
*   **Tag**: `tags` table. A join table `journal_entry_tags` might be needed for many-to-many.
*   **Achievement**: `achievements` table (for definitions).
*   **UserProgress**: `user_progress` table with a foreign key to `users`.
*   **UnlockedAchievements**: `user_unlocked_achievements` join table (linking `user_progress` and `achievements`).
*   **Quests**: `quests` table.

## 6. Key Object Interactions / Use Cases

*   **User writes a new journal entry**:
    1.  `JournalEntry.Create()` is called.
    2.  Associated `Tag` objects are linked.
    3.  Gamification system is notified:
        *   `UserProgress.UpdateStreak("daily_writing")`
        *   Check for achievements like "first_entry", "wrote_today". `Achievement.IsUnlockedForUser()` -> `UserProgress.GrantAchievement()`.
        *   Update relevant `Quest` progress.

*   **User completes a 7-day writing streak**:
    1.  Each day `JournalEntry.Create()` is called.
    2.  `UserProgress.UpdateStreak("daily_writing")` increments the streak.
    3.  When streak count reaches 7, the "7_day_streak" `Achievement` criteria is met.
    4.  `Achievement.UnlockForUser()` is triggered, updating `UserProgress.UnlockedAchievements` and `UserProgress.Points`.

## 7. Go Specific Considerations

*   **Interfaces**: Define behavior for services (e.g., `JournalService`, `GamificationService`). Classes will implement these interfaces.
*   **Structs**: Will be used for data representation (our "classes").
*   **Embedding**: Can be used for composition if Go's version of "inheritance" is desired (e.g., a `BaseModel` struct with `ID`, `CreatedAt`, `UpdatedAt`).
*   **Goroutines/Concurrency**: Consider for background tasks (e.g., processing achievements, notifications) if performance becomes a concern.
*   **Error Handling**: Go's explicit error handling (`error` type) will be used throughout methods.
*   **Packages**: Organize code into logical packages (e.g., `user`, `entry`, `gamification`, `storage`).

---

This provides a foundational structure. We can now delve deeper into each section. 