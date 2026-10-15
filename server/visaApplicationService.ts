import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const STORAGE_BUCKET = "visa-documents";
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export const visaServices = {
  arrival: { name: "Visa on Arrival", price: 300 },
  "emergency-entry": { name: "Emergency Entry Visa (EEV)", price: 300 },
  "portal-eev": { name: "eVisa Portal EEV", price: 260 },
  priority: { name: "Priority eVisa", price: 338 },
  express: { name: "Express eVisa", price: 442 },
} as const;

export const visaDocumentDefinitions = {
  applicationLetter: {
    label: "Application Letter",
    extensions: [".pdf", ".doc", ".docx"],
  },
  passportBiodata: {
    label: "Passport Biodata Page",
    extensions: [".pdf", ".jpg", ".jpeg", ".png"],
  },
  signatoryId: {
    label: "Signatory’s Identification",
    extensions: [".pdf", ".jpg", ".jpeg", ".png"],
  },
  companyRegistration: {
    label: "Invitee Company Registration Documents",
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
  },
  yellowFever: {
    label: "Yellow Fever Vaccination Card",
    extensions: [".pdf", ".jpg", ".jpeg", ".png"],
  },
  passportPhoto: {
    label: "Passport-Size Photograph",
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
  travelItinerary: {
    label: "Travel Itinerary / Flight Details",
    extensions: [".pdf", ".jpg", ".jpeg", ".png"],
  },
} as const;

export type VisaDocumentKey = keyof typeof visaDocumentDefinitions;
export type ApplicationStatus = "Drafted" | "Documents Verified" | "Ready for Upload";

export type CreateApplicationInput = {
  applicantFullName: string;
  nationality: string;
  passportNumber: string;
  serviceId: string;
};

export type SignDocumentInput = {
  applicationId: string;
  documentKey: string;
  originalFilename: string;
  mimeType?: string;
  fileSizeBytes: number;
};

export type CompleteDocumentInput = SignDocumentInput & {
  storagePath: string;
};

type SupabaseAdmin = SupabaseClient;

function getSupabaseAdmin(): SupabaseAdmin {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function requiredText(value: unknown, field: string, maxLength = 320): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${field} is too long.`);
  }
  return normalized;
}

function safeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
  return normalized || "document";
}

function extensionOf(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.slice(lastDot).toLowerCase();
}

function contentTypeFor(filename: string, provided?: string): string {
  if (provided?.trim()) return provided.trim().toLowerCase();
  const extension = extensionOf(filename);
  const byExtension: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return byExtension[extension] ?? "application/octet-stream";
}

function validateDocumentInput(input: SignDocumentInput | CompleteDocumentInput) {
  const documentKey = requiredText(input.documentKey, "documentKey", 80) as VisaDocumentKey;
  const definition = visaDocumentDefinitions[documentKey];
  if (!definition) throw new Error("This document type is not supported.");

  const originalFilename = requiredText(input.originalFilename, "originalFilename", 240);
  const extension = extensionOf(originalFilename);
  if (!definition.extensions.includes(extension as never)) {
    throw new Error(`${definition.label} has an unsupported file format.`);
  }
  if (!Number.isInteger(input.fileSizeBytes) || input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_DOCUMENT_SIZE) {
    throw new Error(`${definition.label} must be smaller than 10 MB.`);
  }

  return {
    documentKey,
    definition,
    originalFilename,
    mimeType: contentTypeFor(originalFilename, input.mimeType),
    fileSizeBytes: input.fileSizeBytes,
  };
}

export function validateCreateApplicationInput(raw: unknown): CreateApplicationInput {
  if (!raw || typeof raw !== "object") throw new Error("Application payload is required.");
  const input = raw as Record<string, unknown>;
  const serviceId = requiredText(input.serviceId, "serviceId", 80) as keyof typeof visaServices;
  const service = visaServices[serviceId];
  if (!service) throw new Error("Choose a valid visa service.");

  return {
    applicantFullName: requiredText(input.applicantFullName, "applicantFullName"),
    nationality: requiredText(input.nationality, "nationality"),
    passportNumber: requiredText(input.passportNumber, "passportNumber", 80),
    serviceId,
  };
}

export async function createVisaApplication(raw: unknown) {
  const input = validateCreateApplicationInput(raw);
  const supabase = getSupabaseAdmin();
  const service = visaServices[input.serviceId as keyof typeof visaServices];
  const referenceNumber = `IDG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;

  const { data, error } = await supabase
    .from("visa_applications")
    .insert({
      reference_number: referenceNumber,
      applicant_full_name: input.applicantFullName,
      nationality: input.nationality,
      passport_number: input.passportNumber,
      service_id: input.serviceId,
      service_name: service.name,
      fee_usd: service.price,
      prepared_by: "Online applicant",
      submission_date: new Date().toISOString().slice(0, 10),
      status: "Drafted",
    })
    .select("id, reference_number")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create the visa application.");
  }

  return { applicationId: data.id as string, referenceNumber: data.reference_number as string };
}

export async function createSignedDocumentUpload(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new Error("Document payload is required.");
  const input = raw as SignDocumentInput;
  const applicationId = requiredText(input.applicationId, "applicationId", 80);
  const validated = validateDocumentInput(input);
  const supabase = getSupabaseAdmin();
  const storagePath = `applications/${applicationId}/${validated.documentKey}-${Date.now()}-${safeFilename(validated.originalFilename)}`;

  const { data: application, error: applicationError } = await supabase
    .from("visa_applications")
    .select("id")
    .eq("id", applicationId)
    .maybeSingle();
  if (applicationError || !application) throw new Error("The application could not be found.");

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });
  if (error || !data) {
    throw new Error(error?.message || "Could not create a signed upload URL.");
  }

  return {
    applicationId,
    documentKey: validated.documentKey,
    documentLabel: validated.definition.label,
    originalFilename: validated.originalFilename,
    mimeType: validated.mimeType,
    fileSizeBytes: validated.fileSizeBytes,
    storagePath,
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

export async function completeVisaDocument(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new Error("Document completion payload is required.");
  const input = raw as CompleteDocumentInput;
  const applicationId = requiredText(input.applicationId, "applicationId", 80);
  const storagePath = requiredText(input.storagePath, "storagePath", 500);
  const validated = validateDocumentInput(input);
  if (!storagePath.startsWith(`applications/${applicationId}/`)) {
    throw new Error("The document path does not belong to this application.");
  }

  const supabase = getSupabaseAdmin();
  const pathParts = storagePath.split("/");
  const folder = pathParts.slice(0, -1).join("/");
  const filename = pathParts.at(-1);
  const { data: storedFiles, error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, { search: filename });
  if (storageError || !storedFiles?.some((file) => file.name === filename)) {
    throw new Error("The uploaded document could not be verified in secure storage.");
  }

  const { data, error } = await supabase
    .from("visa_application_documents")
    .upsert(
      {
        application_id: applicationId,
        document_key: validated.documentKey,
        document_label: validated.definition.label,
        storage_bucket: STORAGE_BUCKET,
        storage_path: storagePath,
        original_filename: validated.originalFilename,
        mime_type: validated.mimeType,
        file_size_bytes: validated.fileSizeBytes,
      },
      { onConflict: "application_id,document_key" },
    )
    .select("id, document_key")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not save the document record.");
  }

  return { documentId: data.id as string, documentKey: data.document_key as string };
}
