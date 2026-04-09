import { useMutation } from "@tanstack/react-query";
import { generatePPT } from "@/services/tutor.api";

export const useGeneratePPT = () => {
  return useMutation({
    mutationFn: generatePPT,
  });
};