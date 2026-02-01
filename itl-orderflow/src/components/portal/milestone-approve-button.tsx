"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { approveMilestone, rejectMilestone } from "@/actions/portal";
import { toast } from "@/lib/use-toast";

interface MilestoneApproveButtonProps {
  clientId: string;
  milestoneId: string;
}

export function MilestoneApproveButton({
  clientId,
  milestoneId,
}: MilestoneApproveButtonProps) {
  const router = useRouter();
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  async function handleApprove() {
    setApproveLoading(true);
    try {
      const result = await approveMilestone(clientId, milestoneId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Этап согласован");
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setApproveLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectComment.trim()) {
      toast.error("Укажите причину отклонения");
      return;
    }
    setRejectLoading(true);
    try {
      const result = await rejectMilestone(clientId, milestoneId, rejectComment);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Этап отклонён, комментарий отправлен");
        setShowRejectDialog(false);
        setRejectComment("");
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setRejectLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={approveLoading || rejectLoading}
          onClick={handleApprove}
        >
          {approveLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ThumbsUp className="w-4 h-4" />
          )}
          Согласовать
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={approveLoading || rejectLoading}
          onClick={() => setShowRejectDialog(true)}
        >
          <ThumbsDown className="w-4 h-4" />
          Отклонить
        </Button>
      </div>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить этап</AlertDialogTitle>
            <AlertDialogDescription>
              Этап будет возвращён в работу. Укажите причину отклонения — команда получит ваш комментарий.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="reject-comment">Причина отклонения *</Label>
            <Textarea
              id="reject-comment"
              placeholder="Опишите, что нужно доработать..."
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectLoading}>Отмена</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLoading || !rejectComment.trim()}
            >
              {rejectLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ThumbsDown className="w-4 h-4 mr-2" />
              )}
              Отклонить этап
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
