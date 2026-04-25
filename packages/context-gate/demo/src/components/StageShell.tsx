import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type StageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  side: ReactNode;
};

export function StageShell({ eyebrow, title, description, children, side }: StageShellProps) {
  return (
    <motion.section
      key={title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="stage-shell"
    >
      <div className="stage-main panel panel-glass">
        <div className="section-heading">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </div>
      <aside className="stage-side">{side}</aside>
    </motion.section>
  );
}
