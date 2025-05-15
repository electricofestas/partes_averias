// Variables globales
let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
let historialVisible = false;
let tareaAEditarId = null; // Variable para rastrear el ID de la tarea que se está editando

// Función para inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar elementos
  const form = document.getElementById("tareaForm");
  const toggleHistorialBtn = document.getElementById("toggleHistorial");
  const historialContainer = document.getElementById("historialContainer");
  const fotosInput = document.getElementById("fotos");
  const fotosPreview = document.getElementById("fotosPreview");

  // Cargar salas desde localStorage o inicializar si no existen
  let salas = JSON.parse(localStorage.getItem("salas")) || [
    "Nave Arinaga ",
    "Sala La Mareta",
    "Sala 7 Palmas",
    "Sala San Telmo",
    "Sala Tamaraceite",
    "Sala Galdar",
    "Sala Arinaga",
    "Sala Sol y Sombra",
    "Sala Kasbah",
    "Sala Pama Cita",
    "Sala Traiña",
    "Sala Puerto Rico",
    "Sala Mogán Mall",
    "Sala Mogán"
  ];

  // Llenar el datalist de salas
  const salasList = document.getElementById("salasList");
  salas.forEach((sala) => {
    const option = document.createElement("option");
    option.value = sala;
    salasList.appendChild(option);
  });

  // Llenar el select de salas para el filtro
  const salaFiltro = document.getElementById("salaFiltro");
  salas.forEach((sala) => {
    const option = document.createElement("option");
    option.value = sala;
    option.textContent = sala;
    salaFiltro.appendChild(option);
  });

  // Event Listeners
  form.addEventListener("submit", guardarTarea);
  toggleHistorialBtn.addEventListener("click", toggleHistorial);
  fotosInput.addEventListener("change", mostrarPreviewFotos);

  // Cargar historial inicial
  actualizarHistorial();
});

// Función para guardar una nueva tarea o editar una existente
function guardarTarea(e) {
  e.preventDefault();

  const sala = document.getElementById("titulo").value;
  const prioridad = document.getElementById("prioridad").value;
  const fecha = document.getElementById("fecha").value;
  const horaInicio = document.getElementById("horaInicio").value;
  const horaFin = document.getElementById("horaFin").value;
  const descripcion = document.getElementById("descripcion").value;
  const fotosInput = document.getElementById("fotos");
  const fotosPromises = Array.from(fotosInput.files).map((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  });

  Promise.all(fotosPromises).then((nuevasFotosBase64) => {
    const tareaActualizada = {
      sala: sala,
      prioridad: prioridad,
      fecha: fecha,
      horaInicio: horaInicio,
      horaFin: horaFin,
      descripcion: descripcion,
      fotos: nuevasFotosBase64 // Se llenará con las fotos convertidas a Base64
    };

    if (tareaAEditarId !== null) {
       console.log("Entrando en el bloque de edición.");
      // Editar tarea existente
      const indice = tareas.findIndex((tarea) => tarea.id === tareaAEditarId);
      console.log("Índice de la tarea a editar:", indice);
      if (indice !== -1) {
          tareas[indice] = { id: tareaAEditarId, ...tareaActualizada };
          mostrarMensaje("Tarea editada correctamente", "success");
          console.log("Tareas después de la edición:", tareas);
          localStorage.setItem("tareas", JSON.stringify(tareas));
          actualizarHistorial(); 
          tareaAEditarId = null; // Resetear el ID de edición
      const guardarBtn = document.querySelector('button[type="submit"]');
      if (guardarBtn) {
        guardarBtn.textContent = "Guardar Tarea"; // Restablecer el texto del botón
      }
    } else {
        console.log("No se encontró la tarea con ID:", tareaAEditarId, "en el array tareas para editar.");
       }
   } else {
      // Guardar nueva tarea
      const nuevaTarea = { id: Date.now(), ...tareaActualizada };
      tareas.push(nuevaTarea);
      mostrarMensaje("Tarea guardada correctamente", "success");
    }

    localStorage.setItem("tareas", JSON.stringify(tareas));
    document.getElementById("tareaForm").reset();
    document.getElementById("fotosPreview").innerHTML = "";
    actualizarHistorial();
  });
}

// Función para mostrar/ocultar el historial
function toggleHistorial() {
  const historialContainer = document.getElementById("historialContainer");
  const toggleBtn = document.getElementById("toggleHistorial");

  if (!historialContainer || !toggleBtn) {
    console.error("No se encontraron los elementos necesarios");
    return;
  }

  historialContainer.style.display =
    historialContainer.style.display === "none" ? "block" : "none";
  toggleBtn.textContent =
    historialContainer.style.display === "block"
      ? "Ocultar Historial"
      : "Mostrar Historial";
  actualizarHistorial();
}

// Función para actualizar el historial
function actualizarHistorial() {
  const historialTareas = document.getElementById("historialTareas");
  historialTareas.innerHTML = "";

  tareas
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .forEach((tarea) => {
      const tareaElement = document.createElement("div");
      tareaElement.className = "list-group-item";
      tareaElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-1">${tarea.sala}</h6>
                    <span class="badge ${getPrioridadBadgeClass(
                      tarea.prioridad
                    )}">${tarea.prioridad}</span>
                </div>
                <p class="mb-1"><strong>Fecha:</strong> ${new Date(
                  tarea.fecha
                ).toLocaleDateString()}</p>
                <p class="mb-1"><strong>Horario:</strong> ${
                  tarea.horaInicio
                } - ${tarea.horaFin}</p>
                <p class="mb-1">${tarea.descripcion}</p>
                ${
                  tarea.fotos && tarea.fotos.length > 0
                    ? `
                    <div class="fotos-container mt-2">
                        <div class="d-flex flex-wrap gap-2">
                            ${tarea.fotos
                              .map(
                                (foto) => `
                                    <div class="foto-preview">
                                        <img src="${foto}" alt="Foto de la tarea">
                                    </div>
                                `
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }
                <div class="d-flex justify-content-end gap-2 mt-2">
                    <button class="btn btn-sm btn-primary" onclick="editarRegistro('${
                      tarea.id
                    }')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarRegistro('${
                      tarea.id}')">Eliminar</button>
                </div>
            `;
      historialTareas.appendChild(tareaElement);
    });
}

// Función para cargar los datos de una tarea en el formulario para editar

function editarRegistro(id) {
  console.log("Función editarRegistro llamada con ID:", id, typeof id);
  const tareaAEditar = tareas.find((tarea) => String(tarea.id) === String(id));
  if (tareaAEditar) {
    document.getElementById("titulo").value = tareaAEditar.sala;
    document.getElementById("prioridad").value = tareaAEditar.prioridad;
    document.getElementById("fecha").value = tareaAEditar.fecha;
    document.getElementById("horaInicio").value = tareaAEditar.horaInicio;
    document.getElementById("horaFin").value = tareaAEditar.horaFin;
    document.getElementById("descripcion").value = tareaAEditar.descripcion;

    // Limpiar la preview de fotos
    document.getElementById("fotosPreview").innerHTML = "";

    tareaAEditarId = id;

    const guardarBtn = document.querySelector('button[type="submit"]');
    if (guardarBtn) {
      guardarBtn.textContent = "Guardar Cambios";
    }

    const historialContainer = document.getElementById("historialContainer");
    const toggleBtn = document.getElementById("toggleHistorial");
    if (
      historialContainer &&
      toggleBtn &&
      historialContainer.style.display === "block"
    ) {
      historialContainer.style.display = "none";
      toggleBtn.textContent = "Mostrar Historial";
    }
  } else {
    console.log(`No se encontró la tarea con ID: ${id} para editar.`);
  }
}

// Función para eliminar una tarea
function eliminarRegistro(id) {
    console.log("Intentando eliminar tarea con ID:", id);
    console.log("Tareas antes de filtrar:", tareas);
  if (confirm("¿Está seguro de que desea eliminar esta tarea?")) {
    tareas = tareas.filter((tarea) => String(tarea.id) !== String(id)); // Forzar comparación como strings
    console.log("Tareas después de filtrar:", tareas);
    localStorage.setItem("tareas", JSON.stringify(tareas));
    actualizarHistorial();
    mostrarMensaje("Tarea eliminada correctamente", "success");
    } else {
     console.log("Eliminación cancelada por el usuario.");
  }
}

// Función para mostrar preview de fotos
function mostrarPreviewFotos(e) {
  const fotosPreview = document.getElementById("fotosPreview");
  fotosPreview.innerHTML = "";

  Array.from(e.target.files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "img-thumbnail";
      img.style.maxWidth = "100px";
      fotosPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

// Función auxiliar para obtener la clase de badge según la prioridad
function getPrioridadBadgeClass(prioridad) {
  switch (prioridad.toLowerCase()) {
    case "alta":
      return "bg-danger";
    case "media":
      return "bg-warning";
    case "baja":
      return "bg-success";
    default:
      return "bg-secondary";
  }
}

// Función para mostrar mensajes
function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
  mensaje.style.display = "block";

  setTimeout(() => {
    mensaje.style.display = "none";
  }, 3000);
}

// Función para generar PDF
function generarPDF() {
  const fechaInicio = document.getElementById("fechaInicioPDF").value;
  const fechaFin = document.getElementById("fechaFinPDF").value;
  const salaSeleccionada = document.getElementById("salaFiltro").value;

  let tareasFiltradas = tareas.filter((tarea) => {
    const fechaTarea = new Date(tarea.fecha);
    const inicio = fechaInicio ? new Date(fechaInicio) : null;
    const fin = fechaFin ? new Date(fechaFin) : null;

    return (
      (!inicio || fechaTarea >= inicio) &&
      (!fin || fechaTarea <= fin) &&
      (!salaSeleccionada || tarea.sala === salaSeleccionada)
    );
  });

  const doc = new jsPDF();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text("Informe de Tareas", 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.text(
    `Período: ${fechaInicio || "Inicio"} - ${fechaFin || "Fin"}`,
    20,
    yPos
  );
  yPos += 10;
  doc.text(`Sala: ${salaSeleccionada || "Todas"}`, 20, yPos);
  yPos += 20;

  tareasFiltradas.forEach((tarea) => {
    // Verificar si necesitamos una nueva página
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text(`Sala: ${tarea.sala}`, 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Fecha: ${tarea.fecha}`, 30, yPos);
    yPos += 7;
    doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, 30, yPos);
    yPos += 7;
    doc.text(`Prioridad: ${tarea.prioridad}`, 30, yPos);
    yPos += 7;
    doc.text(`Descripción: ${tarea.descripcion}`, 30, yPos);
    yPos += 20;
  });

  doc.save("informe-tareas.pdf");
}
