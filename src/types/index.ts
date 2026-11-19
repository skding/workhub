export type EnquiryStatus =
  | "NEW"
  | "CONCEPT_DESIGN"
  | "COSTING"
  | "QUOTED"
  | "WON"
  | "LOST";

export type EnquiryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type NoteType = "WHATSAPP" | "CALL" | "REQUIREMENT" | "GENERAL";

export type FileCategory = "INPUT" | "DESIGN" | "COSTING";

export interface Client {
  id: string;
  companyName: string;
  clientCode: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  industry: string | null;
  address: string | null;
  notes: string | null;
  enquiries?: Enquiry[];
  _count?: {
    enquiries: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  enquiryId: string;
  type: NoteType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revision {
  id: string;
  enquiryId: string;
  revCode: string;
  type: string;
  summary: string;
  totalAmount: number | null;
  dataJson?: string | null;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  enquiryId: string;
  category: FileCategory;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  fileUrl: string | null;
  oneDriveId?: string | null;
  source: string;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  enquiryId: string;
  task: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  code: string;
  title: string;
  clientId?: string | null;
  client?: Client | null;
  clientName: string;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  folderName: string;
  oneDriveFolderId?: string | null;
  oneDriveWebUrl?: string | null;
  estimatedBudget: number | null;
  targetDate: string | null;
  summary: string | null;
  notes: Note[];
  revisions: Revision[];
  files: FileAttachment[];
  todos: TodoItem[];
  createdAt: string;
  updatedAt: string;
}
