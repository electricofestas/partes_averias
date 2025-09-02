/**
 * Main application initialization
 */

// Global variable for room list
let salas = [];

// Global variables for IndexedDB
let db;
let tareaAEditarId = null;
let fotosPreviasEdicion = [];

/**
 * Initialize the application
 */
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Initialize IndexedDB
    initIndexedDB();

    // Get DOM elements
    const form = document.getElementById("tareaForm");
    const toggleHistorialBtn = document.getElementById("toggleHistorial");
    const fotosInput = document.getElementById("fotos");
    const generarPdfBtn = document.getElementById("generarPdfBtn");

    // Load and initialize rooms
    initSalas();

    // Add event listeners
    if (form) form.addEventListener("submit", guardarTarea);
    if (toggleHistorialBtn) toggleHistorialBtn.addEventListener("click", toggleHistorial);
    if (fotosInput) fotosInput.addEventListener("change", mostrarPreviewFotos);

    // PDF generation
    if (generarPdfBtn) {
      generarPdfBtn.addEventListener("click", generarPDF);
    }

    // Initialize form validation
    initFormValidation();

    // Add version information for debugging
    console.log("App version: 2.0.0 (IndexedDB)");
  } catch (error) {
    logError('DOMContentLoaded', error);
    mostrarMensaje("Error al inicializar la aplicación", "danger");
  }
});

/**
 * Initialize IndexedDB
 */
function initIndexedDB() {
  const request = indexedDB.open("TareasDB", 1);

  request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("tareas")) {
      const objectStore = db.createObjectStore("tareas", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("fecha", "fecha", { unique: false });
    }
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Base de datos IndexedDB abierta con éxito");
    // Load tasks after DB is ready
    cargarTareas();
    // Re-bind change event for filter after Salas are loaded
    const salaFiltro = document.getElementById("salaFiltro");
    if (salaFiltro) {
        salaFiltro.addEventListener("change", actualizarHistorial);
    }
  };

  request.onerror = function(event) {
    console.error("Error al abrir la base de datos:", event.target.errorCode);
    mostrarMensaje("Error al conectar con la base de datos local", "danger");
  };
}

/**
 * Initialize rooms list
 */
function initSalas() {
  try {
    salas = JSON.parse(localStorage.getItem("salas")) || [
      "Comida", "Inst. Sanchez", "Central", "Edificio-Vecindario", "Finca_Telde", "Nave Arinaga",
      "Sala La Mareta", "Sala 7 Palmas", "Sala San Telmo", "Sala Tamaraceite", "Sala Galdar",
      "Sala Arinaga", "Sala Sol y Sombra", "Sala Kasbah", "Sala Pama Cita", "Sala Traiña",
      "Sala Puerto Rico", "Sala Mogán Mall", "Sala Mogán"
    ];

    if (!localStorage.getItem("salas")) {
      localStorage.setItem("salas", JSON.stringify(salas));
    }

    const salasList = document.getElementById("salasList");
    if (salasList) {
      salasList.innerHTML = "";
      salas.forEach(sala => {
        const option = document.createElement("option");
        option.value = sala;
        salasList.appendChild(option);
      });
    }

    const salaFiltro = document.getElementById("salaFiltro");
    if (salaFiltro) {
      const firstOption = salaFiltro.querySelector("option");
      salaFiltro.innerHTML = "";
      if (firstOption) {
        salaFiltro.appendChild(firstOption);
      }
      salas.forEach(sala => {
        const option = document.createElement("option");
        option.value = sala;
        option.textContent = sala;
        salaFiltro.appendChild(option);
      });
    }
  } catch (error) {
    logError('initSalas', error);
    mostrarMensaje("Error al inicializar las salas", "danger");
  }
}

/**
 * Services for PDF generation in the application
 */
function generarPDF() {
  try {
    const fechaInicio = document.getElementById("fechaInicioPDF") ? document.getElementById("fechaInicioPDF").value : "";
    const fechaFin = document.getElementById("fechaFinPDF") ? document.getElementById("fechaFinPDF").value : "";
    const salaSeleccionada = document.getElementById("salaFiltro") ? document.getElementById("salaFiltro").value : "";

    const transaction = db.transaction(["tareas"], "readonly");
    const objectStore = transaction.objectStore("tareas");
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
      const todasLasTareas = event.target.result;
      const tareasFiltradas = todasLasTareas.filter(tarea => {
        const fechaTarea = new Date(tarea.fecha);
        const inicio = fechaInicio ? new Date(fechaInicio) : null;
        const fin = fechaFin ? new Date(fechaFin) : null;
        return (
          (!inicio || fechaTarea >= inicio) &&
          (!fin || fechaTarea <= fin) &&
          (!salaSeleccionada || tarea.sala === salaSeleccionada)
        );
      });

      tareasFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      if (!window.jspdf || !window.jspdf.jsPDF) {
        mostrarMensaje("jsPDF no está cargado. Asegúrate de incluir jsPDF en tu HTML.", "danger");
        return;
      }

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
        doc.text(`Fecha: ${formatDate(tarea.fecha)}`, margin + 10, yPos); yPos += 7;
        doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, margin + 10, yPos); yPos += 7;
        doc.text(`Prioridad: ${tarea.prioridad}`, margin + 10, yPos); yPos += 7;
        doc.text(`Descripción: ${tarea.descripcion}`, margin + 10, yPos); yPos += 10;

        if (tarea.fotos && tarea.fotos.length > 0) {
          doc.setFontSize(11);
          doc.text("Fotos:", margin + 10, yPos); yPos += 5;

          let imgX = margin + 15;
          let imgY = yPos;
          const maxImgWidth = 40;
          const maxImgHeight = 40;
          const spacing = 5;

          tarea.fotos.forEach((foto) => {
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
              } catch (e2) {
                console.error("Error adding image to PDF:", e2);
              }
            }
            imgX += maxImgWidth + spacing;
          });
          yPos = imgY + maxImgHeight + 10;
        } else {
          yPos += 10;
        }
      });
      doc.save("informe-tareas.pdf");
      mostrarMensaje("PDF generado correctamente", "success");
    };
    request.onerror = (event) => logError('generarPDF', event.target.error);
  } catch (error) {
    logError('generarPDF', error);
    mostrarMensaje("Error al generar el PDF: " + error.message, "danger");
  }
}

/**
 * Services for handling photos in the task management application
 */
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_PHOTO_DIMENSION = 1200;

function processPhoto(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_PHOTO_SIZE) {
      reject(new Error(`La imagen es demasiado grande. Máximo: ${MAX_PHOTO_SIZE / (1024 * 1024)}MB`));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= MAX_PHOTO_DIMENSION && img.height <= MAX_PHOTO_DIMENSION) {
          resolve(event.target.result);
          return;
        }
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_PHOTO_DIMENSION) {
            height = Math.round(height * (MAX_PHOTO_DIMENSION / width));
            width = MAX_PHOTO_DIMENSION;
          }
        } else {
          if (height > MAX_PHOTO_DIMENSION) {
            width = Math.round(width * (MAX_PHOTO_DIMENSION / height));
            height = MAX_PHOTO_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    reader.readAsDataURL(file);
  });
}

function processPhotos(fileList) {
  const files = Array.from(fileList || []);
  if (files.length === 0) {
    return Promise.resolve([]);
  }
  const photoPromises = files.map(file => {
    return processPhoto(file).catch(error => {
      logError('processPhotos', error);
      mostrarMensaje(`Error al procesar foto: ${error.message}`, 'warning');
      return null;
    });
  });
  return Promise.all(photoPromises).then(results => {
    return results.filter(result => result !== null);
  });
}

function mostrarPreviewFotos(event) {
  const fotosPreview = document.getElementById("fotosPreview");
  fotosPreview.innerHTML = "";
  const files = event.target.files;
  if (!files || files.length === 0) return;
  Array.from(files).forEach(file => {
    try {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "img-thumbnail me-2";
        img.style.maxWidth = "100px";
        fotosPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logError('mostrarPreviewFotos', error);
    }
  });
}

function optimizeForStorage(base64String) {
  return base64String;
}

/**
 * Services for managing tasks in the application
 */

function cargarTareas() {
  try {
    const transaction = db.transaction(["tareas"], "readonly");
    const objectStore = transaction.objectStore("tareas");
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
      const tareas = event.target.result;
      actualizarHistorial(tareas);
    };

    request.onerror = function(event) {
      logError('cargarTareas', event.target.error);
      mostrarMensaje("Error al cargar las tareas", "danger");
    };
  } catch (error) {
    logError('cargarTareas', error);
    mostrarMensaje("Error al cargar tareas. Se han restablecido.", "warning");
  }
}

async function guardarTarea(event) {
  event.preventDefault();

  try {
    const sala = document.getElementById("titulo").value;
    const prioridad = document.getElementById("prioridad").value;
    const fecha = document.getElementById("fecha").value;
    const horaInicio = document.getElementById("horaInicio").value;
    const horaFin = document.getElementById("horaFin").value;
    const descripcion = document.getElementById("descripcion").value;
    const fotosInput = document.getElementById("fotos");

    const nuevasFotosBase64 = await processPhotos(fotosInput.files);

    let fotosFinal;
    if (tareaAEditarId !== null) {
      fotosFinal = fotosPreviasEdicion.concat(nuevasFotosBase64);
    } else {
      fotosFinal = nuevasFotosBase64;
    }

    const tareaActualizada = {
      sala, prioridad, fecha, horaInicio, horaFin, descripcion,
      fotos: fotosFinal
    };

    const transaction = db.transaction(["tareas"], "readwrite");
    const objectStore = transaction.objectStore("tareas");

    if (tareaAEditarId !== null) {
      const requestUpdate = objectStore.put({ id: tareaAEditarId, ...tareaActualizada });
      requestUpdate.onsuccess = () => {
        mostrarMensaje("Tarea editada correctamente", "success");
        tareaAEditarId = null;
        fotosPreviasEdicion = [];
        document.querySelector('#tareaForm button[type="submit"]').textContent = "Guardar Tarea";
        limpiarFormulario();
        cargarTareas();
      };
      requestUpdate.onerror = (event) => logError('guardarTarea', event.target.error);
    } else {
      const requestAdd = objectStore.add(tareaActualizada);
      requestAdd.onsuccess = () => {
        mostrarMensaje("Tarea guardada correctamente", "success");
        limpiarFormulario();
        cargarTareas();
      };
      requestAdd.onerror = (event) => logError('guardarTarea', event.target.error);
    }
  } catch (error) {
    logError('guardarTarea', error);
    mostrarMensaje("Error al guardar la tarea: " + error.message, "danger");
  }
}
/**
 * Delete a task
 * @param {string|number} id - Task ID
 */
function eliminarRegistro(id) {
  if (confirm("¿Está seguro de que desea eliminar esta tarea?")) {
    try {
      // Convertir el ID a un número
      const taskId = parseInt(id, 10);
      const transaction = db.transaction(["tareas"], "readwrite");
      const objectStore = transaction.objectStore("tareas");
      const request = objectStore.delete(taskId);

      request.onsuccess = () => {
        mostrarMensaje("Tarea eliminada correctamente", "success");
        cargarTareas();
      };
      request.onerror = (event) => logError('eliminarRegistro', event.target.error);
    } catch (error) {
      logError('eliminarRegistro', error);
      mostrarMensaje("Error al eliminar la tarea", "danger");
    }
  }


/**
 * Edit a task
 * @param {string|number} id - Task ID
 */
function editarRegistro(id) {
  try {
    // Convertir el ID a un número
    const taskId = parseInt(id, 10);
    const transaction = db.transaction(["tareas"], "readonly");
    const objectStore = transaction.objectStore("tareas");
    const request = objectStore.get(taskId);

    request.onsuccess = function(event) {
      const tareaAEditar = event.target.result;
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
        tareaAEditarId = taskId;
        document.querySelector('#tareaForm button[type="submit"]').textContent = "Guardar Cambios";
        const historialContainer = document.getElementById("historialContainer");
        if (!historialContainer.classList.contains("d-none")) {
          historialContainer.classList.add("d-none");
          document.getElementById("toggleHistorial").textContent = "Mostrar Historial";
        }
        document.getElementById("tareaForm").scrollIntoView({ behavior: 'smooth' });
      }
    };
    request.onerror = (event) => logError('editarRegistro', event.target.error);
  } catch (error) {
    logError('editarRegistro', error);
    mostrarMensaje("Error al editar la tarea", "danger");
  }
}
  }
}

function borrarFotosDeTarea(tareaId, indicesABorrar) {
  try {
    const transaction = db.transaction(["tareas"], "readwrite");
    const objectStore = transaction.objectStore("tareas");
    const request = objectStore.get(tareaId);

    request.onsuccess = function(event) {
      const tareaAEditar = event.target.result;
      if (tareaAEditar) {
        indicesABorrar.sort((a, b) => b - a).forEach(idx => tareaAEditar.fotos.splice(idx, 1));
        const requestUpdate = objectStore.put(tareaAEditar);
        requestUpdate.onsuccess = () => {
          mostrarMensaje("Fotos borradas correctamente.", "success");
          cargarTareas();
        };
        requestUpdate.onerror = (event) => logError('borrarFotosDeTarea', event.target.error);
      }
    };
    request.onerror = (event) => logError('borrarFotosDeTarea', event.target.error);
  } catch (error) {
    logError('borrarFotosDeTarea', error);
    mostrarMensaje("Error al borrar fotos", "danger");
  }
}

/**
 * Services for UI management in the application
 */

function toggleHistorial() {
  const historialContainer = document.getElementById("historialContainer");
  const visible = !historialContainer.classList.contains("d-none");
  if (visible) {
    historialContainer.classList.add("d-none");
    document.getElementById("toggleHistorial").textContent = "Mostrar Historial";
  } else {
    historialContainer.classList.remove("d-none");
    document.getElementById("toggleHistorial").textContent = "Ocultar Historial";
    cargarTareas(); // Load tasks from DB to show history
  }
}

function limpiarFormulario() {
  const form = document.getElementById("tareaForm");
  if (form) form.reset();
  ["titulo", "prioridad", "fecha", "horaInicio", "horaFin", "descripcion", "fotos"].forEach(id => {
    let el = document.getElementById(id);
    if (el) {
      if (el.tagName === "SELECT") el.selectedIndex = 0;
      else el.value = "";
    }
  });
  document.getElementById("fotosPreview").innerHTML = "";
  if (form) form.classList.remove("was-validated");
  fotosPreviasEdicion = [];
}

function actualizarHistorial(tareas) {
  const historialTareas = document.getElementById("historialTareas");
  const salaFiltro = document.getElementById("salaFiltro").value || "";
  historialTareas.innerHTML = "";
  try {
    const tareasFiltradas = (tareas || [])
      .filter(tarea => !salaFiltro || tarea.sala === salaFiltro)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tareasFiltradas.forEach(tarea => {
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
        <p class="mb-1"><strong>Fecha:</strong> ${formatDate(tarea.fecha)}</p>
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

    document.querySelectorAll(".form-borrar-fotos").forEach(form => {
      form.querySelector(".borrar-fotos-btn").onclick = function() {
        const tareaId = parseInt(form.getAttribute("data-tarea-id"), 10);
        const checks = form.querySelectorAll(".borrar-foto-chk");
        const indicesABorrar = [];
        checks.forEach((chk) => {
          if (chk.checked) {
            const idx = parseInt(chk.getAttribute("data-foto-idx"), 10);
            if (!isNaN(idx)) {
              indicesABorrar.push(idx);
            }
          }
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

    if (tareasFiltradas.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "alert alert-info";
      emptyMessage.textContent = salaFiltro
        ? `No hay tareas registradas para la sala "${salaFiltro}".`
        : "No hay tareas registradas.";
      historialTareas.appendChild(emptyMessage);
    }
  } catch (error) {
    logError('actualizarHistorial', error);
    mostrarMensaje("Error al actualizar el historial", "danger");
  }
}

function initFormValidation() {
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * Utility functions for the task management application
 */

function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = `alert alert-${tipo}`;
  mensaje.style.display = "block";
  setTimeout(() => {
    mensaje.style.display = "none";
  }, 3000);
}

function getPrioridadBadgeClass(prioridad) {
  switch ((prioridad || "").toLowerCase()) {
    case "alta": return "bg-danger";
    case "media": return "bg-warning";
    case "baja": return "bg-success";
    default: return "bg-secondary";
  }
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function logError(context, error) {
  console.error(`[${context}] Error:`, error);
  if (isMobileDevice()) {
    mostrarMensaje(`Error en ${context}: ${error.message}`, "danger");
  }
}
