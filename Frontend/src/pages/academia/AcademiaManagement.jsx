import { useState } from "react";
import { AltaAcademia } from "./AltaAcademia";

export const AcademiaManagement = () => {
  const [view, setView] = useState("list");

  return (
    <>
      {view === "list" && (
        <div>
          <h1 className="text-2xl font-black mb-4">Academias</h1>

          <button
            onClick={() => setView("create")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
          >
            Nueva Academia
          </button>
        </div>
      )}

      {view === "create" && (
        <AltaAcademia
          onBack={() => setView("list")}
          onSuccess={() => setView("list")}
        />
      )}
    </>
  );
};