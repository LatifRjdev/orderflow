"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { changePassword } from "@/actions/users";

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (newPassword.length < 6) {
      setError("Новый пароль должен быть не менее 6 символов");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Смена пароля</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Текущий пароль</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Введите текущий пароль"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Новый пароль</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите новый пароль"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Пароль изменён</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4 mr-2" />
            )}
            Изменить пароль
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
