"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updateProposalStatus, deleteProposal } from "@/actions/proposals";
import { toast } from "@/lib/use-toast";

interface ProposalActionsProps {
  proposalId: string;
  status: string;
  userRole?: string;
}

export function ProposalActions({ proposalId, status, userRole }: ProposalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setLoading(newStatus);
    try {
      const result = await updateProposalStatus(proposalId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          newStatus === "SENT"
            ? "КП отправлено клиенту"
            : newStatus === "ACCEPTED"
            ? "КП отмечено как принятое"
            : "КП отмечено как отклонённое"
        );
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    setLoading("DELETE");
    try {
      const result = await deleteProposal(proposalId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("КП удалено");
        router.push("/proposals");
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(null);
      setDeleteOpen(false);
    }
  }

  function handleDownloadPdf() {
    window.open(`/proposals/${proposalId}/print`, "_blank");
  }

  return (
    <div className="space-y-2">
      {status === "DRAFT" && (
        <Button
          variant="outline"
          className="w-full justify-start"
          size="sm"
          disabled={loading === "SENT"}
          onClick={() => handleStatusChange("SENT")}
        >
          {loading === "SENT" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Отправить клиенту
        </Button>
      )}
      {(status === "SENT" || status === "VIEWED") && (
        <>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            disabled={loading === "ACCEPTED"}
            onClick={() => handleStatusChange("ACCEPTED")}
          >
            {loading === "ACCEPTED" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Отметить как принято
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            disabled={loading === "REJECTED"}
            onClick={() => handleStatusChange("REJECTED")}
          >
            {loading === "REJECTED" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Отметить как отклонено
          </Button>
        </>
      )}
      <Button
        variant="outline"
        className="w-full justify-start"
        size="sm"
        onClick={handleDownloadPdf}
      >
        <FileText className="w-4 h-4 mr-2" />
        Скачать PDF
      </Button>
      {userRole === "ADMIN" && (
        <>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive"
            size="sm"
            disabled={loading === "DELETE"}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить КП
          </Button>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Удалить коммерческое предложение?</DialogTitle>
                <DialogDescription>
                  Это действие нельзя отменить. КП и все его разделы будут удалены навсегда.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Отмена</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={loading === "DELETE"}
                  onClick={handleDelete}
                >
                  {loading === "DELETE" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Удалить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

export function ProposalSendButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const result = await updateProposalStatus(proposalId, "SENT");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("КП отправлено клиенту");
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" disabled={loading} onClick={handleSend}>
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Send className="w-4 h-4 mr-2" />
      )}
      Отправить клиенту
    </Button>
  );
}
