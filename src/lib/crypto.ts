import CryptoJS from 'crypto-js';

export const encryptData = (text: string, password: string) => {
  if (!text) return '';
  const cleanPassword = password.trim();
  // Usamos AES com a senha fornecida. 
  // O toString() padrão do CryptoJS gera uma string compatível com OpenSSL (Base64 + Salt)
  return CryptoJS.AES.encrypt(text, cleanPassword).toString();
};

export const decryptData = (cipherText: string, password: string) => {
  if (!cipherText) return '';
  const cleanPassword = password.trim();
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, cleanPassword);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedText;
  } catch (error) {
    console.error('Erro na descriptografia:', error);
    return '';
  }
};

export const hashPassword = (password: string) => {
  return CryptoJS.SHA256(password.trim()).toString();
};
