/**
 * =====================================================================
 * GESTOR DE BIBLIOTECA TRANSACCIONAL - SPA APP.JS
 * Vanilla JavaScript (ES6+), Fetch API Asíncrono, Debounce 300ms, Toasts
 * =====================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Estado global de la aplicación
    let currentUser = JSON.parse(localStorage.getItem('mebytech_auth_user')) || null;
    let authorsList = [];
    let genresList = [];
    let usersList = [];
    let currentBooks = [];
    let debounceTimer = null;
    let userFavorites = new Map(); // id_libro -> id_favorito
    let userRecentBookIds = [];
    let currentCollectionTab = 'all';

    // Elementos del DOM
    const booksTableBody = document.getElementById('books-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const searchSpinner = document.getElementById('search-spinner');
    const activeUserSelect = document.getElementById('active-user-select');

    // Stats y Tarjetas Estadísticas Interactivas
    const statTotalBooks = document.getElementById('stat-total-books');
    const statTotalAuthors = document.getElementById('stat-total-authors');
    const statTotalUsers = document.getElementById('stat-total-users');
    const statTotalLoans = document.getElementById('stat-total-loans');
    const cardStatBooks = document.getElementById('card-stat-books');
    const cardStatAuthors = document.getElementById('card-stat-authors');
    const cardStatUsers = document.getElementById('card-stat-users');
    const cardStatLoans = document.getElementById('card-stat-loans');

    // Modales
    const modalBook = document.getElementById('modal-book');
    const modalBookTitle = document.getElementById('modal-book-title');
    const formBook = document.getElementById('form-book');
    const bookIdInput = document.getElementById('book-id');
    const bookTitleInput = document.getElementById('book-title');
    const bookYearInput = document.getElementById('book-year');
    const bookGenreSelect = document.getElementById('book-genre');
    const bookAuthorSelect = document.getElementById('book-author');
    const bookContentInput = document.getElementById('book-content');
    const bookCoverInput = document.getElementById('book-cover');
    const bookCoverPreview = document.getElementById('book-cover-preview');
    const bookCoverPlaceholder = document.getElementById('book-cover-placeholder');

    // Carga de portada desde galería / dispositivo
    const bookCoverFileInput = document.getElementById('book-cover-file');
    const btnTriggerUploadCover = document.getElementById('btn-trigger-upload-cover');
    const coverUploadStatus = document.getElementById('cover-upload-status');

    // Contenedores y conmutador de Vistas
    const booksGrid = document.getElementById('books-grid');
    const booksTableContainer = document.getElementById('books-table-container');
    const btnViewGrid = document.getElementById('btn-view-grid');
    const btnViewTable = document.getElementById('btn-view-table');

    // Pestañas de Colecciones del Catálogo
    const collectionTabs = document.querySelectorAll('.btn-collection-tab');
    const tabCountAll = document.getElementById('tab-count-all');
    const tabCountAvailable = document.getElementById('tab-count-available');
    const tabCountRecommended = document.getElementById('tab-count-recommended');
    const tabCountRecent = document.getElementById('tab-count-recent');
    const tabCountFavorites = document.getElementById('tab-count-favorites');

    // Modal Lector
    const modalReadBook = document.getElementById('modal-read-book');
    const readBookTitle = document.getElementById('read-book-title');
    const readBookMeta = document.getElementById('read-book-meta');
    const readBookContent = document.getElementById('read-book-content');
    const readBookCover = document.getElementById('read-book-cover');
    const readBookModeBadge = document.getElementById('read-book-mode-badge');

    const modalLoan = document.getElementById('modal-loan');
    const formLoan = document.getElementById('form-loan');
    const loanBookId = document.getElementById('loan-book-id');
    const loanBookTitle = document.getElementById('loan-book-title');
    const loanBookAuthor = document.getElementById('loan-book-author');
    const loanUserSelect = document.getElementById('loan-user');
    const loanDeadline = document.getElementById('loan-deadline');

    const modalUser = document.getElementById('modal-user');
    const formUser = document.getElementById('form-user');
    const userNameInput = document.getElementById('user-name');
    const userEmailInput = document.getElementById('user-email');
    const userPasswordInput = document.getElementById('user-password');

    const modalLoansList = document.getElementById('modal-loans-list');
    const loansTableBody = document.getElementById('loans-table-body');

    // Modales de Autores y Usuarios
    const modalAuthorsList = document.getElementById('modal-authors-list');
    const authorsTableBody = document.getElementById('authors-table-body');
    const authorsSearchInput = document.getElementById('authors-search-input');
    const formQuickAddAuthor = document.getElementById('form-quick-add-author');
    const quickAuthorName = document.getElementById('quick-author-name');

    const modalUsersList = document.getElementById('modal-users-list');
    const usersTableBody = document.getElementById('users-table-body');
    const usersSearchInput = document.getElementById('users-search-input');
    const btnOpenUserFromList = document.getElementById('btn-open-user-from-list');

    // Modal de Comentarios y Reseñas
    const modalComments = document.getElementById('modal-comments');
    const btnOpenComments = document.getElementById('btn-open-comments');
    const formComment = document.getElementById('form-comment');
    const commentBookSelect = document.getElementById('comment-book-select');
    const commentBookSearch = document.getElementById('comment-book-search');
    const btnSearchCommentBook = document.getElementById('btn-search-comment-book');
    const btnClearCommentBookSearch = document.getElementById('btn-clear-comment-book-search');
    const commentSearchFeedback = document.getElementById('comment-search-feedback');
    const commentContent = document.getElementById('comment-content');
    const commentRatingValue = document.getElementById('comment-rating-value');
    const commentRatingLabel = document.getElementById('comment-rating-label');
    const commentStarRating = document.getElementById('comment-star-rating');
    const commentAuthorName = document.getElementById('comment-author-name');
    const commentsContainer = document.getElementById('comments-container');
    const commentsCountStat = document.getElementById('comments-count-stat');

    // Modal de Historial de Accesos y Auditoría
    const modalAccessLogs = document.getElementById('modal-access-logs');
    const btnOpenAccessLogs = document.getElementById('btn-open-access-logs');
    const accessLogsSearch = document.getElementById('access-logs-search');
    const accessLogsCount = document.getElementById('access-logs-count');
    const btnRefreshAccessLogs = document.getElementById('btn-refresh-access-logs');
    const accessLogsTableBody = document.getElementById('access-logs-table-body');

    // Elementos de Autenticación / Sesión
    const authPortal = document.getElementById('auth-portal');
    const appDashboard = document.getElementById('app-dashboard');
    const authTabsContainer = document.getElementById('auth-tabs-container');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const linkToRegister = document.getElementById('link-to-register');
    const linkToLogin = document.getElementById('link-to-login');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const btnToggleLoginPass = document.getElementById('btn-toggle-login-pass');
    const btnSubmitLogin = document.getElementById('btn-submit-login');
    const btnFillAdmin = document.getElementById('btn-fill-admin');
    const loginRememberMe = document.getElementById('login-remember-me');
    const linkToRecover = document.getElementById('link-to-recover');
    const regName = document.getElementById('reg-name');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');
    const btnToggleRegPass = document.getElementById('btn-toggle-reg-pass');
    const btnSubmitRegister = document.getElementById('btn-submit-register');

    // Formulario de Recuperación de Contraseña
    const formRecover = document.getElementById('form-recover');
    const recEmail = document.getElementById('rec-email');
    const recPassword = document.getElementById('rec-password');
    const recPasswordConfirm = document.getElementById('rec-password-confirm');
    const btnToggleRecPass = document.getElementById('btn-toggle-rec-pass');
    const btnToggleRecPassConfirm = document.getElementById('btn-toggle-rec-pass-confirm');
    const btnSubmitRecover = document.getElementById('btn-submit-recover');
    const btnBackFromRecover = document.getElementById('btn-back-from-recover');
    const linkRecoverToLogin = document.getElementById('link-recover-to-login');

    const authUserContainer = document.getElementById('auth-user-container');
    const authUserAvatar = document.getElementById('auth-user-avatar');
    const authUserName = document.getElementById('auth-user-name');
    const authUserLoansBadge = document.getElementById('auth-user-loans-badge');
    const btnLogout = document.getElementById('btn-logout');

    // Botones de Apertura de Modales
    const btnOpenCreateBook = document.getElementById('btn-open-create-book');
    const btnOpenUserModal = document.getElementById('btn-open-user-modal');

    // Botones de Cierre de Modales
    const closeButtons = document.querySelectorAll('.btn-close-modal');

    // ==========================================
    // SISTEMA DE NOTIFICACIONES TOAST FLOTANTES
    // ==========================================
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast-enter pointer-events-auto flex items-center p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300';

        let iconClass = 'fa-circle-check text-emerald-500';
        let bgBorderClass = 'bg-white border-emerald-100 text-slate-800';

        if (type === 'error') {
            iconClass = 'fa-circle-exclamation text-rose-500';
            bgBorderClass = 'bg-white border-rose-100 text-slate-800';
        } else if (type === 'warning') {
            iconClass = 'fa-triangle-exclamation text-amber-500';
            bgBorderClass = 'bg-white border-amber-100 text-slate-800';
        } else if (type === 'info') {
            iconClass = 'fa-circle-info text-indigo-500';
            bgBorderClass = 'bg-white border-indigo-100 text-slate-800';
        }

        toast.classList.add(...bgBorderClass.split(' '));
        toast.innerHTML = `
            <div class="flex items-center space-x-3 w-full">
                <i class="fa-solid ${iconClass} text-lg"></i>
                <div class="flex-1">${message}</div>
                <button class="text-slate-400 hover:text-slate-600 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Auto-eliminar después de 3.5 segundos
        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }, 3500);
    }

    // ==========================================
    // CONTROL DE MODALES
    // ==========================================
    function openModal(modalElement) {
        modalElement.classList.remove('hidden');
    }

    function closeModal(modalElement) {
        modalElement.classList.add('hidden');
    }

    const allModals = [
        modalBook, 
        modalLoan, 
        modalUser, 
        modalLoansList, 
        modalReadBook, 
        modalAuthorsList, 
        modalUsersList,
        modalComments,
        modalAccessLogs
    ];

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            allModals.forEach(m => {
                if (m) closeModal(m);
            });
        });
    });

    // Cerrar al dar click fuera del contenido del modal
    allModals.forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        }
    });

    // ==========================================
    // CONMUTADOR DE VISTAS (Cuadrícula / Tabla)
    // ==========================================
    let currentView = localStorage.getItem('mebytech_view') || 'grid';

    function setView(view) {
        currentView = view;
        localStorage.setItem('mebytech_view', view);
        if (view === 'grid') {
            booksGrid.classList.remove('hidden');
            booksTableContainer.classList.add('hidden');
            btnViewGrid.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-600 shadow-sm transition-all';
            btnViewTable.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all';
        } else {
            booksGrid.classList.add('hidden');
            booksTableContainer.classList.remove('hidden');
            btnViewTable.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-600 shadow-sm transition-all';
            btnViewGrid.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all';
        }
    }

    btnViewGrid.addEventListener('click', () => setView('grid'));
    btnViewTable.addEventListener('click', () => setView('table'));
    setView(currentView);

    // ==========================================
    // VISTA PREVIA DINÁMICA DE PORTADA
    // ==========================================
    const DEFAULT_COVER_URL = '/static/img/covers/default-book.svg';

    function updateCoverPreview(url) {
        const coverToUse = (url && url.trim()) ? url.trim() : DEFAULT_COVER_URL;
        bookCoverPreview.src = coverToUse;
        bookCoverPreview.classList.remove('hidden');
        bookCoverPlaceholder.classList.add('hidden');
        bookCoverPreview.onerror = () => {
            bookCoverPreview.src = DEFAULT_COVER_URL;
        };
    }

    bookCoverInput.addEventListener('input', () => updateCoverPreview(bookCoverInput.value));

    // Subida de imagen de portada desde galería o dispositivo
    if (btnTriggerUploadCover && bookCoverFileInput) {
        btnTriggerUploadCover.addEventListener('click', () => {
            bookCoverFileInput.click();
        });

        bookCoverFileInput.addEventListener('change', async () => {
            const file = bookCoverFileInput.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast("Por favor selecciona un archivo de imagen válido", "warning");
                return;
            }

            const formData = new FormData();
            formData.append('cover_image', file);

            try {
                if (coverUploadStatus) coverUploadStatus.classList.remove('hidden');
                btnTriggerUploadCover.disabled = true;

                const res = await fetch('/api/upload-cover', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (res.ok && data.url) {
                    bookCoverInput.value = data.url;
                    updateCoverPreview(data.url);
                    showToast(data.message || "Portada subida con éxito desde tu galería", "success");
                } else {
                    showToast(data.message || "Error al subir la imagen", "error");
                }
            } catch (err) {
                showToast("Error de conexión al subir la imagen", "error");
            } finally {
                if (coverUploadStatus) coverUploadStatus.classList.add('hidden');
                btnTriggerUploadCover.disabled = false;
                bookCoverFileInput.value = '';
            }
        });
    }

    // ==========================================
    // CARGA DE METADATOS Y CATÁLOGOS (Autores, Géneros, Usuarios)
    // ==========================================
    async function loadAuthors() {
        try {
            const res = await fetch('/api/autores');
            if (res.ok) {
                authorsList = await res.json();
                statTotalAuthors.textContent = authorsList.length;
                bookAuthorSelect.innerHTML = '<option value="">Seleccione Autor...</option>' + 
                    authorsList.map(a => `<option value="${a.id_autor}">${a.nombre}</option>`).join('');
            }
        } catch (err) {
            console.error("Error al cargar autores:", err);
        }
    }

    async function loadGenres() {
        try {
            const res = await fetch('/api/generos');
            if (res.ok) {
                genresList = await res.json();
                bookGenreSelect.innerHTML = '<option value="">Seleccione Género...</option>' + 
                    genresList.map(g => `<option value="${g.id_genero}">${g.nombre}</option>`).join('');
            }
        } catch (err) {
            console.error("Error al cargar géneros:", err);
        }
    }

    async function loadUsers() {
        try {
            const res = await fetch('/api/usuarios');
            if (res.ok) {
                usersList = await res.json();
                
                // Si hay un usuario activo en sesión, sincronizar su estado actualizado
                if (currentUser) {
                    const freshUser = usersList.find(u => u.id_usuario === currentUser.id_usuario);
                    if (freshUser) {
                        currentUser.libros_activos = freshUser.libros_activos;
                        currentUser.rol = freshUser.rol || currentUser.rol;
                        localStorage.setItem('mebytech_auth_user', JSON.stringify(currentUser));
                    }
                }

                const isAdmin = currentUser && currentUser.rol === 'admin';
                if (statTotalUsers) {
                    statTotalUsers.textContent = isAdmin ? usersList.length : `${currentUser ? currentUser.libros_activos : 0}/3`;
                }

                // Actualizar selects de usuarios
                const optionsHtml = usersList.map(u => 
                    `<option value="${u.id_usuario}">${u.nombre} (${u.libros_activos}/3 activos)</option>`
                ).join('');

                if (activeUserSelect) activeUserSelect.innerHTML = optionsHtml;
                if (loanUserSelect) loanUserSelect.innerHTML = optionsHtml;
            }
        } catch (err) {
            console.error("Error al cargar usuarios:", err);
        }
    }

    async function updateLoansStat() {
        try {
            const isAdmin = currentUser && currentUser.rol === 'admin';
            const url = (currentUser && !isAdmin) ? `/api/prestamos?id_usuario=${currentUser.id_usuario}` : '/api/prestamos';
            const res = await fetch(url);
            if (res.ok) {
                const loans = await res.json();
                const activeLoans = loans.filter(l => l.estado !== 'Devuelto');
                statTotalLoans.textContent = activeLoans.length;
            }
        } catch (err) {
            console.error("Error al obtener estadísticas de préstamos:", err);
        }
    }

    // ==========================================
    // GESTIÓN DE COLECCIONES Y FAVORITOS
    // ==========================================
    async function loadUserFavorites() {
        if (!currentUser) {
            userFavorites.clear();
            return;
        }
        try {
            const res = await fetch(`/api/favoritos?id_usuario=${currentUser.id_usuario}`);
            if (res.ok) {
                const favs = await res.json();
                userFavorites.clear();
                favs.forEach(f => userFavorites.set(f.id_libro, f.id_favorito));
            }
        } catch (err) {
            console.error("Error al cargar favoritos:", err);
        }
    }

    function loadUserRecentBooks() {
        if (!currentUser) {
            userRecentBookIds = [];
            return;
        }
        try {
            const stored = localStorage.getItem(`mebytech_recent_${currentUser.id_usuario}`);
            userRecentBookIds = stored ? JSON.parse(stored) : [];
        } catch (e) {
            userRecentBookIds = [];
        }
    }

    function recordBookView(bookId) {
        if (!currentUser || !bookId) return;
        const bId = parseInt(bookId, 10);
        userRecentBookIds = [bId, ...userRecentBookIds.filter(id => id !== bId)].slice(0, 30);
        try {
            localStorage.setItem(`mebytech_recent_${currentUser.id_usuario}`, JSON.stringify(userRecentBookIds));
        } catch (e) {}
        updateCollectionCounts();
    }

    function getBooksForCollection(books) {
        if (currentCollectionTab === 'available') {
            return books.filter(b => !b.es_prestado);
        } else if (currentCollectionTab === 'recommended') {
            return books.filter(b => b.rating_promedio !== null && b.rating_promedio >= 4.0);
        } else if (currentCollectionTab === 'recent') {
            const recentSet = new Set(userRecentBookIds);
            const foundBooks = books.filter(b => recentSet.has(b.id_libro));
            return foundBooks.sort((a, b) => userRecentBookIds.indexOf(a.id_libro) - userRecentBookIds.indexOf(b.id_libro));
        } else if (currentCollectionTab === 'favorites') {
            return books.filter(b => userFavorites.has(b.id_libro));
        }
        return books; // 'all'
    }

    function updateCollectionCounts() {
        const availCount = currentBooks.filter(b => !b.es_prestado).length;
        const recCount = currentBooks.filter(b => b.rating_promedio !== null && b.rating_promedio >= 4.0).length;
        const recentCount = currentBooks.filter(b => userRecentBookIds.includes(b.id_libro)).length;
        const favCount = currentBooks.filter(b => userFavorites.has(b.id_libro)).length;

        if (tabCountAll) tabCountAll.textContent = currentBooks.length;
        if (tabCountAvailable) tabCountAvailable.textContent = availCount;
        if (tabCountRecommended) tabCountRecommended.textContent = recCount;
        if (tabCountRecent) tabCountRecent.textContent = recentCount;
        if (tabCountFavorites) tabCountFavorites.textContent = favCount;
    }

    // Eventos de Pestañas de Colecciones
    if (collectionTabs && collectionTabs.length > 0) {
        collectionTabs.forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const tabName = tabBtn.dataset.tab;
                currentCollectionTab = tabName;

                collectionTabs.forEach(btn => {
                    const badge = btn.querySelector('span:last-child');
                    if (btn === tabBtn) {
                        btn.className = 'btn-collection-tab active px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 bg-indigo-600 text-white shadow-sm';
                        if (badge) badge.className = 'ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono';
                    } else {
                        btn.className = 'btn-collection-tab px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100';
                        if (badge) {
                            const t = btn.dataset.tab;
                            const colorMap = {
                                all: 'bg-slate-200 text-slate-700 font-mono',
                                available: 'bg-emerald-100 text-emerald-800 font-mono',
                                recommended: 'bg-amber-100 text-amber-800 font-mono',
                                recent: 'bg-blue-100 text-blue-800 font-mono',
                                favorites: 'bg-amber-100 text-amber-800 font-mono'
                            };
                            badge.className = `ml-1 px-2 py-0.5 rounded-full text-[10px] ${colorMap[t] || 'bg-slate-100 text-slate-700 font-mono'}`;
                        }
                    }
                });

                renderBooks(currentBooks);
            });
        });
    }

    // ==========================================
    // LISTADO Y RENDERIZADO DE LIBROS
    // ==========================================
    async function fetchBooks(searchQuery = '') {
        try {
            searchSpinner.classList.remove('hidden');
            const url = searchQuery ? `/api/books?search=${encodeURIComponent(searchQuery)}` : '/api/books';
            const res = await fetch(url);
            
            if (!res.ok) throw new Error("Error en la respuesta del servidor");

            const books = await res.json();
            currentBooks = books;
            statTotalBooks.textContent = books.length;
            renderBooks(books);
            populateCommentBookSelect();
        } catch (err) {
            showToast("No se pudieron cargar los libros", "error");
        } finally {
            searchSpinner.classList.add('hidden');
        }
    }

    function renderBooks(books) {
        booksTableBody.innerHTML = '';
        booksGrid.innerHTML = '';

        updateCollectionCounts();

        const filteredBooks = getBooksForCollection(books || []);

        if (!filteredBooks || filteredBooks.length === 0) {
            emptyState.classList.remove('hidden');
            const emptyTitle = emptyState.querySelector('h3');
            const emptyDesc = emptyState.querySelector('p');
            if (emptyTitle && emptyDesc) {
                if (currentCollectionTab === 'favorites') {
                    emptyTitle.textContent = 'No tienes libros en favoritos';
                    emptyDesc.textContent = 'Guarda tus obras preferidas haciendo clic en la estrella (⭐) de cualquier libro.';
                } else if (currentCollectionTab === 'recent') {
                    emptyTitle.textContent = 'No has visto libros recientemente';
                    emptyDesc.textContent = 'Abre y lee alguna obra usando el botón "Leer" para que aparezca en tu historial.';
                } else if (currentCollectionTab === 'recommended') {
                    emptyTitle.textContent = 'No se encontraron recomendaciones (4 a 5 estrellas)';
                    emptyDesc.textContent = 'Solo se muestran obras con calificación promedio sobresaliente de 4 a 5 estrellas.';
                } else if (currentCollectionTab === 'available') {
                    emptyTitle.textContent = 'No hay libros disponibles en este momento';
                    emptyDesc.textContent = 'Todos los ejemplares del catálogo se encuentran actualmente en préstamo activo.';
                } else {
                    emptyTitle.textContent = 'No se encontraron libros';
                    emptyDesc.textContent = 'Prueba ajustando el término de búsqueda o crea una nueva obra literaria.';
                }
            }
            return;
        }

        emptyState.classList.add('hidden');

        const fallbackCover = DEFAULT_COVER_URL;
        const isAdmin = currentUser && currentUser.rol === 'admin';

        filteredBooks.forEach(book => {
            const coverUrl = book.portada_url || fallbackCover;
            const isFav = userFavorites.has(book.id_libro);
            const isBorrowed = Boolean(book.es_prestado);
            const loanActivo = book.prestamo_activo;
            const myLoan = isBorrowed && loanActivo && currentUser && (loanActivo.id_usuario === currentUser.id_usuario);
            const canReturn = isBorrowed && (myLoan || isAdmin);

            // Generar botón de acción de préstamo o devolución temprana
            let actionLoanBtnGrid = '';
            let actionLoanBtnTable = '';

            if (canReturn && loanActivo) {
                // Caso 1: Préstamo activo que puede devolver anticipadamente (el lector titular o el admin)
                actionLoanBtnGrid = `
                    <button class="btn-return flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 shadow-sm" data-id="${loanActivo.id_prestamo}" data-book-id="${book.id_libro}" title="Devolver libro antes de tiempo (Actualmente prestado)">
                        <i class="fa-solid fa-arrow-rotate-left"></i>
                        <span>Devolver</span>
                    </button>
                `;
                actionLoanBtnTable = `
                    <button class="btn-return px-2.5 py-1.5 rounded-lg text-white bg-amber-500 hover:bg-amber-600 text-xs font-semibold border border-amber-600 transition-colors shadow-sm flex items-center" data-id="${loanActivo.id_prestamo}" data-book-id="${book.id_libro}" title="Devolver libro antes de tiempo">
                        <i class="fa-solid fa-arrow-rotate-left mr-1"></i> Devolver
                    </button>
                `;
            } else if (isBorrowed) {
                // Caso 2: Préstamo activo perteneciente a otro usuario
                actionLoanBtnGrid = `
                    <button disabled class="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center space-x-1 opacity-80" title="Libro actualmente prestado a otro usuario">
                        <i class="fa-solid fa-lock"></i>
                        <span>Prestado</span>
                    </button>
                `;
                actionLoanBtnTable = `
                    <button disabled class="px-2.5 py-1.5 rounded-lg text-slate-400 bg-slate-100 text-xs font-semibold border border-slate-200 cursor-not-allowed opacity-80 flex items-center" title="Libro actualmente prestado a otro usuario">
                        <i class="fa-solid fa-lock mr-1"></i> Prestado
                    </button>
                `;
            } else {
                // Caso 3: Disponible para préstamo
                actionLoanBtnGrid = `
                    <button class="btn-loan flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 shadow-sm" data-id="${book.id_libro}" title="Prestar Libro">
                        <i class="fa-solid fa-handshake"></i>
                        <span>Prestar</span>
                    </button>
                `;
                actionLoanBtnTable = `
                    <button class="btn-loan px-2.5 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 text-xs font-semibold border border-emerald-200 transition-colors flex items-center" data-id="${book.id_libro}" title="Prestar Libro">
                        <i class="fa-solid fa-handshake mr-1"></i> Prestar
                    </button>
                `;
            }

            // Indicador de disponibilidad
            const availabilityBadge = isBorrowed
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-md shadow-sm"><i class="fa-solid fa-clock mr-1 text-[9px]"></i>Prestado</span>`
                : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/90 text-white backdrop-blur-md shadow-sm"><i class="fa-solid fa-check mr-1 text-[9px]"></i>Disponible</span>`;

            // Indicador de puntuación / rating de estrellas
            const ratingBadge = book.rating_promedio !== null
                ? `<span class="inline-flex items-center text-xs font-bold text-amber-500 flex-shrink-0" title="Calificación promedio: ${book.rating_promedio} de 5 estrellas (${book.total_resenas} reseñas)"><i class="fa-solid fa-star mr-1 text-[11px]"></i>${book.rating_promedio}</span>`
                : `<span class="text-[11px] text-slate-400 font-medium flex-shrink-0">Sin reseñas</span>`;

            // 1. VISTA CUADRÍCULA DE PORTADAS (GRID CARDS)
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group';
            card.innerHTML = `
                <div class="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                    <img src="${coverUrl}" alt="${book.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='${fallbackCover}'">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/20 pointer-events-none"></div>
                    
                    <!-- Año y Estado en cabecera de portada -->
                    <div class="absolute top-3 left-3 flex items-center space-x-1.5">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md shadow-sm">
                            ${book.anio}
                        </span>
                        ${availabilityBadge}
                    </div>

                    <!-- Favorito botón flotante -->
                    <button class="btn-favorite absolute top-3 right-3 w-8 h-8 rounded-full ${isFav ? 'bg-amber-400 text-white shadow-amber-300/50' : 'bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500'} shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95" data-id="${book.id_libro}" title="${isFav ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}">
                        <i class="${isFav ? 'fa-solid fa-star text-white' : 'fa-regular fa-star'} text-sm"></i>
                    </button>

                    <!-- Género en el pie de la imagen -->
                    <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-600/90 text-white backdrop-blur-md shadow-sm">
                            ${book.genero || 'Literatura'}
                        </span>
                    </div>
                </div>

                <div class="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex items-start justify-between gap-1 mb-1">
                            <h4 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors flex-1" title="${book.titulo}">
                                ${book.titulo}
                            </h4>
                            ${ratingBadge}
                        </div>
                        <p class="text-xs text-slate-500 font-medium mt-1 flex items-center">
                            <i class="fa-solid fa-feather-pointed text-purple-500 mr-1.5 text-[11px]"></i>
                            <span class="truncate">${book.autor || 'Sin Autor'}</span>
                        </p>
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <button class="btn-read flex-1 py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 shadow-sm" data-id="${book.id_libro}" title="Leer Obra">
                            <i class="fa-solid fa-book-open"></i>
                            <span>Leer</span>
                        </button>
                        
                        ${actionLoanBtnGrid}

                        ${isAdmin ? `
                        <button class="btn-edit p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors" data-id="${book.id_libro}" title="Editar Libro">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
                        </button>

                        <button class="btn-delete p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors" data-id="${book.id_libro}" title="Eliminar Libro">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
            booksGrid.appendChild(card);

            // 2. VISTA TABLA CLÁSICA (TABLE VIEW CON MINIATURA)
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/80 transition-colors';
            tr.innerHTML = `
                <td class="py-3 px-6">
                    <div class="flex items-center space-x-3">
                        <img src="${coverUrl}" alt="${book.titulo}" class="w-9 h-12 rounded object-cover shadow-sm border border-slate-200 flex-shrink-0" onerror="this.src='${fallbackCover}'">
                        <span class="font-mono text-xs text-slate-400">#${book.id_libro}</span>
                    </div>
                </td>
                <td class="py-3 px-6">
                    <div class="flex items-center space-x-2">
                        <span class="font-bold text-slate-900">${book.titulo}</span>
                        ${isBorrowed ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Prestado</span>' : '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Disponible</span>'}
                        ${book.rating_promedio !== null ? `<span class="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"><i class="fa-solid fa-star text-amber-500 mr-1 text-[9px]"></i>${book.rating_promedio}</span>` : ''}
                    </div>
                </td>
                <td class="py-3 px-6">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        <i class="fa-solid fa-pen-nib mr-1 text-[10px]"></i>
                        ${book.autor || 'Sin Autor'}
                    </span>
                </td>
                <td class="py-3 px-6">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        ${book.genero || 'Sin Género'}
                    </span>
                </td>
                <td class="py-3 px-6 text-slate-500 font-medium">${book.anio}</td>
                <td class="py-3 px-6 text-center">
                    <div class="flex items-center justify-center space-x-1.5">
                        <button class="btn-read px-2.5 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 transition-colors" data-id="${book.id_libro}" title="Leer Obra">
                            <i class="fa-solid fa-book-open mr-1"></i> Leer
                        </button>
                        ${actionLoanBtnTable}
                        <button class="btn-favorite px-2.5 py-1.5 rounded-lg ${isFav ? 'text-amber-700 bg-amber-100 border-amber-300' : 'text-slate-500 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border-slate-200'} text-xs font-semibold border transition-colors" data-id="${book.id_libro}" title="${isFav ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}">
                            <i class="${isFav ? 'fa-solid fa-star text-amber-500' : 'fa-regular fa-star'} mr-1"></i> Favorito
                        </button>
                        ${isAdmin ? `
                        <button class="btn-edit p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" data-id="${book.id_libro}" title="Editar Libro">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-delete p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" data-id="${book.id_libro}" title="Eliminar Libro">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            booksTableBody.appendChild(tr);
        });
    }

    // ==========================================
    // DEBOUNCE DE BÚSQUEDA (300ms)
    // ==========================================
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchBooks(query);
        }, 300);
    });

    // ==========================================
    // OPERACIONES CRUD: LIBROS
    // ==========================================
    btnOpenCreateBook.addEventListener('click', () => {
        if (!currentUser || currentUser.rol !== 'admin') {
            showToast('Solo el administrador puede agregar nuevos libros', 'warning');
            return;
        }
        formBook.reset();
        bookIdInput.value = '';
        bookContentInput.value = '';
        bookCoverInput.value = DEFAULT_COVER_URL;
        updateCoverPreview(DEFAULT_COVER_URL);
        modalBookTitle.textContent = 'Nuevo Libro';
        openModal(modalBook);
    });

    formBook.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser || currentUser.rol !== 'admin') {
            showToast('Solo el administrador puede guardar libros', 'warning');
            return;
        }

        const id = bookIdInput.value;
        const coverVal = bookCoverInput.value.trim();
        const payload = {
            titulo: bookTitleInput.value.trim(),
            anio: parseInt(bookYearInput.value, 10),
            contenido: bookContentInput.value.trim(),
            portada_url: coverVal || DEFAULT_COVER_URL,
            id_autor: parseInt(bookAuthorSelect.value, 10),
            id_genero: parseInt(bookGenreSelect.value, 10)
        };

        try {
            const url = id ? `/api/books/${id}` : '/api/books';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                showToast(id ? 'Libro actualizado exitosamente' : 'Libro creado exitosamente', 'success');
                closeModal(modalBook);
                fetchBooks(searchInput.value);
            } else {
                showToast(data.message || 'Error al procesar la solicitud', 'error');
            }
        } catch (err) {
            showToast('Error de conexión con el servidor', 'error');
        }
    });

    // Función auxiliar para abrir el modal de préstamo configurado
    function openLoanModal(book) {
        if (!book) return;
        loanBookId.value = book.id_libro;
        loanBookTitle.textContent = book.titulo;
        loanBookAuthor.textContent = `${book.autor} (${book.anio})`;

        // Configurar fecha límite por defecto a 14 días en el futuro
        const today = new Date();
        today.setDate(today.getDate() + 14);
        loanDeadline.value = today.toISOString().split('T')[0];
        loanDeadline.min = new Date().toISOString().split('T')[0];

        const isAdmin = currentUser && currentUser.rol === 'admin';
        const loanUserAdminContainer = document.getElementById('loan-user-admin-container');
        const loanUserReaderContainer = document.getElementById('loan-user-reader-container');
        const loanUserReaderName = document.getElementById('loan-user-reader-name');
        const loanUserReaderLoans = document.getElementById('loan-user-reader-loans');

        if (isAdmin) {
            if (loanUserAdminContainer) loanUserAdminContainer.classList.remove('hidden');
            if (loanUserReaderContainer) loanUserReaderContainer.classList.add('hidden');
            if (currentUser && loanUserSelect) {
                loanUserSelect.value = currentUser.id_usuario;
            }
        } else {
            if (loanUserAdminContainer) loanUserAdminContainer.classList.add('hidden');
            if (loanUserReaderContainer) loanUserReaderContainer.classList.remove('hidden');
            if (currentUser) {
                if (loanUserReaderName) loanUserReaderName.textContent = currentUser.nombre;
                if (loanUserReaderLoans) loanUserReaderLoans.textContent = `${currentUser.libros_activos || 0}/3 activos`;
                if (loanUserSelect) loanUserSelect.value = currentUser.id_usuario;
            }
        }

        openModal(modalLoan);
    }

    // Controlador compartido de acciones sobre libros (Leer, Editar, Eliminar, Prestar, Favorito)
    async function handleBookAction(e) {
        const btnRead = e.target.closest('.btn-read');
        const btnEdit = e.target.closest('.btn-edit');
        const btnDelete = e.target.closest('.btn-delete');
        const btnLoan = e.target.closest('.btn-loan');
        const btnReturn = e.target.closest('.btn-return');
        const btnFavorite = e.target.closest('.btn-favorite');

        // LEER LIBRO
        if (btnRead) {
            const id = btnRead.dataset.id;
            recordBookView(id);
            const book = currentBooks.find(b => b.id_libro == id);
            if (book) {
                readBookTitle.textContent = book.titulo;
                readBookMeta.textContent = `${book.autor || 'Autor desconocido'} • ${book.genero || 'Literatura'} • ${book.anio}`;
                if (readBookCover) {
                    readBookCover.src = book.portada_url || DEFAULT_COVER_URL;
                    readBookCover.onerror = () => {
                        readBookCover.src = DEFAULT_COVER_URL;
                    };
                }

                if (!book.contenido || !book.contenido.trim()) {
                    readBookContent.innerHTML = '<p class="text-slate-400 italic text-center py-8">Esta obra no cuenta con un texto o fragmento cargado en el sistema.</p>';
                    if (readBookModeBadge) {
                        readBookModeBadge.innerHTML = '<i class="fa-solid fa-circle-info mr-1"></i> Sin contenido disponible';
                    }
                    openModal(modalReadBook);
                    return;
                }

                const isBorrowedByMe = Boolean(book.es_prestado && book.prestamo_activo && currentUser && (book.prestamo_activo.id_usuario === currentUser.id_usuario));
                const isAdmin = Boolean(currentUser && currentUser.rol === 'admin');
                const canReadFull = isBorrowedByMe || isAdmin;

                if (canReadFull) {
                    // LECTURA COMPLETA: El lector titular del préstamo o el Administrador
                    if (readBookModeBadge) {
                        readBookModeBadge.innerHTML = isBorrowedByMe
                            ? '<span class="text-emerald-700 font-semibold flex items-center"><i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> Lectura Completa Desbloqueada (Préstamo Activo)</span>'
                            : '<span class="text-indigo-700 font-semibold flex items-center"><i class="fa-solid fa-shield-halved text-indigo-600 mr-1.5"></i> Modo Administrador (Lectura Completa)</span>';
                    }

                    const accessBanner = isBorrowedByMe ? `
                        <div class="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm">
                            <div class="flex items-center space-x-2">
                                <i class="fa-solid fa-circle-check text-emerald-600 text-base flex-shrink-0"></i>
                                <span><strong>Lectura Completa Desbloqueada:</strong> Ejemplar actualmente en préstamo activo a tu cuenta.</span>
                            </div>
                            <span class="text-[11px] font-mono bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-700 shadow-xs self-start sm:self-auto">
                                Fecha límite: ${book.prestamo_activo ? book.prestamo_activo.fecha_limite : 'Activo'}
                            </span>
                        </div>
                    ` : '';

                    const paragraphs = book.contenido.split('\n\n').filter(p => p.trim());
                    readBookContent.innerHTML = accessBanner + paragraphs.map(p => 
                        `<p class="mb-5 text-justify leading-relaxed text-slate-700 indent-6 font-serif text-sm sm:text-base selection:bg-indigo-100">${p}</p>`
                    ).join('');
                } else {
                    // VISTA PREVIA LIMITADA (4 LÍNEAS) CON INVITACIÓN A PRESTAR
                    if (readBookModeBadge) {
                        readBookModeBadge.innerHTML = '<span class="text-amber-800 font-medium flex items-center"><i class="fa-solid fa-lock text-amber-600 mr-1.5"></i> Fragmento de Muestra (4 Líneas) • Prestar para leer completo</span>';
                    }

                    // Extraer primeras 4 líneas (~260 caracteres del primer párrafo de inicio)
                    const allParagraphs = book.contenido.split('\n\n').filter(p => p.trim());
                    const firstParagraph = allParagraphs.length > 0 ? allParagraphs[0].trim() : book.contenido.trim();
                    let previewSnippet = firstParagraph;
                    if (previewSnippet.length > 260) {
                        const cut = previewSnippet.substring(0, 260);
                        const lastSpace = cut.lastIndexOf(' ');
                        previewSnippet = (lastSpace > 160 ? cut.substring(0, lastSpace) : cut) + '...';
                    }

                    readBookContent.innerHTML = `
                        <div class="space-y-4">
                            <!-- Cabecera de fragmento de muestra -->
                            <div class="flex items-center justify-between border-b border-amber-200/60 pb-2">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                                    <i class="fa-solid fa-eye text-amber-700 mr-1.5"></i>
                                    Fragmento de Muestra (Primeras 4 Líneas)
                                </span>
                                <span class="text-[11px] text-amber-800/80 font-mono">
                                    Capítulo 1 • Inicio
                                </span>
                            </div>

                            <!-- Párrafo de 4 líneas con gradiente de desvanecimiento -->
                            <div class="relative bg-white/80 p-5 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                                <p class="text-justify leading-relaxed text-slate-800 indent-6 font-serif text-sm sm:text-base selection:bg-indigo-100">
                                    ${previewSnippet}
                                </p>
                                <div class="h-10 bg-gradient-to-t from-amber-50 to-transparent pointer-events-none -mt-4"></div>
                            </div>

                            <!-- Bloque de interés: Prestar para leer completo -->
                            <div class="p-6 rounded-2xl bg-gradient-to-br from-amber-100/90 via-amber-50 to-orange-50 border-2 border-amber-300 text-center space-y-3.5 shadow-md">
                                <div class="w-12 h-12 mx-auto rounded-full bg-amber-200/90 text-amber-800 flex items-center justify-center text-xl shadow-inner">
                                    <i class="fa-solid fa-book-bookmark"></i>
                                </div>

                                <div>
                                    <h4 class="text-base font-extrabold text-amber-950">
                                        ¿Quieres continuar la lectura?
                                    </h4>
                                    <p class="text-xs sm:text-sm text-amber-800/90 max-w-md mx-auto mt-1 leading-relaxed">
                                        Solo se visualizan las primeras 4 líneas de muestra. Para desbloquear todos los capítulos y párrafos completos de <strong class="text-amber-950">"${book.titulo}"</strong>, solicita el préstamo del libro.
                                    </p>
                                </div>

                                <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                                    ${!book.es_prestado ? `
                                        <button type="button" class="btn-read-modal-loan w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-200 hover:shadow-lg transition-all flex items-center justify-center space-x-2 transform hover:-translate-y-0.5" data-id="${book.id_libro}">
                                            <i class="fa-solid fa-handshake"></i>
                                            <span>Prestar para leer completo</span>
                                        </button>
                                    ` : `
                                        <div class="px-4 py-2 rounded-xl bg-slate-200/90 text-slate-700 text-xs font-semibold flex items-center space-x-2">
                                            <i class="fa-solid fa-clock"></i>
                                            <span>Este libro está actualmente prestado a otro usuario. Podrás solicitarlo cuando lo devuelva.</span>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
                }

                openModal(modalReadBook);
            }
        }

        // EDITAR LIBRO (Solo Administrador)
        if (btnEdit) {
            if (!currentUser || currentUser.rol !== 'admin') {
                showToast('Acción reservada exclusivamente para el Administrador', 'warning');
                return;
            }
            const id = btnEdit.dataset.id;
            const book = currentBooks.find(b => b.id_libro == id);
            if (book) {
                bookIdInput.value = book.id_libro;
                bookTitleInput.value = book.titulo;
                bookYearInput.value = book.anio;
                bookContentInput.value = book.contenido || '';
                bookCoverInput.value = book.portada_url || DEFAULT_COVER_URL;
                updateCoverPreview(book.portada_url || DEFAULT_COVER_URL);
                bookGenreSelect.value = book.id_genero;
                bookAuthorSelect.value = book.id_autor;

                modalBookTitle.textContent = 'Editar Libro';
                openModal(modalBook);
            }
        }

        // ELIMINAR LIBRO (Solo Administrador)
        if (btnDelete) {
            if (!currentUser || currentUser.rol !== 'admin') {
                showToast('Acción reservada exclusivamente para el Administrador', 'warning');
                return;
            }
            const id = btnDelete.dataset.id;
            const book = currentBooks.find(b => b.id_libro == id);
            if (!confirm(`¿Estás seguro de que deseas eliminar la obra "${book ? book.titulo : id}"?`)) {
                return;
            }

            try {
                const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message, 'success');
                    fetchBooks(searchInput.value);
                } else {
                    showToast(data.message || 'Error al eliminar el libro', 'error');
                }
            } catch (err) {
                showToast('Error de conexión', 'error');
            }
        }

        // PRESTAR LIBRO
        if (btnLoan) {
            const id = btnLoan.dataset.id;
            const book = currentBooks.find(b => b.id_libro == id);
            if (book) {
                openLoanModal(book);
            }
        }

        // DEVOLVER LIBRO ANTICIPADAMENTE (Lector titular o Administrador)
        if (btnReturn) {
            const loanId = btnReturn.dataset.id;
            const bookId = btnReturn.dataset.bookId;
            const book = currentBooks.find(b => b.id_libro == bookId);
            const bookTitle = book ? book.titulo : 'Libro';

            if (!confirm(`¿Deseas devolver anticipadamente la obra "${bookTitle}"?`)) {
                return;
            }

            try {
                const res = await fetch(`/api/prestamos/${loanId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'Devuelto' })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast(`¡"${bookTitle}" devuelto con éxito! El libro ahora está Disponible.`, 'success');
                    await loadUsers();
                    await updateLoansStat();
                    await fetchBooks(searchInput.value);
                    updateAuthUI();
                } else {
                    showToast(data.message || 'Error al devolver el libro', 'error');
                }
            } catch (err) {
                showToast('Error de conexión con el servidor', 'error');
            }
            return;
        }

        // AGREGAR O QUITAR DE FAVORITOS (TOGGLE)
        if (btnFavorite) {
            const id = parseInt(btnFavorite.dataset.id, 10);
            const activeUserId = currentUser ? currentUser.id_usuario : (activeUserSelect ? activeUserSelect.value : null);

            if (!activeUserId) {
                showToast("Debes iniciar sesión para gestionar tus favoritos", "warning");
                return;
            }

            if (userFavorites.has(id)) {
                // Quitar de favoritos
                const favId = userFavorites.get(id);
                try {
                    const res = await fetch(`/api/favoritos/${favId}`, { method: 'DELETE' });
                    if (res.ok) {
                        userFavorites.delete(id);
                        showToast("Libro removido de tus favoritos", "info");
                        renderBooks(currentBooks);
                    } else {
                        showToast("No se pudo remover de favoritos", "error");
                    }
                } catch (err) {
                    showToast("Error de conexión con el servidor", "error");
                }
            } else {
                // Agregar a favoritos
                try {
                    const res = await fetch('/api/favoritos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_libro: id,
                            id_usuario: parseInt(activeUserId, 10)
                        })
                    });

                    const data = await res.json();

                    if (res.status === 201) {
                        userFavorites.set(id, data.id_favorito);
                        showToast("¡Libro agregado a tus favoritos!", "success");
                        renderBooks(currentBooks);
                    } else if (res.status === 409) {
                        showToast(data.message || "Este libro ya está en favoritos", "warning");
                    } else {
                        showToast(data.message || "Error al agregar a favoritos", "error");
                    }
                } catch (err) {
                    showToast("Error de conexión con el servidor", "error");
                }
            }
        }
    }

    // Registrar eventos para ambas vistas (Tabla y Cuadrícula de Portadas)
    booksTableBody.addEventListener('click', handleBookAction);
    booksGrid.addEventListener('click', handleBookAction);

    // Evento para el botón dentro del Modal de Lectura (Prestar para leer completo)
    if (readBookContent) {
        readBookContent.addEventListener('click', (e) => {
            const btnLoanFromRead = e.target.closest('.btn-read-modal-loan');
            if (btnLoanFromRead) {
                const bookId = btnLoanFromRead.dataset.id;
                const book = currentBooks.find(b => b.id_libro == bookId);
                if (book) {
                    closeModal(modalReadBook);
                    openLoanModal(book);
                }
            }
        });
    }

    // ==========================================
    // OPERACIONES DE PRÉSTAMOS (Transaccional)
    // ==========================================
    formLoan.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isAdmin = currentUser && currentUser.rol === 'admin';
        const userIdForLoan = (isAdmin && loanUserSelect && loanUserSelect.value)
            ? parseInt(loanUserSelect.value, 10)
            : (currentUser ? currentUser.id_usuario : parseInt(loanUserSelect.value, 10));

        const payload = {
            id_libro: parseInt(loanBookId.value, 10),
            id_usuario: userIdForLoan,
            fecha_limite: loanDeadline.value
        };

        try {
            const res = await fetch('/api/prestamos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.status === 201) {
                showToast('Préstamo registrado exitosamente (+1 libro activo)', 'success');
                closeModal(modalLoan);
                await loadUsers();
                await updateLoansStat();
                await fetchBooks(searchInput.value);
                updateAuthUI();
            } else if (res.status === 403) {
                // Regla de negocio: Límite de 3 libros activos alcanzado
                showToast(data.message || 'Límite de libros alcanzado (Máx. 3)', 'error');
            } else {
                showToast(data.message || 'No se pudo realizar el préstamo', 'error');
            }
        } catch (err) {
            showToast('Error de conexión con el servidor', 'error');
        }
    });

    // ==========================================
    // GESTIÓN Y RETORNO DE PRÉSTAMOS
    // ==========================================
    async function renderLoansHistory() {
        const isAdmin = currentUser && currentUser.rol === 'admin';
        const modalLoansTitle = document.getElementById('modal-loans-title');
        const thLoanActions = document.getElementById('th-loan-actions');
        if (modalLoansTitle) {
            modalLoansTitle.textContent = isAdmin ? 'Control y Retorno de Préstamos' : 'Mis Préstamos Activos';
        }
        if (thLoanActions) {
            thLoanActions.textContent = isAdmin ? 'Acción' : 'Estado Devolución';
        }

        loansTableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-400">Cargando registros...</td></tr>';
        try {
            const url = (currentUser && !isAdmin) ? `/api/prestamos?id_usuario=${currentUser.id_usuario}` : '/api/prestamos';
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error");
            const loans = await res.json();

            if (loans.length === 0) {
                loansTableBody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">No hay préstamos registrados aún.</td></tr>';
                return;
            }

            loansTableBody.innerHTML = '';
            loans.forEach(loan => {
                const tr = document.createElement('tr');
                const isReturned = loan.estado === 'Devuelto';
                const statusBadge = isReturned
                    ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Devuelto</span>'
                    : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Reservado</span>';

                let actionCell = '';
                const canReturnThisLoan = !isReturned && (isAdmin || (currentUser && currentUser.id_usuario === loan.id_usuario));
                if (canReturnThisLoan) {
                    actionCell = `
                        <button class="btn-return-loan px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm" data-id="${loan.id_prestamo}" data-user-id="${loan.id_usuario}">
                            Devolver
                        </button>
                    `;
                } else if (isReturned) {
                    actionCell = '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-check mr-1 text-[10px]"></i> Devuelto</span>';
                } else {
                    actionCell = `
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <i class="fa-solid fa-clock mr-1 text-[10px]"></i> En curso
                        </span>
                    `;
                }

                tr.innerHTML = `
                    <td class="py-3 px-4 font-medium text-slate-900">${loan.libro_titulo || 'Libro #' + loan.id_libro}</td>
                    <td class="py-3 px-4 text-slate-600">${loan.usuario_nombre || 'Usuario #' + loan.id_usuario}</td>
                    <td class="py-3 px-4 text-slate-500 font-mono text-xs">${loan.fecha_limite}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-center">${actionCell}</td>
                `;
                loansTableBody.appendChild(tr);
            });
        } catch (err) {
            loansTableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-rose-500">Error al cargar préstamos</td></tr>';
        }
    }

    loansTableBody.addEventListener('click', async (e) => {
        const btnReturn = e.target.closest('.btn-return-loan');
        if (btnReturn) {
            const loanId = btnReturn.dataset.id;
            const loanUserId = parseInt(btnReturn.dataset.userId, 10);
            const isAdmin = currentUser && currentUser.rol === 'admin';
            const isOwner = currentUser && currentUser.id_usuario === loanUserId;

            if (!isAdmin && !isOwner) {
                showToast('Solo el administrador o el lector titular pueden devolver el préstamo', 'warning');
                return;
            }

            try {
                const res = await fetch(`/api/prestamos/${loanId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'Devuelto' })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast('Libro devuelto con éxito (-1 libro activo al usuario)', 'success');
                    await renderLoansHistory();
                    await loadUsers();
                    await updateLoansStat();
                    await fetchBooks(searchInput.value);
                    updateAuthUI();
                } else {
                    showToast(data.message || 'Error al devolver el libro', 'error');
                }
            } catch (err) {
                showToast('Error al conectar con el servidor', 'error');
            }
        }
    });

    // ==========================================
    // OPERACIONES DE USUARIOS
    // ==========================================
    if (btnOpenUserModal) {
        btnOpenUserModal.addEventListener('click', () => {
            if (!currentUser || currentUser.rol !== 'admin') {
                showToast('Solo el administrador puede registrar nuevos usuarios desde el panel', 'warning');
                return;
            }
            formUser.reset();
            openModal(modalUser);
        });
    }

    formUser.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser || currentUser.rol !== 'admin') {
            showToast('Solo el administrador puede registrar nuevos usuarios desde el panel', 'warning');
            return;
        }

        const payload = {
            nombre: userNameInput.value.trim(),
            correo: userEmailInput.value.trim().toLowerCase(),
            password: userPasswordInput.value.trim() || '123456'
        };

        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.status === 201) {
                showToast(`Usuario "${data.nombre}" registrado exitosamente`, 'success');
                closeModal(modalUser);
                await loadUsers();
            } else if (res.status === 409) {
                showToast(data.message || 'El correo ya está registrado', 'warning');
            } else {
                showToast(data.message || 'Error al registrar usuario', 'error');
            }
        } catch (err) {
            showToast('Error al conectar con el servidor', 'error');
        }
    });

    // ==========================================
    // GESTIÓN Y EXPLORACIÓN DE AUTORES (Modal de Autores 3NF)
    // ==========================================
    async function renderAuthorsModal(filter = '') {
        if (!authorsTableBody) return;
        authorsTableBody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Cargando autores...</td></tr>';
        try {
            const res = await fetch('/api/autores');
            if (!res.ok) throw new Error("Error al obtener autores");
            authorsList = await res.json();
            if (statTotalAuthors) statTotalAuthors.textContent = authorsList.length;

            const query = (filter || '').toLowerCase().trim();
            const filtered = query 
                ? authorsList.filter(a => a.nombre.toLowerCase().includes(query))
                : authorsList;

            if (filtered.length === 0) {
                authorsTableBody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-400">No se encontraron autores que coincidan con la búsqueda.</td></tr>';
                return;
            }

            const isAdmin = currentUser && currentUser.rol === 'admin';
            authorsTableBody.innerHTML = '';
            filtered.forEach(author => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/80 transition-colors';
                const count = author.total_libros || 0;
                const badgeClass = count > 0 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-slate-100 text-slate-500';

                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = count > 0 
                        ? `<button class="btn-delete-author p-1.5 text-xs text-slate-300 hover:text-rose-500 rounded-lg transition-all" data-id="${author.id_autor}" data-name="${author.nombre}" data-books="${count}" title="Tiene ${count} obra(s) en la biblioteca">
                             <i class="fa-solid fa-trash-can"></i>
                           </button>`
                        : `<button class="btn-delete-author p-1.5 text-xs text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all shadow-sm" data-id="${author.id_autor}" data-name="${author.nombre}" data-books="0" title="Eliminar autor">
                             <i class="fa-solid fa-trash-can"></i>
                           </button>`;
                }

                tr.innerHTML = `
                    <td class="py-3 px-4 font-mono text-xs text-slate-400 font-semibold">#${author.id_autor}</td>
                    <td class="py-3 px-4 font-medium text-slate-900">${author.nombre}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">
                            <i class="fa-solid fa-book mr-1 text-[10px]"></i>
                            ${count} ${count === 1 ? 'libro' : 'libros'}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                        <div class="flex items-center justify-center space-x-1.5">
                            <button class="btn-filter-by-author px-2.5 py-1 text-xs font-semibold text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-200 hover:border-purple-600 rounded-lg transition-all" data-author="${author.nombre}" title="Explorar libros de este autor">
                                Ver obras &rarr;
                            </button>
                            ${deleteBtn}
                        </div>
                    </td>
                `;
                authorsTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            authorsTableBody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-rose-500">Error al cargar la lista de autores</td></tr>';
        }
    }

    if (authorsTableBody) {
        authorsTableBody.addEventListener('click', async (e) => {
            const btnFilter = e.target.closest('.btn-filter-by-author');
            if (btnFilter) {
                const authorName = btnFilter.dataset.author;
                closeModal(modalAuthorsList);
                if (searchInput) {
                    searchInput.value = authorName;
                    fetchBooks(authorName);
                    const target = document.getElementById('search-input') || booksGrid;
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    showToast(`Mostrando catálogo de "${authorName}"`, 'info');
                }
                return;
            }

            const btnDelete = e.target.closest('.btn-delete-author');
            if (btnDelete) {
                const isAdmin = currentUser && currentUser.rol === 'admin';
                if (!isAdmin) {
                    showToast('Solo el administrador puede eliminar autores', 'warning');
                    return;
                }

                const authorId = btnDelete.dataset.id;
                const authorName = btnDelete.dataset.name;
                const booksCount = parseInt(btnDelete.dataset.books, 10) || 0;

                if (booksCount > 0) {
                    showToast(`No se puede eliminar a "${authorName}" porque tiene ${booksCount} obra(s) asociada(s) en la biblioteca.`, 'warning');
                    return;
                }

                if (!confirm(`¿Estás seguro de que deseas eliminar al autor "${authorName}"?`)) {
                    return;
                }

                try {
                    const res = await fetch(`/api/autores/${authorId}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (res.ok) {
                        showToast(data.message || `Autor "${authorName}" eliminado con éxito`, 'success');
                        await loadAuthors();
                        await renderAuthorsModal(authorsSearchInput ? authorsSearchInput.value : '');
                    } else {
                        showToast(data.message || 'Error al eliminar autor', 'error');
                    }
                } catch (err) {
                    showToast('Error de conexión con el servidor', 'error');
                }
            }
        });
    }

    if (authorsSearchInput) {
        authorsSearchInput.addEventListener('input', (e) => {
            renderAuthorsModal(e.target.value);
        });
    }

    if (formQuickAddAuthor) {
        formQuickAddAuthor.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isAdmin = currentUser && currentUser.rol === 'admin';
            if (!isAdmin) {
                showToast('Solo el administrador puede registrar autores', 'warning');
                return;
            }

            const name = quickAuthorName.value.trim();
            if (!name) return;

            try {
                const res = await fetch('/api/autores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: name })
                });
                const data = await res.json();
                if (res.status === 201) {
                    showToast(`Autor "${data.nombre}" registrado exitosamente`, 'success');
                    quickAuthorName.value = '';
                    await loadAuthors();
                    await renderAuthorsModal(authorsSearchInput ? authorsSearchInput.value : '');
                } else if (res.status === 409) {
                    showToast(data.message || 'El autor ya está registrado', 'warning');
                } else {
                    showToast(data.message || 'Error al agregar autor', 'error');
                }
            } catch (err) {
                showToast('Error de conexión con el servidor', 'error');
            }
        });
    }

    // ==========================================
    // EXPLORACIÓN DE USUARIOS (Modal de Usuarios)
    // ==========================================
    async function renderUsersModal(filter = '') {
        if (!usersTableBody) return;
        const isAdmin = currentUser && currentUser.rol === 'admin';
        if (!isAdmin) {
            usersTableBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-rose-500 font-medium"><i class="fa-solid fa-lock mr-2"></i>Acceso restringido: Vista disponible exclusivamente para el Administrador.</td></tr>';
            return;
        }

        usersTableBody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Cargando usuarios...</td></tr>';
        try {
            const res = await fetch('/api/usuarios');
            if (!res.ok) throw new Error("Error al obtener usuarios");
            usersList = await res.json();
            if (statTotalUsers) statTotalUsers.textContent = usersList.length;

            const query = (filter || '').toLowerCase().trim();
            const filtered = query 
                ? usersList.filter(u => u.nombre.toLowerCase().includes(query) || (u.correo && u.correo.toLowerCase().includes(query)))
                : usersList;

            if (filtered.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-400">No se encontraron usuarios que coincidan con la búsqueda.</td></tr>';
                return;
            }

            usersTableBody.innerHTML = '';
            filtered.forEach(user => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/80 transition-colors';
                const initial = (user.nombre || 'U').charAt(0).toUpperCase();
                const isUserAdmin = user.rol === 'admin' || (user.correo && user.correo.toLowerCase().includes('admin'));
                const roleBadge = isUserAdmin
                    ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">👑 Admin</span>'
                    : '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">📖 Lector</span>';

                const loansCount = user.libros_activos || 0;
                let loanBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (loansCount >= 3) {
                    loanBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                } else if (loansCount > 0) {
                    loanBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                }

                tr.innerHTML = `
                    <td class="py-3 px-4 font-mono text-xs text-slate-400 font-semibold">#${user.id_usuario}</td>
                    <td class="py-3 px-4">
                        <div class="flex items-center space-x-2.5">
                            <span class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                ${initial}
                            </span>
                            <span class="font-medium text-slate-900">${user.nombre}</span>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-slate-600 text-xs font-mono">${user.correo}</td>
                    <td class="py-3 px-4">${roleBadge}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${loanBadgeClass}">
                            ${loansCount}/3 activos
                        </span>
                    </td>
                `;
                usersTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            usersTableBody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-rose-500">Error al cargar la lista de usuarios</td></tr>';
        }
    }

    if (usersSearchInput) {
        usersSearchInput.addEventListener('input', (e) => {
            renderUsersModal(e.target.value);
        });
    }

    if (btnOpenUserFromList) {
        btnOpenUserFromList.addEventListener('click', () => {
            if (!currentUser || currentUser.rol !== 'admin') {
                showToast('Solo el administrador puede registrar nuevos usuarios', 'warning');
                return;
            }
            closeModal(modalUsersList);
            formUser.reset();
            openModal(modalUser);
        });
    }

    // ==========================================
    // TARJETAS ESTADÍSTICAS INTERACTIVAS (CLICK HANDLERS)
    // ==========================================
    if (cardStatBooks) {
        cardStatBooks.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            fetchBooks('');
            const targetSection = document.getElementById('search-input') || booksGrid;
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (searchInput) searchInput.focus();
            }
            showToast('Explorando catálogo completo de libros', 'info');
        });
    }

    if (cardStatAuthors) {
        cardStatAuthors.addEventListener('click', async () => {
            await renderAuthorsModal();
            openModal(modalAuthorsList);
            if (authorsSearchInput) {
                authorsSearchInput.value = '';
                authorsSearchInput.focus();
            }
        });
    }

    if (cardStatUsers) {
        cardStatUsers.addEventListener('click', async () => {
            const isAdmin = currentUser && currentUser.rol === 'admin';
            if (isAdmin) {
                await renderUsersModal();
                openModal(modalUsersList);
                if (usersSearchInput) {
                    usersSearchInput.value = '';
                    usersSearchInput.focus();
                }
            } else {
                await renderLoansHistory();
                openModal(modalLoansList);
            }
        });
    }

    if (cardStatLoans) {
        cardStatLoans.addEventListener('click', async () => {
            await renderLoansHistory();
            openModal(modalLoansList);
        });
    }

    // Soporte de navegación por teclado en las tarjetas
    [cardStatBooks, cardStatAuthors, cardStatUsers, cardStatLoans].forEach(card => {
        if (card) {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        }
    });

    // ==========================================
    // COMUNIDAD Y RESEÑAS LITERARIAS (Modal de Comentarios)
    // ==========================================
    function populateCommentBookSelect(filter = '') {
        if (!commentBookSelect) return;
        const currentSelected = commentBookSelect.value;
        const query = (filter || '').trim().toLowerCase();

        let matchingBooks = currentBooks || [];
        if (query) {
            matchingBooks = matchingBooks.filter(b => 
                (b.titulo && b.titulo.toLowerCase().includes(query)) ||
                (b.autor && b.autor.toLowerCase().includes(query))
            );
        }

        let html = '<option value="">💬 Opinión general sobre la biblioteca</option>';
        if (matchingBooks && matchingBooks.length > 0) {
            matchingBooks.forEach(b => {
                html += `<option value="${b.id_libro}">📖 ${b.titulo} (${b.autor || 'Clásico'})</option>`;
            });
        }
        commentBookSelect.innerHTML = html;

        if (query) {
            if (commentSearchFeedback) {
                commentSearchFeedback.textContent = matchingBooks.length > 0
                    ? `${matchingBooks.length} obra(s) encontrada(s)`
                    : 'Sin coincidencias';
            }
            if (btnClearCommentBookSearch) btnClearCommentBookSearch.classList.remove('hidden');
            if (matchingBooks.length > 0) {
                commentBookSelect.value = matchingBooks[0].id_libro;
            }
        } else {
            if (commentSearchFeedback) commentSearchFeedback.textContent = '';
            if (btnClearCommentBookSearch) btnClearCommentBookSearch.classList.add('hidden');
            if (currentSelected) commentBookSelect.value = currentSelected;
        }
    }

    // Buscador interactivo de libros/autores dentro del modal de comentarios
    if (commentBookSearch) {
        commentBookSearch.addEventListener('input', () => {
            populateCommentBookSelect(commentBookSearch.value);
        });
        commentBookSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                populateCommentBookSelect(commentBookSearch.value);
            }
        });
    }

    if (btnSearchCommentBook && commentBookSearch) {
        btnSearchCommentBook.addEventListener('click', () => {
            const query = commentBookSearch.value.trim();
            populateCommentBookSelect(query);
            if (query) {
                if (commentBookSelect && commentBookSelect.value) {
                    showToast("Obra seleccionada en la lista", "info");
                } else {
                    showToast("No se encontraron libros con ese término", "warning");
                }
            }
        });
    }

    if (btnClearCommentBookSearch && commentBookSearch) {
        btnClearCommentBookSearch.addEventListener('click', () => {
            commentBookSearch.value = '';
            populateCommentBookSelect('');
        });
    }

    if (commentStarRating) {
        commentStarRating.addEventListener('click', (e) => {
            const star = e.target.closest('.star-btn');
            if (star) {
                const rating = parseInt(star.dataset.rating, 10);
                if (commentRatingValue) commentRatingValue.value = rating;
                if (commentRatingLabel) commentRatingLabel.textContent = `${rating}/5`;
                const stars = commentStarRating.querySelectorAll('.star-btn');
                stars.forEach((s, idx) => {
                    if (idx < rating) {
                        s.className = 'fa-solid fa-star star-btn text-amber-400';
                    } else {
                        s.className = 'fa-regular fa-star star-btn text-slate-300';
                    }
                });
            }
        });
    }

    async function renderCommentsModal() {
        if (!commentsContainer) return;
        commentsContainer.innerHTML = '<div class="py-8 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Cargando comentarios...</div>';
        
        if (commentAuthorName) {
            commentAuthorName.textContent = currentUser ? `Publicando como ${currentUser.nombre}` : 'Inicia sesión para comentar';
        }

        if (commentBookSearch) commentBookSearch.value = '';
        populateCommentBookSelect('');

        try {
            const res = await fetch('/api/comentarios');
            if (!res.ok) throw new Error("Error al obtener comentarios");
            const comments = await res.json();

            if (commentsCountStat) {
                commentsCountStat.textContent = `${comments.length} ${comments.length === 1 ? 'comentario registrado' : 'comentarios registrados'}`;
            }

            if (comments.length === 0) {
                commentsContainer.innerHTML = `
                    <div class="py-10 text-center text-slate-400">
                        <i class="fa-regular fa-comment-dots text-3xl mb-2 text-slate-300"></i>
                        <p class="text-sm font-medium">Aún no hay comentarios publicados.</p>
                        <p class="text-xs text-slate-400 mt-1">¡Sé el primero en compartir tu opinión o reseña literaria!</p>
                    </div>
                `;
                return;
            }

            commentsContainer.innerHTML = '';
            comments.forEach(c => {
                const card = document.createElement('div');
                card.className = 'p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all space-y-2';
                
                const initial = (c.usuario_nombre || 'U').charAt(0).toUpperCase();
                const isAdmin = c.usuario_rol === 'admin';
                const roleBadge = isAdmin
                    ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">👑 Admin</span>'
                    : '<span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700">📖 Lector</span>';

                // Generar estrellas doradas
                const starsCount = c.puntuacion || 5;
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= starsCount) {
                        starsHtml += '<i class="fa-solid fa-star text-amber-400 text-xs"></i>';
                    } else {
                        starsHtml += '<i class="fa-regular fa-star text-slate-200 text-xs"></i>';
                    }
                }

                // Badge de obra vinculada
                const bookBadge = c.libro_titulo
                    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 max-w-[220px] truncate"><i class="fa-solid fa-book mr-1 text-[9px]"></i>${c.libro_titulo}</span>`
                    : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600"><i class="fa-solid fa-building-columns mr-1 text-[9px]"></i>Biblioteca General</span>`;

                // Botón de eliminar (visible para admin o el autor del comentario)
                const canDelete = currentUser && (currentUser.rol === 'admin' || currentUser.id_usuario === c.id_usuario);
                const deleteBtnHtml = canDelete
                    ? `<button class="btn-delete-comment text-slate-300 hover:text-rose-500 p-1 transition-colors" data-id="${c.id_comentario}" title="Eliminar comentario"><i class="fa-solid fa-trash-can text-xs"></i></button>`
                    : '';

                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2.5">
                            <span class="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                                ${initial}
                            </span>
                            <div class="flex flex-col">
                                <div class="flex items-center space-x-1.5">
                                    <span class="text-xs font-bold text-slate-800">${c.usuario_nombre}</span>
                                    ${roleBadge}
                                </div>
                                <span class="text-[10px] text-slate-400">${c.fecha || 'Reciente'}</span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="flex items-center space-x-0.5" title="${starsCount} de 5 estrellas">
                                ${starsHtml}
                            </div>
                            ${deleteBtnHtml}
                        </div>
                    </div>

                    <div class="pt-0.5">
                        <div class="mb-1.5">${bookBadge}</div>
                        <p class="text-xs text-slate-700 leading-relaxed break-words">${c.contenido}</p>
                    </div>
                `;
                commentsContainer.appendChild(card);
            });
        } catch (err) {
            console.error(err);
            commentsContainer.innerHTML = '<div class="py-6 text-center text-rose-500 text-xs">Error al cargar los comentarios</div>';
        }
    }

    if (formComment) {
        formComment.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) {
                showToast("Debes iniciar sesión para publicar un comentario", "warning");
                return;
            }

            const text = commentContent.value.trim();
            if (!text) {
                showToast("Escribe un comentario", "warning");
                return;
            }

            const payload = {
                id_usuario: currentUser.id_usuario,
                id_libro: commentBookSelect.value ? parseInt(commentBookSelect.value, 10) : null,
                contenido: text,
                puntuacion: parseInt(commentRatingValue.value, 10) || 5
            };

            try {
                const res = await fetch('/api/comentarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.status === 201) {
                    showToast("¡Comentario publicado exitosamente!", "success");
                    commentContent.value = '';
                    await renderCommentsModal();
                    await fetchBooks(searchInput.value);
                } else {
                    showToast(data.message || "Error al publicar comentario", "error");
                }
            } catch (err) {
                showToast("Error de conexión con el servidor", "error");
            }
        });
    }

    if (commentsContainer) {
        commentsContainer.addEventListener('click', async (e) => {
            const btnDelete = e.target.closest('.btn-delete-comment');
            if (btnDelete) {
                const commentId = btnDelete.dataset.id;
                if (!confirm("¿Deseas eliminar este comentario?")) return;

                try {
                    const res = await fetch(`/api/comentarios/${commentId}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) {
                        showToast(data.message || "Comentario eliminado", "info");
                        await renderCommentsModal();
                        await fetchBooks(searchInput.value);
                    } else {
                        showToast(data.message || "Error al eliminar comentario", "error");
                    }
                } catch (err) {
                    showToast("Error de conexión con el servidor", "error");
                }
            }
        });
    }

    if (btnOpenComments) {
        btnOpenComments.addEventListener('click', async () => {
            await renderCommentsModal();
            openModal(modalComments);
        });
    }

    // ==========================================
    // HISTORIAL DE ACCESOS Y AUDITORÍA (Admin)
    // ==========================================
    async function renderAccessLogs(filter = '') {
        if (!accessLogsTableBody) return;
        accessLogsTableBody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-slate-400 text-xs"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Cargando historial de accesos...</td></tr>';

        try {
            const res = await fetch('/api/historial-accesos');
            if (!res.ok) throw new Error("Error al consultar historial");
            const logs = await res.json();

            const query = (filter || '').toLowerCase().trim();
            const filtered = query ? logs.filter(log => 
                (log.nombre && log.nombre.toLowerCase().includes(query)) ||
                (log.correo && log.correo.toLowerCase().includes(query)) ||
                (log.ip && log.ip.includes(query)) ||
                (log.rol && log.rol.toLowerCase().includes(query))
            ) : logs;

            if (accessLogsCount) accessLogsCount.textContent = `${filtered.length} registro(s)`;

            if (filtered.length === 0) {
                accessLogsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                            <i class="fa-solid fa-shield-cat text-2xl mb-2 text-slate-300 block"></i>
                            No se encontraron registros de acceso.
                        </td>
                    </tr>
                `;
                return;
            }

            accessLogsTableBody.innerHTML = filtered.map(log => {
                const isAdmin = log.rol === 'admin';
                const roleBadge = isAdmin
                    ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">👑 Admin</span>'
                    : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">📖 Lector</span>';
                
                const statusBadge = log.exitoso
                    ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-check text-[9px] mr-1"></i>Exitoso</span>'
                    : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800"><i class="fa-solid fa-xmark text-[9px] mr-1"></i>Fallido</span>';

                let formattedDate = log.fecha;
                try {
                    const d = new Date(log.fecha);
                    if (!isNaN(d.getTime())) {
                        formattedDate = d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' });
                    }
                } catch (e) {}

                return `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="py-2.5 px-4 font-mono text-xs text-slate-400">#${log.id_acceso}</td>
                        <td class="py-2.5 px-4 font-semibold text-slate-800">
                            <div class="flex items-center space-x-2">
                                <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                    ${(log.nombre || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span class="truncate max-w-[140px]">${log.nombre || 'Desconocido'}</span>
                            </div>
                        </td>
                        <td class="py-2.5 px-4 text-slate-600 text-xs font-mono">${log.correo || '-'}</td>
                        <td class="py-2.5 px-4">${roleBadge}</td>
                        <td class="py-2.5 px-4 text-slate-500 text-xs">${formattedDate}</td>
                        <td class="py-2.5 px-4 font-mono text-xs text-slate-500">${log.ip || '127.0.0.1'}</td>
                        <td class="py-2.5 px-4 text-center">${statusBadge}</td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            accessLogsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-6 text-center text-rose-500 text-xs">
                        Error al cargar registros de auditoría.
                    </td>
                </tr>
            `;
        }
    }

    if (btnOpenAccessLogs) {
        btnOpenAccessLogs.addEventListener('click', () => {
            if (!currentUser || currentUser.rol !== 'admin') {
                showToast("Acceso exclusivo para el Administrador", "warning");
                return;
            }
            openModal(modalAccessLogs);
            renderAccessLogs();
        });
    }

    if (accessLogsSearch) {
        accessLogsSearch.addEventListener('input', (e) => {
            renderAccessLogs(e.target.value);
        });
    }

    if (btnRefreshAccessLogs) {
        btnRefreshAccessLogs.addEventListener('click', () => {
            renderAccessLogs(accessLogsSearch ? accessLogsSearch.value : '');
            showToast("Historial de accesos actualizado", "info");
        });
    }

    // ==========================================
    // VALIDACIÓN DE SEGURIDAD DE CONTRASEÑA
    // ==========================================
    function evaluatePasswordSecurity(password, elements) {
        const { lenEl, numEl, specEl, barEl, strengthEl } = elements;
        const pass = password || '';
        const hasLen = pass.length >= 6;
        const hasNum = /\d/.test(pass);
        const specialChars = "!@#$%^&*()_+-=[]{};':\"|,.<>/?~`";
        const hasSpec = [...pass].some(ch => specialChars.includes(ch));

        function updateRequirement(el, valid) {
            if (!el) return;
            const icon = el.querySelector('i');
            if (valid) {
                el.className = 'flex items-center space-x-1.5 text-emerald-600 font-medium';
                if (icon) icon.className = 'fa-solid fa-circle-check text-emerald-500';
            } else {
                el.className = 'flex items-center space-x-1.5 text-slate-400';
                if (icon) icon.className = 'fa-solid fa-circle-xmark text-slate-400';
            }
        }

        updateRequirement(lenEl, hasLen);
        updateRequirement(numEl, hasNum);
        updateRequirement(specEl, hasSpec);

        const score = (hasLen ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);

        if (pass.length === 0) {
            if (barEl) {
                barEl.style.width = '0%';
                barEl.className = 'h-full transition-all duration-300 bg-slate-300';
            }
            if (strengthEl) {
                strengthEl.textContent = 'Pendiente';
                strengthEl.className = 'text-slate-400 font-semibold';
            }
        } else if (score === 3) {
            if (barEl) {
                barEl.style.width = '100%';
                barEl.className = 'h-full transition-all duration-300 bg-emerald-500';
            }
            if (strengthEl) {
                strengthEl.textContent = 'Segura ✓';
                strengthEl.className = 'text-emerald-600 font-bold';
            }
        } else if (score === 2) {
            if (barEl) {
                barEl.style.width = '66%';
                barEl.className = 'h-full transition-all duration-300 bg-amber-500';
            }
            if (strengthEl) {
                strengthEl.textContent = 'Media';
                strengthEl.className = 'text-amber-500 font-semibold';
            }
        } else {
            if (barEl) {
                barEl.style.width = '33%';
                barEl.className = 'h-full transition-all duration-300 bg-rose-500';
            }
            if (strengthEl) {
                strengthEl.textContent = 'Insegura';
                strengthEl.className = 'text-rose-500 font-semibold';
            }
        }

        return score === 3;
    }

    const regSecElements = {
        lenEl: document.getElementById('req-reg-len'),
        numEl: document.getElementById('req-reg-num'),
        specEl: document.getElementById('req-reg-spec'),
        barEl: document.getElementById('reg-pass-bar'),
        strengthEl: document.getElementById('reg-pass-strength')
    };

    const recSecElements = {
        lenEl: document.getElementById('req-rec-len'),
        numEl: document.getElementById('req-rec-num'),
        specEl: document.getElementById('req-rec-spec'),
        barEl: document.getElementById('rec-pass-bar'),
        strengthEl: document.getElementById('rec-pass-strength')
    };

    if (regPassword) {
        regPassword.addEventListener('input', () => {
            evaluatePasswordSecurity(regPassword.value, regSecElements);
        });
    }

    if (recPassword) {
        recPassword.addEventListener('input', () => {
            evaluatePasswordSecurity(recPassword.value, recSecElements);
        });
    }

    // ==========================================
    // VISIBILIDAD DE CONTRASEÑAS (OJO 👁️)
    // ==========================================
    function setupPasswordToggle(button, input) {
        if (!button || !input) return;
        button.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye', !isPassword);
                icon.classList.toggle('fa-eye-slash', isPassword);
            }
        });
    }

    setupPasswordToggle(btnToggleLoginPass, loginPassword);
    setupPasswordToggle(btnToggleRegPass, regPassword);
    setupPasswordToggle(btnToggleRecPass, recPassword);
    setupPasswordToggle(btnToggleRecPassConfirm, recPasswordConfirm);

    // ==========================================
    // GESTIÓN DE AUTENTICACIÓN Y SESIÓN (Portal de Acceso)
    // ==========================================
    // currentUser se inicializa al inicio de DOMContentLoaded

    function updateAuthUI() {
        if (currentUser) {
            const isAdmin = currentUser.rol === 'admin';

            if (authPortal) authPortal.classList.add('hidden');
            if (appDashboard) appDashboard.classList.remove('hidden');
            if (authUserContainer) authUserContainer.classList.remove('hidden');
            if (authUserName) authUserName.textContent = currentUser.nombre;
            if (authUserAvatar) authUserAvatar.textContent = (currentUser.nombre || 'U').charAt(0).toUpperCase();
            if (authUserLoansBadge) authUserLoansBadge.textContent = `${currentUser.libros_activos || 0}/3 libros activos`;
            
            const authUserRoleBadge = document.getElementById('auth-user-role-badge');
            if (authUserRoleBadge) {
                if (isAdmin) {
                    authUserRoleBadge.textContent = '👑 Admin';
                    authUserRoleBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200';
                } else {
                    authUserRoleBadge.textContent = '📖 Lector';
                    authUserRoleBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200';
                }
            }

            // Alternar elementos exclusivos de Administrador
            document.querySelectorAll('.admin-only').forEach(el => {
                if (isAdmin) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });

            // Ajustar etiquetas y enlaces de tarjetas de estadísticas según el rol
            const statLabelUsers = document.getElementById('stat-label-users');
            const statLinkUsers = document.getElementById('stat-link-users');
            const statLabelLoans = document.getElementById('stat-label-loans');
            const statLinkLoans = document.getElementById('stat-link-loans');

            if (isAdmin) {
                if (statLabelUsers) statLabelUsers.textContent = 'Usuarios Activos';
                if (statLinkUsers) statLinkUsers.textContent = 'Ver lectores →';
                if (statTotalUsers && usersList) statTotalUsers.textContent = usersList.length;
                if (statLabelLoans) statLabelLoans.textContent = 'Préstamos en Curso';
                if (statLinkLoans) statLinkLoans.textContent = 'Gestionar préstamos →';
            } else {
                if (statLabelUsers) statLabelUsers.textContent = 'Mi Cuenta';
                if (statLinkUsers) statLinkUsers.textContent = 'Mis préstamos activos →';
                if (statTotalUsers) statTotalUsers.textContent = `${currentUser.libros_activos || 0}/3`;
                if (statLabelLoans) statLabelLoans.textContent = 'Mis Préstamos';
                if (statLinkLoans) statLinkLoans.textContent = 'Ver mis préstamos →';
            }

            // Sincronizar usuario activo seleccionado
            if (activeUserSelect) {
                activeUserSelect.value = currentUser.id_usuario;
            }

            if (commentAuthorName) {
                commentAuthorName.textContent = `Publicando como ${currentUser.nombre}`;
            }

            loadUserRecentBooks();
            loadUserFavorites().then(() => updateCollectionCounts());
        } else {
            if (commentAuthorName) {
                commentAuthorName.textContent = 'Inicia sesión para comentar';
            }
            if (appDashboard) appDashboard.classList.add('hidden');
            if (authPortal) authPortal.classList.remove('hidden');
            if (authUserContainer) authUserContainer.classList.add('hidden');

            userFavorites.clear();
            userRecentBookIds = [];

            // Recordar usuario si existe guardado
            const remembered = localStorage.getItem('mebytech_remember_email');
            if (remembered && loginEmail) {
                loginEmail.value = remembered;
                if (loginRememberMe) loginRememberMe.checked = true;
            }
        }
    }

    // Pestañas y navegación entre formularios (Login / Register / Recover)
    function switchToLogin() {
        if (formLogin && formRegister && formRecover && tabLogin && tabRegister && authTabsContainer) {
            formLogin.classList.remove('hidden');
            formRegister.classList.add('hidden');
            formRecover.classList.add('hidden');
            authTabsContainer.classList.remove('hidden');
            tabLogin.className = 'flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition-all';
            tabRegister.className = 'flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl text-slate-500 hover:text-slate-800 transition-all';
        }
    }

    function switchToRegister() {
        if (formLogin && formRegister && formRecover && tabLogin && tabRegister && authTabsContainer) {
            formLogin.classList.add('hidden');
            formRegister.classList.remove('hidden');
            formRecover.classList.add('hidden');
            authTabsContainer.classList.remove('hidden');
            tabRegister.className = 'flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white text-emerald-600 shadow-sm transition-all';
            tabLogin.className = 'flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl text-slate-500 hover:text-slate-800 transition-all';
        }
    }

    function switchToRecover() {
        if (formLogin && formRegister && formRecover && authTabsContainer) {
            formLogin.classList.add('hidden');
            formRegister.classList.add('hidden');
            formRecover.classList.remove('hidden');
            authTabsContainer.classList.add('hidden');
            if (loginEmail && recEmail && loginEmail.value.trim()) {
                recEmail.value = loginEmail.value.trim();
            }
            if (recPassword) recPassword.value = '';
            if (recPasswordConfirm) recPasswordConfirm.value = '';
            evaluatePasswordSecurity('', recSecElements);
        }
    }

    if (tabLogin) tabLogin.addEventListener('click', switchToLogin);
    if (tabRegister) tabRegister.addEventListener('click', switchToRegister);
    if (linkToRegister) linkToRegister.addEventListener('click', switchToRegister);
    if (linkToLogin) linkToLogin.addEventListener('click', switchToLogin);
    if (linkToRecover) linkToRecover.addEventListener('click', switchToRecover);
    if (btnBackFromRecover) btnBackFromRecover.addEventListener('click', switchToLogin);
    if (linkRecoverToLogin) linkRecoverToLogin.addEventListener('click', switchToLogin);

    // Botón de rellenar credenciales Demo Administrador
    if (btnFillAdmin) {
        btnFillAdmin.addEventListener('click', () => {
            if (loginEmail) loginEmail.value = 'admin@mebytech.com';
            if (loginPassword) loginPassword.value = 'admin123';
            showToast('Credenciales de administrador completadas', 'info');
        });
    }

    // Submit Iniciar Sesión (con Recordar Usuario)
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailVal = loginEmail ? loginEmail.value.trim().toLowerCase() : '';
            const passVal = loginPassword ? loginPassword.value : '';

            if (!emailVal || !passVal) {
                showToast('Por favor ingrese su correo y contraseña', 'warning');
                return;
            }

            const payload = {
                correo: emailVal,
                password: passVal
            };

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (res.ok) {
                    currentUser = data.usuario;
                    localStorage.setItem('mebytech_auth_user', JSON.stringify(currentUser));

                    // Guardar o eliminar correo recordado
                    if (loginRememberMe && loginRememberMe.checked) {
                        localStorage.setItem('mebytech_remember_email', emailVal);
                    } else {
                        localStorage.removeItem('mebytech_remember_email');
                    }

                    showToast(data.message || `¡Bienvenido de nuevo, ${currentUser.nombre}!`, 'success');
                    updateAuthUI();

                    try {
                        await Promise.all([
                            loadAuthors(),
                            loadGenres(),
                            loadUsers(),
                            updateLoansStat()
                        ]);
                        await fetchBooks();
                    } catch (catalogoErr) {
                        console.error('Error cargando catálogos:', catalogoErr);
                    }
                } else {
                    showToast(data.message || 'Correo o contraseña incorrectos. Verifique sus credenciales.', 'error');
                }
            } catch (err) {
                console.error('Error de conexión en login:', err);
                showToast('Error de conexión con el servidor', 'error');
            }
        });
    }

    // Submit Registro desde Auth Portal
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameVal = regName ? regName.value.trim() : '';
            const emailVal = regEmail ? regEmail.value.trim().toLowerCase() : '';
            const passVal = regPassword ? regPassword.value : '';

            if (!nameVal || !emailVal || !passVal) {
                showToast('Por favor completa todos los campos para registrarte', 'warning');
                return;
            }

            if (!evaluatePasswordSecurity(passVal, regSecElements)) {
                showToast("La contraseña debe incluir al menos 6 caracteres, 1 número y 1 carácter especial", "warning");
                return;
            }

            const payload = {
                nombre: nameVal,
                correo: emailVal,
                password: passVal
            };

            try {
                const res = await fetch('/api/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (res.status === 201) {
                    currentUser = data;
                    localStorage.setItem('mebytech_auth_user', JSON.stringify(currentUser));
                    showToast(`¡Bienvenido, ${data.nombre}! Cuenta creada con éxito`, 'success');
                    updateAuthUI();

                    try {
                        await Promise.all([
                            loadAuthors(),
                            loadGenres(),
                            loadUsers(),
                            updateLoansStat()
                        ]);
                        await fetchBooks();
                    } catch (catalogoErr) {
                        console.error('Error cargando catálogos:', catalogoErr);
                    }
                } else if (res.status === 409) {
                    showToast(data.message || 'El correo ya está registrado', 'warning');
                } else {
                    showToast(data.message || 'Error al registrar usuario', 'error');
                }
            } catch (err) {
                console.error('Error de conexión en registro:', err);
                showToast('Error de conexión con el servidor', 'error');
            }
        });
    }

    // Submit Recuperación de Contraseña
    if (formRecover) {
        formRecover.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailVal = recEmail.value.trim().toLowerCase();
            const passVal = recPassword.value;
            const confirmVal = recPasswordConfirm.value;

            if (passVal !== confirmVal) {
                showToast("Las contraseñas no coinciden. Verifícalas.", "error");
                return;
            }

            if (!evaluatePasswordSecurity(passVal, recSecElements)) {
                showToast("La nueva contraseña debe tener mínimo 6 caracteres, 1 número y 1 carácter especial", "warning");
                return;
            }

            try {
                const res = await fetch('/api/auth/recuperar-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        correo: emailVal,
                        nueva_password: passVal
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || "Contraseña restablecida exitosamente", "success");
                    switchToLogin();
                    if (loginEmail) loginEmail.value = emailVal;
                    if (loginPassword) loginPassword.value = '';
                } else {
                    showToast(data.message || "Error al restablecer contraseña", "error");
                }
            } catch (err) {
                showToast("Error de conexión con el servidor", "error");
            }
        });
    }

    // Cerrar sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('mebytech_auth_user');
            showToast('Sesión cerrada con éxito', 'info');
            updateAuthUI();
        });
    }

    // ==========================================
    // INICIALIZACIÓN DE LA APLICACIÓN
    // ==========================================
    async function initApp() {
        try {
            // Cargar correo recordado si existe
            const remembered = localStorage.getItem('mebytech_remember_email');
            if (remembered && loginEmail) {
                loginEmail.value = remembered;
                if (loginRememberMe) loginRememberMe.checked = true;
            }

            updateAuthUI();

            if (currentUser) {
                await Promise.all([
                    loadAuthors(),
                    loadGenres(),
                    loadUsers(),
                    updateLoansStat()
                ]);
                await fetchBooks();
            }
        } catch (initErr) {
            console.error('Error al inicializar la app:', initErr);
        }
    }

    initApp();
});
