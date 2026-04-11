import ReactMarkdown from "react-markdown";

interface Props {
  role: "user" | "ai";
  text: string;
}

export default function Message({ role, text }: Props) {
  return (
    <div
      className={`flex w-full ${
        role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          role === "user"
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border rounded-bl-none"
        }`}
      >
        {/* Markdown support */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}