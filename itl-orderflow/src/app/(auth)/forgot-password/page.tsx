"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const result = await requestPasswordReset(email);
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
              <h1 className="text-2xl font-bold">Восстановление пароля</h1>
              <p className="text-muted-foreground mt-2">
                Введите email, и мы отправим ссылку для сброса пароля
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <div className="bg-success/10 p-3 rounded-full">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Проверьте почту</h1>
              <p className="text-muted-foreground mt-2">
                Мы отправили ссылку для сброса пароля на{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {!isSuccess ? (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@itl.com"
                    className="pl-10 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? "Отправка..." : "Отправить ссылку"}
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
              <p className="text-sm text-center text-muted-foreground">
                Не получили письмо?{" "}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-primary font-medium hover:underline"
                >
                  Отправить повторно
                </button>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full h-12">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
