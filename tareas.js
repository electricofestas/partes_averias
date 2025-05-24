// Variables globales
let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
let tareaAEditarId = null;
let fotosPreviasEdicion = [];

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
    let fotosFinal = nuevasFotosBase64;
    if (tareaAEditarId !== null) {
      // Añade las fotos anteriores si existen
      fotosFinal = fotosPreviasEdicion.concat(nuevasFotosBase64);
    }

    const tareaActualizada = {
      sala, prioridad, fecha, horaInicio, horaFin, descripcion,
      fotos: fotosFinal
    };

    if (tareaAEditarId !== null) {
      const indice = tareas.findIndex(tarea => tarea.id == tareaAEditarId);
      if (indice !== -1) {
        tareas[indice] = { id: tareaAEditarId, ...tareaActualizada };
        mostrarMensaje("Tarea editada correctamente", "success");
      }
      tareaAEditarId = null;
      fotosPreviasEdicion = [];
      document.querySelector('#tareaForm button[type="submit"]').textContent = "Guardar Tarea";
    } else {
      const nuevaTarea = { id: Date.now(), ...tareaActualizada };
      tareas.push(nuevaTarea);
      mostrarMensaje("Tarea guardada correctamente", "success");
    }

    localStorage.setItem("tareas", JSON.stringify(tareas));

    limpiarFormulario();

    actualizarHistorial();
  });
}

function limpiarFormulario() {
  const form = document.getElementById("tareaForm");
  form.reset();
  document.getElementById("titulo").value = "";
  document.getElementById("prioridad").selectedIndex = 0;
  document.getElementById("fecha").value = "";
  document.getElementById("horaInicio").value = "";
  document.getElementById("horaFin").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("fotos").value = "";
  document.getElementById("fotosPreview").innerHTML = "";
  form.classList.remove("was-validated");
  fotosPreviasEdicion = [];
}

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
      const fotosHTML = (tarea.fotos && tarea.fotos.length > 0) ?
        `<form onsubmit="return false;" class="form-borrar-fotos" data-tarea-id="${tarea.id}">
            <div class="fotos-container mt-2 d-flex flex-wrap gap-2">
              ${tarea.fotos.map((foto, idx) => `
                <div class="foto-preview position-relative" style="display:inline-block;">
                  <img src="${foto}" alt="Foto de la tarea" class="img-thumbnail" style="max-width:100px;">
                  <div style="position:absolute;top:2px;right:2px;">
                    <input type="checkbox" class="form-check-input borrar-foto-chk" data-foto-idx="${idx}">
                  </div>
                </div>
              `).join("")}
            </div>
            <button type="button" class="btn btn-sm btn-danger mt-2 borrar-fotos-btn">Borrar seleccionadas</button>
        </form>` : "";

      tareaElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="mb-1">${tarea.sala}</h6>
          <span class="badge ${getPrioridadBadgeClass(tarea.prioridad)}">${tarea.prioridad}</span>
        </div>
        <p class="mb-1"><strong>Fecha:</strong> ${new Date(tarea.fecha).toLocaleDateString()}</p>
        <p class="mb-1"><strong>Horario:</strong> ${tarea.horaInicio} - ${tarea.horaFin}</p>
        <p class="mb-1">${tarea.descripcion}</p>
        ${fotosHTML}
        <div class="d-flex justify-content-end gap-2 mt-2">
          <button class="btn btn-sm btn-primary" onclick="editarRegistro('${tarea.id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarRegistro('${tarea.id}')">Eliminar</button>
        </div>
      `;
      historialTareas.appendChild(tareaElement);
    });

  // Asignar listeners a todos los formularios de borrar fotos
  document.querySelectorAll(".form-borrar-fotos").forEach(form => {
    form.querySelector(".borrar-fotos-btn").onclick = function () {
      const tareaId = form.getAttribute("data-tarea-id");
      const checks = form.querySelectorAll(".borrar-foto-chk");
      const indicesABorrar = [];
      checks.forEach((chk, idx) => {
        if (chk.checked) indicesABorrar.push(idx);
      });
      if (indicesABorrar.length === 0) {
        mostrarMensaje("Selecciona al menos una foto para borrar.", "warning");
        return;
      }
      if (confirm("¿Seguro que quieres borrar las fotos seleccionadas?")) {
        borrarFotosDeTarea(tareaId, indicesABorrar);
      }
    };
  });
}

function borrarFotosDeTarea(tareaId, indicesABorrar) {
  const tareaIdx = tareas.findIndex(t => String(t.id) === String(tareaId));
  if (tareaIdx === -1) return;
  // Borra fotos según los índices (de mayor a menor para no desordenar)
  indicesABorrar.sort((a, b) => b - a)
    .forEach(idx => tareas[tareaIdx].fotos.splice(idx, 1));
  localStorage.setItem("tareas", JSON.stringify(tareas));
  mostrarMensaje("Fotos borradas correctamente.", "success");
  actualizarHistorial();
}

function editarRegistro(id) {
  const tareaAEditar = tareas.find(tarea => String(tarea.id) === String(id));
  if (tareaAEditar) {
    document.getElementById("titulo").value = tareaAEditar.sala;
    document.getElementById("prioridad").value = tareaAEditar.prioridad;
    document.getElementById("fecha").value = tareaAEditar.fecha;
    document.getElementById("horaInicio").value = tareaAEditar.horaInicio;
    document.getElementById("horaFin").value = tareaAEditar.horaFin;
    document.getElementById("descripcion").value = tareaAEditar.descripcion;

    fotosPreviasEdicion = tareaAEditar.fotos ? [...tareaAEditar.fotos] : [];
    const fotosPreview = document.getElementById("fotosPreview");
    fotosPreview.innerHTML = "";
    if (fotosPreviasEdicion.length > 0) {
      fotosPreviasEdicion.forEach(foto => {
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

    const historialContainer = document.getElementById("historialContainer");
    if (!historialContainer.classList.contains("d-none")) {
      historialContainer.classList.add("d-none");
      document.getElementById("toggleHistorial").textContent = "Mostrar Historial";
    }
  }
}

function eliminarRegistro(id) {
  if (confirm("¿Está seguro de que desea eliminar esta tarea?")) {
    tareas = tareas.filter(tarea => String(tarea.id) !== String(id));
    localStorage.setItem("tareas", JSON.stringify(tareas));
    actualizarHistorial();
    mostrarMensaje("Tarea eliminada correctamente", "success");
  }
}

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

function getPrioridadBadgeClass(prioridad) {
  switch ((prioridad || "").toLowerCase()) {
    case "alta": return "bg-danger";
    case "media": return "bg-warning";
    case "baja": return "bg-success";
    default: return "bg-secondary";
  }
}

function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
  mensaje.style.display = "block";
  setTimeout(() => {
    mensaje.style.display = "none";
  }, 3000);
}
