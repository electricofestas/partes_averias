// Función para guardar una tarea
function guardarTarea(event) {
    event.preventDefault();
    
    try {
        const titulo = document.getElementById('titulo').value;
        const prioridad = document.getElementById('prioridad').value;
        const fecha = document.getElementById('fecha').value;
        
        const horaInicio = document.getElementById('horaInicio').value;
        const horaFin = document.getElementById('horaFin').value;
        const descripcion = document.getElementById('descripcion').value;
        const fotosInput = document.getElementById('fotos');
        const formulario = document.getElementById('tareaForm');
        
        if (!titulo || !fecha || !horaInicio || !horaFin || !descripcion) {
            mostrarMensaje('Por favor, complete todos los campos requeridos');
            return;
        }

        const id = formulario.dataset.editandoId || 'tarea_' + Date.now();
        const version = formulario.dataset.editandoId ? parseInt(formulario.dataset.version) || 1 : 1;

        // Procesar fotos
        const fotos = [];
        const procesarFotos = new Promise((resolve) => {
            if (fotosInput.files.length > 0) {
                let fotosProcessadas = 0;
                Array.from(fotosInput.files).forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        fotos[index] = e.target.result;
                        fotosProcessadas++;
                        if (fotosProcessadas === fotosInput.files.length) {
                            resolve();
                        }
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                resolve();
            }
        });

        procesarFotos.then(() => {
            const tarea = {
                id: id,
                titulo: titulo,
                prioridad: prioridad,
                fecha: fecha,
                horaInicio: horaInicio,
                horaFin: horaFin,
                descripcion: descripcion,
                fotos: fotos,
                fechaCreacion: formulario.dataset.editandoId ? 
                    JSON.parse(localStorage.getItem(id)).fechaCreacion : 
                    new Date().toISOString(),
                fechaModificacion: new Date().toISOString(),
                version: version
            };

            localStorage.setItem(id, JSON.stringify(tarea));

            if (!formulario.dataset.editandoId) {
                const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
                indicesTareas.push(id);
                localStorage.setItem('indicesTareas', JSON.stringify(indicesTareas));
            }

            formulario.reset();
            delete formulario.dataset.editandoId;
            delete formulario.dataset.version;
            document.getElementById('fotosPreview').innerHTML = '';
            
            const submitButton = formulario.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Guardar Tarea';
            }

            mostrarMensaje(formulario.dataset.editandoId ? 
                'Tarea actualizada correctamente' : 
                'Tarea guardada correctamente');
            
            mostrarTareas();
        });
    } catch (error) {
        console.error('Error al guardar la tarea:', error);
        mostrarMensaje('Error al guardar la tarea');
    }
}

// Función para editar un registro
function editarRegistro(id) {
    try {
        const tarea = JSON.parse(localStorage.getItem(id));
        if (!tarea) {
            mostrarMensaje('No se encontró la tarea');
            return;
        }

        document.getElementById('titulo').value = tarea.titulo;
        document.getElementById('prioridad').value = tarea.prioridad;
        document.getElementById('fecha').value = tarea.fecha;
        document.getElementById('horaInicio').value = tarea.horaInicio;
        document.getElementById('horaFin').value = tarea.horaFin;
        document.getElementById('descripcion').value = tarea.descripcion;

        const previewContainer = document.getElementById('fotosPreview');
        previewContainer.innerHTML = '';
        if (tarea.fotos && tarea.fotos.length > 0) {
            tarea.fotos.forEach(foto => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'foto-preview';
                previewDiv.innerHTML = `<img src="${foto}" alt="Vista previa">`;
                previewContainer.appendChild(previewDiv);
            });
        }

        const formulario = document.getElementById('tareaForm');
        formulario.dataset.editandoId = id;
        formulario.dataset.version = (tarea.version || 1) + 1;

        const submitButton = formulario.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Actualizar Tarea';
        }

        formulario.scrollIntoView({ behavior: 'smooth' });
        mostrarMensaje('Editando tarea...');
    } catch (error) {
        console.error('Error al cargar la tarea para editar:', error);
        mostrarMensaje('Error al cargar la tarea');
    }
}

// Función para obtener tareas del storage
function obtenerTareasDelStorage() {
    const indicesTareas = JSON.parse(localStorage.getItem('indicesTareas')) || [];
    return indicesTareas.map(id => JSON.parse(localStorage.getItem(id))).filter(Boolean);
}

// Función para mostrar tareas en el historial
function mostrarTareas() {
    const historialTareas = document.getElementById('historialTareas');
    if (!historialTareas) return;

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
                <span class="prioridad-${tarea.prioridad.toLowerCase()}">${tarea.prioridad}</span>
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

// Función para generar PDF
function generarPDF() {
    try {
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
            
            inicio.setHours(0, 0, 0, 0);
            fin.setHours(23, 59, 59, 999);
            
            const cumpleFecha = fechaTarea >= inicio && fechaTarea <= fin;
            const cumpleSala = !salaSeleccionada || tarea.titulo === salaSeleccionada;
            
            return cumpleFecha && cumpleSala;
        });

        if (tareas.length === 0) {
            mostrarMensaje('No hay tareas para el período seleccionado');
            return;
        }

        // Configurar el documento
        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.text('Informe de Tareas', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()}`, 20, 30);
        if (salaSeleccionada) {
            doc.text(`Sala: ${salaSeleccionada}`, 20, 40);
        }

        let yPos = 50;
        
        tareas.forEach((tarea, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${tarea.titulo}`, 20, yPos);
            yPos += 10;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Fecha: ${new Date(tarea.fecha).toLocaleDateString()}`, 25, yPos);
            yPos += 7;
            doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, 25, yPos);
            yPos += 7;
            doc.text(`Prioridad: ${tarea.prioridad}`, 25, yPos);
            yPos += 7;
            
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

        doc.save(`informe_tareas_${fechaInicio}_${fechaFin}.pdf`);
        mostrarMensaje('PDF generado correctamente');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarMensaje('Error al generar el PDF');
    }
}

// Event Listeners
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