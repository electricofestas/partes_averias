// Variables globales
let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
let tareaAEditarId = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tareaForm");
  const toggleHistorialBtn = document.getElementById("toggleHistorial");
  const fotosInput = document.getElementById("fotos");

  // Salas por defecto
  let salas = JSON.parse(localStorage.getItem("salas")) || [
    "Comida", "Inst. Sanchez", "Central", "Edificio-Vecindario", "Finca_Telde", "Nave Arinaga",
    "Sala La Mareta", "Sala 7 Palmas", "Sala San Telmo", "Sala Tamaraceite", "Sala Galdar",
    "Sala Arinaga", "Sala Sol y Sombra", "Sala Kasbah", "Sala Pama Cita", "Sala Traiña",
    "Sala Puerto Rico", "Sala Mogán Mall", "Sala Mogán"
  ];

  // Llenar datalist y filtro de salas
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

// Guardar o editar tarea (admite varias fotos)
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
      document.querySelector('#tareaForm button[type="submit"]').textContent = "Guardar Tarea";
    } else {
      const nuevaTarea = { id: Date.now(), ...tareaActualizada };
      tareas.push(nuevaTarea);
      mostrarMensaje("Tarea guardada correctamente", "success");
    }

    localStorage.setItem("tareas", JSON.stringify(tareas));

    // Limpieza completa, compatible móvil y escritorio:
    limpiarFormulario();

    actualizarHistorial();
  });
}

// Limpia todos los campos del formulario, incluyendo manualmente los controles en móviles
function limpiarFormulario() {
  const form = document.getElementById("tareaForm");
  form.reset();

  // Limpieza manual de los campos para máxima compatibilidad móvil
  document.getElementById("titulo").value = "";
  document.getElementById("prioridad").selectedIndex = 0;
  document.getElementById("fecha").value = "";
  document.getElementById("horaInicio").value = "";
  document.getElementById("horaFin").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("fotos").value = "";

  document.getElementById("fotosPreview").innerHTML = "";

  // Si el formulario tuviera validación visual, la quitamos:
  form.classList.remove("was-validated");
}

// Mostrar/ocultar historial con Bootstrap d-none
function toggleHistorial() {
  const historialContainer = document.getElementById("historialContainer");
  const visible = !historialContainer.classList.contains("d-none");
  if (visible) {
    historialContainer.classList.add("d-none");
    document.getElementById("toggleHistorial").textContent = "Mostrar Historial";
  } else {
    historialContainer.classList.remove("d-none");
    document.getElementById("toggleHistorial").textContent = "Ocultar Historial";
    actualizarHistorial();
  }
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
            ? `<div class="fotos-container mt-2 d-flex flex-wrap gap-2">
                  ${tarea.fotos.map(foto => `
                    <div class="foto-preview">
                      <img src="${foto}" alt="Foto de la tarea" class="img-thumbnail" style="max-width:100px;">
                    </div>
                  `).join("")}
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
    document.getElementById("fotos").value = "";

    tareaAEditarId = id;
    document.querySelector('#tareaForm button[type="submit"]').textContent = "Guardar Cambios";

    // Ocultar historial para editar cómodamente si está visible
    const historialContainer = document.getElementById("historialContainer");
    if (!historialContainer.classList.contains("d-none")) {
      historialContainer.classList.add("d-none");
      document.getElementById("toggleHistorial").textContent = "Mostrar Historial";
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

// Mostrar preview de todas las fotos seleccionadas
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

// Generar informe PDF (con imágenes)
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  doc.setFontSize(16);
  doc.text("Informe de Tareas", margin, yPos);
  const textWidth = doc.getTextWidth("Informe de Tareas");
  doc.setLineWidth(0.4);
  doc.line(margin, yPos + 2, margin + textWidth, yPos + 2);
  yPos += 10;

  doc.setFontSize(12);
  doc.text(`Período: ${fechaInicio || "Inicio"} - ${fechaFin || "Fin"}`, margin, yPos);
  yPos += 10;
  doc.text(`Sala: ${salaSeleccionada || "Todas"}`, margin, yPos);
  yPos += 20;

  tareasFiltradas.forEach(tarea => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    const salaTexto = tarea.sala;
    doc.text(salaTexto, margin, yPos);
    const salaTextWidth = doc.getTextWidth(salaTexto);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + salaTextWidth, yPos + 2);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Fecha: ${tarea.fecha}`, margin + 10, yPos); yPos += 7;
    doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, margin + 10, yPos); yPos += 7;
    doc.text(`Prioridad: ${tarea.prioridad}`, margin + 10, yPos); yPos += 7;
    doc.text(`Descripción: ${tarea.descripcion}`, margin + 10, yPos); yPos += 10;

    // Añadir imágenes
    if (tarea.fotos && tarea.fotos.length > 0) {
      doc.setFontSize(11);
      doc.text("Fotos:", margin + 10, yPos); yPos += 5;

      let imgX = margin + 15;
      let imgY = yPos;
      const maxImgWidth = 40;
      const maxImgHeight = 40;
      const spacing = 5;

      tarea.fotos.forEach((foto, idx) => {
        if (imgX + maxImgWidth > doc.internal.pageSize.getWidth() - margin) {
          imgX = margin + 15;
          imgY += maxImgHeight + spacing;
        }
        if (imgY + maxImgHeight > pageHeight - 20) {
          doc.addPage();
          imgY = 20;
          imgX = margin + 15;
        }
        try {
          doc.addImage(foto, "JPEG", imgX, imgY, maxImgWidth, maxImgHeight);
        } catch (e) {
          try {
            doc.addImage(foto, "PNG", imgX, imgY, maxImgWidth, maxImgHeight);
          } catch (e2) {}
        }
        imgX += maxImgWidth + spacing;
      });
      yPos = imgY + maxImgHeight + 10;
    } else {
      yPos += 10;
    }
  });

  doc.save("informe-tareas.pdf");
}
