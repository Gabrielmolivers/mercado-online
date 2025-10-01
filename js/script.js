const searchForm = document.querySelector('.search-form');

document.querySelector('#search-btn').onclick = () => {
    searchForm.classList.add('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.focus();
    }
};
// Redireciona ao submeter o formulário de busca
if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const searchBox = document.getElementById('search-box');
        if (searchBox) {
            const termo = searchBox.value.trim();
            if (termo) {
                window.location.href = `produtos.html?search=${encodeURIComponent(termo)}`;
                searchBox.value = '';
            } else {
                searchBox.value = '';
                searchBox.focus();
            }
        }
    });
}

let shoppingCart = document.querySelector('.shopping-cart');

document.querySelector('#cart-btn').onclick = () => {
    shoppingCart.classList.toggle('active');
    searchForm.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
};

let loginForm = document.querySelector('.login-form');
document.querySelector('#login-btn').onclick = () => {
    if (loginForm) {
        loginForm.classList.toggle('active');
    }
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    navbar.classList.remove('active');
};

let navbar = document.querySelector('.navbar');

document.querySelector('#menu-btn').onclick = () => {
    navbar.classList.toggle('active');
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
};

window.onscroll = () => {
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
}



if (typeof Swiper !== 'undefined') {
    var swiper = new Swiper(".produto-slider, .categorias-slider", {
        loop: true,
        spaceBetween: 20,

        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

        autoplay: {
            delay: 7500,
            disableOnInteraction: false,
        },

        breakpoints: {
            0: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 3,
            },
            1020: {
                slidesPerView: 4,
            },
            1240: {
                slidesPerView: 5,
            },
        }
    });
}

// Função para conectar ao banco Firebird
function conectarBanco() {
    fetch('/api/conectar')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(err => alert('Erro: ' + err));
}


// Adiciona eventos aos botões
window.addEventListener('DOMContentLoaded', function() {
    var btnConectar = document.getElementById('btn-conectar');
    if (btnConectar) btnConectar.addEventListener('click', conectarBanco);
    
});



