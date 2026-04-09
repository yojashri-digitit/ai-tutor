import { api } from "./api";

export const generatePPT = (data: any) =>
  api.post("/tutor/generate-ppt", data);

export const explainSlide = (data: any) =>
  api.post("/tutor/explain-slide", data);

export const generateQuiz = (data: any) =>
  api.post("/tutor/generate-quiz", data);

export const chat = (data: any) =>
  api.post("/tutor/chat", data);