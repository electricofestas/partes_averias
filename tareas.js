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
    toggleHistorialBtn.addEventListener('submit', toggleHistorial);
    fotosInput.addEventListener('change', mostrarPreviewFotos);

    // Cargar historial inicial
    actualizarHistorial();
});

// Función para guardar una nueva tarea
function guardarTarea(e) {
    e.preventDefault();
    
    const tarea = {
        id: Date.now(),
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
        tarea.fotos = fotosBase64;
        tareas.push(tarea);
        localStorage.setItem('tareas', JSON.stringify(tareas));
        
        document.getElementById('tareaForm').reset();
        document.getElementById('fotosPreview').innerHTML = '';
        actualizarHistorial();
        
        mostrarMensaje('Tarea guardada correctamente', 'success');
    });
}

// Función para mostrar/ocultar el historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleBtn = document.getElementById('toggleHistorial');
    historialVisible = !historialVisible;
    
    historialContainer.classList.toggle('hidden');
    toggleBtn.textContent = historialVisible ? 'Ocultar Historial' : 'Mostrar Historial';
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