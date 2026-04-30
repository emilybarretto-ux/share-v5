import React from 'react';
import { motion } from 'motion/react';
import { SecretCreator } from '../features/SecretCreator';
import { Screen } from '../../types';

interface CreateSecretScreenProps {
  user: any;
  secretText: string;
  setSecretText: (t: string) => void;
  keyValuePairs: Array<{ id: number, key: string, value: string }>;
  addPair: () => void;
  removePair: (id: number) => void;
  updatePair: (id: number, field: 'key' | 'value', value: string) => void;
  handleFormat: (type: 'bold' | 'italic' | 'code') => void;
  expiration: string;
  setExpiration: (e: string) => void;
  limitViews: boolean;
  setLimitViews: (l: boolean) => void;
  maxViews: number;
  setMaxViews: (m: number) => void;
  password: string;
  setPassword: (p: string) => void;
  referenceName: string;
  setReferenceName: (r: string) => void;
  handleCreateSecret: () => void;
  isCreating?: boolean;
  restrictIp: boolean;
  setRestrictIp: (v: boolean) => void;
  requireEmail: boolean;
  setRequireEmail: (v: boolean) => void;
  allowedEmails: string[];
  setAllowedEmails: (v: string[]) => void;
  allowedDomain: string;
  setAllowedDomain: (v: string) => void;
  notifyAccess: boolean;
  setNotifyAccess: (v: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  redirectUrl: string;
  setRedirectUrl: (r: string) => void;
}

export const CreateSecretScreen = (props: CreateSecretScreenProps) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-3xl md:text-5xl font-black text-text-primary tracking-tighter uppercase italic">Gerar Novo Link Seguro</h2>
        <p className="text-text-secondary font-medium italic opacity-70">Sua informação será criptografada e o link gerado terá validade limitada.</p>
      </div>
      
      <div className="bg-surface border border-border-base rounded-[2.5rem] p-2 shadow-2xl">
        <SecretCreator {...props} />
      </div>
    </div>
  );
};
