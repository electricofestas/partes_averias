// Obtener elementos del DOM
const tareaForm = document.getElementById('tareaForm');
const toggleHistorialBtn = document.getElementById('toggleHistorial');
const historialContainer = document.getElementById('historialContainer');
const historialTareas = document.getElementById('historialTareas');
const selectSala = document.getElementById('titulo');
let tareaEditandoId = null;

// Función para cargar las salas guardadas
function cargarSalas() {
    const salasGuardadas = JSON.parse(localStorage.getItem('salas')) || [];
    
    // Limpiar opciones existentes excepto la primera (placeholder)
    while (selectSala.options.length > 1) {
        selectSala.remove(1);
    }
    
    // Agregar las salas guardadas al select
    salasGuardadas.forEach(sala => {
        const option = new Option(sala, sala);
        selectSala.add(option);
    });
}

// Función para guardar una nueva sala
function guardarNuevaSala(sala) {
    const salasGuardadas = JSON.parse(localStorage.getItem('salas')) || [];
    if (!salasGuardadas.includes(sala)) {
        salasGuardadas.push(sala);
        localStorage.setItem('salas', JSON.stringify(salasGuardadas));
        const option = new Option(sala, sala);
        selectSala.add(option);
    }
}

// Agregar evento para permitir agregar nuevas salas
selectSala.addEventListener('change', (e) => {
    if (e.target.value === 'nueva_sala') {
        const nuevaSala = prompt('Ingrese el nombre de la nueva sala:');
        if (nuevaSala && nuevaSala.trim()) {
            guardarNuevaSala(nuevaSala.trim());
            selectSala.value = nuevaSala;
        } else {
            selectSala.value = '';
        }
    }
});

// Cargar tareas y salas guardadas al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarSalas();
    mostrarTareas();
    
    // Agregar opción para nueva sala
    const optionNueva = new Option('+ Agregar nueva sala', 'nueva_sala');
    selectSala.add(optionNueva);
});

// Manejar el envío del formulario
tareaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener valores del formulario
    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const fecha = document.getElementById('fecha').value;
    const horaInicio = document.getElementById('horaInicio').value;
    const horaFin = document.getElementById('horaFin').value;
    const prioridad = document.getElementById('prioridad').value;
    
    // Validar que la hora de fin sea posterior a la hora de inicio
    if (horaFin <= horaInicio) {
        alert('La hora de finalización debe ser posterior a la hora de inicio');
        return;
    }
    
    try {
        if (tareaEditandoId) {
            // Estamos editando un registro existente
            const tareaExistente = JSON.parse(localStorage.getItem(tareaEditandoId));
            
            // Crear nueva versión del registro
            const tareaActualizada = {
                id: tareaEditandoId,
                titulo,
                descripcion,
                fecha,
                horaInicio,
                horaFin,
                prioridad,
                fechaCreacion: tareaExistente.fechaCreacion,
                fechaModificacion: new Date().toISOString(),
                version: (tareaExistente.version || 1) + 1
            };
            
            // Guardar la versión actualizada
            localStorage.setItem(tareaEditandoId, JSON.stringify(tareaActualizada));
            mostrarMensaje('Registro actualizado correctamente');
            
            // Resetear el modo de edición
            tareaEditandoId = null;
            document.querySelector('.btn-primary').textContent = 'Guardar Tarea';
            
        } else {
            // Guardar la sala si no existe
            guardarNuevaSala(titulo);
            
            // Crear nuevo registro
            const nuevoId = `tarea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const nuevaTarea = {
                id: nuevoId,
                titulo,
                descripcion,
                fecha,
                horaInicio,
                horaFin,
                prioridad,
                fechaCreacion: new Date().toISOString(),
                version: 1
            };
            
            // Guardar nuevo registro
            localStorage.setItem(nuevoId, JSON.stringify(nuevaTarea));
            
            // Actualizar índice
            let indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
            indicesTareas.push(nuevoId);
            localStorage.setItem('indicesTareas', JSON.stringify(indicesTareas));
            
            mostrarMensaje('Nuevo registro guardado');
        }
        
        // Limpiar formulario y actualizar vista
        tareaForm.reset();
        mostrarTareas();
        
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarMensaje('Error al procesar el registro');
    }
});

// Función para cargar registro en el formulario para edición
function editarRegistro(tareaId) {
    const tarea = JSON.parse(localStorage.getItem(tareaId));
    if (!tarea) {
        mostrarMensaje('Error al cargar el registro');
        return;
    }
    
    // Cargar datos en el formulario
    document.getElementById('titulo').value = tarea.titulo;
    document.getElementById('descripcion').value = tarea.descripcion;
    document.getElementById('fecha').value = tarea.fecha;
    document.getElementById('horaInicio').value = tarea.horaInicio;
    document.getElementById('horaFin').value = tarea.horaFin;
    document.getElementById('prioridad').value = tarea.prioridad;
    
    // Cambiar a modo edición
    tareaEditandoId = tareaId;
    document.querySelector('.btn-primary').textContent = 'Actualizar Registro';
    
    // Scroll al formulario
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    mostrarMensaje('Editando registro - Realice los cambios necesarios');
}

// Función para eliminar registro
function eliminarRegistro(tareaId, event) {
    event.stopPropagation();
    
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        try {
            // Eliminar registro
            localStorage.removeItem(tareaId);
            
            // Actualizar índice
            let indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
            indicesTareas = indicesTareas.filter(id => id !== tareaId);
            localStorage.setItem('indicesTareas', JSON.stringify(indicesTareas));
            
            // Si estábamos editando este registro, resetear el formulario
            if (tareaEditandoId === tareaId) {
                tareaEditandoId = null;
                tareaForm.reset();
                document.querySelector('.btn-primary').textContent = 'Guardar Tarea';
            }
            
            mostrarMensaje('Registro eliminado correctamente');
            mostrarTareas();
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarMensaje('Error al eliminar el registro');
        }
    }
}

// Función para mostrar mensaje temporal
function mostrarMensaje(texto) {
    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-flotante';
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.remove();
    }, 2000);
}

// Toggle del historial
toggleHistorialBtn.addEventListener('click', () => {
    const estaOculto = historialContainer.classList.contains('hidden');
    if (estaOculto) {
        historialContainer.classList.remove('hidden');
        toggleHistorialBtn.textContent = 'Ocultar Historial';
    } else {
        historialContainer.classList.add('hidden');
        toggleHistorialBtn.textContent = 'Mostrar Historial';
    }
});

// Función para mostrar tareas
function mostrarTareas() {
    historialTareas.innerHTML = '';
    
    try {
        const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
        
        // Obtener y procesar registros
        const tareas = indicesTareas
            .map(id => {
                const tareaData = localStorage.getItem(id);
                if (!tareaData) return null;
                return JSON.parse(tareaData);
            })
            .filter(tarea => tarea !== null);
        
        // Ordenar por fecha de creación (más recientes primero)
        tareas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        
        // Mostrar cada registro
        tareas.forEach(tarea => {
            const tareaElement = document.createElement('div');
            tareaElement.className = `tarea-item prioridad-${tarea.prioridad}`;
            if (tareaEditandoId === tarea.id) {
                tareaElement.classList.add('editando');
            }
            
            const fecha = new Date(tarea.fecha).toLocaleDateString();
            const horaInicio = formatearHora(tarea.horaInicio);
            const horaFin = formatearHora(tarea.horaFin);
            
            let infoVersion = `<p class="version-info">Versión ${tarea.version || 1}`;
            if (tarea.fechaModificacion) {
                infoVersion += ` - Última modificación: ${new Date(tarea.fechaModificacion).toLocaleString()}`;
            }
            infoVersion += '</p>';
            
            tareaElement.innerHTML = `
                <div class="tarea-header">
                    <div class="info-principal">
                        <h3 class="sala-titulo">Sala: ${tarea.titulo}</h3>
                        <p class="fecha-registro">Fecha: ${fecha}</p>
                        <p class="horario-registro">Horario: ${horaInicio} - ${horaFin}</p>
                        <p class="prioridad-registro">Prioridad: ${tarea.prioridad.charAt(0).toUpperCase() + tarea.prioridad.slice(1)}</p>
                    </div>
                    <div class="botones-tarea">
                        <button class="btn-editar" title="Editar registro">✎</button>
                        <button class="btn-eliminar" title="Eliminar registro">×</button>
                    </div>
                </div>
                <div class="trabajo-contenido">
                    <p class="trabajo-realizado-label">Trabajo realizado:</p>
                    <p class="descripcion">${tarea.descripcion}</p>
                </div>
                <p class="registro-info">Registro #${tarea.id}</p>
                ${infoVersion}
            `;
            
            // Eventos para los botones
            const btnEditar = tareaElement.querySelector('.btn-editar');
            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation();
                editarRegistro(tarea.id);
            });
            
            const btnEliminar = tareaElement.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', (e) => eliminarRegistro(tarea.id, e));
            
            historialTareas.appendChild(tareaElement);
        });
    } catch (error) {
        console.error('Error al mostrar registros:', error);
        mostrarMensaje('Error al cargar el historial');
    }
}

// Función para formatear la hora en formato 24 horas
function formatearHora(hora24) {
    if (!hora24) return '';
    return hora24;
}

// Función para actualizar el selector de salas en el filtro PDF
function actualizarSelectorSalasPDF() {
    const salaFiltro = document.getElementById('salaFiltro');
    const salasGuardadas = new Set();
    
    // Obtener todas las salas únicas del historial
    const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
    indicesTareas.forEach(id => {
        const tareaData = localStorage.getItem(id);
        if (tareaData) {
            const tarea = JSON.parse(tareaData);
            salasGuardadas.add(tarea.titulo);
        }
    });
    
    // Limpiar opciones existentes excepto la primera (Todas las salas)
    while (salaFiltro.options.length > 1) {
        salaFiltro.remove(1);
    }
    
    // Agregar las salas al selector
    Array.from(salasGuardadas).sort().forEach(sala => {
        const option = new Option(sala, sala);
        salaFiltro.add(option);
    });
}

// Función para mostrar el selector de fechas
function mostrarSelectorFechas() {
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    fechaFiltroContainer.classList.add('visible');
    actualizarSelectorSalasPDF();
}

// Función para formatear fecha como dd/mm/aaaa
function formatearFecha(fecha) {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
}

// Función para generar el PDF
async function generarPDF(fechaInicio, fechaFin, salaSeleccionada) {
    try {
        // Obtener tareas del localStorage
        const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
        let tareas = indicesTareas
            .map(id => {
                const tareaData = localStorage.getItem(id);
                if (!tareaData) return null;
                return JSON.parse(tareaData);
            })
            .filter(tarea => {
                if (!tarea) return false;
                const fechaTarea = new Date(tarea.fecha);
                const inicio = new Date(fechaInicio);
                const fin = new Date(fechaFin);
                
                // Filtrar por fecha y sala si está seleccionada
                const cumpleFecha = fechaTarea >= inicio && fechaTarea <= fin;
                if (salaSeleccionada) {
                    return cumpleFecha && tarea.titulo === salaSeleccionada;
                }
                return cumpleFecha;
            });

        // Ordenar por fecha
        tareas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // Crear el contenido del PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Función para agregar el título centrado y subrayado
        function agregarTituloCentrado(doc, yPos = 20) {
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            const titulo = 'Informe de Partes de Trabajo';
            const anchoTitulo = doc.getTextWidth(titulo);
            const xTitulo = (doc.internal.pageSize.width - anchoTitulo) / 2;
            
            // Dibujar el título
            doc.text(titulo, xTitulo, yPos);
            
            // Agregar el subrayado
            doc.setLineWidth(0.5);
            doc.line(xTitulo, yPos + 1, xTitulo + anchoTitulo, yPos + 1);
            
            // Restaurar la fuente normal
            doc.setFont(undefined, 'normal');
            
            return yPos + 10; // Retorna la siguiente posición Y
        }
        
        // Agregar título en la primera página
        let yPos = agregarTituloCentrado(doc);
        
        // Período y sala seleccionada
        doc.setFontSize(12);
        const fechaInicioFormateada = formatearFecha(fechaInicio);
        const fechaFinFormateada = formatearFecha(fechaFin);
        doc.text(`Período: ${fechaInicioFormateada} al ${fechaFinFormateada}`, 20, yPos + 10);
        
        if (salaSeleccionada) {
            doc.text(`Sala: ${salaSeleccionada}`, 20, yPos + 17);
            yPos = yPos + 27;
        } else {
            doc.text('Todas las salas', 20, yPos + 17);
            yPos = yPos + 27;
        }
        
        // Agregar cada tarea al PDF
        tareas.forEach(tarea => {
            // Si no hay espacio suficiente en la página actual, crear una nueva
            if (yPos > 250) {
                doc.addPage();
                // Agregar título en la nueva página
                yPos = agregarTituloCentrado(doc);
            }
            
            // Escribir "Sala:" y el nombre de la sala en negrita y subrayado
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            const textoCompletoSala = `Sala: ${tarea.titulo}`;
            doc.text(textoCompletoSala, 20, yPos);
            
            // Calcular ancho del texto completo para el subrayado
            const anchoTextoCompleto = doc.getTextWidth(textoCompletoSala);
            doc.setLineWidth(0.5);
            doc.line(20, yPos + 1, 20 + anchoTextoCompleto, yPos + 1);
            yPos += 7;
            
            // Volver a fuente normal para el resto del contenido
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            
            const fechaTareaFormateada = formatearFecha(tarea.fecha);
            doc.text(`Fecha: ${fechaTareaFormateada}`, 20, yPos);
            yPos += 5;
            
            doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, 20, yPos);
            yPos += 5;
            
            doc.text(`Prioridad: ${tarea.prioridad}`, 20, yPos);
            yPos += 7;
            
            // Escribir "Trabajo realizado:" en negrita y subrayado
            doc.setFont(undefined, 'bold');
            const textoTrabajo = 'Trabajo realizado:';
            doc.text(textoTrabajo, 20, yPos);
            
            const anchoTrabajo = doc.getTextWidth(textoTrabajo);
            doc.setLineWidth(0.5);
            doc.line(20, yPos + 1, 20 + anchoTrabajo, yPos + 1);
            yPos += 5;
            
            doc.setFont(undefined, 'normal');
            const descripcionLineas = doc.splitTextToSize(tarea.descripcion, 170);
            doc.text(descripcionLineas, 20, yPos);
            yPos += (descripcionLineas.length * 5) + 10;
            
            doc.setLineWidth(0.2);
            doc.line(20, yPos - 5, 190, yPos - 5);
            yPos += 10;
        });
        
        // Nombre del archivo con la sala si está seleccionada
        let nombreArchivo = `informe_tareas_${fechaInicioFormateada}_${fechaFinFormateada}`;
        if (salaSeleccionada) {
            nombreArchivo += `_${salaSeleccionada.replace(/[^a-z0-9]/gi, '_')}`;
        }
        doc.save(`${nombreArchivo}.pdf`);
        
        document.getElementById('fechaFiltroContainer').classList.remove('visible');
        mostrarMensaje('PDF generado correctamente');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarMensaje('Error al generar el PDF');
    }
}

// Evento para generar el PDF cuando se confirman las fechas
document.getElementById('generarPDFBtn').addEventListener('click', () => {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const salaSeleccionada = document.getElementById('salaFiltro').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarMensaje('Por favor, seleccione ambas fechas');
        return;
    }
    
    if (fechaFin < fechaInicio) {
        mostrarMensaje('La fecha final debe ser posterior a la fecha inicial');
        return;
    }
    
    generarPDF(fechaInicio, fechaFin, salaSeleccionada);
});

// Evento para mostrar el selector de fechas
document.getElementById('mostrarPDFBtn').addEventListener('click', mostrarSelectorFechas);

// Evento para cerrar el selector de fechas
document.getElementById('cerrarFiltroBtn').addEventListener('click', () => {
    document.getElementById('fechaFiltroContainer').classList.remove('visible');
}); 