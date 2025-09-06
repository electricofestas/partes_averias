// Variables globales
let db;
let tareaAEditarId = null;

// Inicializar la base de datos IndexedDB
const request = indexedDB.open("TareasDB", 1);

request.onupgradeneeded = function (event) {
  // Se ejecuta si la base de datos no existe o si la versión cambia
  db = event.target.result;
  const objectStore = db.createObjectStore("tareas", {
    keyPath: "id",
    autoIncrement: true
  });
  objectStore.createIndex("fecha", "fecha", { unique: false });
};

request.onsuccess = function (event) {
  db = event.target.result;
  console.log("Base de datos IndexedDB abierta con éxito");
  // Cargar las tareas al iniciar la aplicación
  cargarTareasDesdeDB();
};

request.onerror = function (event) {
  console.error("Error al abrir la base de datos:", event.target.errorCode);
};

// Función para inicializar la aplicación y los Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tareaForm");
  const toggleHistorialBtn = document.getElementById("toggleHistorial");
  const fotosInput = document.getElementById("fotos");

  form.addEventListener("submit", guardarTarea);
  toggleHistorialBtn.addEventListener("click", toggleHistorial);
  fotosInput.addEventListener("change", mostrarPreviewFotos);

  // Cargar salas y opciones de filtro
  let salas = [
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

  const salasList = document.getElementById("salasList");
  salas.forEach((sala) => {
    const option = document.createElement("option");
    option.value = sala;
    salasList.appendChild(option);
  });

  const salaFiltro = document.getElementById("salaFiltro");
  salas.forEach((sala) => {
    const option = document.createElement("option");
    option.value = sala;
    option.textContent = sala;
    salaFiltro.appendChild(option);
  });
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
    const nuevaTarea = {
      sala: sala,
      prioridad: prioridad,
      fecha: fecha,
      horaInicio: horaInicio,
      horaFin: horaFin,
      descripcion: descripcion,
      fotos: nuevasFotosBase64
    };

    const transaction = db.transaction(["tareas"], "readwrite");
    const objectStore = transaction.objectStore("tareas");

    if (tareaAEditarId !== null) {
      // Editar tarea existente
      nuevaTarea.id = tareaAEditarId;
      const requestUpdate = objectStore.put(nuevaTarea);
      requestUpdate.onsuccess = () => {
        mostrarMensaje("Tarea editada correctamente", "success");
        tareaAEditarId = null;
        document.getElementById("tareaForm").reset();
        document.getElementById("fotosPreview").innerHTML = "";
        const guardarBtn = document.querySelector('button[type="submit"]');
        if (guardarBtn) {
          guardarBtn.textContent = "Guardar Tarea";
        }
        cargarTareasDesdeDB();
      };
      requestUpdate.onerror = (event) => {
        console.error("Error al editar la tarea:", event.target.error);
        mostrarMensaje("Error al editar la tarea", "danger");
      };
    } else {
      // Guardar nueva tarea
      const requestAdd = objectStore.add(nuevaTarea);
      requestAdd.onsuccess = () => {
        mostrarMensaje("Tarea guardada correctamente", "success");
        document.getElementById("tareaForm").reset();
        document.getElementById("fotosPreview").innerHTML = "";
        cargarTareasDesdeDB();
      };
      requestAdd.onerror = (event) => {
        console.error("Error al guardar la tarea:", event.target.error);
        mostrarMensaje("Error al guardar la tarea", "danger");
      };
    }
  });
}

// Función para cargar todas las tareas desde IndexedDB
function cargarTareasDesdeDB() {
  const transaction = db.transaction(["tareas"], "readonly");
  const objectStore = transaction.objectStore("tareas");
  const request = objectStore.getAll();

  request.onsuccess = function (event) {
    const tareas = event.target.result;
    actualizarHistorial(tareas);
  };

  request.onerror = function (event) {
    console.error("Error al cargar las tareas:", event.target.error);
  };
}

// Función para mostrar/ocultar el historial
function toggleHistorial() {
  const historialContainer = document.getElementById("historialContainer");
  const toggleBtn = document.getElementById("toggleHistorial");

  historialContainer.style.display =
    historialContainer.style.display === "none" ? "block" : "none";
  toggleBtn.textContent =
    historialContainer.style.display === "block"
      ? "Ocultar Historial"
      : "Mostrar Historial";
  if (historialContainer.style.display === "block") {
    cargarTareasDesdeDB();
  }
}

// Función para actualizar el historial
function actualizarHistorial(tareas) {
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
            <p class="mb-1"><strong>Horario:</strong> ${tarea.horaInicio} - ${
        tarea.horaFin
      }</p>
            <p class="mb-1">${tarea.descripcion}</p>
            ${
              tarea.fotos && tarea.fotos.length > 0
                ? `<div class="fotos-container mt-2 d-flex flex-wrap gap-2">
                    ${tarea.fotos
                      .map(
                        (foto) =>
                          `<div class="foto-preview"><img src="${foto}" alt="Foto de la tarea"></div>`
                      )
                      .join("")}
                   </div>`
                : ""
            }
            <div class="d-flex justify-content-end gap-2 mt-2">
                <button class="btn btn-sm btn-primary" onclick="editarRegistro(${
                  tarea.id
                })">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarRegistro(${
                  tarea.id
                })">Eliminar</button>
            </div>
        `;
      historialTareas.appendChild(tareaElement);
    });
}

// Función para cargar los datos de una tarea en el formulario para editar
function editarRegistro(id) {
  const transaction = db.transaction(["tareas"], "readonly");
  const objectStore = transaction.objectStore("tareas");
  const request = objectStore.get(id);

  request.onsuccess = function (event) {
    const tareaAEditar = event.target.result;
    if (tareaAEditar) {
      document.getElementById("titulo").value = tareaAEditar.sala;
      document.getElementById("prioridad").value = tareaAEditar.prioridad;
      document.getElementById("fecha").value = tareaAEditar.fecha;
      document.getElementById("horaInicio").value = tareaAEditar.horaInicio;
      document.getElementById("horaFin").value = tareaAEditar.horaFin;
      document.getElementById("descripcion").value = tareaAEditar.descripcion;

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
    }
  };
  request.onerror = (event) =>
    console.error("Error al buscar la tarea para editar:", event.target.error);
}

// Función para eliminar una tarea
function eliminarRegistro(id) {
  if (confirm("¿Está seguro de que desea eliminar esta tarea?")) {
    const transaction = db.transaction(["tareas"], "readwrite");
    const objectStore = transaction.objectStore("tareas");
    const request = objectStore.delete(id);

    request.onsuccess = () => {
      mostrarMensaje("Tarea eliminada correctamente", "success");
      cargarTareasDesdeDB();
    };
    request.onerror = (event) => {
      console.error("Error al eliminar la tarea:", event.target.error);
      mostrarMensaje("Error al eliminar la tarea", "danger");
    };
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

  const transaction = db.transaction(["tareas"], "readonly");
  const objectStore = transaction.objectStore("tareas");
  const request = objectStore.getAll();

  request.onsuccess = function (event) {
    const todasLasTareas = event.target.result;
    const tareasFiltradas = todasLasTareas.filter((tarea) => {
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
  };
  request.onerror = (event) =>
    console.error(
      "Error al obtener las tareas para el PDF:",
      event.target.error
    );
}
