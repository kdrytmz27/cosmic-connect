import { useEffect, useRef } from 'react';

const VIDEO_EXT = /\.(webm|mp4|mov)(\?|#|$)/i;

/** Hediyenin animationUrl'i vektör (Lottie JSON) mü yoksa video mu, uzantısından anlar. */
export const isVideoAnimation = (url?: string | null): boolean => !!url && VIDEO_EXT.test(url);

interface AlphaVideoPlayerProps {
    url: string;
    className?: string;
    onComplete?: () => void;
}

/**
 * Alfa kanallı video oynatıcı - render edilmiş (3D, parçacık, doku) hediye animasyonları için.
 *
 * Lottie sadece vektör taşıdığı için render edilmiş görüntüyü ifade edemiyor; canlı yayın
 * uygulamalarının hediyeleri bu yüzden farklı görünüyor. Bu oynatıcı o boşluğu kapatır ve
 * ek kütüphane gerektirmez - Chromium WebView alfa kanallı VP8/VP9 WebM'i doğrudan oynatır.
 *
 * iOS notu: WKWebView WebM oynatmaz; orada alfa kanalı için HEVC'li .mov gerekir. Proje şu an
 * yalnızca Android'e paketlendiği için tek kaynak yeterli (bkz. public/gift-video/README.md).
 */
export const AlphaVideoPlayer: React.FC<AlphaVideoPlayerProps> = ({ url, className, onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const doneRef = useRef(onComplete);
    doneRef.current = onComplete;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        // Otomatik oynatma reddedilebilir (tarayıcı politikası, çözücü hatası). Sessizce
        // takılıp kalmak yerine bitmiş sayıyoruz, yoksa hediye katmanı ekranda asılı kalır.
        const started = video.play();
        if (started) started.catch(() => doneRef.current?.());
    }, [url]);

    return (
        <video
            ref={videoRef}
            src={url}
            className={className}
            autoPlay
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            onEnded={() => doneRef.current?.()}
            onError={() => doneRef.current?.()}
            style={{ background: 'transparent', objectFit: 'contain' }}
        />
    );
};
