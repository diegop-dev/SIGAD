import { useState } from "react";
import { Academias } from "./Academias";
import { AltaAcademia } from "./AltaAcademia";

export const AcademiaManagement = () => {
  const [vista, setVista] = useState("lista");
  const [academiaSeleccionada, setAcademiaSeleccionada] = useState(null);

  const handleNueva = () => {
    setAcademiaSeleccionada(null);
    setVista("form");
  };

  const handleEditar = (academia) => {
    setAcademiaSeleccionada(academia);
    setVista("form");
  };

  const handleVolver = () => {
    setAcademiaSeleccionada(null);
    setVista("lista");
  };

  return (
    <>
      {vista === "lista" && (
        <Academias 
          onNueva={handleNueva}
          onEditar={handleEditar} 
        />
      )}

      {vista === "form" && (
        <AltaAcademia
          academiaToEdit={academiaSeleccionada}
          onBack={handleVolver}
          onSuccess={handleVolver}
        />
      )}
    </>
  );
};