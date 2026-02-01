"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FolderKanban, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { resetPassword } from "@/actions/auth";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(token, password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsSuccess(true);
    }
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center p-4">
      <Card className="w-full max-w-[450px]">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <FolderKanban className="w-8 h-8 text-primary" />
            </div>
          </div>
          {!isSuccess ? (
            <>
              <h1 className="text-2xl font-bold">Новый пароль</h1>
              <p className="text-muted-foreground mt-2">
                Введите новый пароль для вашей учётной записи
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <div className="bg-green-50 p-3 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Пароль изменён</h1>
              <p className="text-muted-foreground mt-2">
                Ваш пароль успешно обновлён. Теперь вы можете войти с новым паролем.
              </p>
            </>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {!isSuccess ? (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Новый пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Минимум 6 символов"
                    className="pl-10 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Повторите пароль"
                    className="pl-10 h-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить пароль"}
              </Button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Вернуться к входу
              </Link>
            </form>
          ) : (
            <div className="space-y-4">
              <Link href="/login">
                <Button className="w-full h-12">
                  Войти в систему
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
