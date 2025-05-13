// ... existing code ...

// Función para alternar la visibilidad del historial (versión corregida)
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleBtn = document.getElementById('toggleHistorial');
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    
    if (!historialContainer || !toggleBtn) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    const estaOculto = historialContainer.classList.contains('hidden');
    
    if (estaOculto) {
        historialContainer.classList.remove('hidden');
        fechaFiltroContainer.classList.remove('hidden');
        toggleBtn.textContent = 'Ocultar Historial';
        mostrarTareas(); // Actualizamos el historial
    } else {
        historialContainer.classList.add('hidden');
        fechaFiltroContainer.classList.add('hidden');
        toggleBtn.textContent = 'Mostrar Historial';
    }
}

// Función para mostrar tareas (versión corregida)
function mostrarTareas() {
    const historialTareas = document.getElementById('historialTareas');
    if (!historialTareas) {
        console.error('No se encontró el contenedor del historial');
        return;
    }

    try {
        const tareas = obtenerTareasDelStorage();
        historialTareas.innerHTML = ''; // Limpiar el contenedor

        if (tareas.length === 0) {
            historialTareas.innerHTML = '<p class="text-center">No hay tareas guardadas</p>';
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
    } catch (error) {
        console.error('Error al mostrar registros:', error);
        mostrarMensaje('Error al cargar el historial');
    }
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