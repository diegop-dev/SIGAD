
module.exports = (sequelize, DataTypes) => {
  const Periodo = sequelize.define("Periodo", {
    id_periodo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    periodo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_limite_calif: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estatus: {
      type: DataTypes.STRING,
      defaultValue: "ACTIVO",
    },
    creado_por: {
      type: DataTypes.INTEGER,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
    },
    modificado_por: {
      type: DataTypes.INTEGER,
    },
    fecha_modificacion: {
      type: DataTypes.DATE,
    },
    eliminado_por: {
      type: DataTypes.INTEGER,
    },
    fecha_eliminacion: {
      type: DataTypes.DATE,
    },
  });

  return Periodo;
};