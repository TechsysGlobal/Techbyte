// ─── TechByte Admin — Client-Side Interactions ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // ─── Image Preview ──────────────────────────────────────────────────────
    const imageInput = document.getElementById('imageInput');
    const preview = document.getElementById('imagePreview');

    if (imageInput && preview) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.innerHTML = `<img src="${ev.target.result}" style="max-width:120px;border-radius:12px;border:1px solid rgba(0,0,0,0.06)">`;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ─── File Upload Wrappers ────────────────────────────────────────────────
    document.querySelectorAll('.file-upload-wrapper').forEach(wrapper => {
        const input = wrapper.querySelector('.file-input-hidden');
        const nameSpan = wrapper.querySelector('.file-name');
        const clearBtn = wrapper.querySelector('.file-clear-btn');

        if (input && nameSpan && clearBtn) {
            input.addEventListener('change', () => {
                if (input.files.length > 0) {
                    nameSpan.textContent = input.files[0].name;
                    clearBtn.style.display = 'inline';
                } else {
                    nameSpan.textContent = '';
                    clearBtn.style.display = 'none';
                }
            });

            clearBtn.addEventListener('click', () => {
                input.value = '';
                nameSpan.textContent = '';
                clearBtn.style.display = 'none';
            });
        }
    });

    // ─── Sidebar Toggle (Mobile) ────────────────────────────────────────────
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.sidebar-toggle');

    if (sidebar && toggle) {
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // ─── Page Load Animation ────────────────────────────────────────────────
    const cards = document.querySelectorAll('.card, .stat-card, .brand-card, .discount-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        card.style.transition = `opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) ${i * 0.05}s, transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) ${i * 0.05}s`;
        requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });

    // ─── Confirm Dialogs ────────────────────────────────────────────────────
    // Handled via onsubmit in forms

    // ─── Customer Drawer ────────────────────────────────────────────────────
    const overlay = document.getElementById('customerOverlay');
    // Handle customer row click
    const customerTable = document.querySelector('.data-table tbody');
    if (customerTable) {
        customerTable.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons or links
            if (e.target.closest('.actions') || e.target.closest('a') || e.target.closest('button')) {
                return;
            }

            const row = e.target.closest('.customer-row');
            if (row) {
                const customerId = row.dataset.id;
                if (customerId) {
                    openCustomerDrawer(customerId);
                }
            }
        });
    }

    const drawer = document.getElementById('customerDrawer');
    const customerLinks = document.querySelectorAll('.customer-link');

    if (overlay && drawer) {
        const closeDrawer = () => {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        };

        customerLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const customerId = link.getAttribute('data-id');

                // Clear previous content & show loading
                drawer.innerHTML = `
                    <div class="drawer-header">
                        <h2>Loading...</h2>
                        <button class="drawer-close">&times;</button>
                    </div>
                    <div class="drawer-content" style="text-align:center;padding:100px;">
                        <span style="font-size:14px;color:var(--text-muted);">Please wait while we fetch customer details...</span>
                    </div>
                `;

                drawer.classList.add('open');
                overlay.classList.add('open');
                document.body.style.overflow = 'hidden';

                try {
                    const response = await fetch(`/admin/customers/${customerId}?ajax=true`);
                    if (!response.ok) throw new Error('Failed to fetch details');
                    const html = await response.text();
                    drawer.innerHTML = html;

                    // Re-bind close button
                    const closeBtn = drawer.querySelector('.drawer-close');
                    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
                } catch (err) {
                    console.error('Drawer Error:', err);
                    drawer.innerHTML = `
                        <div class="drawer-header">
                            <h2>Error</h2>
                            <button class="drawer-close">&times;</button>
                        </div>
                        <div class="drawer-content">
                            <p class="text-danger">Failed to load customer details. Profile ID: ${customerId}</p>
                        </div>
                    `;
                    const closeBtn = drawer.querySelector('.drawer-close');
                    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
                }
            });
        });

        overlay.addEventListener('click', closeDrawer);
    }

    // ─── Clear URL Query Params (error/msg) ──────────────────────────────────
    // This prevents messages from persisting on page reload
    const url = new URL(window.location.href);
    if (url.searchParams.has('error') || url.searchParams.has('msg')) {
        url.searchParams.delete('error');
        url.searchParams.delete('msg');
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }
});
