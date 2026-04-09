"use client";

export default function Header() {
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="flex justify-between p-4 bg-white dark:bg-gray-800 shadow">
      <h2 className="font-semibold">Dashboard</h2>

      <button
        onClick={toggleDark}
        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
      >
        Toggle Theme
      </button>
    </div>
  );
}