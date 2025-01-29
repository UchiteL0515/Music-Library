let currentAudio = document.getElementById('audio-player');
let currentSongIndex = -1;
let playlist = [];
let isRepeating = false;

function isValidImageUrl(url) {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
}

function updateNowPlaying(song) {
    document.getElementById('now-playing-title').textContent = song.title;
    document.getElementById('now-playing-artist').textContent = song.artist;
    
    // Update album art if available
    const albumArt = document.getElementById('album-art');
    if (isValidImageUrl(song.albumArt)) {
        albumArt.src = song.albumArt;
        // Add error handler in case image fails to load
        albumArt.onerror = function() {
            this.src = "static/images/default-album.png";
        };
    } else {
        albumArt.src = "static/images/default-album.png";
    }
    
    // Update play/pause button
    const playPauseIcon = document.getElementById('play-pause-icon');
    playPauseIcon.className = 'fas fa-pause';
}

function playSong(filepath, songData, index) {
    currentSongIndex = index !== undefined ? index : currentSongIndex;
    currentAudio.src = filepath;
    currentAudio.load();
    currentAudio.play();
    //console.log("Playing song:", songData.title); // debugging purposes
    updateNowPlaying(songData);
}

function togglePlay() {
    if(isRepeating){
        currentAudio.pause();
        isRepeating = false;
        document.getElementById('play-pause-icon').className = 'fas fa-play';
    } else if (currentAudio.paused) {
        currentAudio.play();
        document.getElementById('play-pause-icon').className = 'fas fa-pause';
    } else {
        currentAudio.pause();
        document.getElementById('play-pause-icon').className = 'fas fa-play';
    }
}

function toggleRepeat() {
    isRepeating = !isRepeating;
    const repeatButton = document.getElementById('repeat-button');
  
    if (isRepeating) {
      repeatButton.classList.add('repeat-active');
    } else {
      repeatButton.classList.remove('repeat-active');
    }
  }

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
}

async function nextSong() {
    if (currentSongIndex < playlist.length - 1) {
        currentSongIndex++;
        const nextSong = playlist[currentSongIndex];

        currentAudio.src = nextSong.file_path;
        await currentAudio.load();
        await currentAudio.play();
        //console.log("Playing next song:", nextSong.title); // debugging purposes

        updateNowPlaying({
            title: nextSong.title,
            artist: nextSong.artist,
            albumArt: nextSong.album_art
        });
    } 
}

function previousSong() {
    if (currentSongIndex > 0) {
        currentSongIndex--;
        const prevSong = playlist[currentSongIndex];
        playSong(prevSong.file_path, {
            title: prevSong.title,
            artist: prevSong.artist,
            albumArt: prevSong.album_art
        });
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function filterByMood(mood) {
    fetch(`/mood/${mood}`)
        .then(response => response.json())
        .then(songs => {
            playlist = songs;
            currentSongIndex = -1;
            const playlistElement = document.querySelector('.playlist');
            playlistElement.innerHTML = '';
            songs.forEach((song, index) => {
                playlistElement.innerHTML += `
                    <div class="song-item" onclick="playSong('${song.file_path}',
                    {title: '${song.title}', artist: '${song.artist}', albumArt: '${song.album_art}'}, ${index})">
                        <h3>${song.title}</h3>
                        <p>${song.artist}</p>
                    </div>
                `;
            });
        });
}

document.getElementById('volume-slider').addEventListener('input', function() {
    currentAudio.volume = this.value;
});

document.getElementById('progress-bar').addEventListener('input', function() {
    const time = (this.value / 100) * currentAudio.duration;
    currentAudio.currentTime = time;
});

currentAudio.addEventListener('ended', function() {
    if(isRepeating){
        currentAudio.currentTime = 0;
        currentAudio.play();
    } else if (currentSongIndex === playlist.length -1) {
        // resets player when the last song inside the playlist ends
        currentAudio.pause();
        document.getElementById('play-pause-icon').className = 'fas fa-play';
        document.getElementById('progress-bar').value = 0;
        document.getElementById('current-time').textContent = '0:00';
    } else{
        nextSong();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    const songElements = document.querySelectorAll('.song-item');
    playlist = Array.from(songElements).map(el => {
        const title = el.querySelector('h3').textContent;
        const artist = el.querySelector('p').textContent;
        const filepath = el.getAttribute('onclick').split("'")[1];
        return { title, artist, file_path: filepath};
    });
});

document.getElementById('uploadForm').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await fetch('/upload', {
        method: 'POST',
        body: formData
    });
    
    window.location.reload();
};

currentAudio.addEventListener('timeupdate', function() {
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    document.getElementById('progress-bar').value = progress;
    document.getElementById('current-time').textContent = formatTime(currentAudio.currentTime);
});

currentAudio.addEventListener('loadedmetadata', function() {
    document.getElementById('duration').textContent = formatTime(currentAudio.duration);
});