# Delivery checklist

## Guided application flow
- [ ] The public form is a responsive, accessible multi-step experience for Investments Destination Ghana.
- [ ] The applicant flow has four visible screens: Applicant, Documents, Visa service, and Stage 05 — Review; the Approval stage is omitted entirely from the applicant-facing flow.
- [ ] The flow includes an animated progress indicator, preserves values while moving between steps, and provides clear back/continue controls.
- [ ] The desktop layout uses a branded orientation rail plus a form canvas and collapses cleanly for mobile.

## Applicant information
- [ ] The Applicant Information step includes Applicant Full Name, Nationality, and Passport Number.
- [ ] Required applicant fields have clear inline validation and do not allow the user to proceed with missing values.

## Supporting documents
- [ ] The Required Supporting Documents step includes upload controls for Application Letter (Drafted on behalf of the applicant), Passport Biodata Page, Signatory’s Identification (Passport Copy or Ghana Card Copy), Invitee Company Registration Documents, Yellow Fever Vaccination Card, Passport-Size Photograph, and Travel Itinerary / Flight Details.
- [ ] Upload controls support file type/size validation, a visible upload/progress state, a file or image preview state, and remove/replace controls.
- [ ] The document step clearly communicates that clear, legible copies are required.

## Visa and service selection
- [ ] The Visa Type & Service Selection step includes Visa on Arrival (Single Entry) at US$300 and Emergency Entry Visa (EEV) / Emergency Visa at US$300.
- [ ] The step includes eVisa Portal EEV Fee at US$260, Priority eVisa (48-hour turnaround) at US$338, and Express eVisa (5-hour turnaround) at US$442.
- [ ] Only one service can be selected at a time and the fee summary updates dynamically with the selected service and US dollar fee.

## Submission checklist and review
- [ ] Approval, Prepared By, Date of Submission, and status choices are not shown to applicants; the server assigns an initial Drafted status and records the online submission metadata for later admin work.
- [ ] After Visa service, the applicant goes directly to Stage 05 — Review, which summarizes applicant details, uploaded documents, selected service, and fee, with controls to return and edit.

## Completion state
- [ ] Final submission handling displays a clear success/confirmation state with a reference-style confirmation message and next-step guidance.
- [ ] Motion is smooth, purposeful, and respects reduced-motion preferences.
