import { useMutation } from "@tanstack/react-query";
import { generateNotes } from "@/services/document.api";

export const useGenerateNotes = () => {
  return useMutation({
    mutationFn: generateNotes,
  });
};