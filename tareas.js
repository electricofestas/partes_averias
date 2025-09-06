console.log("El script 'tareas.js' se ha cargado correctamente.");
/**
 * Main application initialization
 */

// Global variable for room list
let salas = [];

/**
 * Initialize the application
 */
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Load tasks from localStorage
    cargarTareas();
    
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
    
    // Update history
    actualizarHistorial();
    
    // Add version information for debugging
    console.log("App version: 1.1.0 (Photo fix for mobile)");
  } catch (error) {
    logError('DOMContentLoaded', error);
    mostrarMensaje("Error al inicializar la aplicación", "danger");
  }
});

/**
 * Initialize rooms list
 */
function initSalas() {
  try {
    // Default rooms
    salas = JSON.parse(localStorage.getItem("salas")) || [
      "Comida", "Inst. Sanchez", "Central", "Edificio-Vecindario", "Finca_Telde", "Nave Arinaga",
      "Sala La Mareta", "Sala 7 Palmas", "Sala San Telmo", "Sala Tamaraceite", "Sala Galdar",
      "Sala Arinaga", "Sala Sol y Sombra", "Sala Kasbah", "Sala Pama Cita", "Sala Traiña",
      "Sala Puerto Rico", "Sala Mogán Mall", "Sala Mogán"
    ];
    
    // Save to localStorage if not already there
    if (!localStorage.getItem("salas")) {
      localStorage.setItem("salas", JSON.stringify(salas));
    }
    
    // Fill datalist
    const salasList = document.getElementById("salasList");
    if (salasList) {
      salasList.innerHTML = "";
      salas.forEach(sala => {
        const option = document.createElement("option");
        option.value = sala;
        salasList.appendChild(option);
      });
    }
    
    // Fill filter select
    const salaFiltro = document.getElementById("salaFiltro");
    if (salaFiltro) {
      // Keep the first option (All Rooms)
      const firstOption = salaFiltro.querySelector("option");
      salaFiltro.innerHTML = "";
      if (firstOption) {
        salaFiltro.appendChild(firstOption);
      }
      
      // Add room options
      salas.forEach(sala => {
        const option = document.createElement("option");
        option.value = sala;
        option.textContent = sala;
        salaFiltro.appendChild(option);
      });
      
      // Add change event
      salaFiltro.addEventListener("change", actualizarHistorial);
    }
  } catch (error) {
    logError('initSalas', error);
    mostrarMensaje("Error al inicializar las salas", "danger");
  }
}

/**
 * Services for PDF generation in the application
 */

/**
 * Generate a PDF report of tasks
 */
function generarPDF() {
  try {
    // Get filter values
    const fechaInicio = document.getElementById("fechaInicioPDF") ? document.getElementById("fechaInicioPDF").value : "";
    const fechaFin = document.getElementById("fechaFinPDF") ? document.getElementById("fechaFinPDF").value : "";
    const salaSeleccionada = document.getElementById("salaFiltro") ? document.getElementById("salaFiltro").value : "";
    
    // Filter tasks
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
    
    // Sort by date
    tareasFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Check if jsPDF is available
    if (!window.jspdf || !window.jspdf.jsPDF) {
      mostrarMensaje("jsPDF no está cargado. Asegúrate de incluir jsPDF en tu HTML.", "danger");
      return;
    }
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Add title
    doc.setFontSize(16);
    doc.text("Informe de Tareas", margin, yPos);
    const textWidth = doc.getTextWidth("Informe de Tareas");
    doc.setLineWidth(0.4);
    doc.line(margin, yPos + 2, margin + textWidth, yPos + 2);
    yPos += 10;
    
    // Add filter info
    doc.setFontSize(12);
    doc.text(`Período: ${fechaInicio || "Inicio"} - ${fechaFin || "Fin"}`, margin, yPos);
    yPos += 10;
    doc.text(`Sala: ${salaSeleccionada || "Todas"}`, margin, yPos);
    yPos += 20;
    
    // Add tasks
    tareasFiltradas.forEach(tarea => {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add task header
      doc.setFontSize(14);
      const salaTexto = tarea.sala;
      doc.text(salaTexto, margin, yPos);
      const salaTextWidth = doc.getTextWidth(salaTexto);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 2, margin + salaTextWidth, yPos + 2);
      yPos += 10;
      
      // Add task details
      doc.setFontSize(12);
      doc.text(`Fecha: ${formatDate(tarea.fecha)}`, margin + 10, yPos); yPos += 7;
      doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, margin + 10, yPos); yPos += 7;
      doc.text(`Prioridad: ${tarea.prioridad}`, margin + 10, yPos); yPos += 7;
      doc.text(`Descripción: ${tarea.descripcion}`, margin + 10, yPos); yPos += 10;
      
      // Add images
      if (tarea.fotos && tarea.fotos.length > 0) {
        doc.setFontSize(11);
        doc.text("Fotos:", margin + 10, yPos); yPos += 5;
        
        let imgX = margin + 15;
        let imgY = yPos;
        const maxImgWidth = 40;
        const maxImgHeight = 40;
        const spacing = 5;
        
        tarea.fotos.forEach((foto, idx) => {
          // Check if we need to move to next row
          if (imgX + maxImgWidth > doc.internal.pageSize.getWidth() - margin) {
            imgX = margin + 15;
            imgY += maxImgHeight + spacing;
          }
          
          // Check if we need a new page
          if (imgY + maxImgHeight > pageHeight - 20) {
            doc.addPage();
            imgY = 20;
            imgX = margin + 15;
          }
          
          // Add image (try JPEG first, then PNG)
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
    
    // Save PDF
    doc.save("informe-tareas.pdf");
    mostrarMensaje("PDF generado correctamente", "success");
  } catch (error) {
    logError('generarPDF', error);
    mostrarMensaje("Error al generar el PDF: " + error.message, "danger");
  }
}

/**
 * Services for handling photos in the task management application
 */

/**
 * Maximum size for photos (in bytes) - 5MB
 */
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

/**
 * Maximum dimension for photos (width or height)
 */
const MAX_PHOTO_DIMENSION = 1200;

/**
 * Process and resize a photo to optimize for storage
 * @param {File} file - Photo file
 * @returns {Promise<string>} Base64 encoded photo
 */
function processPhoto(file) {
  return new Promise((resolve, reject) => {
    // Check file size
    if (file.size > MAX_PHOTO_SIZE) {
      reject(new Error(`La imagen es demasiado grande. Máximo: ${MAX_PHOTO_SIZE / (1024 * 1024)}MB`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Check if resizing is needed
        if (img.width <= MAX_PHOTO_DIMENSION && img.height <= MAX_PHOTO_DIMENSION) {
          resolve(event.target.result); // No need to resize, use original
          return;
        }

        // Resize image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
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

        // Convert to base64 with reduced quality for JPEG
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

/**
 * Process multiple photos and return their base64 representations
 * @param {FileList} fileList - List of photo files
 * @returns {Promise<string[]>} Array of base64 encoded photos
 */
function processPhotos(fileList) {
  const files = Array.from(fileList || []);
  
  if (files.length === 0) {
    return Promise.resolve([]);
  }
  
  const photoPromises = files.map(file => {
    return processPhoto(file).catch(error => {
      logError('processPhotos', error);
      mostrarMensaje(`Error al procesar foto: ${error.message}`, 'warning');
      return null; // Return null for failed photos
    });
  });
  
  return Promise.all(photoPromises).then(results => {
    // Filter out null values (failed photos)
    return results.filter(result => result !== null);
  });
}

/**
 * Show preview of selected photos
 * @param {Event} event - Change event from file input
 */
function mostrarPreviewFotos(event) {
  const fotosPreview = document.getElementById("fotosPreview");
  fotosPreview.innerHTML = "";
  
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  Array.from(files).forEach(file => {
    try {
      // For preview, use FileReader directly without processing
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

/**
 * Split large base64 strings into smaller chunks for better localStorage handling
 * @param {string} base64String - Base64 encoded string
 * @returns {string} The original string (or chunked format for very large strings)
 */
function optimizeForStorage(base64String) {
  // Simple pass-through for now - could implement chunking if needed
  return base64String;
}

/**
 * Services for managing tasks in the application
 */

// Global variables
let tareas = [];
let tareaAEditarId = null;
let fotosPreviasEdicion = [];

/**
 * Load tasks from localStorage
 */
function cargarTareas() {
  try {
    const tareasStr = localStorage.getItem("tareas");
    tareas = tareasStr ? JSON.parse(tareasStr) : [];
  } catch (error) {
    logError('cargarTareas', error);
    tareas = [];
    mostrarMensaje("Error al cargar tareas. Se han restablecido.", "warning");
  }
}

/**
 * Save tasks to localStorage
 */
function guardarTareasEnStorage() {
  try {
    localStorage.setItem("tareas", JSON.stringify(tareas));
    return true;
  } catch (error) {
    logError('guardarTareasEnStorage', error);
    mostrarMensaje("Error al guardar en almacenamiento local. Posiblemente memoria insuficiente.", "danger");
    return false;
  }
}

/**
 * Save a task
 * @param {Event} event - Form submit event
 */
async function guardarTarea(event) {
  event.preventDefault();
  
  try {
    // Get form values
    const sala = document.getElementById("titulo").value;
    const prioridad = document.getElementById("prioridad").value;
    const fecha = document.getElementById("fecha").value;
    const horaInicio = document.getElementById("horaInicio").value;
    const horaFin = document.getElementById("horaFin").value;
    const descripcion = document.getElementById("descripcion").value;
    const fotosInput = document.getElementById("fotos");
    
    // Process new photos
    const nuevasFotosBase64 = await processPhotos(fotosInput.files);
    
    // Combine with previous photos if editing
    let fotosFinal;
    if (tareaAEditarId !== null) {
      fotosFinal = fotosPreviasEdicion.concat(nuevasFotosBase64);
    } else {
      fotosFinal = nuevasFotosBase64;
    }
    
    // Create task object
    const tareaActualizada = {
      sala, prioridad, fecha, horaInicio, horaFin, descripcion,
      fotos: fotosFinal
    };
    
    // Save or update
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
    
    // Save to localStorage
    if (guardarTareasEnStorage()) {
      limpiarFormulario();
      actualizarHistorial();
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
      tareas = tareas.filter(tarea => String(tarea.id) !== String(id));
      if (guardarTareasEnStorage()) {
        actualizarHistorial();
        mostrarMensaje("Tarea eliminada correctamente", "success");
      }
    } catch (error) {
      logError('eliminarRegistro', error);
      mostrarMensaje("Error al eliminar la tarea", "danger");
    }
  }
}

/**
 * Edit a task
 * @param {string|number} id - Task ID
 */
function editarRegistro(id) {
  try {
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
      
      // Scroll to form
      document.getElementById("tareaForm").scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    logError('editarRegistro', error);
    mostrarMensaje("Error al editar la tarea", "danger");
  }
}

/**
 * Delete selected photos from a task
 * @param {string|number} tareaId - Task ID
 * @param {number[]} indicesABorrar - Indices of photos to delete
 */
function borrarFotosDeTarea(tareaId, indicesABorrar) {
  try {
    const tareaIdx = tareas.findIndex(t => String(t.id) === String(tareaId));
    if (tareaIdx === -1) return;
    
    // Delete photos according to indices (from highest to lowest to avoid reordering)
    indicesABorrar.sort((a, b) => b - a)
      .forEach(idx => tareas[tareaIdx].fotos.splice(idx, 1));
    
    if (guardarTareasEnStorage()) {
      mostrarMensaje("Fotos borradas correctamente.", "success");
      actualizarHistorial();
    }
  } catch (error) {
    logError('borrarFotosDeTarea', error);
    mostrarMensaje("Error al borrar fotos", "danger");
  }
}

/**
 * Services for UI management in the application
 */

/**
 * Toggle history visibility
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
    actualizarHistorial();
  }
}

/**
 * Clear the task form
 */
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

/**
 * Update the task history view
 */
function actualizarHistorial() {
  const historialTareas = document.getElementById("historialTareas");
  const salaFiltro = document.getElementById("salaFiltro").value || "";
  historialTareas.innerHTML = "";
  
  try {
    // Filter and sort tasks
    const tareasFiltradas = tareas
      .filter(tarea => !salaFiltro || tarea.sala === salaFiltro)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Create task elements
    tareasFiltradas.forEach(tarea => {
      const tareaElement = document.createElement("div");
      tareaElement.className = "list-group-item";
      
      // Photos with checkboxes
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
    
    // Assign listeners to all delete photo forms
    document.querySelectorAll(".form-borrar-fotos").forEach(form => {
      form.querySelector(".borrar-fotos-btn").onclick = function() {
        const tareaId = form.getAttribute("data-tarea-id");
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
    
    // Show message if no tasks
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

/**
 * Initialize the form validation
 */
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

/**
 * Display a message to the user
 * @param {string} texto - Message text
 * @param {string} tipo - Message type (success, danger, warning, info)
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

/**
 * Get the appropriate Bootstrap badge class for a priority level
 * @param {string} prioridad - Priority level
 * @returns {string} CSS class name
 */
function getPrioridadBadgeClass(prioridad) {
  switch ((prioridad || "").toLowerCase()) {
    case "alta": return "bg-danger";
    case "media": return "bg-warning";
    case "baja": return "bg-success";
    default: return "bg-secondary";
  }
}

/**
 * Format a date string to local date format
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
}

/**
 * Check if the device is a mobile device
 * @returns {boolean} True if mobile device
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Log errors for debugging
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 */
function logError(context, error) {
  console.error(`[${context}] Error:`, error);
  
  // On mobile devices, show error in UI for better debugging
  if (isMobileDevice()) {
    mostrarMensaje(`Error en ${context}: ${error.message}`, "danger");
  }
}
