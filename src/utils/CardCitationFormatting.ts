import { getJournalAbbreviation } from "@/utils/journalAbbreviations";

export const formatAuthors = (authors: string[]): string => {
  if (authors.length === 0) return "Unknown Authors";
  
  const formatName = (author: string) => {
    const [lastName, ...firstNames] = author.split(",");
    const initial = firstNames.join(" ").trim().charAt(0);
    return `${lastName.trim()}${initial ? ` ${initial}` : ""}`;
  };

  return `${formatName(authors[0])} ... and ${formatName(authors[authors.length - 1])}.`;
};

export const formatDate = (date: string): string => {
  // Match patterns like "2024 May 7", "2023 May", "2024 Mar 1"
  const match = date.match(/(\d{4})\s+([A-Za-z]+)(?:\s+\d+)?/);
  if (match) {
    const [_, year, month] = match;
    return `${year} ${month}`;
  }
  return date; // Return original if no match
};

export const getCitation = (
  style: string,
  {
    authors,
    title,
    journal,
    date,
    doi,
  }: {
    authors: string[];
    title: string;
    journal: string;
    date: string;
    doi: string | null;
  }
): string => {
  const authorLastName = authors?.[0]?.split(",")[0].trim() || "Unknown";
  const year = date?.match(/\d{4}/)?.[0] || "";

  switch (style) {
    case "NLM":
      // Get first 6 authors or all if less than 6
      const authorList = authors
        .slice(0, 6)
        .map((author) => {
          const [lastName, ...firstNames] = author.split(",");
          // Convert first names to initials without periods between them
          const initials = firstNames
            .join(" ")
            .trim()
            .split(/\s+/)
            .map((name) => name.charAt(0))
            .join("");
          return `${lastName.trim()}${initials ? " " + initials : ""}`;
        })
        .join(", ");

      // Add "et al." if there are more than 6 authors
      const authorString =
        authors.length > 6 ? `${authorList}, et al` : authorList;

      // Use PubMed abbreviated journal name if available, otherwise use full name
      const journalName = getJournalAbbreviation(journal);

      // Remove any double periods and ensure proper spacing
      return `${authorString}. ${title.replace(
        /\.+$/,
        ""
      )}. ${journalName}. ${year}${doi ? `. doi: ${doi}` : ""}`;
    case "Chicago":
      return `${authorLastName} et al., "${title}," ${journal} (${year}).${
        doi ? ` doi:${doi}` : ""
      }`;
    case "Harvard":
      return `${authorLastName} et al. (${year}) '${title}', ${journal}.${
        doi ? ` doi:${doi}` : ""
      }`;
    case "MLA":
      return `${authorLastName}, et al. "${title}." ${journal}, ${year}.${
        doi ? ` DOI:${doi}` : ""
      }`;
    case "Raw":
      return `${title}\n${authors.join(", ")}\n${journal}\n${date}${
        doi ? `\nDOI: ${doi}` : ""
      }`;
    default:
      return "";
  }
};
