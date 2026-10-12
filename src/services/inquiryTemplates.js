/**
 * Academic Correspondence Templates for Editor-in-Chief communications
 */

export class InquiryTemplates {
  static generateLetter(templateType, paper) {
    if (!paper) {
      return "Please select or create a manuscript to generate academic correspondence.";
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const leadAuthor = paper.authors.find(a => a.isLead)?.name || paper.authors[0]?.name || "Corresponding Author";
    const authorList = paper.authors.map(a => a.name).join(", ");

    switch (templateType) {
      case "status_inquiry":
        return `Date: ${todayStr}

To: The Editor-in-Chief / Handling Editor
Journal: ${paper.journal}
Publisher: ${paper.publisher}

Subject: Status Inquiry regarding Manuscript ID ${paper.trackingId || '[Tracking ID]'}

Dear Editor,

I hope this email finds you well.

I am writing on behalf of my co-authors (${authorList}) to respectfully inquire about the current status of our manuscript:

Title: "${paper.title}"
Manuscript Tracking ID: ${paper.trackingId || '[Tracking ID]'}
Initial Submission Date: ${paper.submissionDate || '[Submission Date]'}

We understand that coordinating thorough peer reviews requires considerable effort and time, and we deeply appreciate the reviewers' and editorial board's commitment to scholarly rigor. Because the manuscript has been under review for some time, we would be grateful for any brief update on whether reviewer reports have been received or if additional information is required from our side.

Thank you very much for your time, consideration, and continued editorial guidance.

Sincerely,

${leadAuthor}
On behalf of all co-authors
Institution: Department of Research & Engineering
Contact: ${paper.authors[0]?.email || 'author@university.edu'}`;

      case "deadline_extension":
        return `Date: ${todayStr}

To: The Editor-in-Chief / Handling Editor
Journal: ${paper.journal}
Manuscript ID: ${paper.trackingId || '[Tracking ID]'}

Subject: Request for Extension on Revision Deadline for Manuscript ID ${paper.trackingId || '[Tracking ID]'}

Dear Editor,

We are writing regarding the revision of our manuscript:
Title: "${paper.title}"
Manuscript ID: ${paper.trackingId || '[Tracking ID]'}

We sincerely thank the editorial team and reviewers for their constructive insights. We are actively conducting additional experimental validations and simulation benchmarks requested in the review reports to elevate the rigor of the manuscript.

To ensure all supplementary tests and rigorous point-by-point comparative analyses are thoroughly completed, we respectfully request a 14-day extension on the current revision submission deadline. 

We anticipate submitting the revised manuscript and comprehensive rebuttal letter on or before ${new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}.

We appreciate your kind consideration and flexibility.

Warm regards,

${leadAuthor}
On behalf of all co-authors`;

      case "author_order":
        return `Date: ${todayStr}

To: The Editorial Office
Journal: ${paper.journal}
Manuscript ID: ${paper.trackingId || '[Tracking ID]'}

Subject: Confirmation of Co-Authorship and Author Contribution Order

Dear Editorial Office,

We hereby confirm that all listed co-authors have actively reviewed, contributed to, and approved the final contents of manuscript "${paper.title}".

The agreed-upon authorship order and affiliations are as follows:
${paper.authors.map((a, i) => `${i + 1}. ${a.name} (${a.role || 'Co-Author'}) — Email: ${a.email || 'N/A'}`).join('\n')}

All authors affirm that there are no undisclosed conflicts of interest.

Sincerely,

${leadAuthor}
Corresponding Author`;

      case "withdrawal":
        return `Date: ${todayStr}

To: The Editor-in-Chief
Journal: ${paper.journal}
Manuscript ID: ${paper.trackingId || '[Tracking ID]'}

Subject: Formal Request for Manuscript Withdrawal — ${paper.trackingId || '[Tracking ID]'}

Dear Editor-in-Chief,

We regret to inform you that, after unanimous deliberation among the co-authors, we wish to formally withdraw our manuscript:

Title: "${paper.title}"
Manuscript Tracking ID: ${paper.trackingId || '[Tracking ID]'}

This decision is made in order to fundamentally restructure our research scope with newly expanded experimental findings. We confirm that this manuscript will not be submitted elsewhere until the formal withdrawal process with ${paper.journal} is completed.

We sincerely apologize for any inconvenience caused to the editorial office and reviewers.

Yours faithfully,

${leadAuthor}
On behalf of all co-authors`;

      case "proof_correction":
        return `Date: ${todayStr}

To: Production & Galley Proof Editor
Journal: ${paper.journal}
Manuscript ID: ${paper.trackingId || '[Tracking ID]'}

Subject: Galley Proof Clarifications — Manuscript ID ${paper.trackingId || '[Tracking ID]'}

Dear Production Editor,

Thank you for providing the galley proofs for our accepted article:
"${paper.title}"

We have thoroughly verified all equations, tables, figures, and author affiliations. Please find our final verified annotations attached. All queries (AQs) have been addressed in the accompanying proof response document.

Thank you for your assistance in expediting the publication process.

Best regards,

${leadAuthor}`;

      default:
        return "Select a template.";
    }
  }
}
