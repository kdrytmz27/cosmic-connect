import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalSlotMachine } from '../components/fortune/UniversalSlotMachine';

const Games = () => {
    const [activeGame, setActiveGame] = useState<string | null>(null);

    return (
        <div className="flex-1 pt-8 px-container-margin max-w-7xl mx-auto w-full pb-24 flex flex-col h-full">
            
            <AnimatePresence mode="wait">
                {activeGame === null ? (
                    /* LOBBY VIEW */
                    <motion.div 
                        key="lobby"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-section-gap"
                    >
                        <header>
                            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary flex items-center gap-3">
                                <span className="material-symbols-outlined text-4xl">sports_esports</span>
                                Oyun Lobisi
                            </h1>
                            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                                Yıldız tozlarını katlamak için şansını dene! İstediğin oyunu seçerek hemen oynamaya başla.
                            </p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Slot Machine Thumbnail */}
                            <motion.div 
                                whileHover={{ y: -8, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveGame('slot')}
                                className="group relative rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-tertiary/50 transition-colors shadow-lg aspect-[4/3] bg-surface-container-highest"
                            >
                                {/* Thumbnail Image/Graphic */}
                                <div className="absolute inset-0 bg-gradient-to-br from-tertiary/30 via-surface to-background z-0 flex items-center justify-center overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-tertiary/40 transition-colors duration-500"></div>
                                    <span className="material-symbols-outlined text-9xl text-white/10 absolute rotate-12 group-hover:rotate-0 transition-transform duration-500">casino</span>
                                    
                                    {/* Abstract Slot Icons */}
                                    <div className="flex gap-2 z-10 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                        <div className="w-12 h-16 bg-gradient-to-b from-white/10 to-transparent border border-white/20 rounded-lg flex items-center justify-center font-bold text-2xl text-white">7</div>
                                        <div className="w-12 h-16 bg-gradient-to-b from-tertiary/40 to-tertiary/10 border border-tertiary/50 rounded-lg flex items-center justify-center font-bold text-2xl text-white shadow-[0_0_15px_rgba(255,198,64,0.5)]">7</div>
                                        <div className="w-12 h-16 bg-gradient-to-b from-white/10 to-transparent border border-white/20 rounded-lg flex items-center justify-center font-bold text-2xl text-white">7</div>
                                    </div>
                                </div>

                                {/* Card Content Bottom */}
                                <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="font-headline-md text-headline-md text-white mb-1 group-hover:text-tertiary transition-colors">Evrensel Çark</h3>
                                            <p className="font-label-sm text-label-sm text-white/60">Zarları döndür, Tozları topla!</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center group-hover:bg-white group-hover:text-tertiary transition-colors shadow-[0_0_15px_rgba(255,198,64,0.3)]">
                                            <span className="material-symbols-outlined">play_arrow</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Coming Soon Thumbnail */}
                            <motion.div 
                                className="relative rounded-3xl overflow-hidden border border-white/5 opacity-60 aspect-[4/3] bg-surface-container flex flex-col items-center justify-center p-6 text-center"
                            >
                                <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">sports_esports</span>
                                <h3 className="font-headline-md text-headline-md text-on-surface-variant mb-2">Gezegen Savaşları</h3>
                                <p className="font-label-sm text-label-sm text-on-surface-variant/50">Çok Yakında...</p>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    /* ACTIVE GAME VIEW */
                    <motion.div 
                        key="active-game"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col h-full gap-4 max-w-2xl mx-auto w-full"
                    >
                        {/* Game Header (Back Button) */}
                        <div className="flex items-center justify-between mb-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                            <button 
                                onClick={() => setActiveGame(null)}
                                className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors px-4 py-2 bg-white/5 rounded-full hover:bg-white/10"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                <span className="font-label-md">Lobiye Dön</span>
                            </button>
                            <div className="font-headline-sm text-tertiary flex items-center gap-2">
                                <span className="material-symbols-outlined">casino</span>
                                {activeGame === 'slot' && 'Evrensel Çark'}
                            </div>
                        </div>

                        {/* Game Container */}
                        <div className="flex-1 min-h-[500px]">
                            {activeGame === 'slot' && <UniversalSlotMachine />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Games;
