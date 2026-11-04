document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.getElementById("category-grid");

    if (gridContainer && typeof storeCategories !== "undefined") {
        gridContainer.innerHTML = storeCategories.map(category => `
            <div class="category-card">
                <div class="card-img-wrap">
                    <img src="${category.image}" alt="${category.title}">
                </div>
                <div class="card-body">
                    <h3>${category.title}</h3>
                    <p>${category.description}</p>
                    <a href="${category.amazonLink}" target="_blank" rel="noopener" class="card-link">
                        View on Amazon &rarr;
                    </a>
                </div>
            </div>
        `).join('');
    }
});
