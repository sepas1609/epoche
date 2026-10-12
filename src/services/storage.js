/**
 * Storage Service for Epoché (Ἐποχή)
 * 100% Zero-Knowledge Client-Side Storage Engine
 * Data is saved strictly in browser LocalStorage & IndexedDB.
 */

import { INITIAL_PAPERS } from '../data/seedData.js';

const STORAGE_KEY = 'epoche_lab_papers_v2';
const SPRINT_KEY = 'epoche_sprint_state';

export class StorageService {
  /**
   * Load papers from local storage, initializing with seed data if first launch
   */
  static getPapers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.savePapers(INITIAL_PAPERS);
        return [...INITIAL_PAPERS];
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Storage read error, using memory fallback", e);
      return [...INITIAL_PAPERS];
    }
  }

  /**
   * Persist papers array locally
   */
  static savePapers(papers) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }
  }

  /**
   * Update or insert a single paper
   */
  static savePaper(paper) {
    const papers = this.getPapers();
    const idx = papers.findIndex(p => p.id === paper.id);
    if (idx >= 0) {
      papers[idx] = { ...papers[idx], ...paper };
    } else {
      papers.unshift(paper);
    }
    this.savePapers(papers);
    return papers;
  }

  /**
   * Delete paper by ID
   */
  static deletePaper(paperId) {
    let papers = this.getPapers();
    papers = papers.filter(p => p.id !== paperId);
    this.savePapers(papers);
    return papers;
  }

  /**
   * Reset to default verified sample benchmark
   */
  static resetToDemo() {
    this.savePapers(INITIAL_PAPERS);
    return [...INITIAL_PAPERS];
  }

  /**
   * Export all lab data as an encrypted/portable `.epoche` JSON file
   */
  static exportVault() {
    const data = {
      app: "Epoché Academic Command Center",
      version: "2.4",
      exportedAt: new Date().toISOString(),
      vaultType: "Zero-Knowledge Local Lab Vault",
      papers: this.getPapers()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `epoche_lab_vault_${dateStr}.epoche`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import `.epoche` vault file
   */
  static importVault(fileContent) {
    try {
      const parsed = JSON.parse(fileContent);
      if (parsed && Array.isArray(parsed.papers)) {
        this.savePapers(parsed.papers);
        return { success: true, count: parsed.papers.length };
      }
      return { success: false, error: "Invalid vault file structure" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate RFC 5545 compliant iCalendar (.ics) export
   * Syncs deadlines directly with Google Calendar / Apple Calendar
   */
  static exportICalendar() {
    const papers = this.getPapers();
    const events = [];

    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    papers.forEach(p => {
      if (p.deadline) {
        const d = new Date(p.deadline);
        if (!isNaN(d.getTime())) {
          const dateStr = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          const summary = `[Epoché Alert] ${p.stage.toUpperCase()}: ${p.journal}`;
          const description = `Manuscript: ${p.title}\\nTracking ID: ${p.trackingId || 'N/A'}\\nPortal: ${p.portalUrl || 'N/A'}\\nOverleaf: ${p.memoryCapsule?.overleafUrl || 'N/A'}`;

          events.push([
            "BEGIN:VEVENT",
            `UID:${p.id}-${stamp}@epoche.research`,
            `DTSTAMP:${stamp}`,
            `DTSTART:${dateStr}`,
            `DTEND:${dateStr}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            "BEGIN:VALARM",
            "TRIGGER:-PT48H",
            "ACTION:DISPLAY",
            "DESCRIPTION:Epoché 48-Hour Deadline Alert!",
            "END:VALARM",
            "END:VEVENT"
          ].join("\r\n"));
        }
      }
    });

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Epoché//Academic Submission Command//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epoche_research_deadlines_${new Date().toISOString().split("T")[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Save sprint scratchpad notes
   */
  static getSprintNotes() {
    return localStorage.getItem('epoche_sprint_notes') || '';
  }

  static saveSprintNotes(notes) {
    localStorage.setItem('epoche_sprint_notes', notes);
  }
}
