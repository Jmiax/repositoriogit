/* ==========================================================================
   BYTEFORGE COMPONENTS - FRONTEND LOGIC SYSTEM
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    // Initialize all components
    initThemeManager();
    initMobileMenu();
    initMouseGlowTracker();
    initScrollReveal();
    initLiveTerminalLogs();
    cart.init();
});

/* ==========================================================================
   PERFILES DE LUZ RGB (THEME MANAGER)
   ========================================================================== */
function initThemeManager() {
    const rgbSelector = document.querySelector(".rgb-profile-selector");
    const rgbButtons = document.querySelectorAll(".rgb-btn");
    const bodyElement = document.body;

    // Load stored theme or default to cyberpunk
    const savedTheme = localStorage.getItem("byteforge-rgb-theme") || "cyberpunk";
    setTheme(savedTheme);

    rgbButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation(); // Avoid closing dropdown immediately if clicked
            const selectedTheme = btn.getAttribute("data-theme");
            setTheme(selectedTheme);
            
            // Trigger visual alert feedback
            const themeName = btn.textContent.trim();
            triggerAlert("SINC_FOTÓNICA", `Perfil RGB modificado a: ${themeName}`, "info");
        });
    });

    function setTheme(themeName) {
        // Clear previous theme classes
        bodyElement.className = bodyElement.className.replace(/\btheme-\S+/g, "");
        bodyElement.classList.add(`theme-${themeName}`);

        // Update active class in dropdown UI
        rgbButtons.forEach(btn => {
            if (btn.getAttribute("data-theme") === themeName) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Save selection
        localStorage.setItem("byteforge-rgb-theme", themeName);
    }
}

/* ==========================================================================
   MENU MÓVIL RESPONSIVO
   ========================================================================== */
function initMobileMenu() {
    const mobileToggle = document.getElementById("mobile-toggle");
    const navMenu = document.getElementById("nav-menu");
    const navbar = document.querySelector(".navbar-container");
    const navLinks = document.querySelectorAll(".nav-link");

    mobileToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        navbar.classList.toggle("active-menu");
    });

    // Close menu when clicking nav link
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("active");
            navbar.classList.remove("active-menu");

            // Update active state class manually
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        });
    });
    

    // Highlight navbar menu item on scroll (Simple Scrollspy)
    window.addEventListener("scroll", () => {
        let currentSection = "";
        const sections = document.querySelectorAll("section, main, footer");
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute("id");
            }
        });

        if (currentSection) {
            navLinks.forEach(link => {
                link.classList.remove("active");
                if (link.getAttribute("data-sec") === currentSection) {
                    link.classList.add("active");
                }
            });
        }
    });
}

/* ==========================================================================
   SEGUIMIENTO DE MOUSE (CARD COORDINATE GLOW EFFECT)
   ========================================================================== */
function initMouseGlowTracker() {
    const cards = document.querySelectorAll(".product-card");

    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position inside element
            const y = e.clientY - rect.top;  // y position inside element

            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });
}

/* ==========================================================================
   ANIMACIONES SUAVES DE CARGA AL HACER SCROLL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(".scroll-reveal");

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                // Stop observing once revealed to maintain layout performance
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Triggers slightly before elements hit viewport
    });

    revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   SISTEMA DE CARRITO DE COMPRAS INTERACTIVO
   ========================================================================== */
const cart = {
    items: [],
    promoApplied: false,
    discountRate: 0.10, // 10% promo coupon

    init() {
        // Load cart items from storage
        const savedItems = localStorage.getItem("byteforge-cart-inventory");
        if (savedItems) {
            try {
                this.items = JSON.parse(savedItems);
            } catch (err) {
                this.items = [];
            }
        }
        
        // Register Cart UI event listeners
        const trigger = document.getElementById("cart-trigger");
        const closeBtn = document.getElementById("cart-close");
        const backdrop = document.getElementById("cart-drawer-backdrop");
        const drawerPanel = document.getElementById("cart-drawer-panel");

        if (trigger && closeBtn && backdrop) {
            trigger.addEventListener("click", () => this.toggleDrawer(true));
            closeBtn.addEventListener("click", () => this.toggleDrawer(false));
            
            // Close when clicking empty backdrop space
            backdrop.addEventListener("click", (e) => {
                if (e.target === backdrop) {
                    this.toggleDrawer(false);
                }
            });
        }

        this.updateUI();
    },

    toggleDrawer(open) {
        const backdrop = document.getElementById("cart-drawer-backdrop");
        if (backdrop) {
            if (open) {
                backdrop.classList.add("active");
                document.body.style.overflow = "hidden"; // Disable background scrolling
            } else {
                backdrop.classList.remove("active");
                document.body.style.overflow = "";
            }
        }
    },

    addItem(id, name, price) {
        // Check if item already exists in the cart list
        const existingItem = this.items.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id,
                name,
                price: parseFloat(price),
                quantity: 1
            });
        }

        // Trigger dynamic audio-chime sound effect (optional/visual alert)
        triggerAlert("HARDWARE_AÑADIDO", `${name} añadido al inventario.`, "success");
        
        this.saveAndSync();
    },

    removeItem(id) {
        const itemToRemove = this.items.find(item => item.id === id);
        if (itemToRemove) {
            triggerAlert("HARDWARE_REMOVIDO", `${itemToRemove.name} retirado del inventario.`, "warning");
        }
        
        this.items = this.items.filter(item => item.id !== id);
        this.saveAndSync();
    },

    adjustQuantity(id, delta) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.quantity += delta;
            
            // Delete if quantity hits zero
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                this.saveAndSync();
            }
        }
    },

    clear(quiet = false) {
        this.items = [];
        this.promoApplied = false;
        
        // Reset promo coupon inputs
        const promoInput = document.getElementById("promo-code-input");
        if (promoInput) promoInput.value = "";

        if (!quiet) {
            triggerAlert("PURGA_HARDWARE", "Carro de hardware vaciado por completo.", "error");
        }
        
        this.saveAndSync();
    },

    saveAndSync() {
        // Persist local state
        localStorage.setItem("byteforge-cart-inventory", JSON.stringify(this.items));
        this.updateUI();
    },

    updateUI() {
        const cartBadge = document.getElementById("cart-badge-count");
        const itemsCountTag = document.getElementById("cart-drawer-items-count");
        const itemsContainer = document.getElementById("cart-items-container");
        const emptyMessage = document.getElementById("cart-empty-msg");
        
        const subtotalSpan = document.getElementById("cart-subtotal");
        const discountSpan = document.getElementById("cart-discount");
        const discountLine = document.getElementById("discount-display-line");
        const totalSpan = document.getElementById("cart-total");

        // Calculate metrics
        let totalItems = 0;
        let subtotal = 0;

        // Render products
        if (itemsContainer) {
            // Remove previous dynamically-created products
            const prevItems = itemsContainer.querySelectorAll(".cart-item");
            prevItems.forEach(el => el.remove());

            if (this.items.length === 0) {
                if (emptyMessage) emptyMessage.style.display = "flex";
            } else {
                if (emptyMessage) emptyMessage.style.display = "none";

                this.items.forEach(item => {
                    totalItems += item.quantity;
                    subtotal += item.price * item.quantity;

                    const itemDiv = document.createElement("div");
                    itemDiv.className = "cart-item";
                    itemDiv.setAttribute("data-cart-id", item.id);
                    itemDiv.innerHTML = `
                        <div class="item-main-details">
                            <span class="item-name">${item.name}</span>
                            <span class="item-sub-math">
                                ${item.quantity} x <span class="item-sub-price">$${item.price.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </span>
                        </div>
                        <div class="cart-item-right-actions">
                            <div class="qty-control-group">
                                <button class="btn-qty" onclick="cart.adjustQuantity('${item.id}', -1)" aria-label="Disminuir">-</button>
                                <span class="item-quantity-val">${item.quantity}</span>
                                <button class="btn-qty" onclick="cart.adjustQuantity('${item.id}', 1)" aria-label="Aumentar">+</button>
                            </div>
                            <button class="btn-delete-item" onclick="cart.removeItem('${item.id}')">
                                <i data-lucide="trash"></i> RETIRAR
                            </button>
                        </div>
                    `;
                    itemsContainer.appendChild(itemDiv);
                });

                // Re-initialize Lucide Icons inside the new drawer contents
                if (typeof lucide !== "undefined") {
                    lucide.createIcons({
                        attrs: {
                            class: ["lucide-sub"]
                        }
                    });
                }
            }
        }

        // Apply visual math logic
        let discount = 0;
        if (this.promoApplied) {
            discount = subtotal * this.discountRate;
            if (discountLine) discountLine.style.display = "flex";
        } else {
            if (discountLine) discountLine.style.display = "none";
        }

        const total = subtotal - discount;

        // Populate values
        if (cartBadge) cartBadge.textContent = totalItems;
        if (itemsCountTag) itemsCountTag.textContent = `${totalItems} ${totalItems === 1 ? 'ITEM' : 'ITEMS'}`;
        if (subtotalSpan) subtotalSpan.textContent = `$${subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
        if (discountSpan) discountSpan.textContent = `-$${discount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
        if (totalSpan) totalSpan.textContent = `$${total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
    }
};

/* ==========================================================================
   CÓDIGOS DE CUPÓN & PROTOCOLO PROMO
   ========================================================================== */
function applyPromoCode() {
    const input = document.getElementById("promo-code-input");
    if (!input) return;

    const code = input.value.trim().toUpperCase();

    if (cart.items.length === 0) {
        triggerAlert("ERROR_APLICACIÓN", "Añade hardware al carro antes de aplicar códigos.", "error");
        return;
    }

    if (code === "SYNC_OVERCLOCK_2026") {
        if (cart.promoApplied) {
            triggerAlert("PROTOCOLO_DUPLICADO", "El descuento overclock ya se encuentra cargado.", "warning");
        } else {
            cart.promoApplied = true;
            cart.saveAndSync();
            triggerAlert("DESCUENTO_AUTORIZADO", "Protocolo SYNC_OVERCLOCK_2026 activado: 10% OFF.", "success");
        }
    } else {
        triggerAlert("PROTOCOLO_INVALIDO", "Firma criptográfica de cupón incorrecta.", "error");
    }
}

/* ==========================================================================
   CIERRE DE COMPRA / CHECKOUT SIMULADO (HIGH-TECH PROGRESS LOADER)
   ========================================================================== */
function checkoutCart() {
    if (cart.items.length === 0) {
        triggerAlert("CÓDIGO_VACÍO", "La lista de forja está vacía. Añade componentes.", "error");
        return;
    }

    const overlay = document.getElementById("checkout-overlay");
    const progressFill = document.getElementById("checkout-progress");
    const loaderText = document.querySelector(".loader-box h3");
    const loaderSubText = document.querySelector(".loader-box p");

    if (!overlay || !progressFill) return;

    // Show high tech scanning sequence
    overlay.classList.add("active");
    cart.toggleDrawer(false); // Close cart drawer
    
    let progress = 0;
    progressFill.style.width = "0%";
    progressFill.textContent = "0%";
    loaderText.textContent = "CONECTANDO CON EL NÚCLEO DE LA BLOCKCHAIN...";
    loaderSubText.textContent = "Enlazando bus cuántico de pago...";

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 4;
        if (progress > 100) progress = 100;

        progressFill.style.width = `${progress}%`;
        progressFill.textContent = `${progress}%`;

        // Update technical feedback text matching checkpoints
        if (progress >= 25 && progress < 55) {
            loaderText.textContent = "VERIFICANDO ASIGNACIÓN DE HARDWARE...";
            loaderSubText.textContent = "Apartando stock de silicio en los almacenes centrales...";
        } else if (progress >= 55 && progress < 85) {
            loaderText.textContent = "APLICANDO ENCRIPTACIÓN DE FASES SSL-9...";
            loaderSubText.textContent = "Firmando contrato inteligente de forja gamer...";
        } else if (progress >= 85 && progress < 100) {
            loaderText.textContent = "CONFIRMANDO TRANSFERENCIA DE CRÉDITOS...";
            loaderSubText.textContent = "Enrutamiento del bus local verificado con éxito...";
        } else if (progress === 100) {
            clearInterval(interval);
            
            // Complete process
            setTimeout(() => {
                overlay.classList.remove("active");
                
                // Clear state
                cart.clear(true); 
                
                // Visual feedback alert
                triggerAlert("FORJA_INICIADA", "¡Setup sincronizado! Tu pedido ha sido enviado al taller de forja.", "success");
            }, 800);
        }
    }, 150);
}

/* ==========================================================================
   CENTRO DE NOTIFICACIONES COMPATIBLE CON HOLOGRAMA
   ========================================================================== */
function triggerAlert(title, message, type = "success") {
    const center = document.getElementById("notification-center");
    if (!center) return;

    // Map categories to glowing hues
    let iconName = "check-circle";
    let colorHex = "#00f2fe"; // Info (Cyan)

    if (type === "success") {
        iconName = "check-circle";
        colorHex = "var(--primary)";
    } else if (type === "warning") {
        iconName = "alert-triangle";
        colorHex = "var(--secondary)";
    } else if (type === "error") {
        iconName = "x-circle";
        colorHex = "#ff003c";
    } else if (type === "info") {
        iconName = "terminal";
        colorHex = "var(--accent)";
    }

    const alertCard = document.createElement("div");
    alertCard.className = "cyber-alert";
    alertCard.style.setProperty("--alert-color", colorHex);
    alertCard.innerHTML = `
        <i data-lucide="${iconName}" class="alert-icon"></i>
        <div class="alert-content">
            <div class="alert-title">${title}</div>
            <div class="alert-message">${message}</div>
        </div>
    `;

    center.appendChild(alertCard);

    // Initial lucide creation inside the single alert card
    if (typeof lucide !== "undefined") {
        lucide.createIcons({
            attrs: {
                class: ["lucide-sub"]
            }
        });
    }

    // Auto delete sequence
    const duration = 4000;
    
    setTimeout(() => {
        alertCard.classList.add("removing");
        alertCard.addEventListener("animationend", () => {
            alertCard.remove();
        });
    }, duration);
}

/* Helper function for contact form dynamic alerts */
function triggerContactAlert() {
    const name = document.getElementById("form-name").value;
    const form = document.getElementById("contact-form");
    
    triggerAlert("INFORME_REGISTRADO", `Ingeniero contactado. Traspaso de datos exitoso, ${name}.`, "success");
    if (form) form.reset();
}

/* ==========================================================================
   FEED DE HACKER TERMINAL LOGS EN FOOTER (DURACIÓN DE SESIÓN)
   ========================================================================== */
function initLiveTerminalLogs() {
    const logsWindow = document.getElementById("terminal-logs");
    if (!logsWindow) return;

    // Array of funny sci-fi hardware messages
    const logPool = [
        "COOLING: Bomba de agua ajustada a 2400 RPM.",
        "CPU_TEMP: Frecuencia estable a 5.4 GHz. Núcleos a 38°C.",
        "RGB_SYNC: Modulación de espectros a 240 fps.",
        "MEM_LATENCY: Latencia DDR5 optimizada en canal dual.",
        "SYS_BUS: Ancho de banda NVMe Gen5 funcionando a 12,400 MB/s.",
        "POWER: Fases VRM estables con modulación PWM a 98%.",
        "SECURITY: Escudo antimagnético de chasis: CARGADO.",
        "GPU_CORE: Trazado de rayos en buffer local: 0.1ms latencia.",
        "NODE_STATUS: Conectividad con la grid central del silicio estable."
    ];

    setInterval(() => {
        // Build mock time
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `[${hrs}:${mins}:${secs}]`;

        // Pick random logs
        const randomLog = logPool[Math.floor(Math.random() * logPool.length)];

        // Append line
        const newLine = document.createElement("div");
        newLine.className = "log-line";
        newLine.innerHTML = `<span class="log-time">${timestamp}</span> ${randomLog}`;
        logsWindow.appendChild(newLine);

        // Limit lines to 10 to prevent resource leaks
        const currentLines = logsWindow.querySelectorAll(".log-line");
        if (currentLines.length > 10) {
            currentLines[0].remove();
        }

        // Scroll to bottom
        logsWindow.scrollTop = logsWindow.scrollHeight;
    }, 4500);
}
