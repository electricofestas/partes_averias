// ... existing code ...

// Agregar estilos para el modal de fotos
const estilosModal = document.createElement('style');
estilosModal.textContent = `
    .modal-foto {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-contenido {
        position: relative;
        max-width: 90%;
        max-height: 90%;
    }
    
    .modal-contenido img {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
    }
    
    .cerrar-modal {
        position: absolute;
        top: -30px;
        right: 0;
        color: white;
        font-size: 30px;
        cursor: pointer;
    }
`;
document.head.appendChild(estilosModal);

// ... existing code ...