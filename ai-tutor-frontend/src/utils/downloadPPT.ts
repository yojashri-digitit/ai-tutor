export const downloadPPT = (filePath: string) => {
  const url = `http://localhost:5000/tutor/download?file=${encodeURIComponent(filePath)}`;
  window.open(url);
};