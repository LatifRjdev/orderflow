"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import { TaskStatus } from "@prisma/client";

// ==================== Parser (can also be used client-side) ====================

export interface ParsedTask {
  number: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  rawStatus: string;
}

export interface ParsedSubsection {
  title: string;
  tasks: ParsedTask[];
}

export interface ParsedPhase {
  title: string;
  subsections: ParsedSubsection[];
}

const STATUS_MAP: Record<string, ParsedTask["status"]> = {
  "[ ]": "TODO",
  "[~]": "IN_PROGRESS",
  "[x]": "DONE",
  "[!]": "TODO",
  "[-]": "CANCELLED",
};

export async function parseProgressFile(text: string): Promise<ParsedPhase[]> {
  const lines = text.split("\n");
  const phases: ParsedPhase[] = [];
  let currentPhase: ParsedPhase | null = null;
  let currentSubsection: ParsedSubsection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match PHASE lines: "PHASE 0: PLANNING & DESIGN" or similar
    const phaseMatch = trimmed.match(/^PHASE\s+(\d+)\s*[:\-—]\s*(.+)$/i);
    if (phaseMatch) {
      currentPhase = {
        title: `Phase ${phaseMatch[1]}: ${phaseMatch[2].trim()}`,
        subsections: [],
      };
      phases.push(currentPhase);
      currentSubsection = null;
      continue;
    }

    // Match subsection lines: "--- 1A: Project Setup ---" or "--- Title ---"
    const subsectionMatch = trimmed.match(/^---\s+(.+?)\s+---$/);
    if (subsectionMatch && currentPhase) {
      currentSubsection = {
        title: subsectionMatch[1].trim(),
        tasks: [],
      };
      currentPhase.subsections.push(currentSubsection);
      continue;
    }

    // Match task lines: "[x] 1.1  Description here"
    const taskMatch = trimmed.match(/^\[([ x~!\-])\]\s+(\d+\.\d+[a-z]?)\s+(.+)$/);
    if (taskMatch && currentPhase) {
      const rawStatus = `[${taskMatch[1]}]`;
      const task: ParsedTask = {
        number: taskMatch[2],
        title: taskMatch[3].trim(),
        status: STATUS_MAP[rawStatus] || "TODO",
        rawStatus,
      };

      if (currentSubsection) {
        currentSubsection.tasks.push(task);
      } else {
        // Task without subsection — create default subsection
        if (currentPhase.subsections.length === 0) {
          currentSubsection = { title: currentPhase.title, tasks: [] };
          currentPhase.subsections.push(currentSubsection);
        }
        currentPhase.subsections[0].tasks.push(task);
      }
      continue;
    }
  }

  return phases;
}

// ==================== Import server action ====================

interface ImportTask {
  title: string;
  status: string;
  phase: string;
  subsection?: string;
}

export async function importTasks(
  orderId: string,
  tasks: ImportTask[]
): Promise<{ success: true; created: number } | { error: string }> {
  await requireAuth();

  if (!orderId || tasks.length === 0) {
    return { error: "Выберите заказ и задачи для импорта" };
  }

  try {
    // Group tasks by phase → subsection
    const groups = new Map<string, ImportTask[]>();
    for (const task of tasks) {
      const key = task.subsection || task.phase;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }

    // Get existing milestones for this order
    const existingMilestones = await prisma.milestone.findMany({
      where: { orderId },
      select: { id: true, title: true },
    });
    const milestoneMap = new Map(existingMilestones.map((m) => [m.title, m.id]));

    // Get max position of existing tasks
    const lastTask = await prisma.task.findFirst({
      where: { orderId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    let position = (lastTask?.position ?? -1) + 1;

    // Get max milestone position
    const lastMilestone = await prisma.milestone.findFirst({
      where: { orderId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    let milestonePosition = (lastMilestone?.position ?? -1) + 1;

    let created = 0;

    const groupEntries = Array.from(groups.entries());
    for (const [groupTitle, groupTasks] of groupEntries) {
      // Create or find milestone
      let milestoneId = milestoneMap.get(groupTitle);
      if (!milestoneId) {
        const milestone = await prisma.milestone.create({
          data: {
            orderId,
            title: groupTitle,
            position: milestonePosition++,
          },
        });
        milestoneId = milestone.id;
        milestoneMap.set(groupTitle, milestoneId);
      }

      // Create tasks
      for (const task of groupTasks) {
        await prisma.task.create({
          data: {
            orderId,
            milestoneId,
            title: task.title,
            status: task.status as TaskStatus,
            priority: "MEDIUM",
            position: position++,
          },
        });
        created++;
      }
    }

    revalidatePath("/tasks");
    revalidatePath(`/orders/${orderId}`);
    return { success: true, created };
  } catch (error) {
    console.error("Error importing tasks:", error);
    return { error: "Ошибка при импорте задач" };
  }
}
