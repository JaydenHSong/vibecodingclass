const API_KEY = '6df645db66226de9144481f7f09b4878';
const API_URL = 'https://api.themoviedb.org/3';

let imgBaseUrl = '';
let posterSize = '';
let backdropSize = '';

// DOM Elements
const navbar = document.getElementById('navbar');
const banner = document.getElementById('banner');
const bannerTitle = document.getElementById('banner-title');
const bannerOverview = document.getElementById('banner-overview');
const rowPosters = document.getElementById('popular-movies');

// Initialize App
async function initApp() {
  try {
    // 1. Fetch Configuration Object
    await fetchConfig();
    
    // 2. Fetch Popular Movies
    const movies = await fetchPopularMovies();
    
    if (movies && movies.length > 0) {
      // 3. Set Banner
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      setBanner(randomMovie);
      
      // 4. Render Row
      renderMovies(movies);
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    bannerTitle.innerText = "오류가 발생했습니다.";
    bannerOverview.innerText = "영화 정보를 불러올 수 없습니다. API 키나 네트워크 연결을 확인해주세요.";
  }
}

// Fetch TMDB Configuration for Images
async function fetchConfig() {
  const res = await fetch(`${API_URL}/configuration?api_key=${API_KEY}`);
  const data = await res.json();
  
  if (data && data.images) {
    imgBaseUrl = data.images.secure_base_url;
    // W500 is good for standard posters
    posterSize = data.images.poster_sizes.includes('w500') ? 'w500' : 'original';
    // Backdrops need higher res
    backdropSize = data.images.backdrop_sizes.includes('w1280') ? 'w1280' : 'original';
  } else {
    throw new Error('Could not fetch configuration');
  }
}

// Fetch Popular Movies Details
async function fetchPopularMovies() {
  // language=ko-KR to get Korean titles and overviews where available
  const res = await fetch(`${API_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR&page=1`);
  const data = await res.json();
  return data.results;
}

// Set Banner Movie Details
function setBanner(movie) {
  bannerTitle.innerText = movie.title || movie.original_title;
  bannerOverview.innerText = truncate(movie.overview, 150) || "영화에 대한 상세 정보가 제공되지 않았습니다.";
  
  if (movie.backdrop_path) {
    const bgUrl = `${imgBaseUrl}${backdropSize}${movie.backdrop_path}`;
    banner.style.backgroundImage = `url("${bgUrl}")`;
  }
}

// Render Movie List in Row Components
function renderMovies(movies) {
  rowPosters.innerHTML = ''; // Clear loading state
  
  movies.forEach(movie => {
    if (!movie.poster_path) return; // Skip if no poster
    
    const posterDiv = document.createElement('div');
    posterDiv.className = 'poster';
    
    const img = document.createElement('img');
    img.src = `${imgBaseUrl}${posterSize}${movie.poster_path}`;
    img.alt = movie.title;
    // img.loading = 'lazy'를 제거하여 호버 시 네트워크 요청 취소(Cancelled) 문제 해결
    
    // Hover Information Overlay
    const infoDiv = document.createElement('div');
    infoDiv.className = 'poster-info';
    
    const title = movie.title || movie.original_title;
    const year = movie.release_date ? movie.release_date.split('-')[0] : '';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '';
    const overview = truncate(movie.overview, 50);

    infoDiv.innerHTML = `
      <div class="poster-info-title">${title}</div>
      <div class="poster-info-meta">
        <span class="poster-rating">★ ${rating}</span>
        <span class="poster-year">${year}</span>
      </div>
      <div class="poster-info-overview">${overview}</div>
    `;
    
    posterDiv.appendChild(img);
    posterDiv.appendChild(infoDiv);
    rowPosters.appendChild(posterDiv);
  });
}

// Truncate long texts
function truncate(str, n) {
  return str?.length > n ? str.substr(0, n - 1) + "..." : str;
}

// Navbar Scroll Effect
window.addEventListener("scroll", () => {
  if (window.scrollY > 100) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Run
document.addEventListener('DOMContentLoaded', initApp);
