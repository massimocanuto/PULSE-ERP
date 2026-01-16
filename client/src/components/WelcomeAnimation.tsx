
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeAnimationProps {
    onComplete?: () => void;
    username?: string;
}

export function WelcomeAnimation({ onComplete, username }: WelcomeAnimationProps) {
    const [isVisible, setIsVisible] = useState(true);

    const onCompleteRef = useRef(onComplete);

    // Update ref when prop changes
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        // Use a local variable to track if component is still mounted/active for this effect
        let mounted = true;

        const timer = setTimeout(() => {
            handleComplete();
        }, 2500);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, []);

    const handleComplete = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onCompleteRef.current) {
                onCompleteRef.current();
            }
        }, 500); // Faster exit
    };

    // Particles configuration
    const particleCount = 20;
    const particles = Array.from({ length: particleCount });

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-white overflow-hidden cursor-pointer"
                    onClick={handleComplete}
                >
                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/50" />

                    {/* Soft Glowing Orbs */}
                    <motion.div
                        animate={{
                            x: [0, 50, 0],
                            y: [0, -30, 0],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]"
                    />
                    <motion.div
                        animate={{
                            x: [0, -40, 0],
                            y: [0, 40, 0],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]"
                    />

                    {/* Floating Particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {particles.map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: Math.random() * window.innerHeight,
                                    opacity: 0
                                }}
                                animate={{
                                    y: [null, Math.random() * -100],
                                    opacity: [0, 0.4, 0],
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 4,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: Math.random() * 2
                                }}
                                className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
                            />
                        ))}
                    </div>

                    {/* Main Content Container - Glassmorphism */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }} // Spring-like feel
                        className="relative z-10 p-12 rounded-3xl backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col items-center gap-8 max-w-sm w-full mx-4"
                    >
                        {/* Logo Icon with Pulse */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl animate-pulse" />
                            <div className="w-20 h-20 bg-gradient-to-tr from-white to-blue-50 rounded-2xl shadow-lg border border-white/80 flex items-center justify-center relative overflow-hidden group">
                                <span className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">PE</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-150%] animate-[shimmer_2s_infinite]" />
                            </div>
                        </motion.div>

                        <div className="text-center space-y-2">
                            {/* Staggered Title */}
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.05 }
                                    }
                                }}
                                className="flex justify-center"
                            >
                                {Array.from("PULSE ERP").map((char, i) => (
                                    <motion.span
                                        key={i}
                                        variants={{
                                            hidden: { y: 20, opacity: 0, filter: "blur(10px)" },
                                            visible: { y: 0, opacity: 1, filter: "blur(0px)" }
                                        }}
                                        className="text-2xl font-bold text-gray-800 tracking-tight"
                                    >
                                        {char === " " ? "\u00A0" : char}
                                    </motion.span>
                                ))}
                            </motion.div>

                            {/* Welcome Name */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 1 }}
                                className="relative"
                            >
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-1">Benvenuto</p>
                                <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                                    {username || "Utente"}
                                </div>
                            </motion.div>
                        </div>

                        {/* Elegant Progress Line */}
                        <motion.div
                            className="w-full h-1 bg-gray-100 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Bottom Branding */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="absolute bottom-8 left-0 right-0 text-center"
                    >
                        <p className="text-xs text-gray-400 font-medium tracking-widest">ADVANCED MANAGEMENT SYSTEM</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
