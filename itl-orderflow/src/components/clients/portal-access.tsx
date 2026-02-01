"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Globe,
  Key,
  Copy,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { generatePortalToken } from "@/actions/portal";

interface PortalAccessProps {
  clientId: string;
  portalToken: string | null;
  portalEnabled: boolean;
}

export function PortalAccess({ clientId, portalToken, portalEnabled }: PortalAccessProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"token" | "link" | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);

  const token = newToken || portalToken;
  const portalLoginUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal/login`
    : "/portal/login";

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generatePortalToken(clientId);
      if (result.success && result.token) {
        setNewToken(result.token);
      } else if (result.error) {
        alert(result.error);
      }
      router.refresh();
    });
  };

  const handleCopy = (text: string, type: "token" | "link") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Доступ в портал
          {token ? (
            <Badge className="bg-green-100 text-green-700 ml-2">Активен</Badge>
          ) : (
            <Badge variant="secondary" className="ml-2">Не настроен</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {token ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Токен доступа</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={token}
                  className="font-mono text-xs bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => handleCopy(token, "token")}
                >
                  {copied === "token" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ссылка на портал</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={portalLoginUrl}
                  className="text-xs bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => handleCopy(portalLoginUrl, "link")}
                >
                  {copied === "link" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground">
              <p>Отправьте клиенту ссылку на портал и токен. Клиент вводит токен на странице входа для получения доступа.</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Перегенерировать токен
            </Button>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Key className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Портал не подключён</p>
              <p className="text-xs text-muted-foreground mt-1">
                Сгенерируйте токен, чтобы клиент мог войти в портал
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isPending}
              size="sm"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Сгенерировать токен
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
