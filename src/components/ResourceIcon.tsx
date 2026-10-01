import React from 'react';
import { 
  BookOpen, 
  Calculator, 
  FileText, 
  GraduationCap, 
  Cpu, 
  Ticket, 
  FlaskConical, 
  PenTool, 
  Network, 
  Activity as ActivityIcon, 
  Trophy, 
  Layers, 
  Music, 
  Wrench,
  HelpCircle
} from 'lucide-react';

interface ResourceIconProps {
  name: string;
  className?: string;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ name, className = "w-5 h-5" }) => {
  switch (name) {
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Calculator': return <Calculator className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'GraduationCap': return <GraduationCap className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Ticket': return <Ticket className={className} />;
    case 'FlaskConical': return <FlaskConical className={className} />;
    case 'PenTool': return <PenTool className={className} />;
    case 'Network': return <Network className={className} />;
    case 'Activity': return <ActivityIcon className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Music': return <Music className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    default: return <HelpCircle className={className} />;
  }
};
