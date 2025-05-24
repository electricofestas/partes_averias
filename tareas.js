// Variables globales
let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
let tareaAEditarId = null; // ID de la tarea a editar

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tareaForm");
  const toggleHistorialBtn = document.getElementById("toggleHistorial");
  const fotosInput = document.getElementById("fotos");

  // Inicializar salas por defecto
  let salas = JSON.parse(localStorage.getItem("salas")) || [
    "Comida", "Inst. Sanchez", "Central", "Edificio-Vecindario", "Finca_Telde", "Nave Arinaga",
    "Sala La Mareta", "Sala 7 Palmas", "Sala San Telmo", "Sala Tamaraceite", "Sala Galdar",
    "Sala Arinaga", "Sala Sol y Sombra", "Sala Kasbah", "Sala Pama Cita", "Sala Traiña",
    "Sala Puerto Rico", "Sala Mogán Mall", "Sala Mogán"
  ];

  // Llenar datalist y filtro
  const salasList = document.getElementById("salasList");
  salas.forEach(sala => {
    const option = document.createElement("option");
    option.value = sala;
    salasList.appendChild(option);
  });
  const salaFiltro = document.getElementById("salaFiltro");
  salas.forEach(sala => {
    const option = document.createElement("option");
    option.value = sala;
    option.textContent = sala;
    salaFiltro.appendChild(option);
  });

  salaFiltro.addEventListener("change", actualizarHistorial);
  form.addEventListener("submit", guardarTarea);
  toggleHistorialBtn.addEventListener("click", toggleHistorial);
  fotosInput.addEventListener("change", mostrarPreviewFotos);

  actualizarHistorial();
});

// Guardar o editar tarea
function guardarTarea(e) {
  e.preventDefault();

  const sala = document.getElementById("titulo").value;
  const prioridad = document.getElementById("prioridad").value;
  const fecha = document.getElementById("fecha").value;
  const horaInicio = document.getElementById("horaInicio").value;
  const horaFin = document.getElementById("horaFin").value;
  const descripcion = document.getElementById("descripcion").value;
  const fotosInput = document.getElementById("fotos");
  const fotosPromises = Array.from(fotosInput.files).map(file => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  });

  Promise.all(fotosPromises).then(nuevasFotosBase64 => {
    const tareaActualizada = {
      sala, prioridad, fecha, horaInicio, horaFin, descripcion,
      fotos: nuevasFotosBase64
    };

    if (tareaAEditarId !== null) {
      const indice = tareas.findIndex(tarea => tarea.id == tareaAEditarId);
      if (indice !== -1) {
        tareas[indice] = { id: tareaAEditarId, ...tareaActualizada };
        mostrarMensaje("Tarea editada correctamente", "success");
      }
      tareaAEditarId = null;
      document.getElementById('btnGuardarTarea').textContent = "Guardar Tarea";
    } else {
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

// Mostrar/ocultar historial
function toggleHistorial() {
  const historialContainer = document.getElementById("historialContainer");
  const btn = document.getElementById("toggleHistorial");
  const visible = historialContainer.style.display === "block";
  historialContainer.style.display = visible ? "none" : "block";
  btn.textContent = visible ? "Mostrar Historial" : "Ocultar Historial";
  if (!visible) actualizarHistorial();
}

// Actualizar historial de tareas
function actualizarHistorial() {
  const historialTareas = document.getElementById("historialTareas");
  const salaFiltro = document.getElementById("salaFiltro").value || "";
  historialTareas.innerHTML = "";

  tareas
    .filter(tarea => !salaFiltro || tarea.sala === salaFiltro)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .forEach(tarea => {
      const tareaElement = document.createElement("div");
      tareaElement.className = "list-group-item";
      tareaElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="mb-1">${tarea.sala}</h6>
          <span class="badge ${getPrioridadBadgeClass(tarea.prioridad)}">${tarea.prioridad}</span>
        </div>
        <p class="mb-1"><strong>Fecha:</strong> ${new Date(tarea.fecha).toLocaleDateString()}</p>
        <p class="mb-1"><strong>Horario:</strong> ${tarea.horaInicio} - ${tarea.horaFin}</p>
        <p class="mb-1">${tarea.descripcion}</p>
        ${
          tarea.fotos && tarea.fotos.length > 0
            ? `<div class="fotos-container mt-2">
                <div class="d-flex flex-wrap gap-2">
                  ${tarea.fotos.map(foto => `
                    <div class="foto-preview">
                      <img src="${foto}" alt="Foto de la tarea">
                    </div>
                  `).join("")}
                </div>
              </div>`
            : ""
        }
        <div class="d-flex justify-content-end gap-2 mt-2">
          <button class="btn btn-sm btn-primary" onclick="editarRegistro('${tarea.id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarRegistro('${tarea.id}')">Eliminar</button>
        </div>
      `;
      historialTareas.appendChild(tareaElement);
    });
}

// Cargar datos para editar
function editarRegistro(id) {
  const tareaAEditar = tareas.find(tarea => String(tarea.id) === String(id));
  if (tareaAEditar) {
    document.getElementById("titulo").value = tareaAEditar.sala;
    document.getElementById("prioridad").value = tareaAEditar.prioridad;
    document.getElementById("fecha").value = tareaAEditar.fecha;
    document.getElementById("horaInicio").value = tareaAEditar.horaInicio;
    document.getElementById("horaFin").value = tareaAEditar.horaFin;
    document.getElementById("descripcion").value = tareaAEditar.descripcion;

    // Mostrar fotos existentes solo como preview
    const fotosPreview = document.getElementById("fotosPreview");
    fotosPreview.innerHTML = "";
    if (tareaAEditar.fotos && tareaAEditar.fotos.length > 0) {
      tareaAEditar.fotos.forEach(foto => {
        const img = document.createElement("img");
        img.src = foto;
        img.className = "img-thumbnail me-2";
        img.style.maxWidth = "100px";
        fotosPreview.appendChild(img);
      });
    }
    // El input file no se puede pre-rellenar por seguridad
    document.getElementById("fotos").value = "";

    tareaAEditarId = id;
    document.getElementById('btnGuardarTarea').textContent = "Guardar Cambios";

    // Ocultar historial para editar cómodamente si está visible
    const historialContainer = document.getElementById("historialContainer");
    const toggleBtn = document.getElementById("toggleHistorial");
    if (historialContainer && toggleBtn && historialContainer.style.display === "block") {
      historialContainer.style.display = "none";
      toggleBtn.textContent = "Mostrar Historial";
    }
  }
}

// Eliminar tarea
function eliminarRegistro(id) {
  if (confirm("¿Está seguro de que desea eliminar esta tarea?")) {
    tareas = tareas.filter(tarea => String(tarea.id) !== String(id));
    localStorage.setItem("tareas", JSON.stringify(tareas));
    actualizarHistorial();
    mostrarMensaje("Tarea eliminada correctamente", "success");
  }
}

// Mostrar preview de fotos seleccionadas
function mostrarPreviewFotos(e) {
  const fotosPreview = document.getElementById("fotosPreview");
  fotosPreview.innerHTML = "";
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "img-thumbnail me-2";
      img.style.maxWidth = "100px";
      fotosPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

// Badge visual según prioridad
function getPrioridadBadgeClass(prioridad) {
  switch ((prioridad || "").toLowerCase()) {
    case "alta": return "bg-danger";
    case "media": return "bg-warning";
    case "baja": return "bg-success";
    default: return "bg-secondary";
  }
}

// Mostrar mensajes de éxito/error
function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
  mensaje.style.display = "block";
  setTimeout(() => {
    mensaje.style.display = "none";
  }, 3000);
}

// Generar informe PDF
function generarPDF() {
  const fechaInicio = document.getElementById("fechaInicioPDF").value;
  const fechaFin = document.getElementById("fechaFinPDF").value;
  const salaSeleccionada = document.getElementById("salaFiltro").value;

  let tareasFiltradas = tareas.filter(tarea => {
    const fechaTarea = new Date(tarea.fecha);
    const inicio = fechaInicio ? new Date(fechaInicio) : null;
    const fin = fechaFin ? new Date(fechaFin) : null;
    return (
      (!inicio || fechaTarea >= inicio) &&
      (!fin || fechaTarea <= fin) &&
      (!salaSeleccionada || tarea.sala === salaSeleccionada)
    );
  });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text("Informe de Tareas", 20, yPos);
  const textWidth = doc.getTextWidth("Informe de Tareas");
  doc.setLineWidth(0.4);
  doc.line(20, yPos + 2, 20 + textWidth, yPos + 2);
  yPos += 10;

  doc.setFontSize(12);
  doc.text(`Período: ${fechaInicio || "Inicio"} - ${fechaFin || "Fin"}`, 20, yPos);
  yPos += 10;
  doc.text(`Sala: ${salaSeleccionada || "Todas"}`, 20, yPos);
  yPos += 20;

  tareasFiltradas.forEach(tarea => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    const salaTexto = tarea.sala;
    doc.text(salaTexto, 20, yPos);
    const salaTextWidth = doc.getTextWidth(salaTexto);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 20 + salaTextWidth, yPos + 2);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Fecha: ${tarea.fecha}`, 30, yPos); yPos += 7;
    doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, 30, yPos); yPos += 7;
    doc.text(`Prioridad: ${tarea.prioridad}`, 30, yPos); yPos += 7;
    doc.text(`Descripción: ${tarea.descripcion}`, 30, yPos); yPos += 20;
  });

  doc.save("informe-tareas.pdf");
}
