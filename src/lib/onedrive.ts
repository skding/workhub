import { db } from "./db";

export interface OneDriveItem {
  id: string;
  name: string;
  size?: number;
  webUrl: string;
  downloadUrl?: string;
  isFolder: boolean;
  mimeType?: string;
  lastModifiedDateTime: string;
  category?: "INPUT" | "DESIGN" | "COSTING" | "OTHER";
}

// Environment settings
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "";
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || "";
const TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/onedrive/callback`;

export function isOneDriveConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

// Generate Microsoft OAuth Authorization URL
export function getOneDriveAuthUrl(): string {
  const scope = encodeURIComponent("offline_access Files.ReadWrite Files.ReadWrite.All User.Read");
  const redirect = encodeURIComponent(REDIRECT_URI);
  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirect}&response_mode=query&scope=${scope}&state=workhub_auth`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", REDIRECT_URI);

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Failed to exchange code");
  }

  // Get user profile info
  const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const userData = await userRes.json();

  const tokenExpires = new Date(Date.now() + data.expires_in * 1000);

  // Store in database
  const integration = await db.integration.upsert({
    where: { provider: "onedrive" },
    update: {
      connected: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpires,
      accountEmail: userData.mail || userData.userPrincipalName || "OneDrive User",
      accountName: userData.displayName || "OneDrive Account",
    },
    create: {
      provider: "onedrive",
      connected: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpires,
      accountEmail: userData.mail || userData.userPrincipalName || "OneDrive User",
      accountName: userData.displayName || "OneDrive Account",
    },
  });

  return integration;
}

// Get valid access token (auto-refreshes if expired)
export async function getValidAccessToken(): Promise<string | null> {
  const integration = await db.integration.findUnique({
    where: { provider: "onedrive" },
  });

  if (!integration || !integration.connected || !integration.refreshToken) {
    return null;
  }

  // Check if token is still valid (with 5 min buffer)
  if (integration.tokenExpires && integration.tokenExpires.getTime() > Date.now() + 5 * 60 * 1000) {
    return integration.accessToken;
  }

  // Token expired, refresh it
  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", integration.refreshToken);

    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Token refresh failed:", data);
      return null;
    }

    const tokenExpires = new Date(Date.now() + data.expires_in * 1000);

    await db.integration.update({
      where: { provider: "onedrive" },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || integration.refreshToken,
        tokenExpires,
      },
    });

    return data.access_token;
  } catch (err) {
    console.error("Failed to refresh OneDrive token:", err);
    return null;
  }
}

// Helper: Ensure parent folder exists and create subfolder
async function ensureFolder(accessToken: string, parentPath: string, folderName: string) {
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:${parentPath}:/children`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail",
    }),
  });

  if (res.status === 409) {
    // Already exists, fetch it
    const fetchRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${parentPath}/${folderName}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return await fetchRes.json();
  }

  return await res.json();
}

// Create standardized project folder with 3 sub-folders:
// /WorkHub/2026/[folderName]/
//    ├── 01_Client_Inputs
//    ├── 02_Design_Concepts
//    └── 03_Costing_Revisions
export async function createProjectFolderStructure(folderName: string) {
  const token = await getValidAccessToken();
  const year = new Date().getFullYear().toString();

  if (!token) {
    // If OneDrive is not connected, return a simulated folder record for seamless workflow
    return {
      folderId: `simulated_${folderName}`,
      webUrl: `https://onedrive.live.com/?id=WorkHub/${year}/${folderName}`,
      subfolders: {
        inputs: "01_Client_Inputs",
        design: "02_Design_Concepts",
        costing: "03_Costing_Revisions",
      },
      simulated: true,
    };
  }

  try {
    // 1. Ensure /WorkHub root folder exists
    await ensureFolder(token, "", "WorkHub");

    // 2. Ensure /WorkHub/YYYY folder exists
    await ensureFolder(token, "/WorkHub", year);

    // 3. Create the Enquiry project folder
    const projectFolder = await ensureFolder(token, `/WorkHub/${year}`, folderName);

    // 4. Create standard sub-folders inside project folder
    const projectPath = `/WorkHub/${year}/${folderName}`;
    await Promise.all([
      ensureFolder(token, projectPath, "01_Client_Inputs"),
      ensureFolder(token, projectPath, "02_Design_Concepts"),
      ensureFolder(token, projectPath, "03_Costing_Revisions"),
    ]);

    return {
      folderId: projectFolder.id,
      webUrl: projectFolder.webUrl,
      subfolders: {
        inputs: "01_Client_Inputs",
        design: "02_Design_Concepts",
        costing: "03_Costing_Revisions",
      },
      simulated: false,
    };
  } catch (err: any) {
    console.error("OneDrive folder creation error:", err);
    throw err;
  }
}

// List files inside an enquiry's OneDrive folder
export async function listProjectFiles(folderName: string, folderId?: string | null): Promise<OneDriveItem[]> {
  const token = await getValidAccessToken();
  const year = new Date().getFullYear().toString();

  if (!token || !folderId || folderId.startsWith("simulated_")) {
    return [];
  }

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$expand=thumbnails`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const items: any[] = data.value || [];

    const fileList: OneDriveItem[] = [];

    // Traverse items and standard subfolders (01_Client_Inputs, etc.)
    for (const item of items) {
      if (item.folder) {
        // Fetch subfolder children
        const subRes = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${item.id}/children?$expand=thumbnails`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (subRes.ok) {
          const subData = await subRes.json();
          for (const subItem of subData.value || []) {
            let cat: "INPUT" | "DESIGN" | "COSTING" | "OTHER" = "OTHER";
            if (item.name.includes("Inputs")) cat = "INPUT";
            else if (item.name.includes("Design")) cat = "DESIGN";
            else if (item.name.includes("Costing")) cat = "COSTING";

            fileList.push({
              id: subItem.id,
              name: subItem.name,
              size: subItem.size,
              webUrl: subItem.webUrl,
              downloadUrl: subItem["@microsoft.graph.downloadUrl"],
              isFolder: Boolean(subItem.folder),
              mimeType: subItem.file?.mimeType,
              lastModifiedDateTime: subItem.lastModifiedDateTime,
              category: cat,
            });
          }
        }
      } else {
        fileList.push({
          id: item.id,
          name: item.name,
          size: item.size,
          webUrl: item.webUrl,
          downloadUrl: item["@microsoft.graph.downloadUrl"],
          isFolder: false,
          mimeType: item.file?.mimeType,
          lastModifiedDateTime: item.lastModifiedDateTime,
          category: "OTHER",
        });
      }
    }

    return fileList;
  } catch (err) {
    console.error("Failed to list OneDrive files:", err);
    return [];
  }
}

// Upload file directly into a specific folder in OneDrive
export async function uploadFileToOneDrive(
  folderId: string,
  fileName: string,
  buffer: Buffer,
  subfolderName?: string
) {
  const token = await getValidAccessToken();
  if (!token) throw new Error("OneDrive is not connected");

  let targetFolderId = folderId;

  // If subfolderName is specified, find its ID
  if (subfolderName) {
    const childrenRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (childrenRes.ok) {
      const data = await childrenRes.json();
      const match = data.value?.find((item: any) => item.name === subfolderName);
      if (match) targetFolderId = match.id;
    }
  }

  // Upload small/medium file (up to 4MB direct PUT)
  const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${targetFolderId}:/${encodeURIComponent(fileName)}:/content`;
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(buffer),
  });

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json();
    throw new Error(errorData.error?.message || "Failed to upload file to OneDrive");
  }

  return await uploadRes.json();
}
