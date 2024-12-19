$(document).ready(function () {
        $.getJSON('/api/placeIds', function (data) {
            const categories = {};
            const aliados = data.places;
            const uniqueStates = new Set();
            const stateCitiesMap = {};
            let baseFilteredAllies = aliados; // Inicialmente, baseFilteredAllies contiene todos los aliados
            let filteredAllies = aliados; // Inicialmente, filteredAllies contiene todos los aliados

            // Inicializar categorías, estados y ciudades
            aliados.forEach(aliado => {
                if (!aliado.categoria || aliado.categoria === "\"No disponible\"" || !aliado.id_categoria) return;
                const categoryId = aliado.id_categoria;
                const state = aliado.estado;
                const city = aliado.ciudad;

                uniqueStates.add(state);
                if (!stateCitiesMap[state]) {
                    stateCitiesMap[state] = new Set();
                }
                stateCitiesMap[state].add(city);

                if (!categories[categoryId]) {
                    categories[categoryId] = {
                        name: aliado.categoria,
                        aliados: []
                    };
                }
                categories[categoryId].aliados.push(aliado);
            });

            const $stateList = $('.state-list');
            uniqueStates.forEach(state => {
                $stateList.append(`<span class="state-item" data-state="${state}">${state}</span>`);
            });

            const $cityList = $('.city-list').hide();
            const $backButton = $('<button class="btn btn-secondary mb-3">Volver</button>').hide().on('click', handleBack);

            $cityList.before($backButton);

            function applySearchFilter() {
                const query = normalizeText($('.searchfor').val() || ''); // Obtener el texto del buscador
            
                if (query === '') {
                    // Si el texto está vacío, restaura el filtro base y muestra los resultados correspondientes a la ciudad o estado seleccionado
                    filteredAllies = [...baseFilteredAllies]; // Restaura desde la base filtrada
                    renderCategoriesAndAllies(); // Renderizar los resultados
                } else {
                    // Filtrar sobre los aliados ya filtrados (baseFilteredAllies) según el texto del buscador
                    const filtered = baseFilteredAllies.filter(aliado => {
                        const normalizedName = normalizeText(aliado.name || '');
                        const normalizedCategory = normalizeText(aliado.categoria || '');
                        return normalizedName.includes(query) || normalizedCategory.includes(query);
                    });
                    renderCategoriesAndAllies(filtered); // Renderizar resultados del buscador
                }
            }
            
            function filterByState(state) {
                // Filtrar aliados por estado y guardar en baseFilteredAllies
                baseFilteredAllies = aliados.filter(aliado => aliado.estado === state);
                filteredAllies = [...baseFilteredAllies]; // Inicialmente, filteredAllies es igual a baseFilteredAllies
                applySearchFilter(); // Aplicar el filtro del buscador, si hay texto
            }
            
            function filterByCity(city) {
                if ($('.searchfor').val().trim() === '') {
                    // Si el buscador está vacío, solo filtra por la ciudad sin modificar baseFilteredAllies
                    filteredAllies = baseFilteredAllies.filter(aliado => aliado.ciudad === city);
                    renderCategoriesAndAllies(); // Renderizar resultados basados en la ciudad
                } else {
                    // Si el buscador tiene texto, filtra temporalmente sin modificar baseFilteredAllies
                    const filteredByCity = baseFilteredAllies.filter(aliado => aliado.ciudad === city);
                    filteredAllies = filteredByCity; // Actualizar filteredAllies para este contexto
                    applySearchFilter(); // Aplicar el filtro del buscador
                }
            }
            

            function renderCategoriesAndAllies(filtered = null) {
                const allies = filtered || filteredAllies;
                console.log('Rendering Allies:', allies);
                $('#categories-container').empty();
                const filteredCategories = Object.entries(categories).filter(([_, category]) =>
                    category.aliados.some(aliado => allies.includes(aliado))
                );

                filteredCategories.forEach(([categoryId, category]) => {
                    const alliesInCategory = category.aliados.filter(aliado => allies.includes(aliado));
                    renderCategory(category.name, categoryId, alliesInCategory, !!filtered);
                });
            }

            function renderCategory(categoryName, categoryId, aliados, expand = false) {
                const expandedClass = expand ? 'show' : '';
                const ariaExpanded = expand ? 'true' : 'false';

                const categoryHTML = `
                    <div class="category-container">
                        <button class="btn category-button collapsed" type="button" data-toggle="collapse" data-target="#category-${categoryId}" aria-expanded="${ariaExpanded}" aria-controls="category-${categoryId}">
                            <span class="arrow-icon">&#xf105;</span>
                            <span class="category-text">${categoryName}</span>
                        </button>
                        <div class="collapse ${expandedClass}" id="category-${categoryId}">
                            <div class="card card-body" id="category-${categoryId}-content"></div>
                        </div>
                    </div>
                `;
                $('#categories-container').append(categoryHTML);

                const $categoryContent = $(`#category-${categoryId}-content`);

                aliados.forEach(aliado => {
                    const photoUrl = aliado.photo_url === "\"No disponible\"" ? `/imagenes/categorias/${categoryId}.jpg` : aliado.photo_url;
                    const googleMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${aliado.name} ${aliado.ciudad} ${aliado.estado}`)}&destination_place_id=${aliado.place_id}`;
                     // Verificar si el Instagram está disponible
                    const instagramButton = aliado.instagram === "\"No disponible\"" ? '' : `
                    <a href="${aliado.instagram}" target="_blank" class="btn btn-sm d-flex align-items-center">
                        <i class="fab fa-instagram mr-1"></i> Instagram
                    </a>
                `;

                    const aliadoHTML = `
                        <div class="card mb-2 text-center">
                            <div class="card-body">
                                <img src="${photoUrl}" alt="${aliado.name}" class="img-logo mb-3">
                                <h5 class="card-title">${aliado.name}</h5>
                                <p class="card-text">${aliado.ciudad}</p>
                                
                                <!-- Contenedor para centrar los botones -->
                                <div class="d-flex justify-content-center gap-2 mt-3">
                                    <a href="https://wa.me/${aliado.phone}" target="_blank" class="btn btn-sm d-flex align-items-center">
                                        <i class="fab fa-whatsapp mr-1"></i> WhatsApp
                                    </a>
                                    ${instagramButton}
                                </div>

                                <!-- Botón ajustado al ancho combinado de los botones superiores -->
                                <a href="${googleMapsLink}" target="_blank" class="btn btn-md mt-3 full-width-btn d-flex align-items-center justify-content-center">
                                    Ir a la tienda
                                </a>
                            </div>
                        </div>
                    `;

                
                    $categoryContent.append(aliadoHTML);
                });
            }

            function handleBack() {
                $cityList.hide();
                $stateList.show();
                $('#categories-container').empty();
                renderCategoriesAndAllies();
                $backButton.hide();
                history.pushState(null, null, location.href);
            }

            window.addEventListener('popstate', function () {
                handleBack();
            });

            // Evento para el buscador
            $('.searchfor').on('input', function () {
                applySearchFilter(); // Aplicar el filtro cada vez que el texto cambia
            });

            // Simular clic en el botón de búsqueda al presionar Enter
            $('.searchfor').on('keydown', function (event) {
                if (event.keyCode === 13) { 
                    event.preventDefault(); 
                    $('.btn-search').trigger('click'); 
                }
            });

            function normalizeText(text) {
                if (!text || typeof text !== 'string') return '';
                return text.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
                    .replace(/[^\w\s]/g, ''); // Elimina caracteres especiales
            }

            $stateList.on('click', '.state-item', function () {
                const selectedState = $(this).data('state');
            
                $('.state-item').removeClass('selected');
                $(this).addClass('selected');
            
                $stateList.hide();
                $cityList.empty().show();
                $backButton.show();
            
                stateCitiesMap[selectedState].forEach(city => {
                    $cityList.append(`<span class="city-item" data-city="${city}">${city}</span>`);
                });
            
                filterByState(selectedState);
            
                history.pushState({ view: 'cities' }, null, location.href);
            });

            $cityList.on('click', '.city-item', function () {
                const selectedCity = $(this).data('city');
                $('.city-item').removeClass('selected');
                $(this).addClass('selected');
                filterByCity(selectedCity); // Aplicar filtro por ciudad y respetar el texto del buscador
            });

            $(document).on('click', '.btn-search', function (event) {
                event.preventDefault();
            
                const query = $('.searchfor').val().toLowerCase().replace(/\s+/g, ''); // Obtener y normalizar el texto de búsqueda
            
                if (query === '') {
                    Swal.fire({
                        title: 'Coloque una tienda en el buscador',
                        icon: 'warning',
                        confirmButtonText: 'Continuar'
                    });
                    return;
                }
            
                const selectedState = $('.state-item.selected').data('state');
                const selectedCity = $('.city-item.selected').data('city');
            
                // Filtrar aliados según el texto de búsqueda
                const filteredAllies = aliados.filter(aliado => {
                    const normalizedName = aliado.name.toLowerCase().replace(/\s+/g, '');
                    const matchesQuery = normalizedName.includes(query);
                    const matchesState = selectedState ? aliado.estado === selectedState : true; 
                    const matchesCity = selectedCity ? aliado.ciudad === selectedCity : true; 
                    return matchesQuery && matchesState && matchesCity;
                });
            
                if (filteredAllies.length > 0) {
                    // Realiza el desplazamiento animado al primer .category-container solo si hay resultados
                    const $categoriesContainer = $('#categories-container');
                    const $firstCategory = $categoriesContainer.find('.category-container').first();
            
                    if ($firstCategory.length) {
                        $('html, body').animate({
                            scrollTop: $firstCategory.offset().top - ($('.navbar').outerHeight() || 0) // Ajusta según tu barra de navegación fija
                        }, 600);
                    }
                } else {
                    // Si no hay resultados, mostrar un mensaje
                    Swal.fire({
                        title: 'No se encontraron tiendas con ese nombre',
                        icon: 'warning',
                        confirmButtonText: 'Continuar'
                    });
                }
            });

            renderCategoriesAndAllies();
        });
    });
