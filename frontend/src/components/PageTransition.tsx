import React from 'react';
import { motion } from 'framer-motion';

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
};
