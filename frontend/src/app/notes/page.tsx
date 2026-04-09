"use client";

import { useState } from "react";
import axios from "axios";

export default function NotesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<any>(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file!);

    const res = await axios.post("http://localhost:3000/document/upload", formData);

    const notesRes = await axios.post("http://localhost:3000/tutor/generate-notes", {
      docId: res.data.docId,
    });

    setNotes(notesRes.data);
  };

  return (
    <div className="p-6">
      <input type="file" onChange={(e) => setFile(e.target.files![0])} />
      <button onClick={handleUpload}>Generate Notes</button>

      {notes && (
        <div>
          {notes.notes.map((n: any, i: number) => (
            <div key={i}>
              <h2>{n.heading}</h2>
              <p>{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}