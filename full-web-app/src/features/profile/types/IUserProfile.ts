export interface IUserProfile {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  bio: string;
}

export type UpdateUserProfileRequest = IUserProfile;
