import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { auth } from "./firebase.ts";

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/contacts");

let cachedAccessToken: string | null = null;

// Handle Google Sign in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google sign-in.");
    }
    cachedAccessToken = credential.accessToken;
    console.log("Cached access token initialized successfully.");
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const clearAccessToken = () => {
  cachedAccessToken = null;
};

// Interface definitions for Google Drive file
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  iconLink?: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
}

// Fetch files from Google Drive
export const fetchGoogleDriveFiles = async (queryText = ""): Promise<GoogleDriveFile[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Missing Google Access Token. Please sign in with Google.");
  }

  let url = "https://www.googleapis.com/drive/v3/files?pageSize=30&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,iconLink,webViewLink,size,modifiedTime)&orderBy=modifiedTime+desc";
  if (queryText) {
    const escapedQuery = queryText.replace(/'/g, "\\'");
    url += `&q=name+contains+'${encodeURIComponent(escapedQuery)}'`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch Google Drive files: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
};

// Interface definitions for Google Contact
export interface GoogleContact {
  resourceName: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

// Fetch contacts from Google People API
export const fetchGoogleContacts = async (): Promise<GoogleContact[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Missing Google Access Token. Please sign in with Google.");
  }

  const url = "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=100";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch Google contacts: ${response.statusText}`);
  }

  const data = await response.json();
  const connections = data.connections || [];

  return connections.map((conn: any) => {
    const names = conn.names || [];
    const displayName = names[0]?.displayName || "Unknown Name";
    const emailAddresses = conn.emailAddresses || [];
    const email = emailAddresses[0]?.value || "";
    const phoneNumbers = conn.phoneNumbers || [];
    const phone = phoneNumbers[0]?.value || "";
    const photos = conn.photos || [];
    const photoUrl = photos[0]?.url || "";

    return {
      resourceName: conn.resourceName,
      name: displayName,
      email,
      phone,
      photoUrl,
    };
  });
};
