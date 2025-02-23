import React from "react";
import { motion } from "framer-motion";

interface InfiniteMovingCardsProps {
  items: { content: JSX.Element }[];
  speed?: number;
  direction?: "left" | "right";
}

const InfiniteMovingCards: React.FC<InfiniteMovingCardsProps> = ({
  items,
  speed = 10,
  direction = "left",
}) => {
  return (
    <div className="relative w-full overflow-hidden py-4">
      <motion.div
        className="flex space-x-4"
        initial={{ x: direction === "left" ? "0%" : "-100%" }}
        animate={{
          x: direction === "left" ? ["0%", "-100%"] : ["-100%", "0%"],
        }}
        transition={{
          repeat: Infinity,
          duration: speed,
          ease: "linear",
        }}
      >
        {[...items, ...items, ...items].map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-64 h-32 flex items-center justify-center bg-red-600 hover:bg-red-700 p-4 rounded-lg shadow-lg text-center text-white transition-all duration-300"
          >
            {item.content}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default InfiniteMovingCards;
