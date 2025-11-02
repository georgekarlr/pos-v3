// Simple encryption utility for local storage
class EncryptionUtil {
  private key: string

  constructor(key: string) {
    this.key = key
  }

  // Simple XOR encryption (for demo purposes - use proper encryption in production)
  private xorEncrypt(text: string, key: string): string {
    let result = ''
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return btoa(result) // Base64 encode
  }

  private xorDecrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText) // Base64 decode
      let result = ''
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
      }
      return result
    } catch {
      return ''
    }
  }

  encrypt(data: any): string {
    const jsonString = JSON.stringify(data)
    return this.xorEncrypt(jsonString, this.key)
  }

  decrypt(encryptedData: string): any {
    const decrypted = this.xorDecrypt(encryptedData, this.key)
    try {
      return JSON.parse(decrypted)
    } catch {
      return null
    }
  }
}

export const createEncryption = (email: string) => {
  // Use email as part of the encryption key
  const key = `persona_${email}_${import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) || 'default'}`
  return new EncryptionUtil(key)
}