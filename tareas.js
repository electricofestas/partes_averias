// Función para obtener tareas del storage
function obtenerTareasDelStorage() {
    const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
    return indicesTareas.map(id => JSON.parse(localStorage.getItem(id))).filter(Boolean);
}

// Función para mostrar tareas en el historial
function mostrarTareas() {
    const historialTareas = document.getElementById('historialTareas');
    const tareas = obtenerTareasDelStorage();
    
    historialTareas.innerHTML = '';
    
    tareas.forEach(tarea => {
        const elemento = document.createElement('div');
        elemento.className = 'list-group-item';
        elemento.innerHTML = `
            <h6>${tarea.titulo} - ${tarea.fecha}</h6>
            <p><strong>Prioridad:</strong> ${tarea.prioridad}</p>
            <p><strong>Horario:</strong> ${tarea.horaInicio} - ${tarea.horaFin}</p>
            <p>${tarea.descripcion}</p>
            <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-sm btn-primary" onclick="editarRegistro('${tarea.id}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarRegistro('${tarea.id}')">Eliminar</button>
            </div>
        `;
        historialTareas.appendChild(elemento);
    });
}

// Función para alternar la visibilidad del historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleBtn = document.getElementById('toggleHistorial');
    
    historialContainer.classList.toggle('hidden');
    toggleBtn.textContent = historialContainer.classList.contains('hidden') ? 
        'Mostrar Historial' : 'Ocultar Historial';
    
    if (!historialContainer.classList.contains('hidden')) {
        mostrarTareas();
    }
}

// Agregar los event listeners necesarios al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('tareaForm');
    const fotosInput = document.getElementById('fotos');
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');

    if (formulario) {
        formulario.addEventListener('submit', guardarTarea);
    }

    if (fotosInput) {
        fotosInput.addEventListener('change', mostrarVistaPrevia);
    }

    if (toggleHistorialBtn) {
        toggleHistorialBtn.addEventListener('click', toggleHistorial);
    }

    // Ocultar el contenedor de filtros inicialmente
    if (fechaFiltroContainer) {
        fechaFiltroContainer.classList.add('hidden');
    }
});