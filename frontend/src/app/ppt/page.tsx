"use client";

import { useGeneratePPT } from "@/hooks/usePPT";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "react-hot-toast";

export default function PPTPage() {
  const router = useRouter();
  const { setPPTData } = useAppStore();
  const mutation = useGeneratePPT();

  const handleSubmit = async () => {
    try {
      const res = await mutation.mutateAsync({
        topic: "AI",
        slides: 5,
        course: "CSE",
      });

      setPPTData(res.data);
      router.push("/ppt/view");
    } catch (err) {
      toast.error("Failed to generate PPT");
    }
  };

  return (
    <button onClick={handleSubmit}>
      {mutation.isPending ? "Generating..." : "Generate PPT"}
    </button>
  );
}