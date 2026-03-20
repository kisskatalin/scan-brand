
import { FashionItem } from '../types';

export const sortFashionItems = (items: FashionItem[]): FashionItem[] => {
    return [...items].sort((a, b) => {
        const scores: Record<string, number> = { 'perfect': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const getScore = (confidence: string) => scores[(confidence || '').toLowerCase()] || 0;
        
        const scoreA = getScore(a.confidence);
        const scoreB = getScore(b.confidence);
        
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        const isGeneric = (str: string) => {
            const s = (str || '').toLowerCase();
            return s.includes('unknown') || s.includes('unidentified') || s.includes('generic') || s === 'n/a' || s.includes('ismeretlen');
        };
        if (isGeneric(a.brand) && !isGeneric(b.brand)) return 1;
        if (!isGeneric(a.brand) && isGeneric(b.brand)) return -1;
        return 0;
    });
};
