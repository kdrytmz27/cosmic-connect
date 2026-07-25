import { DailyQuests } from '../components/profile/DailyQuests';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Quests = () => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 pt-8 px-container-margin max-w-7xl mx-auto w-full pb-24 flex flex-col gap-section-gap">
            {/* Header */}
            <header className="mb-section-gap flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-on-surface md:hidden"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl">task_alt</span>
                        Görevlerim
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                        Evrensel görevleri tamamla, deneyim puanı (XP) ve ekstra Yıldız Tozu kazan!
                    </p>
                </div>
            </header>

            {/* Quests Container */}
            <div className="max-w-3xl">
                <DailyQuests />
            </div>
        </div>
    );
};

export default Quests;
