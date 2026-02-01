// Re-export Prisma types
export type {
  User,
  Client,
  ClientContact,
  Order,
  OrderStatus,
  Milestone,
  Task,
  TimeEntry,
  Invoice,
  InvoiceItem,
  Payment,
  File,
  Comment,
  Settings,
} from "@prisma/client";

// Enums
export { Role, Priority, TaskStatus, MilestoneStatus, InvoiceStatus } from "@prisma/client";

// Custom types
export interface OrderWithRelations {
  id: string;
  number: string;
  title: string;
  description: string | null;
  client: {
    id: string;
    name: string;
  };
  status: {
    id: string;
    name: string;
    color: string;
  };
  manager: {
    id: string;
    name: string | null;
  } | null;
  priority: string;
  deadline: Date | null;
  progressPercent: number;
  estimatedBudget: number | null;
  currency: string;
}

export interface ClientWithRelations {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  contacts: {
    id: string;
    firstName: string;
    lastName: string | null;
    position: string | null;
    isPrimary: boolean;
  }[];
  _count: {
    orders: number;
  };
}

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  estimatedHours: number | null;
  order: {
    id: string;
    title: string;
  };
  assignee: {
    id: string;
    name: string | null;
  } | null;
}

export interface TimeEntryWithRelations {
  id: string;
  date: Date;
  hours: number;
  description: string | null;
  isBillable: boolean;
  order: {
    id: string;
    title: string;
  };
  task: {
    id: string;
    title: string;
  } | null;
  user: {
    id: string;
    name: string | null;
  };
}

export interface InvoiceWithRelations {
  id: string;
  number: string;
  issueDate: Date;
  dueDate: Date | null;
  total: number;
  paidAmount: number;
  status: string;
  client: {
    id: string;
    name: string;
  };
  order: {
    id: string;
    title: string;
  } | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

// Form input types
export interface CreateClientInput {
  name: string;
  legalName?: string;
  inn?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  notes?: string;
}

export interface CreateOrderInput {
  clientId: string;
  title: string;
  description?: string;
  projectType?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline?: Date;
  estimatedHours?: number;
  estimatedBudget?: number;
  currency?: string;
  managerId?: string;
}

export interface CreateTaskInput {
  orderId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: Date;
  estimatedHours?: number;
}

export interface CreateTimeEntryInput {
  orderId: string;
  taskId?: string;
  date: Date;
  hours: number;
  description?: string;
  isBillable?: boolean;
}

export interface CreateInvoiceInput {
  clientId: string;
  orderId?: string;
  issueDate: Date;
  dueDate?: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}
