const axios = require('axios');
const db = require('../config/db.js'); 
require('dotenv').config();
const apiUrl = process.env.API_URL;

// Función principal para actualizar aliados
async function actualizarDatosAliados() {
    try {
        const response = await axios.get(apiUrl);
        const aliados = response.data.filter(aliado => aliado.inactivo === '0');
        for (const aliado of aliados) {
            const [existingPlace] = await db.query('SELECT * FROM aliados_maps WHERE id_vendedor = ?', [aliado.id_aliado]);

            if (!existingPlace || existingPlace.length === 0 || (existingPlace[0].place_id === '' || existingPlace[0].place_id === "\"No disponible\"" || existingPlace[0].place_id === null)) {
                // Guardar o actualizar directamente con los datos de la consulta
                await saveOrUpdatePlace(aliado);
            } else {
                // Verificar y actualizar campos faltantes
                await checkAndUpdateMissingFields(existingPlace, aliado);
            }
        }
        // Eliminar registros que están en aliados_maps pero no en el view_aliados_tiendas
        const idAliadosView = aliados.map(aliado => aliado.id_aliado);
        await deleteMissingAllies(idAliadosView);
        console.log('Actualización de datos de aliados completada.');
    } catch (error) {
        console.error('Error al actualizar aliados:', error);
    }
}

// Guardar o actualizar en la base de datos según datos locales
async function saveOrUpdatePlace(aliado) {
    const placeData = {
        id_vendedor: aliado.id_aliado,
        place_id: aliado.place_id || JSON.stringify("No disponible"),
        name: aliado.aliado,
        address: aliado.direccion || JSON.stringify("No disponible"),
        phone: aliado.movil || JSON.stringify("No disponible"),
        hours: JSON.stringify("No disponible"), 
        photo_url: aliado.logo || JSON.stringify("No disponible"),
        lat: aliado.lat || JSON.stringify("No disponible"),
        lng: aliado.lng || JSON.stringify("No disponible"),
        ciudad: aliado.nombre_ciudad,
        estado: aliado.nombre_estado,
        instagram: aliado.instagram || JSON.stringify("No disponible"),
        id_categoria: aliado.id_categoria || JSON.stringify("No disponible"),
        categoria: aliado.categoria || JSON.stringify("No disponible")
    };

    await db.query(
        `INSERT INTO aliados_maps (id_vendedor, place_id, name, address, phone, hours, photo_url, lat, lng, ciudad, estado, instagram, id_categoria, categoria)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            place_id = VALUES(place_id),
            name = VALUES(name), 
            address = VALUES(address), 
            phone = VALUES(phone), 
            hours = VALUES(hours), 
            photo_url = VALUES(photo_url),
            lat = VALUES(lat),
            lng = VALUES(lng),
            ciudad = VALUES(ciudad),
            estado = VALUES(estado),
            instagram = VALUES(instagram),
            id_categoria = VALUES(id_categoria),
            categoria = VALUES(categoria)`,
        [placeData.id_vendedor, placeData.place_id, placeData.name, placeData.address, placeData.phone, placeData.hours, placeData.photo_url, placeData.lat, placeData.lng, placeData.ciudad, placeData.estado, placeData.instagram, placeData.id_categoria, placeData.categoria]
    );
}

// Función para verificar y actualizar campos faltantes
async function checkAndUpdateMissingFields(existingPlace, aliado) {
    if (!existingPlace || existingPlace.length === 0) {
        console.log("No se encontró el registro existente para actualizar.");
        return;
    }

    const place = existingPlace[0];

    const updates = {
        place_id: aliado.place_id || place.place_id || JSON.stringify("No disponible"),
        name: aliado.aliado,
        address: aliado.direccion || place.address,
        phone: aliado.movil || JSON.stringify("No disponible"),
        hours: place.hours || JSON.stringify("No disponible"),
        photo_url: aliado.logo || JSON.stringify("No disponible"),
        lat: aliado.lat || place.lat,
        lng: aliado.lng || place.lng,
        ciudad: aliado.nombre_ciudad,
        estado: aliado.nombre_estado,
        instagram: aliado.instagram || JSON.stringify("No disponible"),
        id_categoria: aliado.id_categoria || place.id_categoria,
        categoria: aliado.categoria || place.categoria
    };

    await db.query(
        `UPDATE aliados_maps SET 
            place_id = ?, 
            name = ?, 
            address = ?, 
            phone = ?, 
            hours = ?, 
            photo_url = ?,
            lat = ?, 
            lng = ?, 
            ciudad = ?, 
            estado = ?,
            instagram = ?,
            id_categoria = ?, 
            categoria = ?
        WHERE id_vendedor = ?`,
        [updates.place_id, updates.name, updates.address, updates.phone, updates.hours, updates.photo_url, updates.lat, updates.lng, updates.ciudad, updates.estado, updates.instagram, updates.id_categoria, updates.categoria, place.id_vendedor]
    );
}

// Función para eliminar registros que no están en el view_aliados_tiendas
async function deleteMissingAllies(idAliadosView) {
    try {
        const [missingAllies] = await db.query('SELECT id_vendedor FROM aliados_maps WHERE id_vendedor NOT IN (?)', [idAliadosView]);

        if (missingAllies.length > 0) {
            const idsToDelete = missingAllies.map(row => row.id_vendedor);
            console.log(`Eliminando aliados que ya no están en el view: ${idsToDelete.join(', ')}`);

            await db.query('DELETE FROM aliados_maps WHERE id_vendedor IN (?)', [idsToDelete]);
            console.log('Registros eliminados correctamente.');
        } else {
            console.log('No se encontraron registros para eliminar.');
        }
    } catch (error) {
        console.error('Error al eliminar aliados que ya no están en el view:', error);
    }
}

module.exports = { actualizarDatosAliados };
