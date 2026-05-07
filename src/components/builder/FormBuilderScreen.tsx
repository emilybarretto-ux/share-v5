import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Settings, Save, Eye, Trash2, 
  ChevronLeft, Layout, Palette, Send, Type, Smartphone, Monitor, RefreshCcw,
  CheckCircle2, Star, PenTool, ArrowRight, GitBranch, Sparkles, Wand2,
  CheckSquare, X, Upload, FileText, ChevronDown, GripVertical, Clock, Check,
  Bot, Zap, MessageSquare
} from 'lucide-react';
import { GoogleGenAI, Type as GeminiType } from "@google/genai";
import { FormField, FieldType, ChatMessage } from '../../types';
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

import { FormSuccessScreen } from '../screens/FormSuccessScreen';

export const FormBuilderScreen = ({ onBack, onPreview, key }: { onBack: () => void, onPreview: (form: any) => void, key?: string }) => {
  const [editMode, setEditMode] = useState<'manual' | 'ai'>('ai');
  const [fields, setFields] = useState<FormField[]>([]);
  const [lastPublishedId, setLastPublishedId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
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
  
  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Advanced Features State
  const [redirectUrl, setRedirectUrl] = useState('');
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState<number>(3); // default 3 min
  const [themePreset, setThemePreset] = useState<'default' | 'dark' | 'minimal' | 'enterprise' | 'vibrant' | 'glass'>('default');
  
  // ✅ FIX: Refs com nomes corretos e únicos
  const headerInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  
  // Design Settings
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [titleColor, setTitleColor] = useState('#0f172a');
  const [subtitleColor, setSubtitleColor] = useState('#64748b');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [layoutType, setLayoutType] = useState<'list' | 'step'>('list');
  const [borderRadius, setBorderRadius] = useState<'none' | 'large' | '3xl'>('large');

  const { showNotification } = useNotification();
  
  const selectedField = fields.find(f => f.id === selectedFieldId);

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
        if (draft.redirectUrl) setRedirectUrl(draft.redirectUrl);
        if (draft.showProgressBar !== undefined) setShowProgressBar(draft.showProgressBar);
        if (draft.estimatedTime) setEstimatedTime(draft.estimatedTime);
        if (draft.themePreset) setThemePreset(draft.themePreset);
      } catch (e) {
        console.error('Erro ao carregar rascunho:', e);
      }
    }
  }, []);

  useEffect(() => {
    const draft = {
      fields, title, subtitle, headerImage, logoUrl,
      primaryColor, titleColor, subtitleColor, fontFamily,
      layoutType, borderRadius, redirectUrl, showProgressBar, themePreset, estimatedTime
    };
    localStorage.setItem('form_builder_draft', JSON.stringify(draft));
  }, [fields, title, subtitle, headerImage, logoUrl, primaryColor, titleColor, subtitleColor, fontFamily, layoutType, borderRadius, redirectUrl, showProgressBar, themePreset, estimatedTime]);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      label: type === 'section' ? 'Nova Seção' : `Sua Pergunta aqui...`,
      placeholder: type === 'section' ? '' : 'Insira sua resposta aqui...',
      required: false,
      options: type === 'radio' || type === 'checkbox' || type === 'dropdown' ? ['Opção 1', 'Opção 2'] : undefined,
      rows: type === 'grid-radio' || type === 'grid-checkbox' ? ['Linha 1', 'Linha 2'] : undefined,
      columns: type === 'grid-radio' || type === 'grid-checkbox' ? ['Coluna 1', 'Coluna 2', 'Coluna 3'] : undefined,
      mask: 'none',
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    showNotification(`Campo adicionado!`, 'success');
  };

  const generateAIImage = async (fieldId: string, prompt: string) => {
    try {
      showNotification('IA está gerando imagem...', 'info');
      // Use fallback if tools are not available, but here I'll use a seed based on prompt
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://picsum.photos/seed/${seed}/800/450`;
      updateField(fieldId, { imageUrl: url });
      showNotification('Imagem gerada!', 'success');
    } catch (e) {
      showNotification('Erro ao gerar imagem.', 'error');
    }
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleGenerateWithAI = async (promptOverride?: string) => {
    const promptToSend = typeof promptOverride === 'string' ? promptOverride : aiPrompt;
    if (!promptToSend || typeof promptToSend !== 'string' || !promptToSend.trim()) {
      showNotification('Descreva o que você precisa no formulário.', 'info');
      return;
    }

    try {
      setIsGeneratingAI(true);
      
      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        content: promptToSend,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, userMessage]);
      setAiPrompt('');

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Chave da API Gemini não configurada.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Build context of current form
      const currentFormContext = {
        title,
        subtitle,
        theme: themePreset,
        headerImage,
        logoUrl,
        fields: fields.map(f => ({
          type: f.type,
          label: f.label,
          required: f.required,
          options: f.options,
          id: f.id,
          logic: f.logic
        }))
      };

      const systemInstruction = `Você é um especialista em UX e design de formulários. 
      Sua tarefa é criar ou ATUALIZAR um formulário baseado no desejo do usuário.
      O formulário atual é: ${JSON.stringify(currentFormContext)}

      REGRAS:
      1. Se o usuário pedir algo novo, crie a estrutura do zero ou adicione ao que já existe.
      2. Se o usuário pedir alterações ("mude a cor", "adicione um campo de telefone", "remova o campo X"), aplique as mudanças no JSON.
      3. SEMPRE retorne um JSON completo e válido no formato especificado.
      4. Use IDs semânticos e únicos. Importante: se você criar Seções ('section'), use-as para agrupar campos logiacamente.
      5. Lógica: "show" oculta o alvo por padrão. Alvo ('targetId') deve ser o ID de outro campo.
      6. Se o usuário apenas conversar, responda amigavelmente mas SEMPRE inclua o JSON do formulário (atualizado ou mantido) no final da sua resposta.
      7. CAPA E LOGO: Se o usuário pedir para mudar a capa ou logo (ou fornecer um link de imagem), use os campos "headerImage" e "logoUrl" no JSON. NÃO coloque a URL da imagem no título ou subtítulo. Link de imagem enviado pelo usuário deve ir para o campo correspondente.

      Formato JSON esperado:
      {
        "responseText": "Explicação do que você fez ou resposta ao usuário",
        "form": {
          "title": "Título",
          "subtitle": "Subtítulo",
          "headerImage": "URL da capa",
          "logoUrl": "URL do logo",
          "theme": "default | dark | minimal | enterprise | vibrant | glass",
          "fields": [
             {
               "id": "id_unico",
               "type": "text | textarea | radio | checkbox | dropdown | date | rating | scale | heading | section | image",
               "label": "Pergunta",
               "required": true,
               "options": [],
               "logic": []
             }
          ]
        }
      }`;

      // Prepare contents with history
      const contents = chatMessages.slice(-5).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: promptToSend }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      const resultText = response.text || '';
      let data;
      try {
        data = JSON.parse(resultText);
      } catch (e) {
        console.error('Failed to parse AI JSON', resultText);
        throw new Error('Erro ao processar resposta da IA.');
      }

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'model',
        content: data.responseText || 'Aqui está a atualização solicitada.',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      if (data.form) {
        const formData = data.form;
        
        if (formData.fields) {
          const newFields = formData.fields.map((f: any) => {
            const existing = fields.find(ef => ef.label === f.label && ef.type === f.type);
            return {
              ...f,
              id: existing?.id || f.id || Math.random().toString(36).substring(2, 9),
              mask: f.mask || 'none'
            };
          });

          setFields(newFields);
        }
        
        if (formData.title) setTitle(formData.title);
        if (formData.subtitle) setSubtitle(formData.subtitle);
        if (formData.theme) setThemePreset(formData.theme);
        if (formData.headerImage !== undefined) setHeaderImage(formData.headerImage);
        if (formData.logoUrl !== undefined) setLogoUrl(formData.logoUrl);
      }

      showNotification('IA atualizou seu formulário!', 'success');

    } catch (error: any) {
      console.error('AI Error:', error);
      showNotification(error.message || 'Erro na comunicação com a IA.', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

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
        const filePath = `${type}s/${fileName}`; 

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
        const reader = new FileReader();
        reader.onloadend = () => {
          setter(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        loader(false);
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
              successMessage: 'Obrigado por responder!',
              redirectUrl,
              showProgressBar,
              estimatedTime,
              themePreset
            },
            status: 'published'
          }
        ]);

      if (error) {
        showNotification(`Erro ao publicar: ${error.message}`, 'error');
        return;
      }

      setLastPublishedId(formId);
      setShowSuccess(true);
      showNotification('Formulário publicado com sucesso!', 'success');
      localStorage.removeItem('form_builder_draft');
    } catch (err: any) {
      console.error('Erro ao publicar:', err);
      showNotification('Erro ao publicar formulário.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const resetForm = () => {
    if (confirm('Tem certeza que deseja limpar todo o rascunho e recomeçar do zero?')) {
      setFields([]);
      setTitle('Título');
      setSubtitle('Subtítulo aqui');
      setHeaderImage('');
      setLogoUrl('');
      setThemePreset('default');
      setRedirectUrl('');
      localStorage.removeItem('form_builder_draft');
      showNotification('Rascunho reiniciado.', 'info');
    }
  };

  const themes = {
    default: { bg: 'bg-bg-base/50', card: 'bg-surface border-border-base' },
    dark: { bg: 'bg-slate-950/90', card: 'bg-slate-900 border-slate-700' },
    minimal: { bg: 'bg-neutral-50', card: 'bg-white border-slate-100 shadow-sm' },
    enterprise: { bg: 'bg-[#f1f5f9]', card: 'bg-white border-slate-200 shadow-sm' },
    vibrant: { bg: 'bg-pink-50/50', card: 'bg-white border-pink-100 shadow-lg shadow-pink-500/5' },
    glass: { bg: 'bg-indigo-950/80', card: 'bg-white/10 backdrop-blur-xl border-white/20' }
  };
  const previewThemeStyles = themes[themePreset as keyof typeof themes] || themes.default;

  if (showSuccess && lastPublishedId) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <FormSuccessScreen 
          formId={lastPublishedId}
          title={title}
          onBack={onBack}
        />
      </div>
    );
  }

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
                successMessage: 'Obrigado por responder!',
                redirectUrl,
                showProgressBar,
                estimatedTime,
                themePreset
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

        <div className="flex items-center gap-6">
          <div className="flex p-1 bg-bg-base border border-border-base rounded-xl">
            <button
              onClick={() => setEditMode('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editMode === 'ai' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Bot size={14} /> Modo Chat
            </button>
            <button
              onClick={() => setEditMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editMode === 'manual' ? 'bg-white text-accent shadow-sm border border-border-base/50' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Settings size={14} /> Manual
            </button>
          </div>

          <div className="hidden md:flex items-center bg-bg-base p-1 rounded-xl border border-border-base">
            <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary'}`}><Monitor size={18} /></button>
            <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary'}`}><Smartphone size={18} /></button>
          </div>
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
          >
            <Send size={18} /> 
            {isPublishing ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {editMode === 'ai' ? (
          <div className="flex-1 flex w-full">
            {/* AI CHAT SIDEBAR */}
            <aside className="w-[400px] bg-surface border-r border-border-base flex flex-col shrink-0">
              <div className="p-4 border-b border-border-base bg-indigo-500/5">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Bot size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">IA Assistente Conversacional</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin flex flex-col h-full">
                <div className="flex-1 space-y-4 pb-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="size-20 bg-indigo-500/10 text-indigo-500 rounded-[2rem] flex items-center justify-center mb-6 animate-pulse">
                        <Sparkles size={40} />
                      </div>
                      <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-2">Como posso ajudar hoje?</h3>
                      <p className="text-[11px] text-text-secondary leading-relaxed max-w-[240px] mx-auto italic">
                        "Crie um formulário de NPS para meus clientes"<br/>
                        "Quero um formulário de reserva de spa com tema dark"<br/>
                        "Adicione um campo para anexar arquivos no final"
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] p-4 rounded-3xl text-[11px] shadow-sm leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-indigo-500 text-white rounded-tr-none' 
                            : 'bg-bg-base text-text-primary border border-border-base rounded-tl-none font-medium'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isGeneratingAI && (
                    <div className="flex items-center gap-2 text-indigo-500 animate-pulse ml-2">
                      <div className="size-2 bg-current rounded-full" />
                      <div className="size-2 bg-current rounded-full" style={{ animationDelay: '0.2s' }} />
                      <div className="size-2 bg-current rounded-full" style={{ animationDelay: '0.4s' }} />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="pt-4 border-t border-border-base/50">
                  <div className="relative">
                    <textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerateWithAI();
                        }
                      }}
                      placeholder="Descreva o que você quer construir..."
                      className="w-full p-4 pr-14 bg-bg-base border border-border-base rounded-[2rem] text-[11px] text-text-primary focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] max-h-[150px] resize-none shadow-inner"
                    />
                    <button 
                      onClick={() => handleGenerateWithAI()}
                      disabled={isGeneratingAI || !aiPrompt.trim()}
                      className="absolute bottom-3 right-3 p-3 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-90 disabled:opacity-50"
                    >
                      {isGeneratingAI ? <RefreshCcw size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between px-2">
                    <p className="text-[9px] font-bold text-text-secondary/60 uppercase tracking-widest">Shift+Enter para nova linha</p>
                    {chatMessages.length > 0 && (
                      <button onClick={() => setChatMessages([])} className="text-[9px] font-black text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors">Reiniciar Chat</button>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* LIVE PREVIEW AREA (AI MODE) */}
            <main className={`flex-1 overflow-y-auto p-12 transition-colors duration-500 ${previewThemeStyles.bg} scrollbar-thin`}>
              <div className={`mx-auto ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'} transition-all duration-500`}>
                <div className={`shadow-inner p-10 bg-surface rounded-[4rem] border border-border-base shadow-2xl relative min-h-[700px]`}>
                  <FormRenderer 
                    form={{
                      id: 'preview-ai',
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
                        successMessage: 'Obrigado por responder!',
                        redirectUrl,
                        showProgressBar,
                        estimatedTime,
                        themePreset
                      }
                    }}
                    onBack={() => {}}
                    onSubmit={(data) => {
                      console.log('AI Preview Submit:', data);
                      showNotification('Simulação enviada com sucesso!', 'success');
                    }}
                  />
                  {fields.length === 0 && !isGeneratingAI && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-12">
                      <div className="text-center space-y-4 max-w-xs">
                        <div className="size-20 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Bot size={40} className="animate-bounce" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary capitalize tracking-tighter">Sua criação aparecerá aqui</h3>
                        <p className="text-sm text-text-secondary italic">Envie sua primeira mensagem para começar o formulário.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        ) : (
          <>
            {/* MANUAL MODE SIDEBAR (L) */}
            <aside className="w-80 bg-surface border-r border-border-base flex flex-col overflow-hidden shrink-0">
          <div className="flex p-1 bg-bg-base m-4 rounded-xl border border-border-base">
            <button onClick={() => setActiveTab('build')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold transition-all ${activeTab === 'build' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary'}`}><Layout size={12} /> Construir</button>
            <button onClick={() => setActiveTab('design')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold transition-all ${activeTab === 'design' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary'}`}><Palette size={12} /> Estilo</button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold transition-all ${activeTab === 'settings' ? 'bg-surface shadow-sm text-accent' : 'text-text-secondary'}`}><Settings size={12} /> Ajustes</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin">
            {activeTab === 'build' ? (
              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Cabeçalho & Logo</h3>
                    <button 
                      onClick={resetForm}
                      className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                    >
                      Limpar Base
                    </button>
                  </div>
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
                      { type: 'image', label: 'Imagem', icon: <Plus size={16} /> },
                    ].map((item) => (
                      <button key={item.type} onClick={() => addField(item.type as FieldType)} className="flex items-center gap-3 p-3 bg-bg-base/50 border border-border-base rounded-card hover:border-accent hover:bg-accent/5 transition-all group text-left">
                        <div className="p-2 bg-surface rounded-lg text-text-secondary group-hover:text-accent transition-colors shadow-sm">{item.icon}</div>
                        <span className="text-sm font-bold text-text-primary">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'design' ? (
              <div className="space-y-6">
                 <div className="space-y-4 p-2">
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Temas Prontos</label>
                       <div className="grid grid-cols-2 gap-3">
                         {[
                           { id: 'default', label: 'Padrão', colors: ['#2563eb', '#ffffff', '#f8fafc'] },
                           { id: 'dark', label: 'Dark Mode', colors: ['#6366f1', '#0f172a', '#1e293b'] },
                           { id: 'enterprise', label: 'Executivo', colors: ['#0f172a', '#f8fafc', '#ffffff'] },
                           { id: 'vibrant', label: 'Vibrante', colors: ['#db2777', '#fff1f2', '#ffffff'] },
                           { id: 'glass', label: 'Glassmorphism', colors: ['#ffffff', '#6366f1', '#4f46e5'] },
                         ].map(t => (
                           <button 
                             key={t.id} 
                             onClick={() => {
                               setThemePreset(t.id as any);
                               if (t.id === 'default') { setPrimaryColor('#2563eb'); setTitleColor('#0f172a'); setSubtitleColor('#64748b'); setBorderRadius('large'); }
                               if (t.id === 'dark') { setPrimaryColor('#6366f1'); setTitleColor('#ffffff'); setSubtitleColor('#94a3b8'); setBorderRadius('large'); }
                               if (t.id === 'enterprise') { setPrimaryColor('#0f172a'); setTitleColor('#0f172a'); setSubtitleColor('#64748b'); setBorderRadius('none'); }
                               if (t.id === 'vibrant') { setPrimaryColor('#db2777'); setTitleColor('#0f172a'); setSubtitleColor('#64748b'); setBorderRadius('3xl'); }
                               if (t.id === 'glass') { setPrimaryColor('#ffffff'); setTitleColor('#ffffff'); setSubtitleColor('#cbd5e1'); setBorderRadius('large'); }
                             }}
                             className={`group relative flex flex-col items-start gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 text-left shadow-sm ${
                               themePreset === t.id 
                                 ? 'border-accent bg-accent/5' 
                                 : 'border-border-base bg-surface hover:border-text-secondary/30'
                             }`}
                           >
                             <div className="flex gap-1.5">
                               {t.colors.map((c, i) => (
                                 <div key={i} className="size-3.5 rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: c }} />
                               ))}
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-wider ${themePreset === t.id ? 'text-accent' : 'text-text-primary'}`}>
                               {t.label}
                             </span>
                             {themePreset === t.id && (
                               <div className="absolute top-2 right-2 text-accent">
                                 <CheckCircle2 size={12} />
                               </div>
                             )}
                           </button>
                         ))}
                       </div>
                     </div>

                     {layoutType === 'step' && (
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Interatividade</label>
                         <button 
                           onClick={() => setShowProgressBar(!showProgressBar)}
                           className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all active:scale-95 ${showProgressBar ? 'border-accent bg-accent/5 text-accent' : 'border-border-base text-text-secondary'}`}
                         >
                           <span className="text-[10px] font-bold">Barra de Progresso</span>
                           <div className={`size-4 rounded-lg border-2 flex items-center justify-center transition-all ${showProgressBar ? 'bg-accent border-accent text-white' : 'bg-bg-base border-border-base'}`}>
                             {showProgressBar && <CheckCircle2 size={12} strokeWidth={3} />}
                           </div>
                         </button>
                       </div>
                     )}

                     <div className="space-y-4 pt-2">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cores de Texto</label>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <span className="text-[9px] font-bold text-text-secondary uppercase">Título</span>
                             <div className="flex flex-wrap gap-1.5">
                               {['#000000', '#ffffff', '#2563eb', '#64748b'].map(color => (
                                 <button key={color} onClick={() => setTitleColor(color)} className={`size-6 rounded-lg border-2 transition-all ${titleColor === color ? 'border-accent scale-110' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: color }} />
                               ))}
                             </div>
                           </div>
                           <div className="space-y-2">
                             <span className="text-[9px] font-bold text-text-secondary uppercase">Subtítulo</span>
                             <div className="flex flex-wrap gap-1.5">
                               {['#64748b', '#94a3b8', '#ffffff', '#000000'].map(color => (
                                 <button key={color} onClick={() => setSubtitleColor(color)} className={`size-6 rounded-lg border-2 transition-all ${subtitleColor === color ? 'border-accent scale-110' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: color }} />
                               ))}
                             </div>
                           </div>
                         </div>
                       </div>

                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cor de Destaque</label>
                         <div className="flex flex-wrap gap-2">
                           {['#2563eb', '#6366f1', '#7c3aed', '#db2777', '#dc2626', '#10b981', '#0891b2', '#0f172a', '#ffffff'].map(color => (
                             <button key={color} onClick={() => setPrimaryColor(color)} className={`size-8 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${primaryColor === color ? 'border-accent ring-2 ring-accent/20' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: color }} />
                           ))}
                         </div>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Modo de Exibição</label>
                       <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setLayoutType('list')}
                           className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${layoutType === 'list' ? 'border-accent bg-accent/5 text-accent font-black' : 'border-border-base text-text-secondary bg-surface'}`}
                         >
                           <Layout size={20} />
                           <span className="text-[10px] uppercase tracking-widest">Lista Única</span>
                         </button>
                         <button 
                           onClick={() => setLayoutType('step')}
                           className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${layoutType === 'step' ? 'border-accent bg-accent/5 text-accent font-black' : 'border-border-base text-text-secondary bg-surface'}`}
                         >
                           <Send size={20} />
                           <span className="text-[10px] uppercase tracking-widest">Passo a Passo</span>
                         </button>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Identidade</label>
                       <button 
                         onClick={() => headerInputRef.current?.click()}
                         className="w-full flex items-center justify-center gap-2 p-3 bg-surface border-2 border-dashed border-border-base rounded-2xl text-[10px] font-black text-text-secondary hover:border-accent hover:text-accent transition-all active:scale-95"
                       >
                         <Upload size={14} />
                         CAPA / BANNER
                       </button>
                       {headerImage && (
                         <button onClick={() => setHeaderImage('')} className="w-full mt-1 py-1.5 text-[8px] font-black uppercase text-red-500 hover:text-red-400">Remover Imagem</button>
                       )}
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Arredondamento</label>
                       <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'none', label: 'Reta', radius: '0.125rem' },
                            { id: 'large', label: 'Suave', radius: '0.75rem' },
                            { id: '3xl', label: 'Curva', radius: '1.25rem' },
                          ].map(r => (
                            <button 
                              key={r.id} 
                              onClick={() => setBorderRadius(r.id as any)}
                              className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all active:scale-95 ${borderRadius === r.id ? 'border-accent bg-accent/5 text-accent font-black' : 'border-border-base text-text-secondary bg-surface'}`}
                            >
                              <div className="size-5 border-2 border-current" style={{ borderRadius: r.radius }} />
                              <span className="text-[9px] uppercase tracking-widest">{r.label}</span>
                            </button>
                          ))}
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4 p-4">
                   <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Geral</h3>
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-text-secondary uppercase">Redirecionar após enviar (URL)</label>
                     <input 
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="https://seusite.com/obrigado"
                        className="w-full p-3 bg-bg-base border border-border-base rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-bold text-text-secondary uppercase">Tempo Estimado (minutos)</label>
                     <input 
                        type="number"
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
                        className="w-full p-3 bg-bg-base border border-border-base rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
                     />
                   </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className={`flex-1 overflow-y-auto p-12 flex justify-center scrollbar-thin transition-colors duration-500 ${previewThemeStyles.bg}`}>
          <div className={`${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'} transition-all duration-500 ease-in-out`}>
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
                  <img src={headerImage} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                  <div className="flex flex-col items-center gap-2 text-text-secondary">
                    <Upload size={32} strokeWidth={1.5} />
                    <span className="text-xs font-bold uppercase tracking-widest text-[8px]">Adicionar Capa</span>
                  </div>
               )}

               {showImageInput && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full max-w-xs flex flex-col gap-3">
                      <button 
                        onClick={() => headerInputRef.current?.click()}
                        className="w-full py-3 bg-white text-text-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-bg-base transition-all"
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

             <div className={`shadow-md p-8 mb-8 border relative transition-all duration-500 ${previewThemeStyles.card}`} style={{ borderRadius: borderRadius === 'none' ? '0' : '0.75rem' }}>
                <div className="mb-6 flex justify-start">
                  <div className="relative size-20 rounded-2xl border-2 border-dashed border-border-base flex items-center justify-center cursor-pointer hover:bg-bg-base transition-all overflow-hidden group" onClick={() => !isUploadingLogo && logoInputRef.current?.click()}>
                    {isUploadingLogo ? (
                      <Upload size={16} className="animate-bounce" />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Upload size={16} />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-4xl font-bold bg-transparent border-none outline-none text-text-primary"
                    style={{ color: titleColor }}
                    placeholder="Título"
                  />
                  <div className="h-px bg-border-base w-full" />
                  <textarea
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full text-sm bg-transparent border-none outline-none resize-none min-h-[60px] text-text-secondary"
                    style={{ color: subtitleColor }}
                    placeholder="Descrição do formulário..."
                  />
                </div>
             </div>

              <div className="space-y-4 pb-24">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <button 
                    onClick={() => addField('text')}
                    className="py-6 border-4 border-dashed border-border-base rounded-3xl flex flex-col items-center gap-3 text-text-secondary hover:border-accent hover:text-accent hover:bg-accent/5 transition-all group shadow-sm bg-surface"
                  >
                    <div className="p-3 bg-bg-base rounded-2xl group-hover:bg-accent group-hover:text-white transition-all"><Plus size={24} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Adicionar Pergunta</span>
                  </button>

                  <button 
                    onClick={() => addField('section')}
                    className="py-6 border-4 border-dashed border-border-base rounded-3xl flex flex-col items-center gap-3 text-text-secondary hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all group shadow-sm bg-surface"
                  >
                    <div className="p-3 bg-bg-base rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><Layout size={24} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Nova Seção</span>
                  </button>
                </div>
              </div>
          </div>
        </main>

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

                {selectedField.type === 'image' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">URL da Imagem</label>
                    <div className="flex gap-2">
                      <input 
                        value={selectedField.imageUrl || ''} 
                        onChange={(e) => updateField(selectedField.id, { imageUrl: e.target.value })} 
                        className="flex-1 px-4 py-3 bg-bg-base border border-border-base rounded-xl text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent" 
                        placeholder="https://..."
                      />
                      <button 
                         onClick={() => generateAIImage(selectedField.id, selectedField.label)}
                         className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                         title="IA Sugere Imagem"
                      >
                         <Sparkles size={16} />
                      </button>
                    </div>
                    {selectedField.imageUrl && (
                      <div className="relative group">
                        <img src={selectedField.imageUrl} className="w-full h-32 object-cover rounded-xl border border-border-base" referrerPolicy="no-referrer" />
                        <button onClick={() => updateField(selectedField.id, { imageUrl: '' })} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {['text', 'tel', 'email', 'number', 'url'].includes(selectedField.type) && (
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Formato de Entrada</label>
                     <select 
                        value={selectedField.mask || 'none'} 
                        onChange={(e) => updateField(selectedField.id, { mask: e.target.value as any })} 
                        className="w-full px-4 py-3 bg-bg-base border border-border-base rounded-xl text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer"
                      >
                        <option value="none" className="bg-surface text-text-primary">Nenhuma</option>
                        <option value="cpf" className="bg-surface text-text-primary">CPF</option>
                        <option value="cnpj" className="bg-surface text-text-primary">CNPJ</option>
                        <option value="tel" className="bg-surface text-text-primary">WhatsApp/Tel</option>
                        <option value="cep" className="bg-surface text-text-primary">CEP</option>
                     </select>
                   </div>
                )}

                {(selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Opções & Imagens</label>
                    {selectedField.options?.map((opt, i) => (
                      <div key={i} className="space-y-2 p-3 bg-bg-base border border-border-base rounded-xl">
                        <div className="flex items-center gap-2">
                          <input 
                            value={opt} 
                            onChange={(e) => {
                              const newOpts = [...(selectedField.options || [])];
                              newOpts[i] = e.target.value;
                              updateField(selectedField.id, { options: newOpts });
                            }}
                            className="flex-1 bg-transparent text-xs font-bold text-text-primary outline-none" 
                          />
                          <button className="text-text-secondary hover:text-red-400 p-1" onClick={() => updateField(selectedField.id, { options: selectedField.options?.filter((_, idx) => idx !== i) })}><X size={14} /></button>
                        </div>
                        <input 
                           placeholder="URL da Imagem"
                           value={selectedField.imageOptions?.[opt] || ''}
                           onChange={(e) => {
                              const current = selectedField.imageOptions || {};
                              updateField(selectedField.id, { imageOptions: { ...current, [opt]: e.target.value } });
                           }}
                           className="w-full p-2 bg-surface/50 border border-border-base rounded-lg text-[9px] text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    ))}
                    <button onClick={() => updateField(selectedField.id, { options: [...(selectedField.options || []), `Opção ${selectedField.options?.length + 1}`] })} className="text-[10px] font-bold text-accent hover:opacity-80 transition-opacity ml-1">+ Adicionar Opção</button>
                  </div>
                )}

                {/* Lógica de Salto */}
                <div className="pt-6 border-t border-border-base space-y-4">
                     <div className="flex items-center gap-2 text-accent">
                       <GitBranch size={16} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Lógica Condicional</h4>
                     </div>
                     
                     <div className="space-y-3">
                       {(selectedField.logic || []).map((rule, idx) => (
                        <div key={idx} className="p-4 bg-bg-base border border-border-base rounded-2xl space-y-4 shadow-sm relative group">
                          <button 
                            onClick={() => {
                              const newLogic = [...(selectedField.logic || [])];
                              newLogic.splice(idx, 1);
                              updateField(selectedField.id, { logic: newLogic.length > 0 ? newLogic : undefined });
                            }}
                            className="absolute top-2 right-2 p-1 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Se a Resposta:</label>
                            <div className="grid grid-cols-2 gap-2">
                              <select 
                                value={rule.conditionOperator || 'equals'}
                                onChange={(e) => {
                                  const newLogic = [...(selectedField.logic || [])];
                                  newLogic[idx] = { ...rule, conditionOperator: e.target.value as any };
                                  updateField(selectedField.id, { logic: newLogic });
                                }}
                                className="w-full px-2 py-2 text-[10px] border border-border-base rounded-xl focus:ring-1 focus:ring-accent outline-none bg-surface text-text-primary font-bold"
                              >
                                <option value="equals">Igual a</option>
                                <option value="not_equals">Diferente de</option>
                                <option value="greater">Maior que</option>
                                <option value="greater_equal">Maior ou igual a</option>
                                <option value="less">Menor que</option>
                                <option value="less_equal">Menor ou igual a</option>
                                <option value="contains">Contém</option>
                              </select>
                              <input 
                                placeholder="Valor"
                                value={rule.conditionValue || ''}
                                onChange={(e) => {
                                  const newLogic = [...(selectedField.logic || [])];
                                  newLogic[idx] = { ...rule, conditionValue: e.target.value };
                                  updateField(selectedField.id, { logic: newLogic });
                                }}
                                className="w-full px-3 py-2 text-[10px] border border-border-base rounded-xl focus:ring-1 focus:ring-accent outline-none bg-surface text-text-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Então faça isso:</label>
                            <div className="grid grid-cols-1 gap-2">
                              <select 
                                value={rule.action || 'jump'}
                                onChange={(e) => {
                                  const newLogic = [...(selectedField.logic || [])];
                                  newLogic[idx] = { ...rule, action: e.target.value as any };
                                  updateField(selectedField.id, { logic: newLogic });
                                }}
                                className="w-full px-3 py-2 text-[10px] border border-border-base rounded-xl focus:ring-1 focus:ring-accent outline-none bg-surface text-text-primary font-black"
                              >
                                <option value="jump">Pular Para...</option>
                                <option value="hide">Ocultar Pergunta...</option>
                                <option value="show">Mostrar Pergunta...</option>
                                <option value="terminate">Finalizar Formulário</option>
                              </select>

                              {rule.action !== 'terminate' && (
                                <select 
                                  value={rule.targetId || ''}
                                  onChange={(e) => {
                                    const newLogic = [...(selectedField.logic || [])];
                                    newLogic[idx] = { ...rule, targetId: e.target.value };
                                    updateField(selectedField.id, { logic: newLogic });
                                  }}
                                  className="w-full px-3 py-2 text-[10px] border border-border-base rounded-xl focus:ring-1 focus:ring-accent outline-none bg-surface text-text-primary font-black"
                                >
                                  <option value="">Selecione o destino</option>
                                  {rule.action === 'jump' && <option value="end">Terminar Formulário</option>}
                                  <optgroup label={rule.action === 'jump' ? "Pular para:" : "Ocultar / Mostrar:"}>
                                    {fields.filter(f => f.id !== selectedField.id).map(f => (
                                      <option key={f.id} value={f.id}>{f.label.substring(0, 30)}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                       ))}
                       
                       <button 
                        onClick={() => {
                          const newRule = { action: 'show', targetId: '', conditionOperator: 'equals', conditionValue: '' };
                          updateField(selectedField.id, { logic: [...(selectedField.logic || []), newRule as any] });
                        }}
                        className="w-full py-2 bg-accent/5 border border-dashed border-accent text-accent text-[9px] font-black uppercase rounded-xl hover:bg-accent/10 transition-all"
                       >
                         + Adicionar Regra Lógica
                       </button>
                     </div>
                     <p className="text-[9px] text-text-secondary italic leading-relaxed">A lógica de salto permite criar fluxos personalizados baseados na resposta do usuário.</p>
                   </div>
                
                {!['section', 'heading', 'divider', 'image'].includes(selectedField.type) && (
                  <div className="flex items-center justify-between p-4 bg-bg-base border border-border-base rounded-2xl group cursor-pointer hover:bg-surface transition-all font-bold shadow-sm" onClick={() => updateField(selectedField.id, { required: !selectedField.required })}>
                    <div className="flex items-center gap-3">
                      <div className={`size-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedField.required ? 'bg-accent border-accent' : 'border-border-base'}`}>
                        {selectedField.required && <Check size={12} className="text-white" strokeWidth={4} />}
                      </div>
                      <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Obrigatório</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-all flex items-center ${selectedField.required ? 'bg-accent' : 'bg-text-secondary/20'}`}>
                       <div className={`size-3 rounded-full bg-white shadow-sm transition-all ${selectedField.required ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-text-secondary opacity-50">
              <Settings size={32} strokeWidth={1} />
              <p className="text-[10px] font-bold uppercase mt-2">Selecione um campo</p>
            </div>
          )}
        </aside>
      </>
    )}
  </div>
    </div>
  );
};
