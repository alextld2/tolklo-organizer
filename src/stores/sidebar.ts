import { writable } from 'svelte/store';

const initialOpen = typeof window !== 'undefined' 
  ? localStorage.getItem('sidebar-open') !== 'false' 
  : true;

export const sidebarOpen = writable<boolean>(initialOpen);

if (typeof window !== 'undefined') {
  sidebarOpen.subscribe((isOpen) => {
    localStorage.setItem('sidebar-open', String(isOpen));
  });
}
