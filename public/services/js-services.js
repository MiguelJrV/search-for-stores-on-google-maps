
$(document).ready(function() {

    let qrScanner; 
    $(".qr-scan").click(function() {
        $("#fc_qr").click();

        $('#qrModal').on('shown.bs.modal', function () {
            const videoElem = $('#qr-video').get(0);
            const resultElem = $('#qr-result').get(0); 

            if (!videoElem) {
                console.error("Elemento de video no encontrado.");
                return;
            }

            try {
                qrScanner = new QrScanner(videoElem, result => {
                    const qrData = result.data;
                    console.log("QR Detectado: ", qrData);

                        // Validar si el QR pertenece al dominio rapikom.com
                        const rapikomDomain = "rapikom.com";
                    if (qrData && qrData.includes(rapikomDomain)) {
                        $('#qrModal').find('.modal-content').hide();
                        qrScanner.stop();
                        window.location.href = qrData;
                    } else {
                        resultElem.style.color = "red";
                        resultElem.textContent = "QR NO VÁLIDO.";
                        qrScanner.stop();
                    }
                }, {
                    highlightScanRegion: true,
                    preferedCamera: 'environment'
                });
                // Iniciar el escáner
                qrScanner.start().then(() => {
                    videoElem.play(); 
                    console.log("Escáner QR iniciado correctamente.");
                }).catch(err => {
                    console.error("Error al acceder a la cámara: ", err);
                    resultElem.style.color = "red";
                    resultElem.textContent = "Error al acceder a la cámara. Verifica los permisos.";
                });

            } catch (err) {
                console.error("Error en la inicialización del escáner QR: ", err);
                resultElem.style.color = "red";
                resultElem.textContent = "Error al inicializar el escáner QR.";
            }
        });

        // Cuando el modal se cierra, detener el escáner
        $('#qrModal').on('hidden.bs.modal', function () {
            if (qrScanner) {
                qrScanner.stop(); // Detener el escáner cuando el modal se cierra
            }
            $('#qr-video').removeAttr('src');
            $('#qr-result').text(''); 
        });
    });
});

