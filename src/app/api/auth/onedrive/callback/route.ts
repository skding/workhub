import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/onedrive";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (error) {
      console.error("Microsoft OAuth error:", error, errorDescription);
      return NextResponse.redirect(`${appUrl}/?onedrive=error&msg=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/?onedrive=error&msg=No_code_provided`);
    }

    await exchangeCodeForTokens(code);

    return NextResponse.redirect(`${appUrl}/?onedrive=success`);
  } catch (error: any) {
    console.error("OneDrive callback error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/?onedrive=error&msg=${encodeURIComponent(error.message || "Failed to exchange token")}`
    );
  }
}
