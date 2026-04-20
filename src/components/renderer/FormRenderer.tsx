import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, ChevronRight, 
  Star, PenTool, ShieldCheck, Mail,
  Upload, Clock, Calendar, ChevronDown
} from 'lucide-react';
import { DynamicForm, FormField } from '../../types';
import { supabase } from '../../lib/supabase';

interface FormRendererProps {
  key?: string;
  form: DynamicForm;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

// Helper function to render bold text
const renderText = (text: string) => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const SignaturePad = ({ onSave, color }: { onSave: (data: string) => void, color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, [color]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full h-40 bg-bg-base border-2 border-dashed border-border-base rounded-3xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
        <button 
          onClick={clear}
          className="absolute top-2 right-2 p-2 bg-surface border border-border-base rounded-lg text-[10px] font-bold text-text-secondary hover:text-red-500 transition-colors"
        >
          Limpar
        </button>
      </div>
      <p className="text-[10px] text-text-secondary text-center font-medium">Assine acima usando seu mouse ou dedo</p>
    </div>
  );
};

export const FormRenderer = ({ form, onSubmit, onBack }: FormRendererProps) => {
  const { fields, settings } = form;
  const isStepMode = settings.layout === 'step';
  const [currentStep, setCurrentStep] = useState(isStepMode ? -1 : 0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < fields.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setUploadingField('submitting'); // Reuse for submission state
      await onSubmit(formData);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setUploadingField(null);
    }
  };

  const updateData = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-bg-base">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-surface rounded-[3rem] p-12 text-center shadow-2xl space-y-6 border border-border-base"
        >
          <div className="size-20 bg-success-base text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-success-base/20">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-text-primary">Enviado!</h2>
            <p className="text-text-secondary">{settings.successMessage}</p>
          </div>
          <button onClick={onBack} className="px-8 py-3 bg-bg-base rounded-2xl font-bold text-text-primary hover:opacity-80 transition-all">Voltar</button>
        </motion.div>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const fieldColor = field.customColor || settings.primaryColor;
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'url':
      case 'date':
      case 'time':
        return (
          <div className="relative">
            {field.type === 'date' && <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />}
            {field.type === 'time' && <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />}
            <input 
              type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
              placeholder={field.placeholder}
              onChange={(e) => updateData(field.id, e.target.value)}
              className={`w-full p-4 bg-bg-base border border-border-base rounded-2xl focus:ring-2 outline-none transition-all text-text-primary ${ (field.type === 'date' || field.type === 'time') ? 'pl-12' : '' }`}
              style={{ '--tw-ring-color': fieldColor } as any}
            />
          </div>
        );
      case 'textarea':
        return (
          <textarea 
            placeholder={field.placeholder}
            onChange={(e) => updateData(field.id, e.target.value)}
            className="w-full p-4 bg-bg-base border border-border-base rounded-2xl focus:ring-2 outline-none transition-all text-text-primary min-h-[120px] resize-none"
            style={{ '--tw-ring-color': fieldColor } as any}
          />
        );
      case 'dropdown':
        return (
          <div className="relative">
            <select 
              onChange={(e) => updateData(field.id, e.target.value)}
              className="w-full p-4 bg-bg-base border border-border-base rounded-2xl focus:ring-2 outline-none transition-all text-text-primary appearance-none"
              style={{ '--tw-ring-color': fieldColor } as any}
            >
              <option value="">Selecione uma opção</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        );
      case 'file':
        return (
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-base rounded-2xl cursor-pointer hover:bg-bg-base/50 transition-colors ${uploadingField === field.id ? 'opacity-50 cursor-wait' : ''}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploadingField === field.id ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2" style={{ borderColor: fieldColor }} />
              ) : (
                <Upload size={24} className="text-text-secondary mb-2" />
              )}
              <p className="text-xs text-text-secondary">
                {uploadingField === field.id ? 'Enviando...' : (formData[field.id] ? 'Arquivo selecionado' : 'Clique para enviar arquivo')}
              </p>
              {formData[field.id] && !uploadingField && (
                <p className="text-[10px] text-success-base mt-1 font-bold">✓ Pronto</p>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              disabled={uploadingField === field.id}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    setUploadingField(field.id);
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `submissions/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from('ativos')
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('ativos')
                      .getPublicUrl(filePath);

                    updateData(field.id, publicUrl);
                  } catch (err) {
                    console.error('Erro no upload do arquivo:', err);
                    // Fallback to filename if upload fails
                    updateData(field.id, file.name);
                  } finally {
                    setUploadingField(null);
                  }
                }
              }} 
            />
          </label>
        );
      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between px-2">
              {[1, 2, 3, 4, 5].map(val => (
                <button 
                  key={val}
                  onClick={() => updateData(field.id, val)}
                  className={`size-10 rounded-full flex items-center justify-center font-bold transition-all ${formData[field.id] === val ? 'text-white' : 'text-text-secondary bg-bg-base'}`}
                  style={{ backgroundColor: formData[field.id] === val ? fieldColor : undefined }}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">
              <span>Discordo</span>
              <span>Concordo</span>
            </div>
          </div>
        );
      case 'radio':
      case 'checkbox':
        return (
          <div className="space-y-3">
            {field.options?.map((opt, i) => (
              <button 
                key={i}
                onClick={() => {
                  if (field.type === 'radio') {
                    updateData(field.id, opt);
                  } else {
                    const current = formData[field.id] || [];
                    const next = current.includes(opt) ? current.filter((o: string) => o !== opt) : [...current, opt];
                    updateData(field.id, next);
                  }
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  (field.type === 'radio' ? formData[field.id] === opt : formData[field.id]?.includes(opt))
                    ? 'bg-accent/5'
                    : 'bg-surface border-border-base'
                }`}
                style={{ borderColor: (field.type === 'radio' ? formData[field.id] === opt : formData[field.id]?.includes(opt)) ? fieldColor : undefined }}
              >
                <div 
                  className={`size-6 rounded-${field.type === 'radio' ? 'full' : 'md'} border-2 flex items-center justify-center transition-all`}
                  style={{ 
                    borderColor: (field.type === 'radio' ? formData[field.id] === opt : formData[field.id]?.includes(opt)) ? fieldColor : 'var(--color-border-base)',
                    backgroundColor: (field.type === 'radio' ? formData[field.id] === opt : formData[field.id]?.includes(opt)) ? fieldColor : 'transparent'
                  }}
                >
                  {(field.type === 'radio' ? formData[field.id] === opt : formData[field.id]?.includes(opt)) && (
                    <div className={field.type === 'radio' ? "size-2 bg-white rounded-full" : "text-white"} >
                      {field.type === 'checkbox' && <CheckCircle2 size={12} />}
                    </div>
                  )}
                </div>
                <span className="font-bold text-text-primary">{renderText(opt)}</span>
              </button>
            ))}
          </div>
        );
      case 'rating':
        return (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button 
                key={val}
                onClick={() => updateData(field.id, val)}
                className={`size-12 rounded-xl flex items-center justify-center transition-all ${formData[field.id] >= val ? 'text-white' : 'text-text-secondary bg-bg-base'}`}
                style={{ backgroundColor: formData[field.id] >= val ? fieldColor : undefined }}
              >
                <Star size={24} fill={formData[field.id] >= val ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        );
      case 'grid-radio':
      case 'grid-checkbox':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  {field.columns?.map(col => (
                    <th key={col} className="p-2 text-text-secondary font-bold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {field.rows?.map(row => (
                  <tr key={row} className="border-t border-border-base">
                    <td className="p-2 font-bold text-text-primary">{row}</td>
                    {field.columns?.map(col => (
                      <td key={col} className="p-2 text-center">
                        <button 
                          onClick={() => {
                            const current = formData[field.id] || {};
                            if (field.type === 'grid-radio') {
                              updateData(field.id, { ...current, [row]: col });
                            } else {
                              const rowData = current[row] || [];
                              const next = rowData.includes(col) ? rowData.filter((c: string) => c !== col) : [...rowData, col];
                              updateData(field.id, { ...current, [row]: next });
                            }
                          }}
                          className={`size-6 rounded-${field.type === 'grid-radio' ? 'full' : 'md'} border-2 mx-auto transition-all flex items-center justify-center`}
                          style={{ 
                            borderColor: (field.type === 'grid-radio' ? formData[field.id]?.[row] === col : formData[field.id]?.[row]?.includes(col)) ? fieldColor : 'var(--color-border-base)',
                            backgroundColor: (field.type === 'grid-radio' ? formData[field.id]?.[row] === col : formData[field.id]?.[row]?.includes(col)) ? fieldColor : 'transparent'
                          }}
                        >
                          {(field.type === 'grid-checkbox' && formData[field.id]?.[row]?.includes(col)) && <CheckCircle2 size={12} className="text-white" />}
                          {(field.type === 'grid-radio' && formData[field.id]?.[row] === col) && <div className="size-2 bg-white rounded-full" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'signature':
        return <SignaturePad onSave={(data) => updateData(field.id, data)} color={fieldColor} />;
      default:
        return <div className="p-4 bg-red-50 text-red-500 rounded-xl">Campo não implementado: {field.type}</div>;
    }
  };

  const borderRadiusValue = settings.borderRadius === 'none' ? '0' : (settings.borderRadius === 'large' ? '1.5rem' : '2.5rem');

  return (
    <div className="min-h-full bg-bg-base py-12 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header Image Block */}
        {settings.headerImage && (
          <div 
            className="w-full h-48 overflow-hidden shadow-md mb-4 relative bg-bg-base/10"
            style={{ borderRadius: settings.borderRadius === 'none' ? '0' : '0.75rem' }}
          >
            <img 
              src={settings.headerImage} 
              alt="Header" 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Title Card Block */}
        <header 
          className="bg-surface shadow-md border border-border-base overflow-hidden relative z-10" 
          style={{ borderRadius: settings.borderRadius === 'none' ? '0' : '0.75rem' }}
        >
          <div className="p-8 space-y-4">
            {settings.logo && (
              <div className="mb-6 flex justify-start">
                <img src={settings.logo} alt="Logo" className="h-12 w-auto object-contain" />
              </div>
            )}
            <h1 className="text-4xl font-bold text-text-primary" style={{ color: settings.titleColor }}>
              {renderText(form.title)}
            </h1>
            <div className="h-px bg-border-base w-full" />
            {form.description && (
              <p className="text-sm text-text-secondary whitespace-pre-wrap" style={{ color: settings.subtitleColor }}>
                {renderText(form.description)}
              </p>
            )}
            {isStepMode && currentStep === -1 && (
              <button 
                onClick={() => setCurrentStep(0)}
                className="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all text-lg mt-6"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Começar
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </header>

        <div className="space-y-6 pb-20">
          {isStepMode ? (
            currentStep >= 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <motion.div
                key={currentStep}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="w-full max-w-xl bg-surface p-10 md:p-16 border border-border-base shadow-2xl space-y-10"
                style={{ borderRadius: borderRadiusValue }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">Pergunta {currentStep + 1} de {fields.length}</span>
                     {fields[currentStep].required && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Obrigatório</span>}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">{renderText(fields[currentStep].label)}</h2>
                  {fields[currentStep].description && <p className="text-lg text-text-secondary">{renderText(fields[currentStep].description)}</p>}
                  
                  <div className="pt-6">
                    {renderField(fields[currentStep])}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {currentStep > 0 && (
                    <button 
                      onClick={() => setCurrentStep(currentStep - 1)} 
                      className="flex-1 py-4 bg-bg-base text-text-primary font-bold rounded-2xl hover:bg-border-base transition-all flex items-center justify-center gap-2"
                    >
                      Voltar
                    </button>
                  )}
                  <button 
                    onClick={handleNext} 
                    className="flex-[2] py-4 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all text-lg"
                    style={{ backgroundColor: fields[currentStep].customColor || settings.primaryColor }}
                  >
                    {currentStep === fields.length - 1 ? 'Enviar Respostas' : 'Próximo'}
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            </div>
          )) : (
            fields.map((field, idx) => (
              <motion.div 
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface p-8 border border-border-base shadow-xl space-y-6"
                style={{ borderRadius: borderRadiusValue }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-text-primary">{renderText(field.label)}</h2>
                    {field.required && <span className="text-red-500">*</span>}
                  </div>
                  {field.description && <p className="text-sm text-text-secondary">{renderText(field.description)}</p>}
                </div>
                {renderField(field)}
              </motion.div>
            ))
          )}

          {!isStepMode && fields.length > 0 && (
          <button 
            onClick={handleSubmit}
            disabled={uploadingField === 'submitting'}
            className="w-full py-5 bg-accent text-white font-black rounded-3xl shadow-2xl shadow-accent/20 text-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70"
            style={{ backgroundColor: settings.primaryColor }}
          >
            {uploadingField === 'submitting' ? (
              <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldCheck size={24} />
            )}
            {uploadingField === 'submitting' ? 'Enviando...' : 'Enviar Respostas'}
          </button>
          )}
        </div>
      </div>
    </div>
  );
};
