import clientPromise from "../mongodb";

export interface UserProfile {
  name?: string;
  bio?: string;
  profilePicture?: string;
}

export interface UserNotificationSettings {
  email: boolean;
  push: boolean;
}

export interface UserSettings {
  privacy: boolean;
  notifications: UserNotificationSettings;
}

export interface User {
  _id?: string;  // made optional to resolve TS2741
  email: string;
  firstName?: string;
  lastName?: string;
  profilePic?: string;
  showProfile?: boolean;
  searchable?: boolean;
  emailUpdates?: boolean;
  productNews?: boolean;
  passwordHash?: string;
  createdAt: Date;
  updatedAt?: Date;
  provider?: "credentials" | "google";
  googleId?: string;
  profile?: UserProfile;
  settings?: UserSettings;
}

export async function ensureUser(userId: string, email?: string) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection<User>("users").updateOne(
    { _id: userId },
    {
      $setOnInsert: {
        _id: userId,
        email: email || "",
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );
}