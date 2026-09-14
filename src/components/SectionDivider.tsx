import { motion } from 'motion/react';

interface SectionDividerProps {
  topColor?: string;
  bottomColor?: string;
  type?: 'wave' | 'slope' | 'curve' | 'static-wave';
}

export default function SectionDivider({ 
  topColor = 'white', 
  bottomColor = '#0F172A',
  type = 'curve'
}: SectionDividerProps) {
  
  // Empty render: creates straight horizontal transitions natively
  return null;
}
