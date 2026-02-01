"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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
import { respondToProposal } from "@/actions/portal";
import { toast } from "@/lib/use-toast";

interface ProposalResponseButtonsProps {
  clientId: string;
  proposalId: string;
}

export function ProposalResponseButtons({
  clientId,
  proposalId,
}: ProposalResponseButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  async function handleAccept() {
    setLoading("ACCEPTED");
    try {
      const result = await respondToProposal(clientId, proposalId, "ACCEPTED");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Предложение принято");
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("REJECTED");
    try {
      const result = await respondToProposal(clientId, proposalId, "REJECTED");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Предложение отклонено");
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(null);
      setRejectOpen(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => setRejectOpen(true)}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Отклонить
        </Button>
        <Button
          size="sm"
          disabled={loading !== null}
          onClick={handleAccept}
        >
          {loading === "ACCEPTED" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Принять предложение
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить предложение?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите отклонить это коммерческое предложение?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={loading === "REJECTED"}
              onClick={handleReject}
            >
              {loading === "REJECTED" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
