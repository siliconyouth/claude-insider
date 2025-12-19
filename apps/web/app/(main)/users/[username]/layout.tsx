/**
 * Public Profile Layout
 *
 * Server component that generates dynamic OpenGraph metadata for user profiles.
 * This enables rich social sharing previews when profile links are shared.
 */

import { Metadata } from "next";
import { pool } from "@/lib/db";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  try {
    // Fetch minimal user data for metadata
    const result = await pool.query(
      `SELECT
        u.name,
        u.image as avatar,
        p.bio,
        p.location,
        u.followers_count,
        u.achievement_points
      FROM "user" u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return {
        title: "User Not Found",
        description: "This user profile could not be found.",
      };
    }

    const user = result.rows[0];
    const name = user.name || username;
    const bio = user.bio || `Check out ${name}'s profile on Claude Insider`;

    // Build OG image URL with profile data
    const ogImageParams = new URLSearchParams({
      name,
      username,
      ...(user.bio && { bio: user.bio.slice(0, 100) }),
      ...(user.avatar && { avatar: user.avatar }),
      ...(user.location && { location: user.location }),
      ...(user.followers_count && { followers: String(user.followers_count) }),
      ...(user.achievement_points && { points: String(user.achievement_points) }),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.claudeinsider.com";

    return {
      title: `${name} (@${username})`,
      description: bio,
      openGraph: {
        title: `${name} (@${username}) | Claude Insider`,
        description: bio,
        url: `${baseUrl}/users/${username}`,
        type: "profile",
        images: [
          {
            url: `${baseUrl}/api/og/profile?${ogImageParams.toString()}`,
            width: 1200,
            height: 630,
            alt: `${name}'s profile`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} (@${username})`,
        description: bio,
        images: [`${baseUrl}/api/og/profile?${ogImageParams.toString()}`],
      },
    };
  } catch (error) {
    console.error("Error generating profile metadata:", error);
    return {
      title: `@${username} | Claude Insider`,
      description: "View this profile on Claude Insider",
    };
  }
}

export default async function PublicProfileLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
