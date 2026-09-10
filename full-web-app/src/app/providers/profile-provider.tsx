import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ApiError } from "../../lib/http-client";
import { getErrorMessage } from "../../utils/errors";
import { getUserProfile } from "../../features/profile/api/user-api";
import type { IUserProfile } from "../../features/profile/types/IUserProfile";
import { useAuth } from "../../features/auth";
import { ProfileContext } from "./profile-context";

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { expireSession, isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const requestVersion = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestVersion.current;

    if (!isAuthenticated || !userId) {
      requestVersion.current += 1;
      return;
    }

    void requestUserProfile()
      .then((nextProfile) => {
        if (currentRequest !== requestVersion.current) return;

        setProfile(nextProfile);
        setLoadedUserId(userId);
        setProfileError("");
      })
      .catch((caughtError: unknown) => {
        if (currentRequest !== requestVersion.current) return;

        setProfile(null);
        setLoadedUserId(userId);

        if (caughtError instanceof ApiError && caughtError.status === 401) {
          expireSession();
          return;
        }

        setProfileError(getErrorMessage(caughtError));
      })
      .finally(() => {
        if (currentRequest === requestVersion.current) {
          setIsRefreshingProfile(false);
        }
      });

    return () => {
      requestVersion.current += 1;
    };
  }, [expireSession, isAuthenticated, userId]);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !userId) return;

    const currentRequest = ++requestVersion.current;
    setIsRefreshingProfile(true);

    try {
      const nextProfile = await requestUserProfile();

      if (currentRequest !== requestVersion.current) return;

      setProfile(nextProfile);
      setLoadedUserId(userId);
      setProfileError("");
    } catch (caughtError) {
      if (currentRequest !== requestVersion.current) return;

      setProfile(null);
      setLoadedUserId(userId);

      if (caughtError instanceof ApiError && caughtError.status === 401) {
        expireSession();
        return;
      }

      setProfileError(getErrorMessage(caughtError));
    } finally {
      if (currentRequest === requestVersion.current) {
        setIsRefreshingProfile(false);
      }
    }
  }, [expireSession, isAuthenticated, userId]);

  const replaceProfile = useCallback(
    (nextProfile: IUserProfile) => {
      setProfile(normalizeProfile(nextProfile));
      setLoadedUserId(userId ?? null);
      setProfileError("");
    },
    [userId],
  );

  const hasCurrentProfile = Boolean(userId && loadedUserId === userId);
  const currentProfile = isAuthenticated && hasCurrentProfile ? profile : null;
  const currentProfileError = isAuthenticated && hasCurrentProfile ? profileError : "";
  const isProfileLoading = Boolean(
    isAuthenticated && userId && (!hasCurrentProfile || isRefreshingProfile),
  );

  const value = useMemo(
    () => ({
      profile: currentProfile,
      isProfileLoading,
      profileError: currentProfileError,
      refreshProfile,
      replaceProfile,
    }),
    [
      currentProfile,
      currentProfileError,
      isProfileLoading,
      refreshProfile,
      replaceProfile,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

function normalizeProfile(profile: IUserProfile): IUserProfile {
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    bio: profile.bio ?? "",
  };
}

async function requestUserProfile(): Promise<IUserProfile> {
  const response = await getUserProfile();

  if (!response.data) {
    throw new Error("The API did not return profile data.");
  }

  return normalizeProfile(response.data);
}
