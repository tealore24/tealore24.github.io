document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  
  const colorBlocks = document.querySelectorAll('.color-block');
  const STORAGE_KEY = 'fastfetch-accent-color';

  const savedColor = localStorage.getItem(STORAGE_KEY);
  if (savedColor) root.style.setProperty('--accent-color', savedColor);

  colorBlocks.forEach((block) => {
    block.addEventListener('click', () => {
      const computedColor = window.getComputedStyle(block).backgroundColor;
      root.style.setProperty('--accent-color', computedColor);
      localStorage.setItem(STORAGE_KEY, computedColor);
    });
  });

  const playlist = [
  	{
      title: "afterglow",
      artist: "tealxre, violetssky, alxrawrie, Y0zuru",
      file: "./audio/afterglow.m4a",
      cover: "./images/afterglow.jpg"
    },
    {
      title: "BLOOM",
      artist: "tealxre",
      file: "./audio/BLOOM.m4a",
      cover: "./images/BLOOM.jpg"
    },
    {
      title: "DENSITY",
      artist: "tealxre",
      file: "./audio/DENSITY.m4a",
      cover: "./images/DENSITY.jpg"
    },
    {
      title: "falling stars",
      artist: "tealxre",
      file: "./audio/falling_stars.m4a",
      cover: "./images/DEPTH_BUFFER.jpg"
    },
    {
      title: "can birds dive into color?",
      artist: "tealxre",
      file: "./audio/can_birds_dive_into_color.m4a",
      cover: "./images/DEPTH_BUFFER.jpg"
    },
    {
      title: "vivid shadows",
      artist: "tealxre",
      file: "./audio/vivid_shadows.m4a",
      cover: "./images/DEPTH_BUFFER.jpg"
    },
    {
      title: "PRESSURE",
      artist: "tealxre, Meandr",
      file: "./audio/PRESSURE.m4a",
      cover: "./images/PRESSURE.jpg"
    },
    {
      title: "parallax numbers",
      artist: "tealxre",
      file: "./audio/parallax_numbers.m4a",
      cover: "./images/parallax_numbers.jpg"
    }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;
  const audio = new Audio();

  const elCover = document.getElementById('track-cover');
  const elTitle = document.getElementById('track-title');
  const elArtist = document.getElementById('track-artist');
  const elPlayBtn = document.getElementById('btn-play');
  const elPrevBtn = document.getElementById('btn-prev');
  const elNextBtn = document.getElementById('btn-next');
  const elProgressContainer = document.getElementById('progress-container');
  const elProgressFill = document.getElementById('progress-fill');
  const elTimeCurrent = document.getElementById('time-current');
  const elTimeTotal = document.getElementById('time-total');
  
  let audioCtx, analyser, source;
  const canvas = document.getElementById('cava-visualizer');
  const ctx = canvas.getContext('2d');
  let isVisualizerInit = false;

  function initVisualizer() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; 
      
      source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      
      drawVisualizer();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isVisualizerInit = true;
  }

  function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    // --- High-DPI / Retina Fix ---
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    const targetWidth = Math.floor(displayWidth * dpr);
    const targetHeight = Math.floor(displayHeight * dpr);

    // Ресайзим буфер холста ТОЛЬКО при реальном изменении размера (экономит ресурсы)
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#ffb2fe';
    ctx.fillStyle = accentColor;

    // Срезаем пустой хвост m4a
    const numBars = Math.floor(bufferLength * 0.55); 
    
    // Масштабируем межпиксельный зазор пропорционально плотности экрана
    const gap = Math.round(2 * dpr); 
    
    const totalGaps = gap * (numBars - 1);
    const barWidth = (canvas.width - totalGaps) / numBars;
    let x = 0;

    for (let i = 0; i < numBars; i++) {
      let val = dataArray[i] / 255;

      // Spectral Gate: отрезаем монолитный низ
      const spectralGateThreshold = 0.5;
      if (val < spectralGateThreshold) {
        val = 0;
      } else {
        val = (val - spectralGateThreshold) / (1 - spectralGateThreshold);
        val = Math.pow(val, 3.0);
      }

      // Частотная коррекция
      let eqMultiplier = 1;
      if (i < 4) {
        eqMultiplier = 0.7 + (i * 0.06); 
      } else {
        eqMultiplier = 1.0 + ((i - 4) / numBars) * 1.3; 
      }
      
      val = val * eqMultiplier;

      // Аналоговый софт-клиппинг (tanh)
      val = Math.tanh(val * 2.0); 

      const barHeight = val * canvas.height;
      const y = canvas.height - barHeight;
      
      // Pixel Snapping: принудительная подгонка под целые физические пиксели матрицы
      const roundedX = Math.round(x);
      const roundedY = Math.round(y);
      const roundedWidth = Math.round(x + barWidth) - roundedX;
      const roundedHeight = Math.round(barHeight);

      ctx.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
      
      x += barWidth + gap;
    }
  }
  
  elPlayBtn.style.order = '1';
  elPrevBtn.style.order = '2';
  elNextBtn.style.order = '3';

  function loadTrack(index) {
    if (playlist.length === 0) return;
    const track = playlist[index];
    audio.src = track.file;
    elTitle.innerText = track.title;
    elArtist.innerText = track.artist;
    elCover.src = track.cover;
    
    elProgressFill.style.width = '0%';
    elTimeCurrent.innerText = '0:00';
    elTimeTotal.innerText = '0:00';
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function togglePlay() {
    if (playlist.length === 0) return;
    
    if (!isVisualizerInit) {
      initVisualizer(); 
    } else if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) {
      audio.pause();
      elPlayBtn.innerText = '[ PLAY ]';
      isPlaying = false;
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          elPlayBtn.innerText = '[ PAUSE ]';
          isPlaying = true;
        }).catch(error => {
          console.error("Playback interrupted:", error);
          elPlayBtn.innerText = '[ PLAY ]';
          isPlaying = false;
        });
      }
    }
  }

  function nextTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audio.play();
  }

  function prevTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audio.play();
  }

  audio.addEventListener('timeupdate', () => {
    const { duration, currentTime } = audio;
    if (duration) {
      const progressPercent = (currentTime / duration) * 100;
      elProgressFill.style.width = `${progressPercent}%`;
      elTimeCurrent.innerText = formatTime(currentTime);
      elTimeTotal.innerText = formatTime(duration);
    }
  });

  elProgressContainer.addEventListener('click', (e) => {
    const width = elProgressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
      audio.currentTime = (clickX / width) * duration;
    }
  });

  audio.addEventListener('ended', nextTrack);

  elPlayBtn.addEventListener('click', togglePlay);
  elNextBtn.addEventListener('click', nextTrack);
  elPrevBtn.addEventListener('click', prevTrack);

  elPlayBtn.innerText = '[ PLAY ]';
  loadTrack(currentTrackIndex);

  function updateSystemClock() {
    const clockEl = document.getElementById('sys-clock');
    if (!clockEl) return;
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  setInterval(updateSystemClock, 1000);
  updateSystemClock();

  window.addEventListener('load', () => {
    const loading = document.getElementById('loading-screen');
    const bgLayer = document.getElementById('bg-layer');
    const workspace = document.querySelector('.workspace');
    const topBar = document.getElementById('top-bar');

    setTimeout(() => {
      loading.classList.add('hide');

      setTimeout(() => {
        bgLayer.classList.add('show');

        setTimeout(() => {
          workspace.classList.add('show');
          
          setTimeout(() => {
            topBar.classList.add('show');
          }, 800);
          
        }, 300);
      }, 200);
    }, 1000);
  });
});
