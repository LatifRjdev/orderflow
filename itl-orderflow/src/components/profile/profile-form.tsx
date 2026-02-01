"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Save } from "lucide-react";
import { updateProfile } from "@/actions/users";
import { getInitials } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-helpers";

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  DEVELOPER: "Разработчик",
  VIEWER: "Наблюдатель",
};

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    createdAt: Date;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name || "");
  const [imageUrl, setImageUrl] = useState(user.image || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("avatarUpload", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setImageUrl(res[0].url);
      }
      setIsUploading(false);
    },
    onUploadError: (err) => {
      setError(err.message || "Ошибка загрузки файла");
      setIsUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    await startUpload([file]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    startTransition(async () => {
      const result = await updateProfile({
        name,
        image: imageUrl || null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  const initials = getInitials(name || user.email);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Личные данные</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
                <AvatarFallback className="bg-primary text-white text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium">Фото профиля</p>
              <p className="text-xs text-muted-foreground">JPG, PNG до 4 МБ</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="bg-muted" />
          </div>

          {/* Role (read-only) */}
          <div className="space-y-2">
            <Label>Роль</Label>
            <div>
              <Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Профиль обновлён</p>}

          <Button type="submit" disabled={isPending || isUploading}>
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Сохранить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
