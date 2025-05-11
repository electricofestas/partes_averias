// Obtener elementos del DOM
const tareaForm = document.getElementById('tareaForm');
const toggleHistorialBtn = document.getElementById('toggleHistorial');
const historialContainer = document.getElementById('historialContainer');
const historialTareas = document.getElementById('historialTareas');
const selectSala = document.getElementById('titulo');
let tareaEditandoId = null;

// Función para mostrar mensajes
function mostrarMensaje(mensaje) {
    alert(mensaje);
}

// Función para validar fecha
function validarFecha(fecha) {
    try {
        if (!fecha) {
            mostrarMensaje('Por favor, seleccione una fecha');
            return false;
        }
        
        const fechaSeleccionada = new Date(fecha);
        const fechaActual = new Date();
        
        // Establecer las horas a 0 para comparar solo las fechas
        fechaSeleccionada.setHours(0, 0, 0, 0);
        fechaActual.setHours(0, 0, 0, 0);
        
        // Verificar si la fecha es válida
        if (isNaN(fechaSeleccionada.getTime())) {
            mostrarMensaje('La fecha ingresada no es válida');
            return false;
        }
        
        // Permitir fechas desde hoy en adelante
        if (fechaSeleccionada < fechaActual) {
            mostrarMensaje('La fecha debe ser igual o posterior a hoy');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error al validar fecha:', error);
        mostrarMensaje('Error al validar la fecha');
        return false;
    }
}

// Función para procesar fotos
async function procesarFotos(fotosInput) {
    try {
        if (!fotosInput || fotosInput.files.length === 0) return [];
        
        const fotos = [];
        for (const file of fotosInput.files) {
            if (!file.type.startsWith('image/')) {
                throw new Error('Solo se permiten archivos de imagen');
            }
            
            const foto = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Error al leer el archivo'));
                reader.readAsDataURL(file);
            });
            fotos.push(foto);
        }
        return fotos;
    } catch (error) {
        console.error('Error al procesar fotos:', error);
        mostrarMensaje('Error al procesar las fotos');
        return [];
    }
}

// Función para mostrar foto en modal
function mostrarFotoModal(fotoUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal-foto';
    modal.innerHTML = `
        <div class="modal-contenido">
            <span class="cerrar-modal">&times;</span>
            <img src="${fotoUrl}" alt="Foto ampliada">
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target.className === 'modal-foto' || e.target.className === 'cerrar-modal') {
            modal.remove();
        }
    });
}

// Función para obtener tareas del storage
function obtenerTareasDelStorage() {
    const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
    return indicesTareas
        .map(id => {
            const tareaData = localStorage.getItem(id);
            if (!tareaData) return null;
            return JSON.parse(tareaData);
        })
        .filter(tarea => tarea !== null);
}

// Función para mostrar tareas
function mostrarTareas() {
    historialTareas.innerHTML = '';
    
    try {
        const tareas = obtenerTareasDelStorage();
        tareas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        
        tareas.forEach(tarea => {
            const tareaElement = document.createElement('div');
            tareaElement.className = `tarea-item prioridad-${tarea.prioridad}`;
            if (tareaEditandoId === tarea.id) {
                tareaElement.classList.add('editando');
            }
            
            tareaElement.innerHTML = `
                <div class="tarea-header">
                    <h5>${tarea.titulo}</h5>
                    <div class="botones-tarea">
                        <button onclick="editarRegistro('${tarea.id}')" class="btn-editar">✏️</button>
                        <button onclick="eliminarRegistro('${tarea.id}', event)" class="btn-eliminar">🗑️</button>
                    </div>
                </div>
                <div class="trabajo-contenido">
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

// Función para mostrar/ocultar el selector de fechas
function mostrarSelectorFechas() {
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    fechaFiltroContainer.classList.toggle('hidden');
    actualizarSelectorSalasPDF();
}

// Función para actualizar el selector de salas en el filtro PDF
function actualizarSelectorSalasPDF() {
    const salaFiltro = document.getElementById('salaFiltro');
    const salasGuardadas = new Set();
    
    const tareas = obtenerTareasDelStorage();
    tareas.forEach(tarea => salasGuardadas.add(tarea.titulo));
    
    // Limpiar opciones existentes excepto la primera
    while (salaFiltro.options.length > 1) {
        salaFiltro.remove(1);
    }
    
    // Agregar las salas al selector
    Array.from(salasGuardadas).sort().forEach(sala => {
        const option = new Option(sala, sala);
        salaFiltro.add(option);
    });
}

// Función para mostrar/ocultar el historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    
    if (!historialContainer || !toggleHistorialBtn) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    if (historialContainer.style.display === 'none' || historialContainer.classList.contains('hidden')) {
        historialContainer.style.display = 'block';
        historialContainer.classList.remove('hidden');
        toggleHistorialBtn.textContent = 'Ocultar Historial';
        mostrarTareas(); // Actualizamos el historial
    } else {
        historialContainer.style.display = 'none';
        historialContainer.classList.add('hidden');
        toggleHistorialBtn.textContent = 'Mostrar Historial';
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar el historial inicialmente
    if (historialContainer) {
        historialContainer.classList.remove('hidden');
        mostrarTareas();
    }
    
    // Configurar el botón de historial
    if (toggleHistorialBtn) {
        toggleHistorialBtn.textContent = 'Ocultar Historial';
        toggleHistorialBtn.addEventListener('click', toggleHistorial);
    }
    
    // Cargar datos iniciales
    limpiarDatosAntiguos();
    cargarSalas();
    
    // Configurar el selector de salas
    const optionNueva = new Option('+ Agregar nueva sala', 'nueva_sala');
    selectSala.add(optionNueva);
});

// Función para editar un registro
function editarRegistro(id) {
    try {
        const tareaData = localStorage.getItem(id);
        if (!tareaData) {
            mostrarMensaje('No se encontró la tarea');
            return;
        }

        const tarea = JSON.parse(tareaData);
        tareaEditandoId = id;

        // Rellenar el formulario con los datos de la tarea
        document.getElementById('titulo').value = tarea.titulo;
        document.getElementById('fecha').value = tarea.fecha;
        document.getElementById('horaInicio').value = tarea.horaInicio;
        document.getElementById('horaFin').value = tarea.horaFin;
        document.getElementById('descripcion').value = tarea.descripcion;
        document.getElementById('prioridad').value = tarea.prioridad;

        // Cambiar el texto del botón de submit
        const submitBtn = tareaForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Actualizar Tarea';

        // Hacer scroll hacia el formulario
        tareaForm.scrollIntoView({ behavior: 'smooth' });

        // Actualizar la vista del historial
        mostrarTareas();
    } catch (error) {
        console.error('Error al editar registro:', error);
        mostrarMensaje('Error al cargar la tarea para editar');
    }
}

// Evento para el formulario
tareaForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const titulo = document.getElementById('titulo').value.trim();
        const fecha = document.getElementById('fecha').value;
        const horaInicio = document.getElementById('horaInicio').value;
        const horaFin = document.getElementById('horaFin').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const prioridad = document.getElementById('prioridad').value;
        const fotos = await procesarFotos(document.getElementById('fotos'));

        // Validaciones
        if (!titulo) {
            mostrarMensaje('Por favor, ingrese el nombre de la sala');
            return;
        }

        if (!validarFecha(fecha)) {
            return; // El mensaje se muestra en la función validarFecha
        }

        if (!horaInicio || !horaFin) {
            mostrarMensaje('Por favor, ingrese el horario completo');
            return;
        }

        if (horaInicio >= horaFin) {
            mostrarMensaje('La hora de inicio debe ser anterior a la hora de fin');
            return;
        }

        if (!descripcion) {
            mostrarMensaje('Por favor, ingrese una descripción de la tarea');
            return;
        }

        const tarea = {
            id: tareaEditandoId || Date.now().toString(),
            titulo,
            fecha,
            horaInicio,
            horaFin,
            descripcion,
            prioridad,
            fotos,
            fechaCreacion: tareaEditandoId ? 
                JSON.parse(localStorage.getItem(tareaEditandoId))?.fechaCreacion || 
                new Date().toISOString() : 
                new Date().toISOString(),
            fechaModificacion: new Date().toISOString(),
            version: tareaEditandoId ? 
                (JSON.parse(localStorage.getItem(tareaEditandoId))?.version || 0) + 1 : 
                1
        };

        // Guardar la tarea
        localStorage.setItem(tarea.id, JSON.stringify(tarea));

        // Actualizar índices
        const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
        if (!indicesTareas.includes(tarea.id)) {
            indicesTareas.push(tarea.id);
            localStorage.setItem('indicesTareas', JSON.stringify(indicesTareas));
        }

        // Limpiar el formulario y restablecer el estado
        tareaForm.reset();
        document.getElementById('fotosPreview').innerHTML = '';
        tareaEditandoId = null;
        const submitBtn = tareaForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Guardar Tarea';

        mostrarMensaje(tareaEditandoId ? 'Tarea actualizada correctamente' : 'Tarea guardada correctamente');
        mostrarTareas();
    } catch (error) {
        console.error('Error al guardar tarea:', error);
        mostrarMensaje('Error al guardar la tarea');
    }
});

// Guardar la sala en la lista de salas
guardarNuevaSala(titulo);

// Limpiar el formulario y restablecer el estado
tareaForm.reset();
document.getElementById('fotosPreview').innerHTML = '';
tareaEditandoId = null;
const submitBtn = tareaForm.querySelector('button[type="submit"]');
submitBtn.textContent = 'Guardar Tarea';

mostrarMensaje(tareaEditandoId ? 'Tarea actualizada correctamente' : 'Tarea guardada correctamente');
mostrarTareas();
} catch (error) {
    console.error('Error al guardar tarea:', error);
    mostrarMensaje('Error al guardar la tarea');
}

// Función para generar PDF
async function generarPDF() {
    const fechaInicio = document.getElementById('fechaInicioPDF').value;
    const fechaFin = document.getElementById('fechaFinPDF').value;
    const salaSeleccionada = document.getElementById('salaFiltro').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarMensaje('Por favor, seleccione un rango de fechas');
        return;
    }
    
    try {
        let tareas = obtenerTareasDelStorage();
        
        // Filtrar por fecha y sala
        tareas = tareas.filter(tarea => {
            const fechaTarea = new Date(tarea.fecha);
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            inicio.setHours(0, 0, 0, 0);
            fin.setHours(23, 59, 59, 999);
            
            const cumpleFecha = fechaTarea >= inicio && fechaTarea <= fin;
            if (salaSeleccionada) {
                return cumpleFecha && tarea.titulo === salaSeleccionada;
            }
            return cumpleFecha;
        });
        
        if (tareas.length === 0) {
            mostrarMensaje('No hay tareas para el período seleccionado');
            return;
        }
        
        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración del documento
        doc.setFontSize(16);
        doc.text('Informe de Tareas', 20, 20);
        
        let yPos = 40;
        tareas.forEach(tarea => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(12);
            doc.text(`Sala: ${tarea.titulo}`, 20, yPos);
            doc.text(`Fecha: ${new Date(tarea.fecha).toLocaleDateString()}`, 20, yPos + 7);
            doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, 20, yPos + 14);
            doc.text(`Prioridad: ${tarea.prioridad}`, 20, yPos + 21);
            
            // Manejar descripción larga
            const descripcionLines = doc.splitTextToSize(tarea.descripcion, 170);
            doc.text('Descripción:', 20, yPos + 28);
            doc.setFontSize(10);
            doc.text(descripcionLines, 20, yPos + 35);
            
            yPos += 50 + (descripcionLines.length * 5);
        });
        
        // Guardar el PDF
        doc.save(`informe_${fechaInicio}_${fechaFin}.pdf`);
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarMensaje('Error al generar el informe PDF');
    }
}