import { notFound, redirect } from "next/navigation";
import { getCanonicalProfilePath, normalizeUsername } from "@/lib/profile-url";

export default async function LegacyUserProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
        notFound();
    }

    redirect(getCanonicalProfilePath(normalizedUsername));
}
