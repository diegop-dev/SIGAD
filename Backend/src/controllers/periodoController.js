const periodoModel = require("../models/periodoModel");

const getPeriodos = async (req,res)=>{

  try{

    const periodos = await periodoModel.getAllPeriodos();

    res.status(200).json(periodos);

  }catch(error){

    console.error("[Error getPeriodos]:",error);

    res.status(500).json({
      error:"Error al consultar periodos"
    });

  }

};

const createPeriodo = async (req,res)=>{

  try{

    const {
      codigo,
      anio,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif
    } = req.body;

    const creado_por = req.user.id_usuario;

    // regla de negocio
    if(new Date(fecha_fin) <= new Date(fecha_inicio)){
      return res.status(400).json({
        error:"La fecha_fin debe ser mayor que fecha_inicio"
      });
    }

    const result = await periodoModel.createPeriodo({
      codigo,
      anio,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif,
      creado_por
    });

    res.status(201).json({
      message:"Periodo creado correctamente",
      id_periodo:result.id
    });

  }catch(error){

    console.error("[Error createPeriodo]:",error);

    res.status(500).json({
      error:"Error al crear periodo"
    });

  }

};

const updatePeriodo = async (req,res)=>{

  try{

    const { id } = req.params;

    const {
      codigo,
      anio,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif
    } = req.body;

    const modificado_por = req.user.id_usuario;

    if(new Date(fecha_fin) <= new Date(fecha_inicio)){
      return res.status(400).json({
        error:"La fecha_fin debe ser mayor que fecha_inicio"
      });
    }

    await periodoModel.updatePeriodo(id,{
      codigo,
      anio,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif,
      modificado_por
    });

    res.status(200).json({
      message:"Periodo actualizado correctamente"
    });

  }catch(error){

    console.error("[Error updatePeriodo]:",error);

    res.status(500).json({
      error:"Error al actualizar periodo"
    });

  }

};

const deletePeriodo = async (req,res)=>{

  try{

    const { id } = req.params;

    const eliminado_por = req.user.id_usuario;

    await periodoModel.inactivarPeriodo(id,eliminado_por);

    res.status(200).json({
      message:"Periodo inactivado correctamente"
    });

  }catch(error){

    console.error("[Error deletePeriodo]:",error);

    res.status(500).json({
      error:"Error al eliminar periodo"
    });

  }

};
  
const togglePeriodo = async (req,res)=>{

  try{

    const { id } = req.params;

    const toggled_by = req.user.id_usuario;

    await periodoModel.togglePeriodo(id,toggled_by);

    res.status(200).json({
      message:"Periodo actualizado correctamente"
    });

  }catch(error){

    console.error("[Error togglePeriodo]:",error);

    res.status(500).json({
      error:"Error al actualizar periodo"
    });

  }

};
        
module.exports = {
  getPeriodos,
  createPeriodo,
  updatePeriodo,
  deletePeriodo,
  togglePeriodo
};