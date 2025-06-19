import React from 'react';
import { motion } from 'framer-motion';

const words = ['学习进步', '知识增长', '能力提升', '目标达成'];

export default function ProfileAnimation() {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg shadow-lg">
            <motion.div
                className="relative h-48 w-48 mb-8"
                animate={{
                    rotate: [0, 360],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-20"></div>
                <div className="absolute inset-2 bg-white rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">📚</span>
                </div>
            </motion.div>

            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">学习之旅</h3>
                <motion.div
                    key={words[index]}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg text-indigo-600 font-medium"
                >
                    {words[index]}
                </motion.div>
            </div>
        </div>
    );
} 