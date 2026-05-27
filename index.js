// Consts
const apikey = "e950e51d5d49e85f7c2f17f01eb23ba3";
const apiEndpoint = "https://api.themoviedb.org/3"
const imgPath = "https://image.tmdb.org/t/p/original";


const apiPaths = {
    fetchAllCategories: `${apiEndpoint}/genre/movie/list?api_key=${apikey}`,
    fetchMoviesList: (id) => `${apiEndpoint}/discover/movie?api_key=${apikey}&with_genres=${id}`,
    fetchTrending:`${apiEndpoint}/trending/all/day?api_key=${apikey}&language=en-US`,
    // NEW: TMDB video endpoint (uses your existing API key)
    fetchMovieVideos: (id) => `${apiEndpoint}/movie/${id}/videos?api_key=${apikey}`,
    fetchTVVideos: (id) => `${apiEndpoint}/tv/${id}/videos?api_key=${apikey}`
}


// Boots up the app
function init() {
    fetchTrendingMovies();
    fetchAndBuildAllSections();
}

function fetchTrendingMovies(){
    fetchAndbuildMovieSection(apiPaths.fetchTrending, 'Trending Now')
    .then(list => {
        const randomIndex = parseInt(Math.random() * list.length);
        buildBannerSection(list[randomIndex]);
    }).catch(err=>{
        console.error(err);
    });
}

function buildBannerSection(movie){
    const bannerCont = document.getElementById('banner-section');

    bannerCont.style.backgroundImage = `url('${imgPath}${movie.backdrop_path}')`;

    const div = document.createElement('div');

    div.innerHTML = `
            <h2 class="banner__title">${movie.title}</h2>
            <p class="banner__info">Trending in movies | Released - ${movie.release_date} </p>
            <p class="banner__overview">${movie.overview && movie.overview.length > 200 ? movie.overview.slice(0,200).trim()+ '...':movie.overview}</p>
            <div class="action-buttons-cont">
                <button class="action-button play-trailer-btn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="Hawkins-Icon Hawkins-Icon-Standard"><path d="M4 2.69127C4 1.93067 4.81547 1.44851 5.48192 1.81506L22.4069 11.1238C23.0977 11.5037 23.0977 12.4963 22.4069 12.8762L5.48192 22.1849C4.81546 22.5515 4 22.0693 4 21.3087V2.69127Z" fill="currentColor"></path></svg> &nbsp;&nbsp; Play</button>
                <button class="action-button"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="Hawkins-Icon Hawkins-Icon-Standard"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM13 10V18H11V10H13ZM12 8.5C12.8284 8.5 13.5 7.82843 13.5 7C13.5 6.17157 12.8284 5.5 12 5.5C11.1716 5.5 10.5 6.17157 10.5 7C10.5 7.82843 11.1716 8.5 12 8.5Z" fill="currentColor"></path></svg> &nbsp;&nbsp; More Info</button>
            </div>
        `;
    div.className = "banner-content container";

    bannerCont.append(div);
    
    // FIX: Add click handler for play button in banner
    const playBtn = bannerCont.querySelector('.play-trailer-btn');
    if (playBtn) {
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playTrailerFromMovie(movie);
        });
    }
}


function fetchAndBuildAllSections(){
    fetch(apiPaths.fetchAllCategories)
    .then(res => res.json())
    .then(res => {
        const categories = res.genres;
        if (Array.isArray(categories) && categories.length) {
            categories.forEach(category => {
                fetchAndbuildMovieSection(
                    apiPaths.fetchMoviesList(category.id),
                    category.name
                );
            });
        }
    })
    .catch(err=>console.error(err));
}

function fetchAndbuildMovieSection(fetchUrl, categoryName){
    console.log(fetchUrl,categoryName);
    return fetch(fetchUrl)
    .then(res => res.json())
    .then(res => {
        const movies = res.results;
        if (Array.isArray(movies) && movies.length) {
            buildMoviesSection(movies.slice(0,6), categoryName);
        }
        return movies;
    })
    .catch(err=>console.error(err))
}

function buildMoviesSection(list, categoryName){
    console.log(list, categoryName);

    const moviesCont = document.getElementById('movies-cont');

    const moviesListHTML = list.map(item => {
        return `
        <div class="movie-item" data-movie-id="${item.id}" data-movie-title="${item.title}" data-movie-type="movie">
            <img decoding="async" class="move-item-img" src="${imgPath}${item.backdrop_path}" alt="${item.title}" />
            <div class="iframe-wrap" id="yt${item.id}"></div>
        </div>`;
    }).join('');

    const moviesSectionHTML = `
        <h2 class="movie-section-heading">${categoryName} <span class="explore-nudge">Explore All</span></span></h2>
        <div class="movies-row">
            ${moviesListHTML}
        </div>
    `

    const div = document.createElement('div');
    div.className = "movies-section"
    div.innerHTML = moviesSectionHTML;

    moviesCont.append(div);
    
    // FIX: Add click handlers to movie items
    const movieItems = div.querySelectorAll('.movie-item');
    movieItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const movieId = item.getAttribute('data-movie-id');
            const movieTitle = item.getAttribute('data-movie-title');
            if (movieId) {
                playTrailer(movieId, movieTitle);
            }
        });
    });
}

// NEW FUNCTION: Get trailer from TMDB (uses your existing API key)
async function getTrailerFromTMDB(movieId, type = 'movie') {
    const url = type === 'tv' ? apiPaths.fetchTVVideos(movieId) : apiPaths.fetchMovieVideos(movieId);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const videos = data.results || [];
        
        // Look for official trailer
        let trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube");
        if (!trailer) trailer = videos.find(v => v.site === "YouTube");
        
        return trailer ? trailer.key : null;
    } catch (error) {
        console.error("Error fetching trailer:", error);
        return null;
    }
}

// NEW FUNCTION: Play trailer
async function playTrailer(movieId, movieTitle) {
    const videoId = await getTrailerFromTMDB(movieId);
    
    if (videoId) {
        // Open trailer in a new window - simple and always works
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    } else {
        // Fallback: search YouTube
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + " official trailer")}`, '_blank');
    }
}

// NEW FUNCTION: Play trailer from movie object (for banner)
async function playTrailerFromMovie(movie) {
    const movieId = movie.id;
    const movieTitle = movie.title || movie.name;
    const isTV = !!movie.first_air_date;
    const videoId = await getTrailerFromTMDB(movieId, isTV ? 'tv' : 'movie');
    
    if (videoId) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    } else {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + " official trailer")}`, '_blank');
    }
}

// Keep your original searchMovieTrailer function but make it work
function searchMovieTrailer(movieName, iframId) {
    if (!movieName) return;
    
    // Just open in new tab instead of trying to embed
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movieName + " official trailer")}`, '_blank');
}

window.addEventListener('load',function() {
    init();
    window.addEventListener('scroll', function(){
        const header = document.getElementById('header');
        if (window.scrollY > 5) header.classList.add('black-bg')
        else header.classList.remove('black-bg');
    });
})