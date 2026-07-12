import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const PageTransition = ({ children, className = '' }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.2, ease: 'linear' }}
    className={className}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
);

export const FadeIn = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2, ease: 'linear' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideIn = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const StaggerParent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const StaggerChild = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const ScaleIn = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const HoverScale = ({ children, className = '', style = {} }) => (
  <div className={className} style={style}>
    {children}
  </div>
);

export default PageTransition;
