// Función para mostrar/ocultar el selector de fechas
function mostrarSelectorFechas() {
    const fechaFiltroContainer = document.getElementById('fechaFiltroContainer');
    if (fechaFiltroContainer) {
        fechaFiltroContainer.classList.remove('hidden');
        // Cargar las salas en el selector de filtro
        cargarSalasEnFiltro();
    }
}

// Función para cargar las salas en el filtro
function cargarSalasEnFiltro() {
    const salaFiltro = document.getElementById('salaFiltro');
    const salas = new Set();
    
    // Obtener todas las salas únicas del historial
    obtenerTareasDelStorage().forEach(tarea => {
        if (tarea.titulo) {
            salas.add(tarea.titulo);
        }
    });

    // Limpiar opciones existentes excepto la primera (Todas las salas)
    while (salaFiltro.options.length > 1) {
        salaFiltro.remove(1);
    }

    // Agregar las salas al selector
    salas.forEach(sala => {
        const option = document.createElement('option');
        option.value = sala;
        option.textContent = sala;
        salaFiltro.appendChild(option);
    });
}

// Función para generar el PDF
function generarPDF() {
    const fechaInicio = document.getElementById('fechaInicioPDF').value;
    const fechaFin = document.getElementById('fechaFinPDF').value;
    const salaFiltro = document.getElementById('salaFiltro').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarMensaje('Por favor, seleccione un rango de fechas');
        return;
    }

    try {
        const tareas = obtenerTareasDelStorage().filter(tarea => {
            const fechaTarea = new Date(tarea.fecha);
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            
            inicio.setHours(0, 0, 0, 0);
            fin.setHours(23, 59, 59, 999);
            
            const cumpleFecha = fechaTarea >= inicio && fechaTarea <= fin;
            const cumpleSala = !salaFiltro || tarea.titulo === salaFiltro;
            
            return cumpleFecha && cumpleSala;
        });

        if (tareas.length === 0) {
            mostrarMensaje('No hay tareas para el período seleccionado');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial del PDF
        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.text('Informe de Tareas', 105, 20, { align: 'center' });
        
        // Información del período
        doc.setFontSize(12);
        doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()}`, 20, 30);
        if (salaFiltro) {
            doc.text(`Sala: ${salaFiltro}`, 20, 40);
        }

        let yPos = 50;
        const margen = 20;
        const lineHeight = 7;

        tareas.forEach((tarea, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${tarea.titulo}`, margen, yPos);
            yPos += lineHeight;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Fecha: ${new Date(tarea.fecha).toLocaleDateString()}`, margen, yPos);
            yPos += lineHeight;
            
            doc.text(`Horario: ${tarea.horaInicio} - ${tarea.horaFin}`, margen, yPos);
            yPos += lineHeight;
            
            doc.text(`Prioridad: ${tarea.prioridad}`, margen, yPos);
            yPos += lineHeight;
            
            const descripcionLineas = doc.splitTextToSize(tarea.descripcion, 170);
            descripcionLineas.forEach(linea => {
                doc.text(linea, margen, yPos);
                yPos += lineHeight;
            });

            yPos += lineHeight;
        });

        doc.save(`informe_tareas_${fechaInicio}_${fechaFin}.pdf`);
        mostrarMensaje('PDF generado correctamente');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarMensaje('Error al generar el PDF');
    }
}