/**
 * Seed data for Epoché (Ἐποχή)
 * Realistic research papers, author assignments, memory capsules, and publisher benchmarks.
 */

export const INITIAL_PAPERS = [
  {
    id: "epoche-paper-01",
    title: "Two-Phase Interleaved Quadratic Boost Converter with Zero-Voltage Transition for Renewable DC Microgrids",
    journal: "IEEE Transactions on Power Electronics",
    publisher: "IEEE",
    trackingId: "TPEL-2026-04192.R1",
    stage: "revision_war_room", // 'drafting', 'submitted', 'under_review', 'revision_war_room', 'camera_ready', 'accepted'
    submissionDate: "2026-07-15",
    deadline: "2026-10-30", // 18 days left from current local time
    portalUrl: "https://mc.manuscriptcentral.com/tpel-ieee",
    impactFactor: "6.7",
    quartile: "Q1",
    authors: [
      { name: "Saran Boddu", role: "Lead Author", email: "saran@amrita.edu", isLead: true },
      { name: "Dr. K. Rao", role: "PI / Advisor", email: "rao@amrita.edu", isLead: false },
      { name: "M. Karthik", role: "Hardware Testing", email: "karthik@amrita.edu", isLead: false },
      { name: "P. Ananya", role: "Thermal Modeling", email: "ananya@amrita.edu", isLead: false }
    ],
    memoryCapsule: {
      overleafUrl: "https://www.overleaf.com/project/66a1e948c2081f9b",
      gitBranch: "main (commit 9f4b12c: zvt-boundary-ccm)",
      datasetUrl: "https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoP",
      modelNotes: "MATLAB R2024b Simscape discrete solver at Ts=1e-6s. Boost inductor L1=120uH, L2=120uH. Oscilloscope Rigol Channel 3 calibrated with current probe 100mV/A.",
      zenodoDoi: "10.5281/zenodo.1284901"
    },
    reviewerComments: [
      {
        id: "c-01",
        reviewer: "Reviewer 1",
        point: 1,
        severity: "major",
        assignee: "Saran Boddu",
        status: "approved",
        quote: "The mathematical proof for continuous conduction mode (CCM) boundary at low duty cycle (D < 0.35) lacks experimental validation under 300W load. Please provide physical oscilloscope captures.",
        response: "We thank the reviewer for pointing out this critical aspect. We have conducted physical hardware experiments on our 500W laboratory prototype at D=0.28 and 300W load. New experimental waveforms depicting CCM inductor currents have been incorporated into Figure 8.",
        manuscriptChange: "Added Fig. 8(c) and updated Section IV-B, Page 6, Paragraphs 2-3."
      },
      {
        id: "c-02",
        reviewer: "Reviewer 1",
        point: 2,
        severity: "minor",
        assignee: "P. Ananya",
        status: "drafted",
        quote: "The thermal junction temperature rise in MOSFET switch S2 appears low. Was natural convection or forced air cooling employed?",
        response: "We appreciate the observation. The thermal test was carried out using forced air cooling with a 12V DC fan (0.15 m3/min airflow). We have clarified the experimental thermal setup in Table III.",
        manuscriptChange: "Revised Table III footnotes on Page 8."
      },
      {
        id: "c-03",
        reviewer: "Reviewer 2",
        point: 1,
        severity: "major",
        assignee: "M. Karthik",
        status: "in_progress",
        quote: "The efficiency comparison in Table IV should include the 2025 IEEE TPEL benchmark converter by Zhang et al. rather than only 2022 references.",
        response: "We agree with the reviewer. We have benchmarked our prototype against Zhang et al. (IEEE TPEL 2025). The comparison illustrates a 1.4% efficiency improvement at 48V/400V boost operation.",
        manuscriptChange: "Updated Table IV and Section V discussion."
      },
      {
        id: "c-04",
        reviewer: "Reviewer 2",
        point: 2,
        severity: "minor",
        assignee: "Dr. K. Rao",
        status: "approved",
        quote: "Equation (14) has a sign error in the second-order ripple coefficient term.",
        response: "We thank the reviewer for the sharp mathematical vigilance. The minus sign in Eq. (14) has been corrected to a plus sign.",
        manuscriptChange: "Corrected sign in Equation (14) on Page 4."
      }
    ]
  },
  {
    id: "epoche-paper-02",
    title: "Quantum Variational Circuit Optimization for Maximum Power Point Tracking in Stochastic Wind Energy Conversion Systems",
    journal: "Elsevier Applied Energy",
    publisher: "Elsevier",
    trackingId: "APEN-D-26-01824",
    stage: "under_review",
    submissionDate: "2026-08-30", // 43 days under review
    deadline: null,
    portalUrl: "https://www.editorialmanager.com/apen/",
    impactFactor: "10.1",
    quartile: "Q1",
    authors: [
      { name: "Saran Boddu", role: "Co-Lead Author", email: "saran@amrita.edu", isLead: true },
      { name: "Dr. V. Sundaram", role: "Quantum Co-PI", email: "sundaram@amrita.edu", isLead: false },
      { name: "R. Jayanth", role: "WECS Dynamics", email: "jayanth@amrita.edu", isLead: false }
    ],
    memoryCapsule: {
      overleafUrl: "https://www.overleaf.com/project/66b0482da812ff",
      gitBranch: "quantum-vqc-v3 (commit e37a912)",
      datasetUrl: "https://zenodo.org/record/8912401",
      modelNotes: "PennyLane v0.38 + Qiskit Statevector simulator. 4-qubit hardware-efficient ansatz with CZ entangling gates. Wind profile data from NREL Western Wind Dataset.",
      zenodoDoi: "10.5281/zenodo.8912401"
    },
    reviewerComments: []
  },
  {
    id: "epoche-paper-03",
    title: "Multi-Modal Audio-Visual Drone Swarm Detection using Edge Neuromorphic Accelerators",
    journal: "ACM/IEEE International Conference on Cyber-Physical Systems (ICCPS)",
    publisher: "ACM",
    trackingId: "ICCPS-2026-Paper#108",
    stage: "camera_ready",
    submissionDate: "2026-06-10",
    deadline: "2026-10-16", // 4 days left! Urgent sprint!
    portalUrl: "https://iccps2026.hotcrp.com/",
    impactFactor: "Core A*",
    quartile: "Top Tier",
    authors: [
      { name: "P. Ananya", role: "Lead Author", email: "ananya@amrita.edu", isLead: true },
      { name: "Saran Boddu", role: "FPGA / Edge Lead", email: "saran@amrita.edu", isLead: false },
      { name: "Dr. K. Rao", role: "PI", email: "rao@amrita.edu", isLead: false }
    ],
    memoryCapsule: {
      overleafUrl: "https://www.overleaf.com/project/66c80211a721",
      gitBranch: "camera-ready-final (commit 44cd881)",
      datasetUrl: "https://huggingface.co/datasets/amrita-lab/drone-swarm-sound-video",
      modelNotes: "PyTorch 2.4 quantized with ONNX Runtime to 8-bit INT8. Compiled for Google Coral Edge TPU and Raspberry Pi 5.",
      zenodoDoi: "10.5281/zenodo.9011832"
    },
    reviewerComments: [
      {
        id: "c-05",
        reviewer: "Reviewer 3",
        point: 1,
        severity: "minor",
        assignee: "Saran Boddu",
        status: "approved",
        quote: "Please ensure the IEEE/ACM copyright block is properly formatted in the LaTeX camera-ready template.",
        response: "Applied the official ACM rights management code snippet in the preamble.",
        manuscriptChange: "Page 1 copyright header updated."
      }
    ]
  }
];

export const GLOBAL_PORTALS = [
  {
    name: "IEEE Author Portal / ScholarOne",
    publisher: "IEEE",
    url: "https://ieee.atyponrex.com/",
    avgFirstDecisionDays: 75,
    inquiryWindowDays: 90,
    typicalRebuttalDays: 30,
    description: "Primary submission portal for IEEE Transactions, Letters, and flagship conferences."
  },
  {
    name: "Elsevier Editorial Manager",
    publisher: "Elsevier",
    url: "https://www.editorialmanager.com/",
    avgFirstDecisionDays: 95,
    inquiryWindowDays: 120,
    typicalRebuttalDays: 45,
    description: "Standard peer-review portal for Applied Energy, Renewable Energy, and Elsevier journals."
  },
  {
    name: "Springer Nature SNAPP / Editorial Manager",
    publisher: "Springer Nature",
    url: "https://submission.springernature.com/",
    avgFirstDecisionDays: 85,
    inquiryWindowDays: 105,
    typicalRebuttalDays: 30,
    description: "Springer Nature Article Processing Platform for Nature Communications and Scientific Reports."
  },
  {
    name: "OpenReview.net",
    publisher: "OpenReview",
    url: "https://openreview.net/",
    avgFirstDecisionDays: 60,
    inquiryWindowDays: 70,
    typicalRebuttalDays: 7,
    description: "Transparent open peer-review engine for NeurIPS, ICLR, ICML, and modern AI conferences."
  },
  {
    name: "Microsoft CMT / HotCRP",
    publisher: "ACM / IEEE / Independent",
    url: "https://cmt3.research.microsoft.com/",
    avgFirstDecisionDays: 50,
    inquiryWindowDays: 65,
    typicalRebuttalDays: 5,
    description: "High-volume conference submission engine with author rebuttal and meta-review tracks."
  },
  {
    name: "arXiv Preprint Server",
    publisher: "arXiv",
    url: "https://arxiv.org/submit",
    avgFirstDecisionDays: 2,
    inquiryWindowDays: 5,
    typicalRebuttalDays: 0,
    description: "Open-access scientific preprint repository hosted by Cornell University."
  }
];

export const SAMPLE_RAW_REVIEWS = `Reviewer #1:
1. The mathematical proof for continuous conduction mode (CCM) boundary at low duty cycle (D < 0.35) lacks experimental validation under 300W load. Please provide physical oscilloscope captures.
2. The thermal junction temperature rise in MOSFET switch S2 appears low. Was natural convection or forced air cooling employed?
3. Please clarify the sampling frequency of the DSP microcontroller in Section III.

Reviewer #2:
1. The efficiency comparison in Table IV should include the 2025 IEEE TPEL benchmark converter by Zhang et al. rather than only 2022 references.
2. Equation (14) has a sign error in the second-order ripple coefficient term.
3. The total harmonic distortion (THD) of the input current should be stated in Section IV.

Reviewer #3:
1. The paper is well organized and demonstrates practical significance. Minor grammatical inconsistencies were observed on Page 5, Column 2.`;
