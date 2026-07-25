import React, { useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Music } from 'lucide-react';

interface FloatingBubbleProps {
    roomId: string;
    roomName: string;
    ownerAvatar?: string;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({ roomId, roomName, ownerAvatar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const controls = useAnimation();
    const bubbleRef = useRef<HTMLDivElement>(null);

    // If we are currently IN the party room, don't show the bubble
    if (location.pathname === `/party/${roomId}`) {
        return null;
    }

    // Handle drag end to snap to edges
    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, _info: any) => {
        const windowWidth = window.innerWidth;
        const bubbleRect = bubbleRef.current?.getBoundingClientRect();
        if (!bubbleRect) return;

        const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
        const isLeftHalf = bubbleCenterX < windowWidth / 2;

        controls.start({
            x: isLeftHalf ? -windowWidth / 2 + bubbleRect.width / 2 + 16 : windowWidth / 2 - bubbleRect.width / 2 - 16,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
        });
    };

    const returnToRoom = () => {
        navigate(`/party/${roomId}`);
    };

    return (
        <motion.div
            ref={bubbleRef}
            drag
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ x: window.innerWidth / 2 - 40, y: -100 }} // Start top right
            style={{ position: 'fixed', zIndex: 9999, touchAction: 'none' }}
            className="w-16 h-16 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] border-2 border-[#ddb8ff] overflow-visible bg-[#0b1326] cursor-pointer"
            onClick={returnToRoom}
        >
            {/* Pulsing background effect */}
            <div className="absolute inset-0 rounded-full bg-[#ddb8ff]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
            
            {/* Avatar */}
            <img 
                src={ownerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(roomName)}&background=9333ea&color=fff&bold=true`} 
                alt="Room" 
                className="w-full h-full rounded-full object-cover relative z-10"
                draggable={false}
            />

            {/* Audio Wave Animation */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-[2px] z-20 h-3 bg-black/60 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                <div className="w-[2px] bg-[#3cddc7] animate-[pulse_1s_ease-in-out_infinite] h-full"></div>
                <div className="w-[2px] bg-[#3cddc7] animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-[60%]"></div>
                <div className="w-[2px] bg-[#3cddc7] animate-[pulse_1.2s_ease-in-out_infinite_0.4s] h-[80%]"></div>
                <div className="w-[2px] bg-[#3cddc7] animate-[pulse_0.9s_ease-in-out_infinite_0.1s] h-[40%]"></div>
            </div>

            {/* Return Icon Indicator */}
            <div className="absolute -top-1 -right-1 bg-[#131b2e] rounded-full p-1 border border-white/20 z-20 shadow-lg text-[#ddb8ff]">
                <Music size={12} />
            </div>
        </motion.div>
    );
};
