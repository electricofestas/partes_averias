// Variables globales
let tareas = JSON.parse(localStorage.getItem('tareas')) || [];
let historialVisible = false;

// Función para inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar elementos
    const form = document.getElementById('tareaForm');
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const historialContainer = document.getElementById('historialContainer');
    const fotosInput = document.getElementById('fotos');
    const fotosPreview = document.getElementById('fotosPreview');
    
    // Cargar salas desde localStorage o inicializar si no existen
    let salas = JSON.parse(localStorage.getItem('salas')) || [
        'Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5'
    ];
    
    // Llenar el datalist de salas
    const salasList = document.getElementById('salasList');
    salas.forEach(sala => {
        const option = document.createElement('option');
        option.value = sala;
        salasList.appendChild(option);
    });

    // Llenar el select de salas para el filtro
    const salaFiltro = document.getElementById('salaFiltro');
    salas.forEach(sala => {
        const option = document.createElement('option');
        option.value = sala;
        option.textContent = sala;
        salaFiltro.appendChild(option);
    });

    // Event Listeners
    form.addEventListener('submit', guardarTarea);
    toggleHistorialBtn.addEventListener('click', toggleHistorial); // Cambiado de 'submit' a 'click'
    fotosInput.addEventListener('change', mostrarPreviewFotos);

    // Cargar historial inicial
    actualizarHistorial();
});

// Función para guardar una nueva tarea
function guardarTarea(e) {
    e.preventDefault();
    
    const form = document.getElementById('tareaForm');
    const editandoId = form.dataset.editandoId;
    
    const tarea = {
        id: editandoId ? parseInt(editandoId) : Date.now(),
        sala: document.getElementById('titulo').value,
        prioridad: document.getElementById('prioridad').value,
        fecha: document.getElementById('fecha').value,
        horaInicio: document.getElementById('horaInicio').value,
        horaFin: document.getElementById('horaFin').value,
        descripcion: document.getElementById('descripcion').value,
        fotos: [], // Se llenará con las fotos convertidas a Base64
    };

    // Procesar fotos
    const fotosInput = document.getElementById('fotos');
    const fotosPromises = Array.from(fotosInput.files).map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(fotosPromises).then(fotosBase64 => {
        // Si estamos editando, mantener las fotos existentes si no se agregaron nuevas
        if (editandoId) {
            const tareaExistente = tareas.find(t => t.id === parseInt(editandoId));
            tarea.fotos = fotosBase64.length > 0 ? fotosBase64 : tareaExistente.fotos;
            
            // Actualizar la tarea existente
            const index = tareas.findIndex(t => t.id === parseInt(editandoId));
            if (index !== -1) {
                tareas[index] = tarea;
            }
        } else {
            tarea.fotos = fotosBase64;
            tareas.push(tarea);
        }
        
        localStorage.setItem('tareas', JSON.stringify(tareas));
        
        // Resetear el formulario y limpiar el modo edición
        form.reset();
        delete form.dataset.editandoId;
        document.getElementById('fotosPreview').innerHTML = '';
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Guardar Tarea';
        }
        
        actualizarHistorial();
        mostrarMensaje(editandoId ? 'Tarea actualizada correctamente' : 'Tarea guardada correctamente', 'success');
    });
}

// Función para mostrar/ocultar el historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleBtn = document.getElementById('toggleHistorial');
    
    if (!historialContainer || !toggleBtn) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    if (historialContainer.style.display === 'none' || !historialContainer.style.display) {
        historialContainer.style.display = 'block';
        toggleBtn.textContent = 'Ocultar Historial';
        actualizarHistorial(); // Actualizamos el contenido del historial
    } else {
        historialContainer.style.display = 'none';
        toggleBtn.textContent = 'Mostrar Historial';
    }
}

// Función para editar una tarea
function editarTarea(id) {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea) {
        mostrarMensaje('No se encontró la tarea', 'danger');
        return;
    }

    // Rellenar el formulario con los datos de la tarea
    document.getElementById('titulo').value = tarea.sala;
    document.getElementById('prioridad').value = tarea.prioridad;
    document.getElementById('fecha').value = tarea.fecha;
    document.getElementById('horaInicio').value = tarea.horaInicio;
    document.getElementById('horaFin').value = tarea.horaFin;
    document.getElementById('descripcion').value = tarea.descripcion;

    // Mostrar las fotos existentes en la vista previa
    const fotosPreview = document.getElementById('fotosPreview');
    fotosPreview.innerHTML = '';
    if (tarea.fotos && tarea.fotos.length > 0) {
        tarea.fotos.forEach(foto => {
            const img = document.createElement('img');
            img.src = foto;
            img.className = 'img-thumbnail';
            img.style.maxWidth = '100px';
            fotosPreview.appendChild(img);
        });
    }

    // Marcar el formulario como modo edición
    const form = document.getElementById('tareaForm');
    form.dataset.editandoId = id;

    // Cambiar el texto del botón de guardar
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Actualizar Tarea';
    }

    // Hacer scroll al formulario
    form.scrollIntoView({ behavior: 'smooth' });
    mostrarMensaje('Editando tarea...', 'info');
}

// Modificar la función actualizarHistorial para incluir el botón de editar
function actualizarHistorial() {
    const historialTareas = document.getElementById('historialTareas');
    if (!historialTareas) return;

    historialTareas.innerHTML = '';

    if (tareas.length === 0) {
        historialTareas.innerHTML = '<p class="text-center">No hay tareas registradas</p>';
        return;
    }

    tareas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(tarea => {
        const tareaElement = document.createElement('div');
        tareaElement.className = 'list-group-item';
        tareaElement.innerHTML = `
            <h5 class="mb-1">${tarea.sala}</h5>
            <p class="mb-1">
                <strong>Fecha:</strong> ${tarea.fecha}<br>
                <strong>Horario:</strong> ${tarea.horaInicio} - ${tarea.horaFin}<br>
                <strong>Prioridad:</strong> <span class="badge ${getPrioridadBadgeClass(tarea.prioridad)}">${tarea.prioridad}</span><br>
                <strong>Descripción:</strong> ${tarea.descripcion}
            </p>
            ${tarea.fotos.map(foto => `<img src="${foto}" class="img-thumbnail" style="max-width: 100px;">`).join('')}
            <div class="d-flex justify-content-end gap-2 mt-2">
                <button class="btn btn-primary btn-sm" onclick="editarTarea(${tarea.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarTarea(${tarea.id})">Eliminar</button>
            </div>
        `;
        historialTareas.appendChild(tareaElement);
    });
}

// Función auxiliar para mostrar las tareas en el historial
function mostrarTareas() {
    const historialTareas = document.getElementById('historialTareas');
    if (!historialTareas) {
        console.error('No se encontró el contenedor del historial');
        return;
    }

    const tareas = obtenerTareasDelStorage();
    historialTareas.innerHTML = '';

    if (tareas.length === 0) {
        historialTareas.innerHTML = '<p class="text-center">No hay tareas registradas</p>';
        return;
    }

    // Ordenar tareas por fecha (más reciente primero)
    tareas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tareas.forEach(tarea => {
        const elemento = document.createElement('div');
        elemento.className = 'list-group-item';
        elemento.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-1">${tarea.titulo}</h6>
                <span class="badge ${getPrioridadBadgeClass(tarea.prioridad)}">${tarea.prioridad}</span>
            </div>
            <p class="mb-1"><strong>Fecha:</strong> ${new Date(tarea.fecha).toLocaleDateString()}</p>
            <p class="mb-1"><strong>Horario:</strong> ${tarea.horaInicio} - ${tarea.horaFin}</p>
            <p class="mb-1">${tarea.descripcion}</p>
            ${tarea.fotos && tarea.fotos.length > 0 ? `
                <div class="fotos-container mt-2">
                    <div class="d-flex flex-wrap gap-2">
                        ${tarea.fotos.map(foto => `
                            <div class="foto-preview">
                                <img src="${foto}" alt="Foto de la tarea">
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="d-flex justify-content-end gap-2 mt-2">
                <button class="btn btn-sm btn-primary" onclick="editarRegistro('${tarea.id}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarRegistro('${tarea.id}')">Eliminar</button>
            </div>
        `;
        historialTareas.appendChild(elemento);
    });
}

// Función auxiliar para obtener la clase de badge según la prioridad
function getPrioridadBadgeClass(prioridad) {
    switch (prioridad.toLowerCase()) {
        case 'alta':
            return 'bg-danger';
        case 'media':
            return 'bg-warning';
        case 'baja':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

// Función para actualizar el historial
function actualizarHistorial() {
    const historialTareas = document.getElementById('historialTareas');
    historialTareas.innerHTML = '';

    tareas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(tarea => {
        const tareaElement = document.createElement('div');
        tareaElement.className = 'list-group-item';
        tareaElement.innerHTML = `
            <h5 class="mb-1">${tarea.sala}</h5>
            <p class="mb-1">
                <strong>Fecha:</strong> ${tarea.fecha}<br>
                <strong>Horario:</strong> ${tarea.horaInicio} - ${tarea.horaFin}<br>
                <strong>Prioridad:</strong> ${tarea.prioridad}<br>
                <strong>Descripción:</strong> ${tarea.descripcion}
            </p>
            ${tarea.fotos.map(foto => `<img src="${foto}" class="img-thumbnail" style="max-width: 100px;">`).join('')}
            <button class="btn btn-danger btn-sm mt-2" onclick="eliminarTarea(${tarea.id})">Eliminar</button>
        `;
        historialTareas.appendChild(tareaElement);
    });
}

// Función para eliminar una tarea
function eliminarTarea(id) {
    if (confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        tareas = tareas.filter(tarea => tarea.id !== id);
        localStorage.setItem('tareas', JSON.stringify(tareas));
        actualizarHistorial();
        mostrarMensaje('Tarea eliminada correctamente', 'success');
    }
}

// Función para mostrar preview de fotos
function mostrarPreviewFotos(e) {
    const fotosPreview = document.getElementById('fotosPreview');
    fotosPreview.innerHTML = '';
    
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'img-thumbnail';
            img.style.maxWidth = '100px';
            fotosPreview.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
}

// Función para mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const mensaje = document.getElementById('mensaje');
    mensaje.textContent = texto;
    mensaje.className = `alert alert-${tipo}`;
    mensaje.style.display = 'block';
    
    setTimeout(() => {
        mensaje.style.display = 'none';
    }, 3000);
}

// Función para mostrar el selector de fechas para el PDF
function mostrarSelectorFechas() {
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    fechaFiltroContainer.classList.remove('hidden');
}

// Función para generar PDF
function generarPDF() {
    const fechaInicio = document.getElementById('fechaInicioPDF').value;
    const fechaFin = document.getElementById('fechaFinPDF').value;
    const salaSeleccionada = document.getElementById('salaFiltro').value;

    // Filtrar tareas según los criterios
    let tareasFiltradas = tareas.filter(tarea => {
        const fechaTarea = new Date(tarea.fecha);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        return (!fechaInicio || fechaTarea >= inicio) &&
               (!fechaFin || fechaTarea <= fin) &&
               (!salaSeleccionada || tarea.sala === salaSeleccionada);
    });

    // Crear PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Título
    doc.setFontSize(16);
    doc.text('Informe de Tareas', 20, yPos);
    yPos += 10;

    // Información del filtro
    doc.setFontSize(12);
    doc.text(`Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}`, 20, yPos);
    yPos += 10;
    doc.text(`Sala: ${salaSeleccionada || 'Todas'}`, 20, yPos);
    yPos += 20;

    // Tareas
    tareasFiltradas.forEach(tarea => {
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

    // Guardar PDF
    doc.save('informe-tareas.pdf');
}