"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Loader2, RefreshCw, Key } from "lucide-react";
import {
  generateContactPortalToken,
  updateContactPortalPermissions,
  revokeContactPortalAccess,
} from "@/actions/portal";
import { PORTAL_SECTIONS, PortalPermissionKey } from "@/lib/portal-permissions";
import { toast } from "@/lib/use-toast";

interface ContactPortalAccessProps {
  clientId: string;
  contact: {
    id: string;
    portalEnabled: boolean;
    portalToken: string | null;
    canViewProjects: boolean;
    canViewProposals: boolean;
    canViewFinance: boolean;
    canViewDocuments: boolean;
    canViewTickets: boolean;
  };
}

type Permissions = Record<PortalPermissionKey, boolean>;

export function ContactPortalAccess({ clientId, contact }: ContactPortalAccessProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"token" | "link" | null>(null);
  const [token, setToken] = useState(contact.portalToken);
  const [enabled, setEnabled] = useState(contact.portalEnabled);
  const [permissions, setPermissions] = useState<Permissions>({
    canViewProjects: contact.canViewProjects,
    canViewProposals: contact.canViewProposals,
    canViewFinance: contact.canViewFinance,
    canViewDocuments: contact.canViewDocuments,
    canViewTickets: contact.canViewTickets,
  });

  const portalLoginUrl =
    typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "/portal/login";

  function savePermissions(
    next: Permissions,
    nextEnabled: boolean,
    previous: Permissions,
    previousEnabled: boolean
  ) {
    startTransition(async () => {
      const result = await updateContactPortalPermissions(contact.id, clientId, {
        portalEnabled: nextEnabled,
        ...next,
      });
      if (result.error) {
        toast.error(result.error);
        setPermissions(previous);
        setEnabled(previousEnabled);
      } else {
        router.refresh();
      }
    });
  }

  function toggleEnabled() {
    const previousEnabled = enabled;
    const next = !enabled;
    setEnabled(next);
    savePermissions(permissions, next, permissions, previousEnabled);
  }

  function togglePermission(key: PortalPermissionKey) {
    const previousPermissions = permissions;
    const next = { ...permissions, [key]: !permissions[key] };
    setPermissions(next);
    savePermissions(next, enabled, previousPermissions, enabled);
  }

  function grantFullAccess() {
    const previousPermissions = permissions;
    const previousEnabled = enabled;
    const next = Object.fromEntries(
      PORTAL_SECTIONS.map((s) => [s.key, true])
    ) as Permissions;
    setPermissions(next);
    setEnabled(true);
    savePermissions(next, true, previousPermissions, previousEnabled);
  }

  function handleGenerateToken() {
    startTransition(async () => {
      const result = await generateContactPortalToken(contact.id, clientId);
      if (result.success && result.token) {
        setToken(result.token);
      } else if (result.error) {
        toast.error(result.error);
      }
      router.refresh();
    });
  }

  function handleRevoke() {
    const previousEnabled = enabled;
    setEnabled(false);
    startTransition(async () => {
      const result = await revokeContactPortalAccess(contact.id, clientId);
      if (result.error) {
        toast.error(result.error);
        setEnabled(previousEnabled);
      } else {
        router.refresh();
      }
    });
  }

  function handleCopy(text: string, type: "token" | "link") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#dbdfe6] space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
          <Checkbox checked={enabled} onCheckedChange={toggleEnabled} disabled={isPending} />
          Доступ в портал
          {enabled && <Badge className="bg-green-100 text-green-700">Включён</Badge>}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={grantFullAccess} disabled={isPending}>
          Полный доступ
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PORTAL_SECTIONS.map((section) => (
          <label key={section.key} className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox
              checked={permissions[section.key]}
              onCheckedChange={() => togglePermission(section.key)}
              disabled={isPending}
            />
            {section.label}
          </label>
        ))}
      </div>

      {token ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={token} className="font-mono text-xs bg-gray-50" />
            <Button variant="outline" size="icon" className="flex-shrink-0" onClick={() => handleCopy(token, "token")}>
              {copied === "token" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input readOnly value={portalLoginUrl} className="text-xs bg-gray-50" />
            <Button variant="outline" size="icon" className="flex-shrink-0" onClick={() => handleCopy(portalLoginUrl, "link")}>
              {copied === "link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateToken} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Перегенерировать токен
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRevoke}
              disabled={isPending}
            >
              Отозвать доступ
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={handleGenerateToken} disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
          Сгенерировать токен
        </Button>
      )}
    </div>
  );
}
