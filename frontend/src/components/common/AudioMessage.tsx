import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';

interface AudioMessageProps {
    url: string;
    isMine: boolean;
}

const AudioMessage: React.FC<AudioMessageProps> = ({ url, isMine }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
        audioRef.current.currentTime = newTime;
        setProgress(Number(e.target.value));
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className={`flex items-center gap-3 p-2 rounded-2xl w-[220px] ${isMine ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)]'}`}>
            <button 
                onClick={togglePlay} 
                className={`p-2 flex-shrink-0 rounded-full text-white shadow-md transition-transform active:scale-95 ${isMine ? 'bg-[var(--accent-pink)]' : 'bg-[var(--accent-purple)]'}`}
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>
            
            <div className="flex flex-col flex-1 gap-1">
                {/* Waveform fake / progress slider */}
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={progress} 
                    onChange={handleSeek}
                    className="w-full h-1 bg-[rgba(255,255,255,0.2)] rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${isMine ? 'var(--accent-pink)' : 'var(--accent-purple)'} ${progress}%, rgba(255,255,255,0.2) ${progress}%)`
                    }}
                />
                
                <div className="flex justify-between text-[10px] text-white/70 font-medium">
                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <audio ref={audioRef} src={fullUrl} className="hidden" />
        </div>
    );
};

export default AudioMessage;
