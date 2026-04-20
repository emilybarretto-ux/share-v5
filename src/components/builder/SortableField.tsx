import React from 'react';
import { motion } from 'motion/react';
import { 
  GripVertical, Trash2, ChevronUp, ChevronDown, 
  Type, CheckCircle2, Star, PenTool, Send, CheckSquare,
  FileText, Upload, Layout, Clock
} from 'lucide-react';
import { FormField } from '../../types';

interface SortableFieldProps {
  key?: any;
  field: FormField;
  index: number;
  isSelected: boolean;
  borderRadius: 'none' | 'large' | '3xl';
  onSelect: () => void;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  renderText: (text: string) => React.ReactNode;
}

export const SortableField = ({ 
  field, isSelected, borderRadius, onSelect, onRemove, 
  onDragStart, onDragEnd, onDragOver, renderText 
}: SortableFieldProps) => {
  const getIcon = () => {
    switch (field.type) {
      case 'text': return <Type size={16} />;
      case 'textarea': return <FileText size={16} />;
      case 'radio': return <CheckCircle2 size={16} />;
      case 'checkbox': return <CheckSquare size={16} />;
      case 'dropdown': return <ChevronDown size={16} />;
      case 'file': return <Upload size={16} />;
      case 'scale': return <GripVertical size={16} />;
      case 'rating': return <Star size={16} />;
      case 'grid-radio':
      case 'grid-checkbox': return <Layout size={16} />;
      case 'date':
      case 'time': return <Clock size={16} />;
      case 'signature': return <PenTool size={16} />;
      case 'section': return <Layout size={16} />;
      default: return <Type size={16} />;
    }
  };

  const fieldColor = field.customColor || 'var(--primary-form)';

  const translateType = (type: string) => {
    switch (type) {
      case 'text': return 'Texto Curto';
      case 'textarea': return 'Parágrafo';
      case 'radio': return 'Múltipla Escolha';
      case 'checkbox': return 'Caixa de Seleção';
      case 'dropdown': return 'Lista Suspensa';
      case 'file': return 'Arquivo';
      case 'scale': return 'Escala';
      case 'rating': return 'Classificação';
      case 'grid-radio': return 'Grade Múltipla';
      case 'grid-checkbox': return 'Grade Caixa';
      case 'date': return 'Data';
      case 'time': return 'Horário';
      case 'signature': return 'Assinatura';
      case 'section': return 'Nova Seção';
      default: return type;
    }
  };

  const isSection = field.type === 'section';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent)}
      onDragEnd={(e) => onDragEnd(e as unknown as React.DragEvent)}
      onDragOver={(e) => onDragOver(e as unknown as React.DragEvent)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative transition-all cursor-move ${
        isSection 
          ? `bg-bg-base/30 border-2 border-dashed ${isSelected ? 'border-accent' : 'border-border-base font-black'}` 
          : `bg-surface border-2 ${isSelected ? 'shadow-xl shadow-accent/10 z-10' : 'border-border-base hover:border-text-secondary/20'}`
      }`}
      style={{ 
        borderRadius: borderRadius === 'none' ? '0' : (borderRadius === 'large' ? '1.5rem' : '2.5rem'),
        borderColor: isSelected ? (isSection ? 'var(--color-accent)' : fieldColor) : undefined
      }}
    >
      <div className={`p-6 flex items-start gap-4 ${isSection ? 'py-10' : ''}`}>
        <div className={`mt-1 text-text-secondary/50 group-hover:text-text-secondary transition-colors ${isSection ? 'self-center' : ''}`}>
          <GripVertical size={20} />
        </div>
        
        <div className={`flex-1 ${isSection ? 'text-center' : 'space-y-4'}`}>
          {isSection ? (
            <div className="space-y-4">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest mx-auto">
                 <Layout size={12} />
                 Nova Seção
               </div>
               <h2 className="text-3xl font-black text-text-primary tracking-tight">
                 {field.label.includes('...') ? 'Título da Seção' : renderText(field.label)}
               </h2>
               {field.description && <p className="text-text-secondary font-medium">{renderText(field.description)}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-bg-base rounded-lg text-text-secondary" style={{ color: isSelected ? fieldColor : undefined }}>
                     {getIcon()}
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest text-text-secondary/60">{translateType(field.type)}</span>
                </div>
                {field.required && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter bg-red-500/10 px-2 py-0.5 rounded">Obrigatório</span>}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-text-primary leading-snug">
                  {renderText(field.label)}
                </h4>
                {field.description && (
                  <p className="text-sm text-text-secondary">{renderText(field.description)}</p>
                )}
              </div>

              {/* Visual representation of input */}
              <div className="pt-2">
                {(field.type === 'radio' || field.type === 'checkbox') ? (
                  <div className="space-y-2">
                    {field.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`size-5 rounded border ${field.type === 'radio' ? 'rounded-full' : 'rounded-md'} border-border-base`} />
                        <span className="text-sm text-text-secondary">{renderText(opt)}</span>
                      </div>
                    ))}
                  </div>
                ) : field.type === 'dropdown' ? (
                  <div className="w-full h-12 bg-bg-base border border-border-base rounded-xl flex items-center justify-between px-4">
                    <span className="text-sm text-text-secondary/60">
                      {field.options?.[0] || 'Selecione uma opção'}
                    </span>
                    <ChevronDown size={16} className="text-text-secondary/40" />
                  </div>
                ) : field.type === 'textarea' ? (
                  <div className="w-full h-24 bg-bg-base border border-border-base rounded-xl flex items-start p-4">
                    <span className="text-sm text-text-secondary/40">{field.placeholder}</span>
                  </div>
                ) : field.type === 'rating' ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} className="text-text-secondary/20" />)}
                  </div>
                ) : field.type === 'scale' ? (
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-secondary/50">1</span>
                    <div className="flex-1 h-2 bg-bg-base rounded-full" />
                    <span className="text-xs text-text-secondary/50">5</span>
                  </div>
                ) : (field.type === 'grid-radio' || field.type === 'grid-checkbox') ? (
                  <div className="overflow-x-auto border border-border-base rounded-xl bg-bg-base/30">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-border-base/50">
                          <th className="p-2"></th>
                          {field.columns?.map((col, i) => (
                            <th key={i} className="p-2 text-text-secondary/40 font-bold uppercase tracking-tighter">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {field.rows?.map((row, i) => (
                          <tr key={i} className={i !== 0 ? 'border-t border-border-base/30' : ''}>
                            <td className="p-2 font-bold text-text-secondary/60">{row}</td>
                            {field.columns?.map((_, j) => (
                              <td key={j} className="p-2 text-center">
                                <div className={`size-3 rounded border ${field.type === 'grid-radio' ? 'rounded-full' : 'rounded-sm'} border-border-base/50 mx-auto`} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (field.type === 'date' || field.type === 'time') ? (
                  <div className="w-full h-12 bg-bg-base border border-border-base rounded-xl flex items-center px-4 gap-3">
                    <Clock size={16} className="text-text-secondary/40" />
                    <span className="text-sm text-text-secondary/40">
                      {field.type === 'date' ? 'DD/MM/AAAA' : '00:00'}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-12 bg-bg-base border border-border-base rounded-xl flex items-center px-4">
                    <span className="text-sm text-text-secondary/40">{field.placeholder}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {isSelected && (
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-surface border border-border-base p-1.5 rounded-xl shadow-xl">
             <button onClick={(e) => { e.stopPropagation(); onRemove(field.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
               <Trash2 size={16} />
             </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
