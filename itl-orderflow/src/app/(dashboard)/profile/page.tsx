import { getCurrentUser } from "@/actions/users";
import { ProfileForm } from "@/components/profile/profile-form";
import { PasswordForm } from "@/components/profile/password-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Профиль</h1>
        <p className="text-muted-foreground">Управление личными данными</p>
      </div>

      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}
