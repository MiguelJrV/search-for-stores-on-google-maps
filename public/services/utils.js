$(document).ready(function() {
    function UtilityButtons() {
        $('.gohome').on('click', function() {
        window.location.href = 'https://rapikom.com';
    });
    }

    UtilityButtons();
});


//Funciones que se necesitan para ciertos eventos


async function sendData(url, method, data) {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('Éxito:', result.message || result);
            return result;
        } else {
            console.error('Error:', result.message || 'Error desconocido');
            throw new Error(result.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        throw error;
    }
}

async function fetchData(url, params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${url}?${queryString}`);
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error al obtener datos de ${url}:`, error);
        throw error;
    }
}

function fetchSVG(url) {
    return fetch(url)
        .then(response => response.text())
        .then(data => {
            const svgBlob = new Blob([data], { type: 'image/svg+xml' });
            return URL.createObjectURL(svgBlob);
        });
}

async function getStateCoordinates() {
    try {
        const response = await fetch('/api/coordenadas-estados');
        const stateCoordinates = await response.json();
        return stateCoordinates;
    } catch (error) {
        console.error('Error al obtener las coordenadas de los estados:', error);
    }
}