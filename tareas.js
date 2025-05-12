// Función para mostrar/ocultar el historial
function toggleHistorial() {
    const historialContainer = document.getElementById('historialContainer');
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const historialTareas = document.getElementById('historialTareas');
    
    if (!historialContainer || !toggleHistorialBtn || !historialTareas) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    // Cambiar la visibilidad del contenedor
    const estaOculto = historialContainer.style.display === 'none' || historialContainer.classList.contains('hidden');
    
    if (estaOculto) {
        historialContainer.style.display = 'block';
        historialContainer.classList.remove('hidden');
        toggleHistorialBtn.textContent = 'Ocultar Historial';
        mostrarTareas(); // Actualizamos el historial solo cuando se muestra
    } else {
        historialContainer.style.display = 'none';
        historialContainer.classList.add('hidden');
        toggleHistorialBtn.textContent = 'Mostrar Historial';
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    const toggleHistorialBtn = document.getElementById('toggleHistorial');
    const historialContainer = document.getElementById('historialContainer');
    
    // Asegurarse de que el historial esté oculto inicialmente
    if (historialContainer) {
        historialContainer.style.display = 'none';
        historialContainer.classList.add('hidden');
    }
    
    // Configurar el botón de historial
    if (toggleHistorialBtn) {
        toggleHistorialBtn.textContent = 'Mostrar Historial';
        toggleHistorialBtn.addEventListener('click', toggleHistorial);
    }
});