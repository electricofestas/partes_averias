// ... existing code ...

// Función para mostrar/ocultar el historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const historialTareas = document.getElementById('historialTareas');
    
    if (!historialContainer || !toggleHistorialBtn || !historialTareas) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    if (historialContainer.classList.contains('hidden')) {
        historialContainer.classList.remove('hidden');
        toggleHistorialBtn.textContent = 'Ocultar Historial';
        
        // Obtener y mostrar todas las tareas
        const tareas = obtenerTareasDelStorage();
        historialTareas.innerHTML = ''; // Limpiar el contenedor
        
        if (tareas.length === 0) {
            historialTareas.innerHTML = '<p class="text-center">No hay tareas guardadas</p>';
            return;
        }
        
        // Ordenar tareas por fecha de modificación (más reciente primero)
        tareas.sort((a, b) => new Date(b.fechaModificacion) - new Date(a.fechaModificacion));
        
        tareas.forEach(tarea => {
            const tareaElement = document.createElement('div');
            tareaElement.className = 'tarea-item';
            tareaElement.innerHTML = `
                <div class="tarea-header">
                    <h3>${tarea.titulo}</h3>
                    <div class="botones-tarea">
                        <button onclick="editarRegistro('${tarea.id}')" class="btn-editar">Editar</button>
                        <button onclick="eliminarRegistro('${tarea.id}')" class="btn-eliminar">Eliminar</button>
                    </div>
                </div>
                <div class="tarea-contenido">
                    <p><strong>Fecha:</strong> ${new Date(tarea.fecha).toLocaleDateString()}</p>
                    <p><strong>Horario:</strong> ${tarea.horaInicio} - ${tarea.horaFin}</p>
                    <p><strong>Prioridad:</strong> ${tarea.prioridad}</p>
                    <p><strong>Descripción:</strong> ${tarea.descripcion}</p>
                </div>
                ${tarea.fotos && tarea.fotos.length > 0 ? `
                    <div class="fotos-container">
                        <p><strong>Fotos:</strong></p>
                        <div class="fotos-grid">
                            ${tarea.fotos.map(foto => `
                                <div class="foto-item" onclick="mostrarFotoModal('${foto}')">
                                    <img src="${foto}" alt="Foto de la tarea">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="version-info">
                    <small>Versión: ${tarea.version || 1}</small>
                    ${tarea.fechaModificacion ? `<br><small>Última modificación: ${new Date(tarea.fechaModificacion).toLocaleString()}</small>` : ''}
                </div>
            `;
            historialTareas.appendChild(tareaElement);
        });
    } else {
        historialContainer.classList.add('hidden');
        toggleHistorialBtn.textContent = 'Mostrar Historial';
    }
}

// ... existing code ...