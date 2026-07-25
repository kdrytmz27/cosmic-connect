interface FamilyBadgeProps {
    familyTag?: string | null;
    className?: string;
}

export const FamilyBadge: React.FC<FamilyBadgeProps> = ({ familyTag, className }) => {
    if (!familyTag) return null;
    return (
        <span className={`inline-flex items-center text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold border border-primary/30 ${className || ''}`}>
            {familyTag}
        </span>
    );
};
