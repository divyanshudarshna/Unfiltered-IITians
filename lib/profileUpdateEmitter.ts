// lib/profileUpdateEmitter.ts
type ProfileUpdateListener = () => void;

class ProfileUpdateEmitter {
  private listeners: ProfileUpdateListener[] = [];

  subscribe(listener: ProfileUpdateListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit() {
    console.log('📡 Emitting profile update to', this.listeners.length, 'listeners');
    this.listeners.forEach(listener => listener());
  }
}

export const profileUpdateEmitter = new ProfileUpdateEmitter();