import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface LottiePlayerProps {
    url: string;
    className?: string;
    onComplete?: () => void;
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({ url, className, onComplete }) => {
    const [animationData, setAnimationData] = useState<object | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (!cancelled) setAnimationData(data);
            })
            .catch(e => {
                console.error('Lottie animasyonu yüklenemedi:', e);
                if (!cancelled) onComplete?.();
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    if (!animationData) return null;

    return (
        <Lottie
            animationData={animationData}
            loop={false}
            autoplay
            onComplete={onComplete}
            className={className}
        />
    );
};
