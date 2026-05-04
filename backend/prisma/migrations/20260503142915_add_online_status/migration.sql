-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "hobby" TEXT,
    "music" TEXT,
    "weekend" TEXT,
    "lookingForHobby" TEXT,
    "lookingForMusic" TEXT,
    "lookingForWeekend" TEXT,
    "gender" TEXT DEFAULT 'MALE',
    "interestedIn" TEXT DEFAULT 'FEMALE',
    "role" TEXT NOT NULL DEFAULT 'STANDARD',
    "birthDate" DATETIME NOT NULL,
    "birthTime" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "sunSign" TEXT NOT NULL,
    "moonSign" TEXT NOT NULL,
    "risingSign" TEXT NOT NULL,
    "stardustBalance" INTEGER NOT NULL DEFAULT 0,
    "matchScore" INTEGER NOT NULL DEFAULT 100,
    "cosmicStatus" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "dailySwipes" INTEGER NOT NULL DEFAULT 0,
    "lastSwipeDate" DATETIME,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" DATETIME,
    "superLikesLeft" INTEGER NOT NULL DEFAULT 0,
    "extraTimeLeft" INTEGER NOT NULL DEFAULT 0,
    "twoFactorSecret" TEXT,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyMatchPasses" INTEGER NOT NULL DEFAULT 50,
    "lastDailyReward" DATETIME,
    "loginStreak" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "lastDailyTarot" DATETIME,
    "badges" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyFriendRequests" INTEGER NOT NULL DEFAULT 0,
    "lastFriendRequestDate" DATETIME
);
INSERT INTO "new_User" ("avatar", "badges", "bio", "birthDate", "birthTime", "cosmicStatus", "createdAt", "dailyFriendRequests", "dailyMatchPasses", "dailySwipes", "email", "extraTimeLeft", "gender", "hobby", "id", "interestedIn", "isPremium", "isTwoFactorEnabled", "lastDailyReward", "lastDailyTarot", "lastFriendRequestDate", "lastSwipeDate", "latitude", "level", "loginStreak", "longitude", "lookingForHobby", "lookingForMusic", "lookingForWeekend", "matchScore", "moonSign", "music", "name", "passwordHash", "risingSign", "role", "stardustBalance", "sunSign", "superLikesLeft", "twoFactorSecret", "weekend", "xp") SELECT "avatar", "badges", "bio", "birthDate", "birthTime", "cosmicStatus", "createdAt", "dailyFriendRequests", "dailyMatchPasses", "dailySwipes", "email", "extraTimeLeft", "gender", "hobby", "id", "interestedIn", "isPremium", "isTwoFactorEnabled", "lastDailyReward", "lastDailyTarot", "lastFriendRequestDate", "lastSwipeDate", "latitude", "level", "loginStreak", "longitude", "lookingForHobby", "lookingForMusic", "lookingForWeekend", "matchScore", "moonSign", "music", "name", "passwordHash", "risingSign", "role", "stardustBalance", "sunSign", "superLikesLeft", "twoFactorSecret", "weekend", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
