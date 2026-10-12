/**
 * Reviewer Comment Dissector Engine
 * Parses unstructured raw peer-review text into atomic actionable items.
 */

export class ReviewerParser {
  /**
   * Dissect raw review text into structured comments
   * @param {string} rawText 
   * @param {Array} defaultAuthors
   * @returns {Array} parsed comments
   */
  static dissect(rawText, defaultAuthors = []) {
    if (!rawText || !rawText.trim()) return [];

    const comments = [];
    const lines = rawText.split(/\r?\n/);

    let currentReviewer = "Reviewer 1";
    let currentPointNum = 0;
    let currentQuoteLines = [];

    const reviewerHeaderRegex = /^(?:Reviewer\s*(?:#|No\.?|Number)?\s*([0-9]+)|Associate\s*Editor|AE|Editor\s*Comments?)/i;
    const pointHeaderRegex = /^(?:([0-9]+)[\.\)\:]|\b(?:Comment|Point|Concern|Issue)\s*([0-9]+)[\:\.\-]?|(?:\-|\*))\s*(.*)/i;

    const flushComment = () => {
      if (currentQuoteLines.length > 0) {
        const quote = currentQuoteLines.join(" ").trim();
        if (quote.length > 5) {
          currentPointNum++;
          // Heuristic severity detection
          let severity = "minor";
          const lower = quote.toLowerCase();
          if (lower.includes("experiment") || lower.includes("hardware") || lower.includes("proof") || lower.includes("validation") || lower.includes("rigorous") || lower.includes("fundamentally") || lower.includes("major")) {
            severity = "major";
          }

          // Pick default author if available
          const leadAuthor = defaultAuthors.find(a => a.isLead)?.name || (defaultAuthors[0]?.name || "Unassigned");

          comments.push({
            id: `c-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            reviewer: currentReviewer,
            point: currentPointNum,
            severity,
            assignee: leadAuthor,
            status: "pending",
            quote,
            response: `We thank ${currentReviewer} for this insightful remark. In response...`,
            manuscriptChange: "Revised Section X, Page Y."
          });
        }
        currentQuoteLines = [];
      }
    };

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        // Empty line might separate points
        continue;
      }

      // Check if line is a Reviewer Header
      const reviewerMatch = trimmed.match(reviewerHeaderRegex);
      if (reviewerMatch) {
        flushComment();
        if (trimmed.toLowerCase().includes("associate editor") || trimmed.toLowerCase().includes("ae")) {
          currentReviewer = "Associate Editor";
        } else if (reviewerMatch[1]) {
          currentReviewer = `Reviewer ${reviewerMatch[1]}`;
        } else {
          currentReviewer = trimmed.replace(/[:]/g, "").trim();
        }
        currentPointNum = 0;
        continue;
      }

      // Check if line is a new numbered point or bullet
      const pointMatch = trimmed.match(pointHeaderRegex);
      if (pointMatch) {
        flushComment();
        const contentAfterNumber = pointMatch[3] !== undefined ? pointMatch[3] : pointMatch[0];
        currentQuoteLines.push(contentAfterNumber.trim());
        continue;
      }

      // Otherwise, continuous line for current point
      currentQuoteLines.push(trimmed);
    }

    // Flush final point
    flushComment();

    // Fallback if no specific points matched: split by double newlines
    if (comments.length === 0 && rawText.trim().length > 10) {
      const paragraphs = rawText.split(/\n\s*\n/);
      paragraphs.forEach((p, idx) => {
        const text = p.trim();
        if (text) {
          comments.push({
            id: `c-gen-${Date.now()}-${idx}`,
            reviewer: "Reviewer 1",
            point: idx + 1,
            severity: "major",
            assignee: defaultAuthors[0]?.name || "Unassigned",
            status: "pending",
            quote: text,
            response: "We thank the reviewer for this remark. In response...",
            manuscriptChange: "Clarified in manuscript."
          });
        }
      });
    }

    return comments;
  }
}
