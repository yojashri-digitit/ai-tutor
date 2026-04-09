"use client";

import { useAppStore } from "@/store/useAppStore";

export default function PPTView() {
  const { pptData } = useAppStore();

  if (!pptData) return <p>No data</p>;

  return <div>{pptData.title}</div>;
}