type JournalAbbreviationMap = {
  [key: string]: string;
};

const journalAbbreviations: JournalAbbreviationMap = {
  // Common journal names and their official NLM abbreviations
  "Academic Medicine": "Acad Med",
  "Acta Crystallographica": "Acta Crystallogr",
  "Acta Pathologica Microbiologica et Immunologica Scandinavica": "APMIS",
  "Advanced Materials": "Adv Mater",
  "American Journal of Cardiology": "Am J Cardiol",
  "American Journal of Clinical Nutrition": "Am J Clin Nutr",
  "American Journal of Medicine": "Am J Med",
  "American Journal of Pathology": "Am J Pathol",
  "American Journal of Physiology": "Am J Physiol",
  "Annals of Internal Medicine": "Ann Intern Med",
  "Annals of Oncology": "Ann Oncol",
  "Annals of Surgery": "Ann Surg",
  "Archives of Internal Medicine": "Arch Intern Med",
  "Biochemical Journal": "Biochem J",
  "Biochimica et Biophysica Acta": "Biochim Biophys Acta",
  "Biology of Blood and Marrow Transplantation": "Biol Blood Marrow Transplant",
  "Blood": "Blood",
  "BMC Cancer": "BMC Cancer",
  "BMC Genomics": "BMC Genomics",
  "BMC Medicine": "BMC Med",
  "British Journal of Cancer": "Br J Cancer",
  "British Medical Journal": "BMJ",
  "Cancer Cell": "Cancer Cell",
  "Cancer Research": "Cancer Res",
  "Cell": "Cell",
  "Clinical Cancer Research": "Clin Cancer Res",
  "Clinical Infectious Diseases": "Clin Infect Dis",
  "Current Biology": "Curr Biol",
  "Diabetes Care": "Diabetes Care",
  "European Heart Journal": "Eur Heart J",
  "European Journal of Cancer": "Eur J Cancer",
  "European Journal of Clinical Nutrition": "Eur J Clin Nutr",
  "European Respiratory Journal": "Eur Respir J",
  "FEBS Letters": "FEBS Lett",
  "Gastroenterology": "Gastroenterology",
  "Genes & Development": "Genes Dev",
  "Genome Biology": "Genome Biol",
  "Gut": "Gut",
  "Investigational New Drugs": "Invest New Drugs",
  "JAMA: Journal of the American Medical Association": "JAMA",
  "JCO Precision Oncology": "JCO Precis Oncol",
  "Journal of Biological Chemistry": "J Biol Chem",
  "Journal of Cell Biology": "J Cell Biol",
  "Journal of Clinical Investigation": "J Clin Invest",
  "Journal of Clinical Oncology": "J Clin Oncol",
  "Journal of Experimental Medicine": "J Exp Med",
  "Journal of General Virology": "J Gen Virol",
  "Journal of Immunology": "J Immunol",
  "Journal of Medical Genetics": "J Med Genet",
  "Journal of Molecular Biology": "J Mol Biol",
  "Journal of the National Cancer Institute": "J Natl Cancer Inst",
  "Journal of Neuroscience": "J Neurosci",
  "Lancet": "Lancet",
  "Molecular Cell": "Mol Cell",
  "Molecular Psychiatry": "Mol Psychiatry",
  "Nature Biotechnology": "Nat Biotechnol",
  "Nature Cell Biology": "Nat Cell Biol",
  "Nature Communications": "Nat Commun",
  "Nature Genetics": "Nat Genet",
  "Nature Immunology": "Nat Immunol",
  "Nature Medicine": "Nat Med",
  "Nature Methods": "Nat Methods",
  "Nature Neuroscience": "Nat Neurosci",
  "Nature Reviews Cancer": "Nat Rev Cancer",
  "Nature Reviews Drug Discovery": "Nat Rev Drug Discov",
  "Nature Reviews Genetics": "Nat Rev Genet",
  "Nature Reviews Immunology": "Nat Rev Immunol",
  "Nature Reviews Molecular Cell Biology": "Nat Rev Mol Cell Biol",
  "New England Journal of Medicine": "N Engl J Med",
  "Nucleic Acids Research": "Nucleic Acids Res",
  "Oncogene": "Oncogene",
  "Pathology, Research and Practice": "Pathol Res Pract",
  "PLOS Biology": "PLoS Biol",
  "PLOS Medicine": "PLoS Med",
  "PLOS ONE": "PLoS One",
  "PNAS: Proceedings of the National Academy of Sciences": "Proc Natl Acad Sci U S A",
  "Science": "Science",
  "Science Advances": "Sci Adv",
  "Scientific Reports": "Sci Rep",
  "The Lancet Oncology": "Lancet Oncol",
  "The Lancet Respiratory Medicine": "Lancet Respir Med",
  "Trends in Biochemical Sciences": "Trends Biochem Sci",
  "Trends in Cell Biology": "Trends Cell Biol",
  "Trends in Immunology": "Trends Immunol",
  "Trends in Molecular Medicine": "Trends Mol Med",
  "Trends in Neurosciences": "Trends Neurosci",
};

export const getJournalAbbreviation = (journalName: string): string => {
  // First check for exact match
  if (journalAbbreviations[journalName]) {
    return journalAbbreviations[journalName];
  }

  // Check for case-insensitive match
  const lowerJournalName = journalName.toLowerCase();
  const match = Object.entries(journalAbbreviations).find(
    ([key]) => key.toLowerCase() === lowerJournalName
  );

  if (match) {
    return match[1];
  }

  // If no match is found, return the original name
  return journalName;
};

// Helper function to clean up journal names
export const cleanJournalName = (journalName: string): string => {
  // Remove any trailing periods
  let cleaned = journalName.trim().replace(/\.+$/, "");

  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned;
};
