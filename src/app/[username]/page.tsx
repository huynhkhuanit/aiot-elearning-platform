import { notFound } from "next/navigation";
import { normalizeUsername } from "@/lib/profile-url";
import UserProfileContent from "@/components/profile/UserProfileContent";

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
        notFound();
    }

    return <UserProfileContent username={normalizedUsername} />;
}
