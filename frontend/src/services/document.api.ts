import { api } from "./api";

export const uploadDoc = (formData: FormData) =>
  api.post("/document/upload", formData);

export const generateNotes = (data: any) =>
  api.post("/tutor/generate-notes", data);