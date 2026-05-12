import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const user = await getMyProfile();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Mi perfil</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          Gestiona tu información personal y seguridad de cuenta
        </p>
      </div>
      <ProfileClient user={user} />
    </div>
  );
}
