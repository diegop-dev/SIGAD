import { useState } from "react";
import { Academias } from "./Academias";
import { AltaAcademia } from "./AltaAcademia";

export const AcademiaManagement = () => {

  const [vista, setVista] = useState("lista");

  return (
    <>
      {vista === "lista" && (
        <Academias 
          onNueva={() => setVista("nueva")}
        />
      )}

      {vista === "nueva" && (
        <AltaAcademia
          onBack={() => setVista("lista")}
          onSuccess={() => setVista("lista")}
        />
      )}
    </>
  );
};