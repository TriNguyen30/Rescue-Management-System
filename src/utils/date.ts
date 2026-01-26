import { format } from "date-fns";

export const formatDate = (date: string, typeFormat: string = "dd/MM/yyyy"): string => {
  if (date === "") {
    return "";
  }
  return format(new Date(date), typeFormat);
};
