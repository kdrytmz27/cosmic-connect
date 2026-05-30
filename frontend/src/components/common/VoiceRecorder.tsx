import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader, Play, Pause, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    maxDurationMs?: number; // e.g. 180000 for 3 minutes
    isUploading?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, maxDurationMs = 180000, isUploading = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                if (timerRef.current) clearInterval(timerRef.current);
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);
            setRecordedBlob(null);

            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev * 1000 >= maxDurationMs) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Mikrofon erişimi reddedildi veya bulunamadı.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleDelete = () => {
        setRecordedBlob(null);
        setDuration(0);
    };

    const handleSend = () => {
        if (recordedBlob) {
            onRecordingComplete(recordedBlob);
            setRecordedBlob(null);
            setDuration(0);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (isUploading) {
        return (
            <div className="flex items-center gap-2 p-2 bg-[rgba(255,255,255,0.05)] rounded-full text-[var(--accent-pink)]">
                <Loader size={20} className="animate-spin" />
                <span className="text-sm">Ses gönderiliyor...</span>
            </div>
        );
    }

    if (recordedBlob) {
        return (
            <div className="flex items-center gap-3 p-2 bg-[rgba(139,92,246,0.1)] rounded-full border border-[rgba(139,92,246,0.3)] w-full">
                <button onClick={handlePlayPause} className="p-2 rounded-full bg-[var(--accent-purple)] text-white hover:opacity-80">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <span className="text-sm font-medium text-white flex-1">{formatTime(duration)}</span>
                <button onClick={handleDelete} className="p-2 rounded-full text-red-400 hover:bg-[rgba(239,68,68,0.1)]">
                    <Trash2 size={16} />
                </button>
                <button onClick={handleSend} className="p-2 px-4 rounded-full bg-[var(--accent-pink)] text-white text-sm font-bold shadow-lg hover:opacity-90">
                    Gönder
                </button>
                <audio 
                    ref={audioRef} 
                    src={URL.createObjectURL(recordedBlob)} 
                    onEnded={() => setIsPlaying(false)}
                    className="hidden" 
                />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {isRecording ? (
                <div className="flex items-center gap-3 p-2 bg-[rgba(239,68,68,0.1)] rounded-full border border-red-500/30">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-red-400 min-w-[40px]">{formatTime(duration)}</span>
                    <button onClick={stopRecording} className="p-2 rounded-full bg-red-500 text-white hover:opacity-80">
                        <Square size={16} />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={startRecording}
                    className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-pink)] hover:bg-[rgba(236,72,153,0.1)] transition-colors"
                    title="Ses Kaydet"
                >
                    <Mic size={24} />
                </button>
            )}
        </div>
    );
};

export default VoiceRecorder;
