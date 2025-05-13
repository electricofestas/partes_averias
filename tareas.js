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

// ... existing code ...

// Función para mostrar vista previa de las fotos
function mostrarVistaPrevia() {
    const fotosInput = document.getElementById('fotos');
    const previewContainer = document.getElementById('fotosPreview');
    previewContainer.innerHTML = '';

    Array.from(fotosInput.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'foto-preview';
            previewDiv.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
            previewContainer.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
    });
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

    if (fechaFiltroContainer) {
        fechaFiltroContainer.classList.add('hidden');
    }
});