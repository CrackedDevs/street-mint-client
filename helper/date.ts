import { parse, format } from "date-fns";

export const formatDate = (
  date: string,
  formatDate: string = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  parseFormat: string = "yyyy-MM-dd'T'HH:mm",
) => {
  if (!date) return "";
  const parsedDate = parse(date, parseFormat, new Date());
  const formattedDate = format(parsedDate, formatDate);

  return formattedDate;
};

// 2025-02-26T00:02
