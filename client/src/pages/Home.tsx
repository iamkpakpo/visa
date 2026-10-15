import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Info,
  LockKeyhole,
  Plane,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type StepId = 1 | 2 | 3 | 4;
type Applicant = {
  fullName: string;
  nationality: string;
  passportNumber: string;
};

type UploadedDocument = {
  file: File;
  progress: number;
  previewUrl?: string;
};

type DocumentKey =
  | "applicationLetter"
  | "passportBiodata"
  | "signatoryId"
  | "companyRegistration"
  | "yellowFever"
  | "passportPhoto"
  | "travelItinerary";

type Service = {
  id: string;
  name: string;
  group: string;
  description: string;
  turnaround: string;
  price: number;
  featured?: boolean;
};

const steps = [
  { id: 1 as StepId, label: "Applicant", eyebrow: "01", icon: UserRound },
  { id: 2 as StepId, label: "Documents", eyebrow: "02", icon: FileText },
  { id: 3 as StepId, label: "Visa service", eyebrow: "03", icon: Plane },
  { id: 4 as StepId, label: "Review", eyebrow: "04", icon: FileCheck2 },
];

const services: Service[] = [
  {
    id: "arrival",
    name: "Visa on Arrival",
    group: "Standard visa option",
    description: "Single entry, arranged for arrival in Ghana.",
    turnaround: "Single entry",
    price: 300,
  },
  {
    id: "emergency-entry",
    name: "Emergency Entry Visa (EEV)",
    group: "Standard visa option",
    description: "Emergency visa processing for urgent travel plans.",
    turnaround: "Urgent processing",
    price: 300,
  },
  {
    id: "portal-eev",
    name: "eVisa Portal EEV",
    group: "eVisa portal option",
    description: "Emergency entry visa fee through the eVisa portal.",
    turnaround: "Portal processing",
    price: 260,
  },
  {
    id: "priority",
    name: "Priority eVisa",
    group: "eVisa portal option",
    description: "Accelerated eVisa route for a considered travel timeline.",
    turnaround: "48-hour turnaround",
    price: 338,
    featured: true,
  },
  {
    id: "express",
    name: "Express eVisa",
    group: "eVisa portal option",
    description: "Fastest available eVisa route for time-sensitive travel.",
    turnaround: "5-hour turnaround",
    price: 442,
    featured: true,
  },
];

const documentDefinitions: Array<{
  key: DocumentKey;
  label: string;
  helper: string;
  accept: string;
  kind: "document" | "image";
}> = [
  {
    key: "applicationLetter",
    label: "Application Letter",
    helper: "Drafted on behalf of the applicant",
    accept: ".pdf,.doc,.docx",
    kind: "document",
  },
  {
    key: "passportBiodata",
    label: "Passport Biodata Page",
    helper: "Clear, legible scan of the photo page",
    accept: ".pdf,.jpg,.jpeg,.png",
    kind: "image",
  },
  {
    key: "signatoryId",
    label: "Signatory’s Identification",
    helper: "Passport copy or Ghana Card copy",
    accept: ".pdf,.jpg,.jpeg,.png",
    kind: "image",
  },
  {
    key: "companyRegistration",
    label: "Invitee Company Registration Documents",
    helper: "Company registration and supporting pages",
    accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    kind: "document",
  },
  {
    key: "yellowFever",
    label: "Yellow Fever Vaccination Card",
    helper: "Valid vaccination card or certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
    kind: "image",
  },
  {
    key: "passportPhoto",
    label: "Passport-Size Photograph",
    helper: "Recent color photo, portrait orientation",
    accept: ".jpg,.jpeg,.png,.webp",
    kind: "image",
  },
  {
    key: "travelItinerary",
    label: "Travel Itinerary / Flight Details",
    helper: "Booking confirmation or flight itinerary",
    accept: ".pdf,.jpg,.jpeg,.png",
    kind: "document",
  },
];

const initialDocuments = {} as Record<DocumentKey, UploadedDocument | null>;
documentDefinitions.forEach(({ key }) => {
  initialDocuments[key] = null;
});

const initialApplicant: Applicant = {
  fullName: "",
  nationality: "",
  passportNumber: "",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
  const [activeStep, setActiveStep] = useState<StepId>(1);
  const [applicant, setApplicant] = useState<Applicant>(initialApplicant);
  const [documents, setDocuments] = useState<Record<DocumentKey, UploadedDocument | null>>(initialDocuments);
  const [serviceId, setServiceId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [persistedReference, setPersistedReference] = useState("");
  const uploadTimers = useRef<number[]>([]);

  useEffect(() => {
    return () => uploadTimers.current.forEach((timer) => window.clearInterval(timer));
  }, []);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId],
  );

  const uploadedCount = Object.values(documents).filter(Boolean).length;
  const formCompletion = Math.round(((activeStep - 1) / (steps.length - 1)) * 100);
  const draftReferenceNumber = useMemo(() => {
    const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    return `IDG-${stamp}-2481`;
  }, []);
  const referenceNumber = persistedReference || draftReferenceNumber;

  const updateApplicant = (field: keyof Applicant, value: string) => {
    setApplicant((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateStep = (step: StepId) => {
    const nextErrors: Record<string, string> = {};
    if (step === 1) {
      if (!applicant.fullName.trim()) nextErrors.fullName = "Add the applicant’s full name.";
      if (!applicant.nationality.trim()) nextErrors.nationality = "Add the applicant’s nationality.";
      if (!applicant.passportNumber.trim()) nextErrors.passportNumber = "Add a passport number.";
    }
    if (step === 2) {
      documentDefinitions.forEach(({ key }) => {
        if (!documents[key] || documents[key]?.progress !== 100) {
          nextErrors[key] = "Upload this document before continuing.";
        }
      });
    }
    if (step === 3 && !serviceId) nextErrors.service = "Choose the visa or eVisa service you need.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToStep = (step: StepId) => {
    if (step < activeStep) {
      setActiveStep(step);
      return;
    }
    if (step === activeStep || validateStep(activeStep)) {
      setActiveStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goNext = () => {
    if (activeStep < 4 && validateStep(activeStep)) {
      setActiveStep((current) => (current + 1) as StepId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (activeStep > 1) {
      setActiveStep((current) => (current - 1) as StepId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFileChange = (key: DocumentKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const definition = documentDefinitions.find((item) => item.key === key);
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const acceptedExtensions = definition?.accept.split(",") ?? [];
    if (!acceptedExtensions.includes(fileExtension)) {
      setErrors((current) => ({ ...current, [key]: "Use one of the accepted file formats shown on this card." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((current) => ({ ...current, [key]: "Keep each file below 10 MB." }));
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setErrors((current) => ({ ...current, [key]: "" }));
    setUploadMessage(`${file.name} is being prepared securely in your browser.`);
    setDocuments((current) => ({ ...current, [key]: { file, progress: 8, previewUrl } }));

    const timer = window.setInterval(() => {
      setDocuments((current) => {
        const currentUpload = current[key];
        if (!currentUpload) return current;
        const nextProgress = Math.min(currentUpload.progress + 18, 100);
        if (nextProgress === 100) {
          window.clearInterval(timer);
          setUploadMessage("");
        }
        return { ...current, [key]: { ...currentUpload, progress: nextProgress } };
      });
    }, 120);
    uploadTimers.current.push(timer);
  };

  const removeDocument = (key: DocumentKey) => {
    const current = documents[key];
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    setDocuments((all) => ({ ...all, [key]: null }));
    setErrors((all) => ({ ...all, [key]: "" }));
  };

  const submitApplication = async () => {
    const firstInvalidStep = ([1, 2, 3] as StepId[]).find((step) => {
      if (step === 1) return !applicant.fullName.trim() || !applicant.nationality.trim() || !applicant.passportNumber.trim();
      if (step === 2) return documentDefinitions.some(({ key }) => !documents[key] || documents[key]?.progress !== 100);
      if (step === 3) return !serviceId;
      return false;
    });
    if (firstInvalidStep) {
      validateStep(firstInvalidStep);
      setActiveStep(firstInvalidStep ?? 4);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");
    setUploadMessage("Creating your secure application record…");

    try {
      const applicationResponse = await fetch("/api/visa-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantFullName: applicant.fullName,
          nationality: applicant.nationality,
          passportNumber: applicant.passportNumber,
          serviceId,
        }),
      });
      const applicationPayload = await applicationResponse.json() as { ok?: boolean; error?: string; applicationId?: string; referenceNumber?: string };
      if (!applicationResponse.ok || !applicationPayload.ok || !applicationPayload.applicationId) {
        throw new Error(applicationPayload.error || "We could not create the application record.");
      }

      setPersistedReference(applicationPayload.referenceNumber || draftReferenceNumber);
      const applicationId = applicationPayload.applicationId;
      for (const definition of documentDefinitions) {
        const uploaded = documents[definition.key];
        if (!uploaded) throw new Error(`${definition.label} is missing.`);
        setUploadMessage(`Securing ${definition.label.toLowerCase()}…`);

        const signResponse = await fetch("/api/visa-documents/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId,
            documentKey: definition.key,
            originalFilename: uploaded.file.name,
            mimeType: uploaded.file.type,
            fileSizeBytes: uploaded.file.size,
          }),
        });
        const signPayload = await signResponse.json() as { ok?: boolean; error?: string; signedUrl?: string; token?: string; storagePath?: string };
        if (!signResponse.ok || !signPayload.ok || !signPayload.signedUrl || !signPayload.token || !signPayload.storagePath) {
          throw new Error(signPayload.error || `We could not prepare ${definition.label.toLowerCase()}.`);
        }

        const uploadResponse = await fetch(signPayload.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": uploaded.file.type || "application/octet-stream" },
          body: uploaded.file,
        });
        if (!uploadResponse.ok) {
          throw new Error(`We could not upload ${definition.label.toLowerCase()}. Please try again.`);
        }

        const completeResponse = await fetch("/api/visa-documents/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId,
            documentKey: definition.key,
            originalFilename: uploaded.file.name,
            mimeType: uploaded.file.type,
            fileSizeBytes: uploaded.file.size,
            storagePath: signPayload.storagePath,
          }),
        });
        const completePayload = await completeResponse.json() as { ok?: boolean; error?: string };
        if (!completeResponse.ok || !completePayload.ok) {
          throw new Error(completePayload.error || `We could not save ${definition.label.toLowerCase()} metadata.`);
        }
      }

      setUploadMessage("");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "We could not submit this application.");
      setUploadMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetApplication = () => {
    setApplicant(initialApplicant);
    setDocuments(initialDocuments);
    setServiceId("");
    setErrors({});
    setSubmissionError("");
    setIsSubmitting(false);
    setPersistedReference("");
    setSubmitted(false);
    setActiveStep(1);
  };

  if (submitted) {
    return (
      <main className="application-shell success-shell">
        <div className="success-glow success-glow-one" />
        <div className="success-glow success-glow-two" />
        <section className="success-card">
          <div className="brand-lockup success-brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>
              <strong>Investments Destination</strong>
              <small>GHANA</small>
            </span>
          </div>
          <motion.div
            className="success-icon"
            initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            <CheckCircle2 size={42} strokeWidth={1.7} />
          </motion.div>
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.45 }}
          >
            <p className="eyebrow centered-eyebrow">Application received</p>
            <h1>Your Ghana journey is in motion.</h1>
            <p className="success-copy">
              We’ve captured your application details and prepared documents. Keep your reference number nearby while our team reviews the submission.
            </p>
          </motion.div>
          <motion.div
            className="confirmation-ticket"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.45 }}
          >
            <div>
              <span>Application reference</span>
              <strong>{referenceNumber}</strong>
            </div>
            <div>
              <span>Selected service</span>
              <strong>{selectedService?.name ?? "Visa service"}</strong>
            </div>
            <div>
              <span>Next step</span>
              <strong>IDG team review</strong>
            </div>
          </motion.div>
          <div className="success-actions">
            <button className="button button-primary" type="button" onClick={resetApplication}>
              <RotateCcw size={16} /> Start another application
            </button>
            <p><LockKeyhole size={14} /> Your application and documents are stored securely for review.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="application-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>Investments Destination</strong>
            <small>GHANA</small>
          </span>
        </div>
        <div className="topbar-note"><LockKeyhole size={14} /> Secure intake form <span className="topbar-divider" /> Takes about 8 minutes</div>
      </header>

      <div className="application-layout">
        <aside className="orientation-rail">
          <div className="rail-intro">
            <p className="eyebrow">Visa application</p>
            <h1>Bring your Ghana visit into focus.</h1>
            <p className="rail-copy">A clear, considered route from arrival intent to Ghana-ready documentation.</p>
          </div>

          <div className="rail-progress">
            <div className="rail-progress-heading">
              <span>Application progress</span>
              <strong>{formCompletion}%</strong>
            </div>
            <div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${Math.max(formCompletion, 7)}%` }} /></div>
          </div>

          <nav className="step-list" aria-label="Application steps">
            {steps.map((step) => {
              const Icon = step.icon;
              const completed = activeStep > step.id;
              const current = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`step-nav ${current ? "current" : ""} ${completed ? "completed" : ""}`}
                  onClick={() => goToStep(step.id)}
                  aria-current={current ? "step" : undefined}
                >
                  <span className="step-icon">{completed ? <Check size={15} /> : <Icon size={16} />}</span>
                  <span className="step-copy"><small>{step.eyebrow}</small><strong>{step.label}</strong></span>
                  {current && <ChevronRight className="step-chevron" size={16} />}
                </button>
              );
            })}
          </nav>

          <div className="rail-footer">
            <div className="rail-footer-icon"><ShieldCheck size={16} /></div>
            <div><strong>Handled with care</strong><p>Your details are only used to prepare this visa application.</p></div>
          </div>
        </aside>

        <section className="form-canvas">
          <div className="mobile-progress" aria-label="Application progress">
            <div><span>Step {activeStep} of 4</span><strong>{steps[activeStep - 1].label}</strong></div>
            <div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${Math.max(formCompletion, 7)}%` }} /></div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              className="step-panel"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              {activeStep === 1 && (
                <ApplicantStep applicant={applicant} errors={errors} updateApplicant={updateApplicant} />
              )}
              {activeStep === 2 && (
                <DocumentsStep
                  documents={documents}
                  errors={errors}
                  uploadMessage={uploadMessage}
                  onFileChange={handleFileChange}
                  onRemove={removeDocument}
                />
              )}
              {activeStep === 3 && (
                <ServiceStep
                  services={services}
                  selectedId={serviceId}
                  selectedService={selectedService}
                  error={errors.service}
                  onSelect={(id) => {
                    setServiceId(id);
                    setErrors((current) => ({ ...current, service: "" }));
                  }}
                />
              )}
              {activeStep === 4 && (
                <ReviewStep
                  applicant={applicant}
                  documents={documents}
                  selectedService={selectedService}
                  onEdit={goToStep}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="form-footer">
            <div className="footer-hint">
              {activeStep === 1 && <><Sparkles size={15} /> Start with the details exactly as they appear on the passport.</>}
              {activeStep === 2 && <><Info size={15} /> Clear, legible copies help us move faster.</>}
              {activeStep === 3 && <><Clock3 size={15} /> Your service choice sets the application fee.</>}
              {activeStep === 4 && <><LockKeyhole size={15} /> Review everything once before release.</>}
            </div>
            <div className="footer-actions">
              {activeStep > 1 && <button className="button button-quiet" type="button" onClick={goBack}><ArrowLeft size={16} /> Back</button>}
              {activeStep < 4 ? (
                <button className="button button-primary" type="button" onClick={goNext}>Continue <ArrowRight size={16} /></button>
              ) : (
                <button className="button button-primary" type="button" onClick={submitApplication} disabled={isSubmitting}>
                  {isSubmitting ? <>Saving securely… <span className="button-spinner" aria-hidden="true" /></> : <>Submit application <Check size={16} /></>}
                </button>
              )}
            </div>
          </div>
          {submissionError && <div className="submission-error" role="alert"><CircleAlert size={16} /> <span>{submissionError}</span></div>}
        </section>
      </div>
    </main>
  );
}

function StepHeader({ eyebrow, title, description, right }: { eyebrow: string; title: string; description: string; right?: React.ReactNode }) {
  return (
    <div className="step-header">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="step-description">{description}</p></div>
      {right}
    </div>
  );
}

function ApplicantStep({ applicant, errors, updateApplicant }: { applicant: Applicant; errors: Record<string, string>; updateApplicant: (field: keyof Applicant, value: string) => void }) {
  return (
    <>
      <StepHeader eyebrow="01 / Applicant information" title="Tell us who is travelling." description="Use the same spelling and details shown on the applicant’s passport." right={<div className="step-stamp">Identity<br /><strong>First pass</strong></div>} />
      <div className="dossier-card intro-card">
        <div className="intro-card-mark"><UserRound size={22} /></div>
        <div><strong>Applicant details</strong><p>These details anchor the rest of the application and appear on your final review.</p></div>
      </div>
      <div className="field-grid">
        <Field label="Applicant full name" hint="As shown on passport" value={applicant.fullName} placeholder="e.g. Ama Serwaa Mensah" error={errors.fullName} onChange={(event) => updateApplicant("fullName", event.target.value)} />
        <Field label="Nationality" value={applicant.nationality} placeholder="e.g. United Kingdom" error={errors.nationality} onChange={(event) => updateApplicant("nationality", event.target.value)} />
        <Field label="Passport number" hint="Letters and numbers only" value={applicant.passportNumber} placeholder="e.g. 533849201" error={errors.passportNumber} onChange={(event) => updateApplicant("passportNumber", event.target.value.toUpperCase())} />
      </div>
      <div className="notice-card"><Info size={17} /><p>We’ll use these details to match your documents and make the review step easy to scan.</p></div>
    </>
  );
}

function DocumentsStep({ documents, errors, uploadMessage, onFileChange, onRemove }: { documents: Record<DocumentKey, UploadedDocument | null>; errors: Record<string, string>; uploadMessage: string; onFileChange: (key: DocumentKey, event: ChangeEvent<HTMLInputElement>) => void; onRemove: (key: DocumentKey) => void }) {
  return (
    <>
      <StepHeader eyebrow="02 / Required supporting documents" title="Build a complete file." description="Prepare clear, legible copies of every item below. You can replace a file before submitting." right={<div className="count-pill"><strong>{Object.values(documents).filter(Boolean).length}</strong><span>of 7<br />uploaded</span></div>} />
      {uploadMessage && <motion.div className="upload-toast" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><UploadCloud size={16} /> {uploadMessage}</motion.div>}
      <div className="document-grid">
        {documentDefinitions.map((definition, index) => (
          <DocumentCard key={definition.key} index={index} definition={definition} upload={documents[definition.key]} error={errors[definition.key]} onFileChange={onFileChange} onRemove={onRemove} />
        ))}
      </div>
      <div className="document-footnote"><LockKeyhole size={15} /><span>Files remain in this browser for this application. Accepted files must be below 10 MB.</span><span className="document-rule" /><span>PDF · JPG · PNG · DOC</span></div>
    </>
  );
}

function DocumentCard({ index, definition, upload, error, onFileChange, onRemove }: { index: number; definition: typeof documentDefinitions[number]; upload: UploadedDocument | null; error?: string; onFileChange: (key: DocumentKey, event: ChangeEvent<HTMLInputElement>) => void; onRemove: (key: DocumentKey) => void }) {
  const inputId = `file-${definition.key}`;
  const isComplete = upload?.progress === 100;
  return (
    <motion.article className={`document-card ${isComplete ? "ready" : ""} ${error ? "has-error" : ""}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
      <div className="document-number">0{index + 1}</div>
      <div className="document-icon">{definition.kind === "image" ? <ImageIcon size={17} /> : <FileText size={17} />}</div>
      <div className="document-content">
        <div className="document-title-row"><div><h3>{definition.label}</h3><p>{definition.helper}</p></div>{isComplete && <span className="ready-badge"><Check size={12} /> Ready</span>}</div>
        {upload ? (
          <div className="uploaded-file">
            {upload.previewUrl ? <img src={upload.previewUrl} alt={`${definition.label} preview`} /> : <span className="file-placeholder"><FileText size={16} /></span>}
            <div className="uploaded-file-copy"><strong>{upload.file.name}</strong><span>{upload.progress < 100 ? `Preparing file… ${upload.progress}%` : `${(upload.file.size / 1024 / 1024).toFixed(1)} MB · Ready to review`}</span>{upload.progress < 100 && <div className="upload-progress"><motion.div animate={{ width: `${upload.progress}%` }} /></div>}</div>
            <button className="icon-button" type="button" onClick={() => onRemove(definition.key)} aria-label={`Remove ${definition.label}`}><Trash2 size={15} /></button>
          </div>
        ) : (
          <label className="upload-dropzone" htmlFor={inputId}><input id={inputId} type="file" accept={definition.accept} onChange={(event) => onFileChange(definition.key, event)} /><UploadCloud size={16} /><span>Choose file</span><small>or drop here</small></label>
        )}
        {error && <p className="field-error"><CircleAlert size={13} /> {error}</p>}
      </div>
    </motion.article>
  );
}

function ServiceStep({ services, selectedId, selectedService, error, onSelect }: { services: Service[]; selectedId: string; selectedService?: Service; error?: string; onSelect: (id: string) => void }) {
  return (
    <>
      <StepHeader eyebrow="03 / Visa type & service selection" title="Choose your route into Ghana." description="Select the option that best fits your timing. Your fee updates as you choose." right={<div className="fee-preview"><span>Current fee</span><strong>{selectedService ? formatCurrency(selectedService.price) : "—"}</strong></div>} />
      <div className="service-layout">
        <div className="service-options">
          <p className="section-label">Standard visa options</p>
          {services.filter((service) => service.group === "Standard visa option").map((service) => <ServiceCard key={service.id} service={service} selected={selectedId === service.id} onSelect={onSelect} />)}
          <p className="section-label evisa-label">eVisa portal options</p>
          {services.filter((service) => service.group === "eVisa portal option").map((service) => <ServiceCard key={service.id} service={service} selected={selectedId === service.id} onSelect={onSelect} />)}
          {error && <p className="field-error service-error"><CircleAlert size={13} /> {error}</p>}
        </div>
        <aside className={`fee-card ${selectedService ? "has-selection" : ""}`}>
          <div className="fee-card-top"><span className="eyebrow">Your selection</span><span className="fee-dot" /></div>
          {selectedService ? <><h3>{selectedService.name}</h3><p>{selectedService.description}</p><div className="fee-card-divider" /><div className="fee-row"><span>Service fee</span><strong>{formatCurrency(selectedService.price)}</strong></div><div className="fee-row"><span>Turnaround</span><strong>{selectedService.turnaround}</strong></div></> : <div className="empty-fee"><Plane size={24} /><p>Choose a visa service to see your fee and turnaround.</p></div>}
          <div className="fee-note"><Info size={14} /> Service fees are shown in US dollars.</div>
        </aside>
      </div>
    </>
  );
}

function ServiceCard({ service, selected, onSelect }: { service: Service; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" className={`service-card ${selected ? "selected" : ""}`} onClick={() => onSelect(service.id)}>
      <span className="radio-indicator">{selected && <span />}</span>
      <span className="service-card-copy"><span className="service-name">{service.name} {service.featured && <small>Faster route</small>}</span><span className="service-description">{service.description}</span></span>
      <strong className="service-price">{formatCurrency(service.price)}</strong>
    </button>
  );
}

function ReviewStep({ applicant, documents, selectedService, onEdit }: { applicant: Applicant; documents: Record<DocumentKey, UploadedDocument | null>; selectedService?: Service; onEdit: (step: StepId) => void }) {
  return (
    <>
      <StepHeader eyebrow="05 / Review before release" title="Make sure it feels right." description="This is the final view of your application. You can jump back and edit any section before submitting." right={<div className="review-seal"><Check size={16} /> Final review</div>} />
      <div className="review-stack">
        <ReviewSection icon={<UserRound size={17} />} title="Applicant information" onEdit={() => onEdit(1)}><div className="review-grid"><ReviewValue label="Full name" value={applicant.fullName} /><ReviewValue label="Nationality" value={applicant.nationality} /><ReviewValue label="Passport number" value={applicant.passportNumber} /></div></ReviewSection>
        <ReviewSection icon={<FileText size={17} />} title="Supporting documents" meta={`${Object.values(documents).filter(Boolean).length} / 7 ready`} onEdit={() => onEdit(2)}><div className="review-documents">{documentDefinitions.map((definition) => <div className="review-document" key={definition.key}><span className={documents[definition.key] ? "review-document-check" : "review-document-empty"}>{documents[definition.key] ? <Check size={12} /> : <X size={12} />}</span><span>{definition.label}</span>{documents[definition.key] && <small>{documents[definition.key]?.file.name}</small>}</div>)}</div></ReviewSection>
        <ReviewSection icon={<Plane size={17} />} title="Visa service" meta={selectedService ? formatCurrency(selectedService.price) : "Not selected"} onEdit={() => onEdit(3)}><div className="review-service"><div><strong>{selectedService?.name ?? "No service selected"}</strong><span>{selectedService?.turnaround ?? "Choose a service before submitting"}</span></div><strong>{selectedService ? formatCurrency(selectedService.price) : "—"}</strong></div></ReviewSection>
        <div className="notice-card review-admin-note"><ShieldCheck size={17} /><p><strong>Admin review follows submission.</strong> Investments Destination Ghana will complete the internal approval and document-verification stage after you submit.</p></div>
      </div>
      <div className="release-note"><Sparkles size={16} /><p>Everything looks in order. Select <strong>Submit application</strong> below to create your confirmation reference.</p></div>
    </>
  );
}

function ReviewSection({ icon, title, meta, onEdit, children }: { icon: React.ReactNode; title: string; meta?: string; onEdit: () => void; children: React.ReactNode }) {
  return <section className="review-section"><div className="review-section-header"><div className="review-section-title"><span>{icon}</span><h3>{title}</h3>{meta && <small>{meta}</small>}</div><button type="button" className="edit-button" onClick={onEdit}>Edit <ArrowRight size={13} /></button></div>{children}</section>;
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return <div className="review-value"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

function Field({ label, hint, value, placeholder, error, onChange }: { label: string; hint?: string; value: string; placeholder: string; error?: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <div className="field-wrap"><label htmlFor={label.toLowerCase().replaceAll(" ", "-")}>{label}<span>{hint}</span></label><input id={label.toLowerCase().replaceAll(" ", "-")} value={value} placeholder={placeholder} onChange={onChange} aria-invalid={Boolean(error)} />{error && <p className="field-error"><CircleAlert size={13} /> {error}</p>}</div>;
}
