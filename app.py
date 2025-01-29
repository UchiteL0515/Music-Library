from flask import Flask, render_template, jsonify, request, redirect, url_for
from werkzeug.utils import secure_filename
import os

class Song:
    def __init__(self, title, artist, file_path, genre, mood=None, album_art=None):
        self.title = title
        self.artist = artist
        self.file_path = file_path
        self.genre = genre
        self.mood = mood
        self.album_art = album_art

class PersonalMusicPlayer:
    def __init__(self):
        self.songs = []
        self.current_playlist = []
        self.moods = ["Energetic", "Chill", "Focus", "Workout"]
        
    def initialize_library(self):
        # Pre-add your favorite songs here
        self.songs = [
            Song("Rather Be", "Clean Bandit ft. Jess Glynne", "static/music/Rather be - Clean Bandit feat. Jess Glynne (Official Audio).mp3", "ElectroPop", "Energetic"),
            Song("Saan", "Maki", "static/music/Maki - Saan.flac", "Pop", "Chill", "static/images/Maki - Saan.jpg"),
            Song("Porque", "Maldita", "static/music/Maldita - Porque.flac", "Soft-Rock", "Chill", "static/images/Maldita - Porque.jpg"),
            Song("Never Be The Same", "Camila Cabello", "static/music/Camila Cabello - Never Be the Same (Radio Edit).flac", "RnB", "Focus", "static/images/Camila Cabello - Camila.jpg"),
            Song("Birds of a Feather", "Billie Eilish", "static/music/Camila Cabello - Billie_Eilish_-_BIRDS_OF_A_FEATHER_Official_Music_Video.mp3", "Electric", "Chill"),
            Song("Ma Meilleure Ennemie (from Arcane Season 2)", "Stromae, Pomme", "static/music/Stromae, Pomme - Ma Meilleure Ennemie (from Arcane Season 2) .mp3", "ElectroPop", "Workout", "static/images/Arcane season 2 album art.jpg")
        ]
    
    def get_by_mood(self, mood):
        return [song for song in self.songs if song.mood == mood]

app = Flask(__name__)
player = PersonalMusicPlayer()
player.initialize_library()

app.config['UPLOAD_FOLDER'] = 'static/music'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'music_file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['music_file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Create new song and add to library
        new_song = Song(
            title=request.form['title'],
            artist=request.form['artist'],
            file_path=f"static/music/{filename}",
            genre="User Uploaded",
            mood=request.form['mood']
        )
        player.songs.append(new_song)
        
        return jsonify({'success': 'File uploaded successfully'})

@app.route('/')
def home():
    return render_template('player.html', songs=[], moods=player.moods)

@app.route('/mood/<mood>')
def get_mood_playlist(mood):
    mood_songs = player.get_by_mood(mood)
    return jsonify([{'title': s.title, 'artist': s.artist, 'file_path': s.file_path, 'album_art': s.album_art} for s in mood_songs])
