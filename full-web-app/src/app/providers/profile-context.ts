import { createContext } from "react";
import type { IUserProfile } from "../../features/profile/types/IUserProfile";

export type ProfileContextValue = {
  profile: IUserProfile | null;
  isProfileLoading: boolean;
  profileError: string;
  replaceProfile: (profile: IUserProfile) => void;
};

export const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);
