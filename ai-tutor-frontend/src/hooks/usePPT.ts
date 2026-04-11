// hooks/usePPT.ts
import { useMutation } from "@tanstack/react-query";
import { generatePPT, evaluateSlides } from "@/services/tutor.service";
import toast from "react-hot-toast";
import useAuth from "./useAuth";

export const usePPT = () => {
  const { requireAuth } = useAuth();

  ////////////////////////////////////////////
  // 📊 GENERATE PPT
  ////////////////////////////////////////////
  const generate = useMutation({
    mutationFn: async (data: any) => {
      const isAuth = await requireAuth();
      if (!isAuth) throw new Error("Unauthorized");

      return generatePPT(data);
    },

    onMutate: () => {
      toast.loading("Generating PPT...");
    },

    onSuccess: () => {
      toast.dismiss();
      toast.success("✅ PPT Generated!");
    },

    onError: (err: any) => {
      toast.dismiss();
      toast.error(
        err?.response?.data?.message || "❌ PPT generation failed"
      );
    },
  });

  ////////////////////////////////////////////
  // 📊 EVALUATE PPT
  ////////////////////////////////////////////
  const evaluate = useMutation({
    mutationFn: async (data: any) => {
      const isAuth = await requireAuth();
      if (!isAuth) throw new Error("Unauthorized");

      return evaluateSlides(data);
    },

    onSuccess: () => {
      toast.success("📊 Evaluation completed");
    },

    onError: () => {
      toast.error("❌ Evaluation failed");
    },
  });

  return {
    generate,
    evaluate,
  };
};