import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Settings, Save, Eye, Trash2, 
  ChevronLeft, Layout, Palette, Send, Type, Smartphone, Monitor,
  CheckCircle2, Star, PenTool,
  CheckSquare, X, Upload, FileText, ChevronDown, GripVertical, Clock
} from 'lucide-react';
import { FormField, FieldType } from '../../types';
import { useNotification } from '../shared/NotificationProvider';
import { SortableField } from './SortableField';
import { FormRenderer } from '../renderer/FormRenderer';
import { supabase } from '../../lib/supabase';

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

export const FormBuilderScreen = ({ onBack, onPreview, key }: { onBack: () => void, onPreview: (form: any) => void, key?: string }) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [title, setTitle] = useState('Título');
  const [subtitle, setSubtitle] = useState('Subtítulo aqui');
  const [headerImage, setHeaderImage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'build' | 'design' | 'settings'>('build');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // ✅ FIX: Refs com nomes corretos e únicos
  const headerInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const fieldFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Design Settings
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [titleColor, setTitleColor] = useState('#ffffff');
  const [subtitleColor, setSubtitleColor] = useState('#94a3b8');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [layoutType, setLayoutType] = useState<'list' | 'step'>('list');
  const [borderRadius, setBorderRadius] = useState<'none' | 'large' | '3xl'>('large');

  const { showNotification } = useNotification();
  
  // --- PERSISTÊNCIA ---
  useEffect(() => {
    const saved = localStorage.getItem('form_builder_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.fields) setFields(draft.fields);
        if (draft.title) setTitle(draft.title);
        if (draft.subtitle) setSubtitle(draft.subtitle);
        if (draft.headerImage) setHeaderImage(draft.headerImage);
        if (draft.logoUrl) setLogoUrl(draft.logoUrl);
        if (draft.primaryColor) setPrimaryColor(draft.primaryColor);
        if (draft.titleColor) setTitleColor(draft.titleColor);
        if (draft.subtitleColor) setSubtitleColor(draft.subtitleColor);
        if (draft.fontFamily) setFontFamily(draft.fontFamily);
        if (draft.layoutType) setLayoutType(draft.layoutType);
        if (draft.borderRadius) setBorderRadius(draft.borderRadius);
      } catch (e) {
        console.error('Erro ao carregar rascunho:', e);
      }
    }
  }, []);

  useEffect(() => {
    const draft = {
      fields, title, subtitle, headerImage, logoUrl,
      primaryColor, titleColor, subtitleColor, fontFamily,
      layoutType, borderRadius
    };
    localStorage.setItem('form_builder_draft', JSON.stringify(draft));
  }, [fields, title, subtitle, headerImage, logoUrl, primaryColor, titleColor, subtitleColor, fontFamily, layoutType, borderRadius]);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      label: `Sua Pergunta aqui...`,
      placeholder: 'Insira sua resposta aqui...',
      required: false,
      options: type === 'radio' || type === 'checkbox' || type === 'dropdown' ? ['Opção 1', 'Opção 2'] : undefined,
      rows: type === 'grid-radio' || type === 'grid-checkbox' ? ['Linha 1', 'Linha 2'] : undefined,
      columns: type === 'grid-radio' || type === 'grid-checkbox' ? ['Coluna 1', 'Coluna 2', 'Coluna 3'] : undefined,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    showNotification(`Campo adicionado!`, 'success');
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // ✅ FIX: handleFileChange agora aceita 'header' | 'logo' como segundo argumento (correto)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Imagem muito grande. Máximo 2MB.', 'error');
        return;
      }

      const setter = type === 'header' ? setHeaderImage : setLogoUrl;
      const loader = type === 'header' ? setIsUploadingHeader : setIsUploadingLogo;

      try {
        loader(true);
        showNotification('Enviando imagem...', 'info');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${type}s/${fileName}`; // headers/ or logos/

        const { error: uploadError } = await supabase.storage
          .from('ativos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ativos')
          .getPublicUrl(filePath);

        setter(publicUrl);
        showNotification('Imagem enviada com sucesso!', 'success');
      } catch (error: any) {
        console.error('Erro no upload:', error);
        showNotification('Erro ao enviar imagem. Verifique se o bucket "ativos" existe.', 'error');
        
        // Fallback: usa base64 local se o upload falhar
        const reader = new FileReader();
        reader.onloadend = () => {
          setter(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        loader(false);
        // ✅ FIX: Limpa o input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newFields = [...fields];
    const item = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, item);
    setFields(newFields);
    setDraggedIndex(index);
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showNotification('Você precisa estar logado para publicar.', 'error');
        return;
      }

      const formId = Math.random().toString(36).substring(2, 12);
      
      const { error } = await supabase
        .from('forms')
        .insert([
          {
            id: formId,
            user_id: user.id,
            title,
            description: subtitle,
            fields,
            settings: {
              primaryColor,
              titleColor,
              subtitleColor,
              fontFamily,
              layout: layoutType,
              headerImage,
              logo: logoUrl,
              borderRadius,
              successMessage: 'Obrigado por responder!'
            },
            status: 'published'
          }
        ]);

      if (error) {
        if (error.code === '42501') {
          showNotification('Erro de permissão: Verifique as políticas de RLS no Supabase para a tabela "forms".', 'error');
        } else {
          console.error('Detalhes completos do erro Supabase:', error);
          showNotification(`Erro ao publicar: ${error.message} (${error.code})`, 'error');
        }
        return;
      }

      // Remove qualquer barra no final e limpa a URL
      const origin = window.location.origin.replace(/\/$/, "");
      const baseOrigin = origin.replace('-dev-', '-pre-');
      const shareUrl = `${baseOrigin}/?form=${formId}`;
      
      navigator.clipboard.writeText(shareUrl);
      showNotification('Formulário publicado! Link público copiado.', 'success');
      localStorage.removeItem('form_builder_draft');
      onBack();
    } catch (err: any) {
      console.error('Erro ao publicar:', err);
      showNotification('Erro ao publicar formulário.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  if (isPreview) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-bg-base">
        <div className="bg-surface border-b border-border-base p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-base text-text-primary font-bold rounded-xl hover:opacity-80 transition-all border border-border-base"
            >
              <ChevronLeft size={18} />
              Voltar ao Editor
            </button>
            <div className="h-6 w-px bg-border-base" />
            <span className="text-sm font-black text-text-secondary uppercase tracking-widest">Modo de Visualização</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium">
            <Monitor size={16} />
            <span>Desktop</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FormRenderer 
            form={{
              id: 'preview',
              title,
              description: subtitle,
              fields,
              status: 'draft',
              created_at: new Date().toISOString(),
              user_id: 'preview',
              settings: {
                primaryColor,
                titleColor,
                subtitleColor,
                fontFamily,
                layout: layoutType,
                headerImage,
                logo: logoUrl,
                borderRadius,
                successMessage: 'Obrigado por responder!'
              }
            }}
            onBack={() => setIsPreview(false)}
            onSubmit={(data) => {
              console.log('Preview submit:', data);
              showNotification('Simulação de envio concluída!', 'success');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-base" style={{ '--primary-form': primaryColor } as any}>
      {/* ✅ FIX: Inputs globais com refs corretos e onChange corretos */}
      <input 
        type="file" 
        ref={headerInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'header')}
      />
      <input 
        type="file" 
        ref={logoInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'logo')}
      />

      {/* Builder Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-base shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-bg-base rounded-xl transition-colors text-text-secondary">
            <ChevronLeft size={20} />
          </button>
          <div className="w-px h-6 bg-border-base" />
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold bg-transparent border-none focus:ring-0 text-text-primary p-0 w-64"
            placeholder=""
          />
        </div>

        <div className="hidden md:flex items-center bg-bg-base p-1 rounded-xl border border-border-base">
          <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary'}`}><Monitor size={18} /></button>
          <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary'}`}><Smartphone size={18} /></button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPreview(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-text-secondary hover:text-accent transition-colors"
          >
            <Eye size={18} /> Visualizar
          </button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <Send size={18} /> 
            {isPublishing ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 bg-surface border-r border-border-base flex flex-col overflow-hidden shrink-0">
          <div className="flex p-1 bg-bg-base m-4 rounded-xl border border-border-base">
            <button onClick={() => setActiveTab('build')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'build' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary'}`}><Layout size={14} /> Construir</button>
            <button onClick={() => setActiveTab('design')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'design' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary'}`}><Palette size={14} /> Estilo</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin">
            {activeTab === 'build' ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Cabeçalho & Logo</h3>
                  <div className="space-y-4 p-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase flex items-center gap-2">Subtítulo (Dica: Use **...** para negrito)</label>
                      <textarea 
                         value={subtitle}
                         onChange={(e) => setSubtitle(e.target.value)}
                         className="w-full p-2 bg-bg-base border border-border-base rounded-lg text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
                         rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Adicionar Campos</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { type: 'text', label: 'Resposta curta', icon: <Type size={16} /> },
                      { type: 'textarea', label: 'Parágrafo', icon: <FileText size={16} /> },
                      { type: 'radio', label: 'Múltipla escolha', icon: <CheckCircle2 size={16} /> },
                      { type: 'checkbox', label: 'Caixas de seleção', icon: <CheckSquare size={16} /> },
                      { type: 'dropdown', label: 'Lista suspensa', icon: <ChevronDown size={16} /> },
                      { type: 'file', label: 'Upload de arquivo', icon: <Upload size={16} /> },
                      { type: 'scale', label: 'Escala linear', icon: <GripVertical size={16} /> },
                      { type: 'rating', label: 'Classificação', icon: <Star size={16} /> },
                      { type: 'grid-radio', label: 'Grade de múltipla escolha', icon: <Layout size={16} /> },
                      { type: 'grid-checkbox', label: 'Grade de caixa de seleção', icon: <Layout size={16} /> },
                      { type: 'date', label: 'Data', icon: <Clock size={16} /> },
                      { type: 'time', label: 'Horário', icon: <Clock size={16} /> },
                      { type: 'signature', label: 'Assinatura', icon: <PenTool size={16} /> },
                    ].map((item) => (
                      <button key={item.type} onClick={() => addField(item.type as FieldType)} className="flex items-center gap-3 p-3 bg-bg-base/50 border border-border-base rounded-card hover:border-accent hover:bg-accent/5 transition-all group text-left">
                        <div className="p-2 bg-surface rounded-lg text-text-secondary group-hover:text-accent transition-colors shadow-sm">{item.icon}</div>
                        <span className="text-sm font-bold text-text-primary">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="space-y-4 p-2">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cor Principal Global</label>
                     <div className="grid grid-cols-5 gap-2">
                       {['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#16a34a', '#0891b2', '#000000', '#6366f1'].map(color => (
                         <button key={color} onClick={() => setPrimaryColor(color)} className={`size-8 rounded-full border-2 transition-all ${primaryColor === color ? 'border-accent scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                       ))}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Modo de Exibição</label>
                     <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => setLayoutType('list')}
                         className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${layoutType === 'list' ? 'border-accent bg-accent/5 text-accent' : 'border-border-base text-text-secondary'}`}
                       >
                         <Layout size={20} />
                         <span className="text-[10px] font-bold uppercase">Lista</span>
                       </button>
                       <button 
                         onClick={() => setLayoutType('step')}
                         className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${layoutType === 'step' ? 'border-accent bg-accent/5 text-accent' : 'border-border-base text-text-secondary'}`}
                       >
                         <Send size={20} />
                         <span className="text-[10px] font-bold uppercase">Passo a Passo</span>
                       </button>
                     </div>
                   </div>

                   {/* ✅ FIX: Botão de Imagem de Capa usando o ref correto */}
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Imagem de Capa</label>
                     <div className="space-y-2">
                       <button 
                        onClick={() => headerInputRef.current?.click()}
                        className="w-full py-2 bg-bg-base border border-dashed border-border-base rounded-lg text-[10px] font-bold text-text-secondary hover:bg-bg-base/80 transition-all flex items-center justify-center gap-2"
                       >
                         <Upload size={14} />
                         Anexar Imagem
                       </button>
                       {headerImage && (
                         <button
                           onClick={() => setHeaderImage('')}
                           className="w-full py-2 text-red-500 text-[10px] font-bold hover:text-red-400 transition-colors"
                         >
                           Remover Capa
                         </button>
                       )}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cor do Título</label>
                     <div className="grid grid-cols-5 gap-2">
                       {['#000000', '#ffffff', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#16a34a', '#0891b2', '#64748b', '#0f172a'].map(color => (
                         <button key={color} onClick={() => setTitleColor(color)} className={`size-8 rounded-full border-2 transition-all ${titleColor === color ? 'border-accent scale-110' : 'border-border-base'}`} style={{ backgroundColor: color }} />
                       ))}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cor do Subtítulo</label>
                     <div className="grid grid-cols-5 gap-2">
                       {['#64748b', '#94a3b8', '#ffffff', '#000000', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#16a34a', '#0891b2'].map(color => (
                         <button key={color} onClick={() => setSubtitleColor(color)} className={`size-8 rounded-full border-2 transition-all ${subtitleColor === color ? 'border-accent scale-110' : 'border-border-base'}`} style={{ backgroundColor: color }} />
                       ))}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Arredondamento</label>
                     <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'none', label: 'Quadrado' },
                          { id: 'large', label: 'Arredondado' },
                          { id: '3xl', label: 'Muito Arredondado' },
                        ].map(r => (
                          <button 
                            key={r.id} 
                            onClick={() => setBorderRadius(r.id as any)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${borderRadius === r.id ? 'border-accent bg-accent/5 text-accent' : 'border-border-base text-text-secondary'}`}
                          >
                            <span className="text-xs font-bold">{r.label}</span>
                          </button>
                        ))}
                     </div>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </aside>

        {/* Builder Canvas */}
        <main className="flex-1 overflow-y-auto p-12 bg-bg-base/50 flex justify-center scrollbar-thin">
          <div className={`${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'} transition-all duration-500 ease-in-out`}>
             {/* Header Image */}
             <div
               className="relative overflow-hidden shadow-md mb-4 group cursor-pointer min-h-[160px] w-full bg-bg-base border border-border-base flex items-center justify-center p-0"
               style={{ borderRadius: borderRadius === 'none' ? '0' : '0.75rem' }}
               onClick={() => !showImageInput && !isUploadingHeader && setShowImageInput(true)}
             >
               {isUploadingHeader ? (
                  <div className="flex flex-col items-center gap-3 text-accent animate-pulse">
                    <Upload size={32} className="animate-bounce" />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Enviando imagem...</span>
                  </div>
               ) : headerImage ? (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <img src={headerImage} alt="Banner" className="w-full h-full object-cover" />
                 </div>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                   <div className="flex flex-col items-center gap-2">
                     <Upload size={32} strokeWidth={1.5} />
                     <span className="text-xs font-bold uppercase tracking-widest text-[8px]">Adicionar Capa</span>
                   </div>
                 </div>
               )}

               {/* ✅ FIX: Overlay usa headerInputRef correto */}
               {showImageInput && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full max-w-xs flex flex-col gap-3">
                      <button 
                        onClick={() => headerInputRef.current?.click()}
                        className="w-full py-3 bg-surface text-text-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-bg-base transition-all"
                      >
                        <Upload size={18} />
                        Anexar Imagem
                      </button>

                      <button
                        onClick={() => setShowImageInput(false)}
                        className="w-full py-2 bg-accent text-white text-xs font-bold rounded-xl hover:opacity-90 transition-colors"
                      >
                        Concluído
                      </button>

                      {headerImage && (
                        <button
                          onClick={() => { setHeaderImage(''); setShowImageInput(false); }}
                          className="w-full py-2 text-red-500 text-xs font-bold hover:text-red-400 transition-colors"
                        >
                          Remover Imagem
                        </button>
                      )}
                    </div>
                 </div>
               )}
             </div>

             {/* Title Card */}
             <div 
               className="bg-surface shadow-md p-8 mb-8 border border-border-base relative"
               style={{ borderRadius: borderRadius === 'none' ? '0' : '0.75rem' }}
             >
               {/* ✅ FIX: Logo usa logoInputRef correto, sem input duplicado inline */}
               <div className="mb-6 flex justify-start">
                 <div 
                   className="relative size-20 rounded-2xl border-2 border-dashed border-border-base flex items-center justify-center cursor-pointer hover:bg-bg-base transition-all overflow-hidden group"
                   onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                 >
                   {isUploadingLogo ? (
                     <div className="flex flex-col items-center gap-1 text-accent animate-pulse">
                       <Upload size={16} className="animate-bounce" />
                       <span className="text-[8px] font-bold uppercase">Enviando...</span>
                     </div>
                        ) : logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                     <div className="flex flex-col items-center gap-1 text-text-secondary">
                       <Upload size={16} />
                       <span className="text-[8px] font-bold uppercase">Logo</span>
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Upload size={16} className="text-white" />
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <input
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   className="w-full text-4xl font-bold bg-transparent border-none outline-none leading-tight cursor-text focus:border-b focus:border-border-base transition-all text-text-primary"
                   style={{ color: titleColor }}
                   placeholder=""
                 />
                 <div className="h-px bg-border-base w-full" />
                 <textarea
                   value={subtitle}
                   onChange={(e) => setSubtitle(e.target.value)}
                   className="w-full text-sm bg-transparent border-none outline-none cursor-text resize-none min-h-[60px] text-text-secondary"
                   style={{ color: subtitleColor }}
                   placeholder=""
                 />
               </div>
             </div>

            <div className="space-y-4 pb-24">
              <AnimatePresence>
                {fields.map((field, index) => (
                  <SortableField 
                    key={field.id} field={field} index={index}
                    isSelected={selectedFieldId === field.id}
                    borderRadius={borderRadius}
                    onSelect={() => setSelectedFieldId(field.id)}
                    onRemove={removeField}
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    renderText={renderText}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 bg-surface border-l border-border-base p-6 overflow-y-auto shrink-0">
          {selectedField ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Configurar Campo</h3>
                <button onClick={() => removeField(selectedField.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Texto da Pergunta</label>
                  <input 
                    value={selectedField.label} 
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })} 
                    className="w-full px-4 py-3 bg-bg-base border border-border-base rounded-xl text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cor deste Quadrado</label>
                  <div className="flex flex-wrap gap-2">
                    {[undefined, '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#16a34a', '#f59e0b'].map(c => (
                      <button 
                         key={c || 'global'} 
                         onClick={() => updateField(selectedField.id, { customColor: c })}
                         className={`size-7 rounded-full border-2 transition-all ${selectedField.customColor === c ? 'border-accent scale-110' : 'border-transparent'}`}
                         style={{ backgroundColor: c || primaryColor }}
                      >
                        {!c && <div className="w-full h-full flex items-center justify-center bg-white/20 text-[10px] font-bold text-white">G</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {(selectedField.type === 'radio' || selectedField.type === 'checkbox' || selectedField.type === 'dropdown') && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Opções da Lista</label>
                    <div className="space-y-2">
                      {selectedField.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input 
                            value={opt} 
                            onChange={(e) => {
                              const newOpts = [...(selectedField.options || [])];
                              newOpts[i] = e.target.value;
                              updateField(selectedField.id, { options: newOpts });
                            }}
                            className="flex-1 px-3 py-2 bg-bg-base border border-border-base rounded-lg text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
                          />
                          <button 
                            onClick={() => {
                              const newOpts = (selectedField.options || []).filter((_, idx) => idx !== i);
                              updateField(selectedField.id, { options: newOpts });
                            }}
                            className="p-1.5 text-text-secondary hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateField(selectedField.id, { options: [...(selectedField.options || []), `Nova Opção ${(selectedField.options?.length || 0) + 1}` ] })}
                        className="w-full py-2 border-2 border-dashed border-border-base rounded-lg text-[10px] font-bold text-text-secondary hover:border-accent hover:text-accent transition-all"
                      >
                        + Adicionar Opção
                      </button>
                    </div>
                  </div>
                )}

                {(selectedField.type === 'grid-radio' || selectedField.type === 'grid-checkbox') && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Linhas (Rows)</label>
                      <div className="space-y-2">
                        {selectedField.rows?.map((row, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input 
                              value={row} 
                              onChange={(e) => {
                                const newRows = [...(selectedField.rows || [])];
                                newRows[i] = e.target.value;
                                updateField(selectedField.id, { rows: newRows });
                              }}
                              className="flex-1 px-3 py-2 bg-bg-base border border-border-base rounded-lg text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
                            />
                            <button 
                              onClick={() => {
                                const newRows = (selectedField.rows || []).filter((_, idx) => idx !== i);
                                updateField(selectedField.id, { rows: newRows });
                              }}
                              className="p-1.5 text-text-secondary hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => updateField(selectedField.id, { rows: [...(selectedField.rows || []), `Nova Linha ${(selectedField.rows?.length || 0) + 1}` ] })}
                          className="w-full py-2 border-2 border-dashed border-border-base rounded-lg text-[10px] font-bold text-text-secondary hover:border-accent hover:text-accent transition-all"
                        >
                          + Adicionar Linha
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Colunas (Columns)</label>
                      <div className="space-y-2">
                        {selectedField.columns?.map((col, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input 
                              value={col} 
                              onChange={(e) => {
                                const newCols = [...(selectedField.columns || [])];
                                newCols[i] = e.target.value;
                                updateField(selectedField.id, { columns: newCols });
                              }}
                              className="flex-1 px-3 py-2 bg-bg-base border border-border-base rounded-lg text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
                            />
                            <button 
                              onClick={() => {
                                const newCols = (selectedField.columns || []).filter((_, idx) => idx !== i);
                                updateField(selectedField.id, { columns: newCols });
                              }}
                              className="p-1.5 text-text-secondary hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => updateField(selectedField.id, { columns: [...(selectedField.columns || []), `Nova Coluna ${(selectedField.columns?.length || 0) + 1}` ] })}
                          className="w-full py-2 border-2 border-dashed border-border-base rounded-lg text-[10px] font-bold text-text-secondary hover:border-accent hover:text-accent transition-all"
                        >
                          + Adicionar Coluna
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                   onClick={() => updateField(selectedField.id, { required: !selectedField.required })} 
                   className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedField.required ? 'border-accent bg-accent/5 text-accent' : 'border-border-base text-text-secondary'}`}
                >
                  <span className="text-xs font-bold">Campo Obrigatório</span>
                  <div className={`size-5 rounded flex items-center justify-center transition-colors ${selectedField.required ? 'bg-accent text-white' : 'bg-bg-base'}`}>
                    <CheckSquare size={14} />
                  </div>
                </button>
              </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
               <div className="size-16 bg-bg-base rounded-3xl flex items-center justify-center">
                 <Settings size={32} className="text-text-secondary" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Selecione um campo para editar</p>
             </div>
          )}
        </aside>
      </div>
    </div>
  );
};