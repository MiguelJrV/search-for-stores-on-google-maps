const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const db = require('./config/db.js');
const cron = require('node-cron');
app.use(express.json());


//Estas son variables globales mas simplicado para acceder en todo el proyecto
app.locals.currentYear = new Date().getFullYear();
app.locals.logoUrlRapikom = '/imagenes/logo/rapikom-logotipo-orange.png';

//Estas son variables globales mas simplicado para acceder en todo el proyecto

//Archivos en segundo plano que se ejecutaran
const { actualizarDatosAliados } = require('./segundo_plano/actualizarAliados.js');

// Ejecutar el proceso de actualización en segundo plano al iniciar el servidor
cron.schedule('59 * * * *', () => {
    actualizarDatosAliados().catch(error => console.error('Error en la actualización de aliados:', error));
});


// Configura la carpeta 'public' para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configura el motor de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ruta para la sección frontend
app.get('/', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';

    // Detectar si es un WebView común (Instagram, Facebook, etc.)
    const isWebView = /wv|android.*samsungbrowser|FBAN|FBAV|Instagram|Line|WhatsApp/i.test(userAgent);

    if (isWebView) {
        // Identificar dispositivo (Android o iOS)
        const isAndroid = /android/i.test(userAgent);
        const isIOS = /iphone|ipad/i.test(userAgent);

        // Enlace de redirección según plataforma
        const targetUrl = "https://tiendasrcash.rapikom.com/";
        const androidIntent = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
        const iosUniversalLink = `googlechrome://${targetUrl.replace(/^https?:\/\//, '')}`;

        // Enviar HTML con redirección dinámica
        res.send(`
            <html>
                <head>
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            const isAndroid = ${isAndroid};
                            const isIOS = ${isIOS};

                            if (isAndroid) {
                                // Redirigir usando Android Intent
                                window.location.href = '${androidIntent}';
                            } else if (isIOS) {
                                // Redirigir usando esquema universal de iOS
                                window.location.href = '${iosUniversalLink}';
                            } else {
                                // Redirigir a URL general
                                window.location.href = '${targetUrl}';
                            }
                        });
                    </script>
                </head>
            </html>
        `);
    } else {
        // Renderiza la página normalmente
        res.render('frontend/layout', { title: 'Ubicación de las Tiendas' });
    }
});




app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.send('Conexión exitosa a la base de datos');
    } catch (error) {
        console.error('Error en la conexión a la base de datos:', error);
        res.status(500).send(`Error en la conexión a la base de datos: ${error.message}`);
    }
});

app.get('/api/placeIds', async (req, res) => {
    try {
        const [aliados] = await db.query('SELECT * FROM aliados_maps');
        res.json({ places: aliados });
    } catch (error) {
        console.error('Error al obtener aliados:', error);
        res.status(500).json({ message: 'Error al obtener aliados' });
    }
});

app.get('/api/coordenadas-estados', (req, res) => {
    res.sendFile(path.join(__dirname, 'consumos-json', 'coordenadas-estados-venezuela.json'));
});

// Inicia el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
