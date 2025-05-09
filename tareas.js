// Obtener elementos del DOM
const tareaForm = document.getElementById('tareaForm');
const toggleHistorialBtn = document.getElementById('toggleHistorial');
const historialContainer = document.getElementById('historialContainer');
const historialTareas = document.getElementById('historialTareas');
const selectSala = document.getElementById('titulo');
let tareaEditandoId = null;

// Función para cargar las salas guardadas
function cargarSalas() {
    try {
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
    } catch (error) {
        console.error('Error al cargar las salas:', error);
        mostrarMensaje('Error al cargar las salas guardadas');
    }
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
            // Validar caracteres especiales y longitud
            const nombreValido = /^[a-zA-Z0-9\s._-]{3,50}$/.test(nuevaSala.trim());
            if (!nombreValido) {
                alert('El nombre de la sala debe tener entre 3 y 50 caracteres y solo puede contener letras, números, espacios, puntos, guiones y guiones bajos');
                selectSala.value = '';
                return;
            }
            guardarNuevaSala(nuevaSala.trim());
            selectSala.value = nuevaSala;
        } else {
            selectSala.value = '';
        }
    }
});

// Cargar tareas y salas guardadas al iniciar
function limpiarDatosAntiguos() {
    try {
        const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
        const tareasValidas = [];
        
        indicesTareas.forEach(id => {
            const tareaData = localStorage.getItem(id);
            if (tareaData) {
                tareasValidas.push(id);
            } else {
                localStorage.removeItem(id);
            }
        });
        
        localStorage.setItem('indicesTareas', JSON.stringify(tareasValidas));
    } catch (error) {
        console.error('Error al limpiar datos antiguos:', error);
    }
}

// Agregar al inicio de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    limpiarDatosAntiguos();
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
    
    // Validar campos obligatorios
    if (!titulo || !descripcion || !fecha || !horaInicio || !horaFin || !prioridad) {
        alert('Por favor, complete todos los campos obligatorios');
        return;
    }

    // Validar que la fecha no sea anterior a la actual
    const fechaSeleccionada = new Date(fecha);
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    if (fechaSeleccionada < fechaActual) {
        alert('La fecha no puede ser anterior a la fecha actual');
        return;
    }
    
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

            // Manejar las fotos si existen
            const fotosInput = document.getElementById('fotos');
            if (fotosInput.files.length > 0) {
                const fotos = [];
                for (let i = 0; i < fotosInput.files.length; i++) {
                    const file = fotosInput.files[i];
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        fotos.push(reader.result);
                        if (fotos.length === fotosInput.files.length) {
                            // Guardar las fotos en el registro
                            tareaActualizada.fotos = fotos;
                            localStorage.setItem(tareaEditandoId, JSON.stringify(tareaActualizada));
                            mostrarTareas();
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }

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

            // Agregar sección de fotos si existen
            let fotosHTML = '';
            if (tarea.fotos && tarea.fotos.length > 0) {
                fotosHTML = `
                    <div class="fotos-container">
                        <h4>Fotos adjuntas:</h4>
                        <div class="fotos-grid">
                            ${tarea.fotos.map((foto, index) => `
                                <div class="foto-thumbnail" onclick="mostrarFotoModal('${foto}')">
                                    <img src="${foto}" alt="Foto ${index + 1}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
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
                    ${fotosHTML}
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

// Función para validar campos del formulario
function validarFormulario() {
    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const fecha = document.getElementById('fecha').value;
    const horaInicio = document.getElementById('horaInicio').value;
    const horaFin = document.getElementById('horaFin').value;
    
    // Validar campos obligatorios
    if (!titulo || !descripcion || !fecha || !horaInicio || !horaFin) {
        mostrarMensaje('Por favor, complete todos los campos obligatorios', 'error');
        return false;
    }

    // Validar longitud de la descripción
    if (descripcion.length > 500) {
        mostrarMensaje('La descripción no puede exceder los 500 caracteres', 'error');
        return false;
    }

    // Validar fecha (no permitir fechas futuras)
    const fechaSeleccionada = new Date(fecha);
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    if (fechaSeleccionada > fechaActual) {
        mostrarMensaje('No se pueden registrar tareas con fecha futura', 'error');
        return false;
    }

    // Validar horas
    if (horaFin <= horaInicio) {
        mostrarMensaje('La hora de finalización debe ser posterior a la hora de inicio', 'error');
        return false;
    }

    return true;
}

// Función mejorada para mostrar mensajes
function mostrarMensaje(texto, tipo = 'info') {
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje-flotante mensaje-${tipo}`;
    mensaje.textContent = texto;
    mensaje.setAttribute('role', 'alert');
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.classList.add('ocultar');
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}

// Función para manejar el respaldo de datos
function exportarRespaldo() {
    try {
        const datos = {
            salas: JSON.parse(localStorage.getItem('salas')) || [],
            indicesTareas: JSON.parse(localStorage.getItem('indicesTareas')) || [],
            tareas: {}
        };

        // Obtener todas las tareas
        datos.indicesTareas.forEach(id => {
            const tarea = localStorage.getItem(id);
            if (tarea) {
                datos.tareas[id] = JSON.parse(tarea);
            }
        });

        // Crear y descargar el archivo
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `respaldo_tareas_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        mostrarMensaje('Respaldo exportado correctamente', 'success');
    } catch (error) {
        console.error('Error al exportar respaldo:', error);
        mostrarMensaje('Error al exportar el respaldo', 'error');
    }
}

// Función para importar respaldo
async function importarRespaldo(archivo) {
    try {
        const texto = await archivo.text();
        const datos = JSON.parse(texto);

        // Validar estructura del archivo
        if (!datos.salas || !datos.indicesTareas || !datos.tareas) {
            throw new Error('Formato de archivo inválido');
        }

        // Importar datos
        localStorage.setItem('salas', JSON.stringify(datos.salas));
        localStorage.setItem('indicesTareas', JSON.stringify(datos.indicesTareas));
        
        Object.entries(datos.tareas).forEach(([id, tarea]) => {
            localStorage.setItem(id, JSON.stringify(tarea));
        });

        mostrarMensaje('Respaldo importado correctamente', 'success');
        cargarSalas();
        mostrarTareas();
    } catch (error) {
        console.error('Error al importar respaldo:', error);
        mostrarMensaje('Error al importar el respaldo', 'error');
    }
}

// Evento para el botón de exportar respaldo
document.getElementById('exportarRespaldo').addEventListener('click', exportarRespaldo);

// Evento para el botón de importar respaldo
document.getElementById('importarRespaldo').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const archivo = e.target.files[0];
        if (archivo) {
            importarRespaldo(archivo);
        }
    };
    input.click();
});

// Función para limpiar datos antiguos
function limpiarDatosAntiguos() {
    try {
        const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
        const tareasValidas = indicesTareas.filter(id => {
            const tarea = localStorage.getItem(id);
            if (!tarea) {
                localStorage.removeItem(id);
                return false;
            }
            return true;
        });
        
        localStorage.setItem('indicesTareas', JSON.stringify(tareasValidas));
    } catch (error) {
        console.error('Error al limpiar datos antiguos:', error);
    }
}

// Modificar el evento submit del formulario
tareaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
        return;
    }
    
    // ... existing code ...
});

// Agregar validación de caracteres al textarea
document.getElementById('descripcion').addEventListener('input', function() {
    const maxLength = 500;
    const contador = document.getElementById('descripcion-contador');
    const caracteresActuales = this.value.length;
    
    contador.textContent = `${caracteresActuales}/${maxLength}`;
    
    if (caracteresActuales > maxLength) {
        contador.classList.add('excedido');
        this.classList.add('error');
    } else {
        contador.classList.remove('excedido');
        this.classList.remove('error');
    }
});

// Inicialización mejorada
document.addEventListener('DOMContentLoaded', () => {
    limpiarDatosAntiguos();
    cargarSalas();
    mostrarTareas();
    
    // Establecer fecha máxima como hoy
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.max = hoy;
    
    // Agregar opción para nueva sala
    const optionNueva = new Option('+ Agregar nueva sala', 'nueva_sala');
    selectSala.add(optionNueva);
});