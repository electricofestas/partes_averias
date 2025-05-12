function obtenerTareasDelStorage() {
    try {
        const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
        return indicesTareas
            .map(id => {
                try {
                    return JSON.parse(localStorage.getItem(id));
                } catch {
                    return null;
                }
            })
            .filter(tarea => tarea !== null);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        return [];
    }
}

// Función para mostrar/ocultar el historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const historialTareas = document.getElementById('historialTareas');
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    
    if (!historialContainer || !toggleHistorialBtn || !historialTareas) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    // Cambiar la visibilidad del contenedor
    const estaOculto = historialContainer.style.display === 'none' || historialContainer.classList.contains('hidden');
    
    if (estaOculto) {
        historialContainer.style.display = 'block';
        historialContainer.classList.remove('hidden');
        fechaFiltroContainer.classList.remove('hidden');
        toggleHistorialBtn.textContent = 'Ocultar Historial';
        mostrarTareas(); // Actualizamos el historial solo cuando se muestra
    } else {
        historialContainer.style.display = 'none';
        historialContainer.classList.add('hidden');
        fechaFiltroContainer.classList.add('hidden');
        toggleHistorialBtn.textContent = 'Mostrar Historial';
    }
}

// Función para mostrar las tareas
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
    } catch (error) {
        console.error('Error al mostrar registros:', error);
        mostrarMensaje('Error al cargar el historial');
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const historialContainer = document.getElementById('historialContainer');
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    
    // Asegurarse de que el historial y el filtro estén ocultos inicialmente
    if (historialContainer) {
        historialContainer.style.display = 'none';
        historialContainer.classList.add('hidden');
    }
    
    if (fechaFiltroContainer) {
        fechaFiltroContainer.style.display = 'none';
        fechaFiltroContainer.classList.add('hidden');
    }
    
    // Configurar el botón de historial
    if (toggleHistorialBtn) {
        toggleHistorialBtn.textContent = 'Mostrar Historial';
        toggleHistorialBtn.addEventListener('click', toggleHistorial);
    }
});

function eliminarRegistro(id) {
    if (confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        try {
            // Eliminar la tarea
            localStorage.removeItem(id);
            
            // Actualizar índices
            const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
            const nuevoIndice = indicesTareas.filter(tareaId => tareaId !== id);
            localStorage.setItem('indicesTareas', JSON.stringify(nuevoIndice));
            
            mostrarMensaje('Tarea eliminada correctamente');
            mostrarTareas();
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            mostrarMensaje('Error al eliminar la tarea');
        }
    }
}

function mostrarMensaje(mensaje) {
    const mensajeElement = document.getElementById('mensaje');
    if (mensajeElement) {
        mensajeElement.textContent = mensaje;
        mensajeElement.style.display = 'block';
        setTimeout(() => {
            mensajeElement.style.display = 'none';
        }, 3000);
    }
}

// Función para mostrar el selector de fechas
function mostrarSelectorFechas() {
    const container = document.getElementById('fechaFiltroContainer');
    if (container) {
        container.classList.toggle('hidden');
        
        // Llenar el selector de salas
        const salaFiltro = document.getElementById('salaFiltro');
        const tareas = obtenerTareasDelStorage();
        const salas = [...new Set(tareas.map(tarea => tarea.titulo))];
        
        salaFiltro.innerHTML = '<option value="">Todas las salas</option>';
        salas.forEach(sala => {
            salaFiltro.innerHTML += `<option value="${sala}">${sala}</option>`;
        });
    }
}

function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const fechaInicio = document.getElementById('fechaInicioPDF').value;
    const fechaFin = document.getElementById('fechaFinPDF').value;
    const salaSeleccionada = document.getElementById('salaFiltro').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarMensaje('Por favor, seleccione ambas fechas');
        return;
    }

    let tareas = obtenerTareasDelStorage();
    
    // Filtrar por fecha y sala
    tareas = tareas.filter(tarea => {
        const fechaTarea = new Date(tarea.fecha);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        const cumpleFecha = fechaTarea >= inicio && fechaTarea <= fin;
        const cumpleSala = !salaSeleccionada || tarea.titulo === salaSeleccionada;
        
        return cumpleFecha && cumpleSala;
    });

    if (tareas.length === 0) {
        mostrarMensaje('No hay tareas para el período seleccionado');
        return;
    }

    // Configurar el documento
    doc.setFontSize(16);
    doc.text('Informe de Tareas', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()}`, 20, 30);
    if (salaSeleccionada) {
        doc.text(`Sala: ${salaSeleccionada}`, 20, 40);
    }

    let yPos = 50;
    
    // Agregar cada tarea al PDF
    tareas.forEach((tarea, index) => {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.text(`Tarea ${index + 1}: ${tarea.titulo}`, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date(tarea.fecha).toLocaleDateString()}`, 25, yPos);
        yPos += 7;
        doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, 25, yPos);
        yPos += 7;
        doc.text(`Prioridad: ${tarea.prioridad}`, 25, yPos);
        yPos += 7;
        
        // Dividir la descripción en líneas si es muy larga
        const descripcionLineas = doc.splitTextToSize(`Descripción: ${tarea.descripcion}`, 170);
        descripcionLineas.forEach(linea => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(linea, 25, yPos);
            yPos += 7;
        });
        
        yPos += 10;
    });

    // Guardar el PDF
    doc.save(`informe_tareas_${new Date().toISOString().split('T')[0]}.pdf`);
    mostrarMensaje('PDF generado exitosamente');
}

// Función para mostrar/ocultar el historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const historialTareas = document.getElementById('historialTareas');
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    
    if (!historialContainer || !toggleHistorialBtn || !historialTareas) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    // Cambiar la visibilidad del contenedor
    const estaOculto = historialContainer.style.display === 'none' || historialContainer.classList.contains('hidden');
    
    if (estaOculto) {
        historialContainer.style.display = 'block';
        historialContainer.classList.remove('hidden');
        fechaFiltroContainer.classList.remove('hidden');
        toggleHistorialBtn.textContent = 'Ocultar Historial';
        mostrarTareas(); // Actualizamos el historial solo cuando se muestra
    } else {
        historialContainer.style.display = 'none';
        historialContainer.classList.add('hidden');
        fechaFiltroContainer.classList.add('hidden');
        toggleHistorialBtn.textContent = 'Mostrar Historial';
    }
}

// Función para mostrar las tareas
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
    } catch (error) {
        console.error('Error al mostrar registros:', error);
        mostrarMensaje('Error al cargar el historial');
    }
}